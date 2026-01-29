import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  is_remote: boolean;
  application_url: string | null;
  application_email: string | null;
  posted_by_email: string | null;
  status: string;
  views: number;
  applications_count: number;
  created_at: string;
  expires_at: string | null;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    website: string | null;
    description: string | null;
    industry: string | null;
    size: string | null;
    location: string | null;
  };
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/jobs - Get jobs list with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const location = searchParams.get("location") || "";
  const job_type = searchParams.get("job_type") || "";
  const salary_min = searchParams.get("salary_min");
  const salary_max = searchParams.get("salary_max");
  const is_remote = searchParams.get("is_remote");
  const status = searchParams.get("status") || "active";
  const company_id = searchParams.get("company_id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort_by = searchParams.get("sort_by") || "created_at";
  const sort_order = searchParams.get("sort_order") || "desc";

  try {
    // Build query
    let query = supabase
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
      `, { count: "exact" });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (job_type) {
      query = query.eq("job_type", job_type);
    }

    if (salary_min) {
      query = query.gte("salary_min", parseInt(salary_min));
    }

    if (salary_max) {
      query = query.lte("salary_max", parseInt(salary_max));
    }

    if (is_remote === "true") {
      query = query.eq("is_remote", true);
    }

    // Apply sorting
    const ascending = sort_order === "asc";
    query = query.order(sort_by, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: jobs, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
      page,
      limit,
    } as JobsResponse);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job posting
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      company_id,
      title,
      description,
      requirements,
      location,
      job_type = "internship",
      salary_min,
      salary_max,
      salary_currency = "SGD",
      is_remote = false,
      application_url,
      application_email,
      posted_by_email,
      expires_at,
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // If company_id is not provided but company details are, create the company first
    let finalCompanyId = company_id;
    if (!company_id && body.company_name) {
      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: body.company_name,
          logo_url: body.company_logo_url,
          website: body.company_website,
          description: body.company_description,
          industry: body.company_industry,
          size: body.company_size,
          location: body.company_location,
        })
        .select()
        .single();

      if (companyError) throw companyError;
      finalCompanyId = newCompany.id;
    }

    // Create the job
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        company_id: finalCompanyId,
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
        posted_by_email,
        expires_at,
      })
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

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
