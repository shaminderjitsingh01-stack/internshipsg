import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/jobs/saved - Get user's saved jobs
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("user_email");

  if (!userEmail) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    // Get saved jobs with job details
    const { data: savedJobs, error } = await supabase
      .from("saved_jobs")
      .select(`
        job_id,
        created_at,
        job:jobs (
          *,
          company:companies (
            id,
            name,
            logo_url,
            website,
            description,
            industry,
            size,
            location
          )
        )
      `)
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform to return jobs with saved_at timestamp
    const jobs = (savedJobs || []).map((saved) => ({
      ...saved.job,
      saved_at: saved.created_at,
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs/saved - Save a job
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { job_id, user_email } = body;

    if (!job_id || !user_email) {
      return NextResponse.json(
        { error: "Job ID and user email are required" },
        { status: 400 }
      );
    }

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", job_id)
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      throw jobError;
    }

    // Save job (upsert to handle duplicates gracefully)
    const { data: savedJob, error } = await supabase
      .from("saved_jobs")
      .upsert(
        { job_id, user_email },
        { onConflict: "job_id,user_email" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, saved: savedJob, message: "Job saved successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving job:", error);
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/saved - Remove a saved job
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const job_id = searchParams.get("job_id");
  const user_email = searchParams.get("user_email");

  if (!job_id || !user_email) {
    return NextResponse.json(
      { error: "Job ID and user email are required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", job_id)
      .eq("user_email", user_email);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Job removed from saved" });
  } catch (error) {
    console.error("Error removing saved job:", error);
    return NextResponse.json(
      { error: "Failed to remove saved job" },
      { status: 500 }
    );
  }
}
