import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/jobs/applications - Get user's job applications
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
    // Get user's applications with job details
    const { data: applications, error } = await supabase
      .from("job_applications")
      .select(`
        *,
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
      .eq("applicant_email", userEmail)
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
