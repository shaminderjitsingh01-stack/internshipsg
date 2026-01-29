import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

// POST /api/jobs/[jobId]/apply - Submit a job application
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { jobId } = await params;

  try {
    const body = await request.json();
    const { applicant_email, resume_url, cover_letter } = body;

    // Validate required fields
    if (!applicant_email) {
      return NextResponse.json(
        { error: "Applicant email is required" },
        { status: 400 }
      );
    }

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, title")
      .eq("id", jobId)
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      throw jobError;
    }

    if (job.status !== "active") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    // Check if user has already applied
    const { data: existingApplication } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("applicant_email", applicant_email)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 400 }
      );
    }

    // Create application
    const { data: application, error } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        applicant_email,
        resume_url,
        cover_letter,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Increment applications count on the job
    await supabase.rpc("increment_applications_count", { job_id: jobId });

    // Fallback if rpc doesn't exist - use update
    await supabase
      .from("jobs")
      .update({
        applications_count: (await supabase
          .from("job_applications")
          .select("id", { count: "exact" })
          .eq("job_id", jobId)).count || 1
      })
      .eq("id", jobId);

    return NextResponse.json(
      { success: true, application, message: "Application submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

// GET /api/jobs/[jobId]/apply - Get applications for a job (for job poster)
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { jobId } = await params;
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("user_email");

  if (!userEmail) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    // First verify ownership
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("posted_by_email")
      .eq("id", jobId)
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      throw jobError;
    }

    // Check if user owns the job
    if (job.posted_by_email !== userEmail) {
      return NextResponse.json(
        { error: "You don't have permission to view applications for this job" },
        { status: 403 }
      );
    }

    // Get applications
    const { data: applications, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications: applications || [] });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
