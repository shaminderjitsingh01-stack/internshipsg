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
    // Get users with interview counts
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data: users, count, error: usersError } = await query;

    if (usersError) throw usersError;

    // Get interview counts for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { count: interviewCount } = await supabase
          .from("interviews")
          .select("*", { count: "exact", head: true })
          .eq("user_email", user.email);

        const { data: lastInterview } = await supabase
          .from("interviews")
          .select("created_at, score")
          .eq("user_email", user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { data: avgScore } = await supabase
          .from("interviews")
          .select("score")
          .eq("user_email", user.email)
          .not("score", "is", null);

        const averageScore = avgScore && avgScore.length > 0
          ? avgScore.reduce((acc, i) => acc + (i.score || 0), 0) / avgScore.length
          : null;

        return {
          ...user,
          interview_count: interviewCount || 0,
          last_interview_at: lastInterview?.created_at || null,
          last_score: lastInterview?.score || null,
          average_score: averageScore ? Math.round(averageScore * 10) / 10 : null,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
