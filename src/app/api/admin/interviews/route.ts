import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // Check admin access
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("interviews")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`user_email.ilike.%${search}%,user_name.ilike.%${search}%,target_role.ilike.%${search}%`);
    }

    const { data: interviews, count, error: interviewsError } = await query;

    if (interviewsError) throw interviewsError;

    return NextResponse.json({
      interviews: interviews || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}
