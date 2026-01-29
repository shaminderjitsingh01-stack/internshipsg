import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch user's experience
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_experience")
    .select("*")
    .eq("user_email", email)
    .order("display_order", { ascending: true })
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Fetch experience error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ experience: data || [] });
}

// POST - Add new experience entry
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { user_email, company, title, location, employment_type, start_date, end_date, is_current, description, skills_used } = body;

    if (!user_email || !company || !title) {
      return NextResponse.json({ error: "Email, company, and title are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_experience")
      .insert({
        user_email,
        company,
        title,
        location,
        employment_type,
        start_date,
        end_date: is_current ? null : end_date,
        is_current,
        description,
        skills_used,
      })
      .select()
      .single();

    if (error) {
      console.error("Add experience error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ experience: data, success: true });
  } catch (error) {
    console.error("Add experience error:", error);
    return NextResponse.json({ error: "Failed to add experience" }, { status: 500 });
  }
}

// PUT - Update experience entry
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, user_email, ...updates } = body;

    if (!id || !user_email) {
      return NextResponse.json({ error: "ID and email are required" }, { status: 400 });
    }

    // Handle is_current logic
    if (updates.is_current) {
      updates.end_date = null;
    }

    const { data, error } = await supabase
      .from("user_experience")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_email", user_email)
      .select()
      .single();

    if (error) {
      console.error("Update experience error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ experience: data, success: true });
  } catch (error) {
    console.error("Update experience error:", error);
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 });
  }
}

// DELETE - Remove experience entry
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  if (!id || !email) {
    return NextResponse.json({ error: "ID and email are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_experience")
    .delete()
    .eq("id", id)
    .eq("user_email", email);

  if (error) {
    console.error("Delete experience error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
