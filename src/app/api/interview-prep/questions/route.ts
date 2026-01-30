import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// GET: Get interview questions with filters
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const company = searchParams.get("company");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");
    const userEmail = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("interview_prep_questions")
      .select("*", { count: "exact" })
      .eq("approved", true);

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }
    if (company) {
      query = query.ilike("company", `%${company}%`);
    }
    if (featured === "true") {
      query = query.eq("is_featured", true);
    }
    if (search) {
      query = query.ilike("question", `%${search}%`);
    }

    // Apply pagination
    query = query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: questions, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If user email provided, fetch their bookmarks to mark saved questions
    let bookmarkedIds: string[] = [];
    if (userEmail) {
      const { data: bookmarks } = await supabase
        .from("interview_prep_bookmarks")
        .select("question_id")
        .eq("user_email", userEmail);

      if (bookmarks) {
        bookmarkedIds = bookmarks.map(b => b.question_id);
      }
    }

    // Add bookmarked flag to questions
    const questionsWithBookmarks = questions?.map(q => ({
      ...q,
      is_bookmarked: bookmarkedIds.includes(q.id),
    })) || [];

    return NextResponse.json({
      questions: questionsWithBookmarks,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: page < Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json(
      { error: "Failed to get questions" },
      { status: 500 }
    );
  }
}

// POST: Add custom question (user-submitted)
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userEmail, question, category, difficulty, company, tips, tags } = body;

    if (!userEmail || !question || !category) {
      return NextResponse.json(
        { error: "Email, question, and category are required" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["behavioral", "technical", "case_study", "situational"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be one of: behavioral, technical, case_study, situational" },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty. Must be one of: easy, medium, hard" },
        { status: 400 }
      );
    }

    const { data: newQuestion, error } = await supabase
      .from("interview_prep_questions")
      .insert({
        question,
        category,
        difficulty: difficulty || "medium",
        company: company || null,
        tips: tips || null,
        tags: tags || [],
        is_user_submitted: true,
        submitted_by: userEmail,
        approved: false, // Requires moderation
      })
      .select()
      .single();

    if (error) {
      console.error("Question creation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      question: newQuestion,
      success: true,
      message: "Question submitted for review",
    });
  } catch (error) {
    console.error("Add question error:", error);
    return NextResponse.json(
      { error: "Failed to add question" },
      { status: 500 }
    );
  }
}

// PUT: Bookmark/unbookmark a question
export async function PUT(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userEmail, questionId, action, notes } = body;

    if (!userEmail || !questionId) {
      return NextResponse.json(
        { error: "Email and question ID are required" },
        { status: 400 }
      );
    }

    if (action === "bookmark") {
      // Add bookmark
      const { error } = await supabase
        .from("interview_prep_bookmarks")
        .upsert({
          user_email: userEmail,
          question_id: questionId,
          notes: notes || null,
        }, { onConflict: "user_email,question_id" });

      if (error) {
        console.error("Bookmark error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, bookmarked: true });
    } else if (action === "unbookmark") {
      // Remove bookmark
      const { error } = await supabase
        .from("interview_prep_bookmarks")
        .delete()
        .eq("user_email", userEmail)
        .eq("question_id", questionId);

      if (error) {
        console.error("Unbookmark error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, bookmarked: false });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
