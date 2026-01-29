import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

// GET /api/jobs/[jobId] - Get single job details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { jobId } = await params;

  try {
    // Get job with company details
    const { data: job, error } = await supabase
      .from("jobs")
      .select(`
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
      `)
      .eq("id", jobId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      throw error;
    }

    // Increment view count
    await supabase
      .from("jobs")
      .update({ views: (job.views || 0) + 1 })
      .eq("id", jobId);

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[jobId] - Update a job
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { jobId } = await params;

  try {
    const body = await request.json();
    const userEmail = body.user_email;

    // First verify ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("posted_by_email")
      .eq("id", jobId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check if user owns the job
    if (existingJob.posted_by_email !== userEmail) {
      return NextResponse.json(
        { error: "You don't have permission to update this job" },
        { status: 403 }
      );
    }

    // Update the job
    const {
      title,
      description,
      requirements,
      location,
      job_type,
      salary_min,
      salary_max,
      salary_currency,
      is_remote,
      application_url,
      application_email,
      status,
      expires_at,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (location !== undefined) updateData.location = location;
    if (job_type !== undefined) updateData.job_type = job_type;
    if (salary_min !== undefined) updateData.salary_min = salary_min;
    if (salary_max !== undefined) updateData.salary_max = salary_max;
    if (salary_currency !== undefined) updateData.salary_currency = salary_currency;
    if (is_remote !== undefined) updateData.is_remote = is_remote;
    if (application_url !== undefined) updateData.application_url = application_url;
    if (application_email !== undefined) updateData.application_email = application_email;
    if (status !== undefined) updateData.status = status;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const { data: job, error } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", jobId)
      .select(`
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
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[jobId] - Delete a job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { jobId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("user_email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // First verify ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("posted_by_email")
      .eq("id", jobId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check if user owns the job
    if (existingJob.posted_by_email !== userEmail) {
      return NextResponse.json(
        { error: "You don't have permission to delete this job" },
        { status: 403 }
      );
    }

    // Delete the job (cascades to applications and saved_jobs)
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
