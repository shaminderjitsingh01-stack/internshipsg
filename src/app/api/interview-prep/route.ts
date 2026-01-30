import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// GET: Get user's interview prep data (stats, recent sessions, saved questions count)
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Fetch user data, recent sessions, and bookmarks count in parallel
    const [userDataResult, sessionsResult, bookmarksResult] = await Promise.all([
      supabase
        .from("interview_prep_user_data")
        .select("*")
        .eq("user_email", userEmail)
        .single(),
      supabase
        .from("interview_prep_sessions")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("interview_prep_bookmarks")
        .select("id", { count: "exact" })
        .eq("user_email", userEmail),
    ]);

    // If user data doesn't exist, create default data
    let userData = userDataResult.data;
    if (!userData) {
      const { data: newUserData, error: createError } = await supabase
        .from("interview_prep_user_data")
        .insert({ user_email: userEmail })
        .select()
        .single();

      if (!createError) {
        userData = newUserData;
      }
    }

    return NextResponse.json({
      userData: userData || {
        total_sessions: 0,
        total_questions_practiced: 0,
        current_streak: 0,
        longest_streak: 0,
        xp_earned: 0,
        level: 1,
      },
      recentSessions: sessionsResult.data || [],
      savedQuestionsCount: bookmarksResult.count || 0,
    });
  } catch (error) {
    console.error("Get interview prep data error:", error);
    return NextResponse.json(
      { error: "Failed to get interview prep data" },
      { status: 500 }
    );
  }
}

// POST: Create a new practice session
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userEmail, sessionType, category, totalQuestions } = body;

    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from("interview_prep_sessions")
      .insert({
        user_email: userEmail,
        session_type: sessionType || "practice",
        category: category || null,
        total_questions: totalQuestions || 0,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    return NextResponse.json({
      session,
      success: true,
    });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// PUT: Update session (complete, add notes, etc.)
export async function PUT(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { sessionId, userEmail, questionsAnswered, score, notes, status, durationMinutes } = body;

    if (!sessionId || !userEmail) {
      return NextResponse.json({ error: "Session ID and email required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (questionsAnswered !== undefined) updateData.questions_answered = questionsAnswered;
    if (score !== undefined) updateData.score = score;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (durationMinutes !== undefined) updateData.duration_minutes = durationMinutes;
    if (status === "completed") updateData.completed_at = new Date().toISOString();

    const { data: session, error: updateError } = await supabase
      .from("interview_prep_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .eq("user_email", userEmail)
      .select()
      .single();

    if (updateError) {
      console.error("Session update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update user stats if session completed
    if (status === "completed") {
      // Get current user data
      const { data: userData } = await supabase
        .from("interview_prep_user_data")
        .select("*")
        .eq("user_email", userEmail)
        .single();

      const today = new Date().toISOString().split("T")[0];
      const lastPractice = userData?.last_practice_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      let newStreak = 1;
      if (lastPractice === yesterday) {
        newStreak = (userData?.current_streak || 0) + 1;
      } else if (lastPractice === today) {
        newStreak = userData?.current_streak || 1;
      }

      const longestStreak = Math.max(newStreak, userData?.longest_streak || 0);

      await supabase
        .from("interview_prep_user_data")
        .upsert({
          user_email: userEmail,
          total_sessions: (userData?.total_sessions || 0) + 1,
          total_questions_practiced: (userData?.total_questions_practiced || 0) + (questionsAnswered || 0),
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_practice_date: today,
          xp_earned: (userData?.xp_earned || 0) + 25,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_email" });
    }

    return NextResponse.json({
      session,
      success: true,
    });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
