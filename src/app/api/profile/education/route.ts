import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch user's education
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
    .from("user_education")
    .select("*")
    .eq("user_email", email)
    .order("display_order", { ascending: true })
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Fetch education error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ education: data || [] });
}

// POST - Add new education entry
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { user_email, school, degree, field_of_study, start_date, end_date, is_current, grade, activities, description } = body;

    if (!user_email || !school) {
      return NextResponse.json({ error: "Email and school are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_education")
      .insert({
        user_email,
        school,
        degree,
        field_of_study,
        start_date,
        end_date: is_current ? null : end_date,
        is_current,
        grade,
        activities,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Add education error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ education: data, success: true });
  } catch (error) {
    console.error("Add education error:", error);
    return NextResponse.json({ error: "Failed to add education" }, { status: 500 });
  }
}

// PUT - Update education entry
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
      .from("user_education")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_email", user_email)
      .select()
      .single();

    if (error) {
      console.error("Update education error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ education: data, success: true });
  } catch (error) {
    console.error("Update education error:", error);
    return NextResponse.json({ error: "Failed to update education" }, { status: 500 });
  }
}

// DELETE - Remove education entry
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
    .from("user_education")
    .delete()
    .eq("id", id)
    .eq("user_email", email);

  if (error) {
    console.error("Delete education error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
