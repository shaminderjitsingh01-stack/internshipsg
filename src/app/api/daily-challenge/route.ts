import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { awardXP, XP_REWARDS } from "@/lib/xp";

// Extend timeout to 60 seconds
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Daily XP reward for completing the challenge
const DAILY_CHALLENGE_XP = 20;

// Challenge categories and questions pool
const CHALLENGE_POOL = [
  {
    category: "Behavioral",
    difficulty: "Medium" as const,
    questions: [
      "Describe a situation where you had to work with someone you found difficult to get along with. How did you handle it?",
      "Tell me about a time when you had to adapt to a significant change at work or school. What was the outcome?",
      "Share an example of when you had to make a decision with incomplete information. What was your approach?",
      "Describe a project where you took the initiative without being asked. What motivated you?",
    ],
    tips: [
      "Use the STAR method (Situation, Task, Action, Result)",
      "Be specific about your role and contributions",
      "Quantify results when possible",
      "Show what you learned from the experience",
    ],
  },
  {
    category: "Problem Solving",
    difficulty: "Hard" as const,
    questions: [
      "Walk me through how you would approach solving a complex problem you've never encountered before.",
      "Describe a time when you identified a problem before it became an issue. How did you handle it?",
      "Tell me about a creative solution you developed to overcome a significant obstacle.",
      "Share an experience where your initial approach to a problem didn't work. What did you do next?",
    ],
    tips: [
      "Explain your thought process step by step",
      "Mention any frameworks or methodologies you use",
      "Discuss how you gather information before deciding",
      "Highlight collaboration when relevant",
    ],
  },
  {
    category: "Leadership",
    difficulty: "Hard" as const,
    questions: [
      "Describe a time when you had to lead a team through a challenging project or situation.",
      "Tell me about a situation where you had to motivate others who were resistant to change.",
      "Share an example of when you had to make an unpopular decision. How did you handle the aftermath?",
      "How do you approach delegating tasks while ensuring quality outcomes?",
    ],
    tips: [
      "Focus on influence, not just authority",
      "Show empathy and understanding of others' perspectives",
      "Demonstrate accountability for outcomes",
      "Highlight team success over personal glory",
    ],
  },
  {
    category: "Technical/Skills",
    difficulty: "Medium" as const,
    questions: [
      "Describe a technical skill you learned recently. How did you approach learning it?",
      "Tell me about a project where you applied technical knowledge to solve a real problem.",
      "How do you stay current with developments in your field of study?",
      "Share an example of when you had to explain a complex technical concept to a non-technical audience.",
    ],
    tips: [
      "Show your learning methodology",
      "Connect technical skills to practical applications",
      "Demonstrate curiosity and growth mindset",
      "Use analogies for complex explanations",
    ],
  },
  {
    category: "Communication",
    difficulty: "Easy" as const,
    questions: [
      "Describe your approach to giving constructive feedback to a peer.",
      "Tell me about a time when miscommunication caused a problem. How did you resolve it?",
      "How do you handle situations where you disagree with your supervisor or professor?",
      "Share an example of how you've successfully persuaded someone to see your point of view.",
    ],
    tips: [
      "Be specific about your communication style",
      "Show active listening skills",
      "Demonstrate emotional intelligence",
      "Highlight positive outcomes from clear communication",
    ],
  },
  {
    category: "Motivation",
    difficulty: "Easy" as const,
    questions: [
      "What motivates you to perform at your best?",
      "Describe a time when you went above and beyond what was required. What drove you?",
      "How do you stay motivated during repetitive or challenging tasks?",
      "Tell me about a goal you set for yourself and how you achieved it.",
    ],
    tips: [
      "Be authentic about what drives you",
      "Connect your motivation to the role/company",
      "Show self-awareness",
      "Give concrete examples",
    ],
  },
];

// Get today's challenge based on date
function getTodaysChallenge() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Select category based on day
  const categoryIndex = dayOfYear % CHALLENGE_POOL.length;
  const category = CHALLENGE_POOL[categoryIndex];

  // Select question within category
  const questionIndex = Math.floor(dayOfYear / CHALLENGE_POOL.length) % category.questions.length;

  return {
    id: `${today.toISOString().split("T")[0]}-${categoryIndex}-${questionIndex}`,
    question: category.questions[questionIndex],
    category: category.category,
    difficulty: category.difficulty,
    tips: category.tips,
  };
}

// Check if user has completed today's challenge
async function hasCompletedToday(userEmail: string): Promise<{
  completed: boolean;
  feedback: string | null;
  xpEarned: number;
}> {
  if (!isSupabaseConfigured()) {
    return { completed: false, feedback: null, xpEarned: 0 };
  }

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_challenges")
    .select("*")
    .eq("user_email", userEmail)
    .eq("challenge_date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking daily challenge:", error);
  }

  return {
    completed: !!data,
    feedback: data?.ai_feedback || null,
    xpEarned: data?.xp_earned || 0,
  };
}

// GET - Get today's challenge and completion status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("email");

  if (!userEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const challenge = getTodaysChallenge();
    const { completed, feedback, xpEarned } = await hasCompletedToday(userEmail);

    return NextResponse.json({
      challenge,
      completed,
      feedback,
      xpEarned,
    });
  } catch (error) {
    console.error("Error fetching daily challenge:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily challenge" },
      { status: 500 }
    );
  }
}

// POST - Submit answer and get AI feedback
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { userEmail, answer, challengeId } = body;

    if (!userEmail || !answer) {
      return NextResponse.json(
        { error: "Email and answer required" },
        { status: 400 }
      );
    }

    // Check if already completed today
    const { completed } = await hasCompletedToday(userEmail);
    if (completed) {
      return NextResponse.json(
        { error: "Challenge already completed today" },
        { status: 400 }
      );
    }

    const challenge = getTodaysChallenge();

    // Generate AI feedback
    const prompt = `You are an expert interview coach providing feedback on a practice interview answer. Be encouraging but constructive.

QUESTION: ${challenge.question}

STUDENT'S ANSWER: ${answer}

Provide feedback in this format (be concise, max 200 words total):

1. STRENGTHS (2-3 points): What they did well
2. IMPROVEMENTS (2-3 points): Specific ways to improve
3. EXAMPLE ENHANCEMENT: One sentence showing how to make their answer stronger
4. SCORE: Rate their answer out of 10

Keep your tone supportive and actionable. Focus on interview best practices like STAR method, specificity, and relevance.`;

    let feedback = "";
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      feedback =
        message.content[0].type === "text"
          ? message.content[0].text
          : "Great job completing the challenge! Keep practicing to improve your interview skills.";
    } catch (aiError) {
      console.error("AI feedback error:", aiError);
      feedback =
        "Great job completing the challenge! Your answer shows good effort. Keep practicing with the STAR method (Situation, Task, Action, Result) to structure your responses effectively.";
    }

    // Calculate XP based on difficulty
    let xpAmount = DAILY_CHALLENGE_XP;
    if (challenge.difficulty === "Hard") {
      xpAmount = 30;
    } else if (challenge.difficulty === "Easy") {
      xpAmount = 15;
    }

    // Save completion record
    const today = new Date().toISOString().split("T")[0];
    const { error: insertError } = await supabase
      .from("daily_challenges")
      .insert({
        user_email: userEmail,
        challenge_date: today,
        challenge_id: challengeId || challenge.id,
        question: challenge.question,
        answer: answer,
        ai_feedback: feedback,
        xp_earned: xpAmount,
      });

    if (insertError) {
      console.error("Error saving challenge completion:", insertError);
      return NextResponse.json(
        { error: "Failed to save completion" },
        { status: 500 }
      );
    }

    // Award XP
    await awardXP(userEmail, xpAmount, "DAILY_CHALLENGE");

    return NextResponse.json({
      success: true,
      feedback,
      xpAwarded: xpAmount,
      completed: true,
    });
  } catch (error) {
    console.error("Error submitting daily challenge:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
