import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - List user's resumes
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const { data: resumes, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_email", email)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ resumes: resumes || [] });
  } catch (error) {
    console.error("Get resumes error:", error);
    return NextResponse.json({ error: "Failed to get resumes" }, { status: 500 });
  }
}

// POST - Create new resume
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { user_email, title, template, data } = body;

    if (!user_email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if this is the first resume (make it primary)
    const { count } = await supabase
      .from("resumes")
      .select("*", { count: "exact", head: true })
      .eq("user_email", user_email);

    const isPrimary = (count || 0) === 0;

    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_email,
        title: title || "My Resume",
        template: template || "modern",
        is_primary: isPrimary,
        data: data || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error("Create resume error:", error);
    return NextResponse.json({ error: "Failed to create resume" }, { status: 500 });
  }
}
