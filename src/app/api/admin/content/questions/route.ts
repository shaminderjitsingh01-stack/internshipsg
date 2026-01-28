import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { interviewQuestions } from "@/data/interviewQuestions";

// GET: List all interview questions
export async function GET() {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  // If Supabase is configured, try to fetch from database
  if (isSupabaseConfigured()) {
    try {
      const { data: questions, error: fetchError } = await supabase
        .from("interview_questions")
        .select("*")
        .order("id", { ascending: true });

      if (!fetchError && questions && questions.length > 0) {
        return NextResponse.json({ questions });
      }
    } catch (err) {
      console.error("Error fetching questions from DB:", err);
    }
  }

  // Fallback to local data
  return NextResponse.json({ questions: interviewQuestions });
}

// POST: Add a new question
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { question, category, difficulty, industry, company, tips } = body;

    if (!question || !category || !difficulty || !industry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      // Return mock success with the question
      const newQuestion = {
        id: Date.now(),
        question,
        category,
        difficulty,
        industry,
        company: company || null,
        tips: tips || [],
      };
      return NextResponse.json({ success: true, question: newQuestion });
    }

    const { data, error: insertError } = await supabase
      .from("interview_questions")
      .insert({
        question,
        category,
        difficulty,
        industry,
        company: company || null,
        tips: tips || [],
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, question: data });
  } catch (error) {
    console.error("Error adding question:", error);
    return NextResponse.json(
      { error: "Failed to add question" },
      { status: 500 }
    );
  }
}

// PATCH: Update a question
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, question, category, difficulty, industry, company, tips } = body;

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: "Updated (mock)" });
    }

    const updateData: any = {};
    if (question !== undefined) updateData.question = question;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (industry !== undefined) updateData.industry = industry;
    if (company !== undefined) updateData.company = company || null;
    if (tips !== undefined) updateData.tips = tips;

    const { error: updateError } = await supabase
      .from("interview_questions")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "Question updated" });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a question
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, message: "Deleted (mock)" });
  }

  try {
    const { error: deleteError } = await supabase
      .from("interview_questions")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
