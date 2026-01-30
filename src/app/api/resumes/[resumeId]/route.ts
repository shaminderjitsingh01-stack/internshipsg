import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ resumeId: string }>;
}

// GET - Get single resume
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { resumeId } = await params;

  try {
    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();

    if (error) throw error;

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Get resume error:", error);
    return NextResponse.json({ error: "Failed to get resume" }, { status: 500 });
  }
}

// PUT - Update resume
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { resumeId } = await params;

  try {
    const body = await request.json();
    const { title, template, data, is_primary } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (template !== undefined) updates.template = template;
    if (data !== undefined) updates.data = data;
    if (is_primary !== undefined) updates.is_primary = is_primary;

    // If setting as primary, unset other primaries
    if (is_primary) {
      const { data: resume } = await supabase
        .from("resumes")
        .select("user_email")
        .eq("id", resumeId)
        .single();

      if (resume) {
        await supabase
          .from("resumes")
          .update({ is_primary: false })
          .eq("user_email", resume.user_email)
          .neq("id", resumeId);
      }
    }

    const { data: updatedResume, error } = await supabase
      .from("resumes")
      .update(updates)
      .eq("id", resumeId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, resume: updatedResume });
  } catch (error) {
    console.error("Update resume error:", error);
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
  }
}

// DELETE - Delete resume
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { resumeId } = await params;
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("email");

  if (!userEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Verify ownership
    const { data: resume } = await supabase
      .from("resumes")
      .select("user_email")
      .eq("id", resumeId)
      .single();

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.user_email !== userEmail) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Resume deleted" });
  } catch (error) {
    console.error("Delete resume error:", error);
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
