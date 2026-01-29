import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  followers_count: number;
  jobs_count: number;
  created_at: string;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/companies - Get companies list with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const industry = searchParams.get("industry") || "";
  const size = searchParams.get("size") || "";
  const location = searchParams.get("location") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort_by = searchParams.get("sort_by") || "name";
  const sort_order = searchParams.get("sort_order") || "asc";

  try {
    // Build query
    let query = supabase
      .from("companies")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (industry) {
      query = query.ilike("industry", `%${industry}%`);
    }

    if (size) {
      query = query.eq("size", size);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    // Apply sorting
    const ascending = sort_order === "asc";
    query = query.order(sort_by, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: companies, error, count } = await query;

    if (error) throw error;

    // Get job counts for each company
    const companyIds = companies?.map(c => c.id) || [];
    if (companyIds.length > 0) {
      const { data: jobCounts } = await supabase
        .from("jobs")
        .select("company_id")
        .in("company_id", companyIds)
        .eq("status", "active");

      // Count jobs per company
      const countMap: Record<string, number> = {};
      jobCounts?.forEach(j => {
        countMap[j.company_id] = (countMap[j.company_id] || 0) + 1;
      });

      // Add job counts to companies
      companies?.forEach(c => {
        c.jobs_count = countMap[c.id] || 0;
      });
    }

    return NextResponse.json({
      companies: companies || [],
      total: count || 0,
      page,
      limit,
    } as CompaniesResponse);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company (admin/recruiter only)
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      name,
      logo_url,
      website,
      description,
      industry,
      size,
      location,
      user_email,
      user_role,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Check authorization (only admins and recruiters can create companies)
    if (!user_email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // In production, you would verify the user's role here
    // For now, we allow any authenticated user to create companies
    // TODO: Add proper role-based authorization

    // Check if company with same name already exists
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A company with this name already exists" },
        { status: 409 }
      );
    }

    // Create the company
    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        name,
        logo_url,
        website,
        description,
        industry,
        size,
        location,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, company }, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
