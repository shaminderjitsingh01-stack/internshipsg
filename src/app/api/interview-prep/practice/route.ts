import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// GET: Get practice sessions history
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
    const sessionId = searchParams.get("sessionId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const offset = (page - 1) * limit;

    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // If specific session requested
    if (sessionId) {
      const { data: session, error } = await supabase
        .from("interview_prep_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_email", userEmail)
        .single();

      if (error) {
        console.error("Session fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Also fetch answers for this session
      const { data: answers } = await supabase
        .from("interview_prep_answers")
        .select(`
          *,
          interview_prep_questions (
            question,
            category,
            difficulty
          )
        `)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        session,
        answers: answers || [],
      });
    }

    // Get paginated sessions
    const { data: sessions, error, count } = await supabase
      .from("interview_prep_sessions")
      .select("*", { count: "exact" })
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Sessions fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sessions: sessions || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: page < Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "Failed to get sessions" },
      { status: 500 }
    );
  }
}

// POST: Save practice session answer with recording/notes
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      userEmail,
      sessionId,
      questionId,
      answerText,
      recordingUrl,
      timeTakenSeconds,
      aiFeedback,
      score
    } = body;

    if (!userEmail || !sessionId) {
      return NextResponse.json(
        { error: "Email and session ID are required" },
        { status: 400 }
      );
    }

    // Save the answer
    const { data: answer, error: answerError } = await supabase
      .from("interview_prep_answers")
      .insert({
        user_email: userEmail,
        session_id: sessionId,
        question_id: questionId || null,
        answer_text: answerText || null,
        recording_url: recordingUrl || null,
        time_taken_seconds: timeTakenSeconds || null,
        ai_feedback: aiFeedback || null,
        score: score || null,
      })
      .select()
      .single();

    if (answerError) {
      console.error("Answer save error:", answerError);
      return NextResponse.json({ error: answerError.message }, { status: 500 });
    }

    // Update session questions_answered count
    const { data: session } = await supabase
      .from("interview_prep_sessions")
      .select("questions_answered")
      .eq("id", sessionId)
      .single();

    if (session) {
      await supabase
        .from("interview_prep_sessions")
        .update({
          questions_answered: (session.questions_answered || 0) + 1,
        })
        .eq("id", sessionId);
    }

    return NextResponse.json({
      answer,
      success: true,
    });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json(
      { error: "Failed to save answer" },
      { status: 500 }
    );
  }
}

// PUT: Update session notes or complete session
export async function PUT(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { sessionId, userEmail, notes, status, score, recordingUrl } = body;

    if (!sessionId || !userEmail) {
      return NextResponse.json(
        { error: "Session ID and email are required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (recordingUrl !== undefined) updateData.recording_url = recordingUrl;
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: session, error } = await supabase
      .from("interview_prep_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .eq("user_email", userEmail)
      .select()
      .single();

    if (error) {
      console.error("Session update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
