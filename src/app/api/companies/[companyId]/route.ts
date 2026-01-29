import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// GET /api/companies/[companyId] - Get single company with jobs list
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { companyId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("user_email");

  try {
    // Get company details
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
      throw error;
    }

    // Get active jobs for this company
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    // Get follower count
    const { count: followersCount } = await supabase
      .from("company_followers")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    // Check if current user is following this company
    let isFollowing = false;
    if (userEmail) {
      const { data: follow } = await supabase
        .from("company_followers")
        .select("company_id")
        .eq("company_id", companyId)
        .eq("user_email", userEmail)
        .single();
      isFollowing = !!follow;
    }

    return NextResponse.json({
      company: {
        ...company,
        followers_count: followersCount || 0,
        jobs_count: jobs?.length || 0,
      },
      jobs: jobs || [],
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[companyId] - Update a company
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { companyId } = await params;

  try {
    const body = await request.json();
    const { user_email, user_role } = body;

    // Check authorization
    if (!user_email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // TODO: Add proper role-based authorization
    // In production, verify user is admin or company owner

    // Build update data
    const updateData: Record<string, unknown> = {};
    const allowedFields = ["name", "logo_url", "website", "description", "industry", "size", "location"];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update the company
    const { data: company, error } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", companyId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[companyId] - Delete a company
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { companyId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("user_email");

    // Check authorization
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // TODO: Add proper role-based authorization
    // In production, only admins should be able to delete companies

    // Delete the company (cascades to jobs and followers)
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
