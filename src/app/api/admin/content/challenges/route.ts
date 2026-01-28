import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET: List daily challenges
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "30");

  if (!isSupabaseConfigured()) {
    // Return mock data
    return NextResponse.json({ challenges: getMockChallenges(limit) });
  }

  try {
    const { data: challenges, error: fetchError } = await supabase
      .from("daily_challenges")
      .select(`
        id,
        date,
        question_id,
        created_at,
        interview_questions (
          question,
          category,
          difficulty
        )
      `)
      .order("date", { ascending: false })
      .limit(limit);

    if (fetchError) throw fetchError;

    // Get participation stats for each challenge
    const challengesWithStats = await Promise.all(
      (challenges || []).map(async (challenge) => {
        const { count: participants } = await supabase
          .from("interviews")
          .select("*", { count: "exact", head: true })
          .eq("challenge_id", challenge.id);

        const { data: scores } = await supabase
          .from("interviews")
          .select("score")
          .eq("challenge_id", challenge.id)
          .not("score", "is", null);

        const avgScore = scores && scores.length > 0
          ? scores.reduce((acc, s) => acc + (s.score || 0), 0) / scores.length
          : null;

        return {
          id: challenge.id,
          date: challenge.date,
          question_id: challenge.question_id,
          question_text: (challenge as any).interview_questions?.question || "Unknown question",
          category: (challenge as any).interview_questions?.category || "General",
          difficulty: (challenge as any).interview_questions?.difficulty || "Medium",
          participants: participants || 0,
          avg_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
        };
      })
    );

    return NextResponse.json({ challenges: challengesWithStats });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ challenges: getMockChallenges(limit) });
  }
}

// POST: Create a new daily challenge
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { date, question_id } = body;

    if (!date || !question_id) {
      return NextResponse.json(
        { error: "Date and question_id are required" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        challenge: {
          id: Date.now().toString(),
          date,
          question_id,
        },
      });
    }

    // Check if challenge already exists for this date
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("id")
      .eq("date", date)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A challenge already exists for this date" },
        { status: 400 }
      );
    }

    const { data, error: insertError } = await supabase
      .from("daily_challenges")
      .insert({ date, question_id })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, challenge: data });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a daily challenge
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, message: "Deleted (mock)" });
  }

  try {
    const { error: deleteError } = await supabase
      .from("daily_challenges")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: "Challenge deleted" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      { error: "Failed to delete challenge" },
      { status: 500 }
    );
  }
}

function getMockChallenges(limit: number) {
  const today = new Date();
  const challenges = [];
  const questions = [
    { text: "Tell me about yourself.", category: "Behavioral", difficulty: "Easy" },
    { text: "Why do you want to work here?", category: "Behavioral", difficulty: "Easy" },
    { text: "Describe a challenge you overcame.", category: "Behavioral", difficulty: "Medium" },
    { text: "What are your strengths?", category: "Behavioral", difficulty: "Easy" },
    { text: "Where do you see yourself in 5 years?", category: "Behavioral", difficulty: "Medium" },
    { text: "Tell me about a time you worked in a team.", category: "Behavioral", difficulty: "Medium" },
    { text: "How do you handle criticism?", category: "Behavioral", difficulty: "Medium" },
    { text: "Describe a time you showed leadership.", category: "Behavioral", difficulty: "Medium" },
    { text: "What would you do if you disagreed with your manager?", category: "Situational", difficulty: "Hard" },
    { text: "Walk me through a technical project.", category: "Technical", difficulty: "Medium" },
    { text: "How would you increase user engagement?", category: "Case Study", difficulty: "Hard" },
    { text: "Tell me about a time you failed.", category: "Behavioral", difficulty: "Hard" },
    { text: "How do you prioritize your work?", category: "Behavioral", difficulty: "Medium" },
    { text: "What motivates you?", category: "Behavioral", difficulty: "Easy" },
  ];

  for (let i = 0; i < Math.min(limit, 30); i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const question = questions[i % questions.length];

    challenges.push({
      id: `challenge-${i}`,
      date: date.toISOString().split("T")[0],
      question_id: (i % 65) + 1,
      question_text: question.text,
      category: question.category,
      difficulty: question.difficulty,
      participants: i === 0 ? Math.floor(Math.random() * 30) + 5 : Math.floor(Math.random() * 100) + 20,
      avg_score: i === 0 ? null : Math.round((5 + Math.random() * 4) * 10) / 10,
    });
  }

  return challenges;
}
