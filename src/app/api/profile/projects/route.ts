import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch user's projects
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
    .from("user_projects")
    .select("*")
    .eq("user_email", email)
    .order("display_order", { ascending: true })
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data || [] });
}

// POST - Add new project
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { user_email, title, description, url, image_url, technologies, start_date, end_date, is_featured } = body;

    if (!user_email || !title) {
      return NextResponse.json({ error: "Email and title are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_projects")
      .insert({
        user_email,
        title,
        description,
        url,
        image_url,
        technologies: technologies || [],
        start_date,
        end_date,
        is_featured: is_featured || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Add project error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data, success: true });
  } catch (error) {
    console.error("Add project error:", error);
    return NextResponse.json({ error: "Failed to add project" }, { status: 500 });
  }
}

// PUT - Update project
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

    const { data, error } = await supabase
      .from("user_projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_email", user_email)
      .select()
      .single();

    if (error) {
      console.error("Update project error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data, success: true });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE - Remove project
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
    .from("user_projects")
    .delete()
    .eq("id", id)
    .eq("user_email", email);

  if (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
