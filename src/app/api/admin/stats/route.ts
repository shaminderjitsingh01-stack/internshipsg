import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  // Check admin access
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Get total interviews
    const { count: totalInterviews } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true });

    // Get average score
    const { data: scoreData } = await supabase
      .from("interviews")
      .select("score")
      .not("score", "is", null);

    const averageScore = scoreData && scoreData.length > 0
      ? scoreData.reduce((acc, i) => acc + (i.score || 0), 0) / scoreData.length
      : 0;

    // Get today's interviews
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: interviewsToday } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Get this week's interviews
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: interviewsThisWeek } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Get this month's interviews
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: interviewsThisMonth } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo.toISOString());

    // Get unique users who signed up this month
    const { count: newUsersThisMonth } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo.toISOString());

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalInterviews: totalInterviews || 0,
      averageScore: Math.round(averageScore * 10) / 10,
      interviewsToday: interviewsToday || 0,
      interviewsThisWeek: interviewsThisWeek || 0,
      interviewsThisMonth: interviewsThisMonth || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
