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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Fetch all counts in parallel for better performance
    const [
      usersResult,
      interviewsResult,
      scoreData,
      interviewsTodayResult,
      interviewsWeekResult,
      interviewsMonthResult,
      newUsersMonthResult,
      postsResult,
      postsTodayResult,
      jobsResult,
      activeJobsResult,
      reportsResult,
      pendingReportsResult,
      feedbackResult,
      newFeedbackResult,
      recentUsersResult,
      recentReportsResult,
      recentFeedbackResult,
      recentActivityResult,
      userGrowthResult,
    ] = await Promise.all([
      // Total users
      supabase.from("users").select("*", { count: "exact", head: true }),
      // Total interviews
      supabase.from("interviews").select("*", { count: "exact", head: true }),
      // Score data for average
      supabase.from("interviews").select("score").not("score", "is", null),
      // Today's interviews
      supabase.from("interviews").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      // This week's interviews
      supabase.from("interviews").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
      // This month's interviews
      supabase.from("interviews").select("*", { count: "exact", head: true }).gte("created_at", monthAgo.toISOString()),
      // New users this month
      supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", monthAgo.toISOString()),
      // Total posts
      supabase.from("posts").select("*", { count: "exact", head: true }).is("deleted_at", null),
      // Posts today
      supabase.from("posts").select("*", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", today.toISOString()),
      // Total jobs
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      // Active jobs
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
      // Total reports
      supabase.from("reports").select("*", { count: "exact", head: true }),
      // Pending reports
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      // Total feedback
      supabase.from("feedback").select("*", { count: "exact", head: true }),
      // New feedback
      supabase.from("feedback").select("*", { count: "exact", head: true }).eq("status", "new"),
      // Recent users (last 10)
      supabase.from("users").select("id, email, name, image_url, role, subscription_tier, created_at, is_banned, is_verified").order("created_at", { ascending: false }).limit(10),
      // Recent pending reports
      supabase.from("reports").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
      // Recent feedback
      supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(10),
      // Recent activity (posts, interviews, signups)
      supabase.from("posts").select("id, author_email, content, post_type, created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
      // User growth by day (last 7 days)
      supabase.from("users").select("created_at").gte("created_at", weekAgo.toISOString()).order("created_at", { ascending: true }),
    ]);

    const averageScore = scoreData.data && scoreData.data.length > 0
      ? scoreData.data.reduce((acc, i) => acc + (i.score || 0), 0) / scoreData.data.length
      : 0;

    // Calculate user growth by day
    const userGrowthByDay: Record<string, number> = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = days[date.getDay()];
      userGrowthByDay[dayKey] = 0;
    }

    userGrowthResult.data?.forEach((user) => {
      const date = new Date(user.created_at);
      const dayKey = days[date.getDay()];
      if (userGrowthByDay[dayKey] !== undefined) {
        userGrowthByDay[dayKey]++;
      }
    });

    // Format recent activity
    const recentActivity = [
      ...(recentActivityResult.data || []).map((post) => ({
        type: "post",
        email: post.author_email,
        content: post.content?.substring(0, 100) + (post.content?.length > 100 ? "..." : ""),
        created_at: post.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

    return NextResponse.json({
      // Overview stats
      totalUsers: usersResult.count || 0,
      totalInterviews: interviewsResult.count || 0,
      averageScore: Math.round(averageScore * 10) / 10,
      interviewsToday: interviewsTodayResult.count || 0,
      interviewsThisWeek: interviewsWeekResult.count || 0,
      interviewsThisMonth: interviewsMonthResult.count || 0,
      newUsersThisMonth: newUsersMonthResult.count || 0,

      // Posts stats
      totalPosts: postsResult.count || 0,
      postsToday: postsTodayResult.count || 0,

      // Jobs stats
      totalJobs: jobsResult.count || 0,
      activeJobs: activeJobsResult.count || 0,

      // Reports stats
      totalReports: reportsResult.count || 0,
      pendingReports: pendingReportsResult.count || 0,

      // Feedback stats
      totalFeedback: feedbackResult.count || 0,
      newFeedback: newFeedbackResult.count || 0,

      // Recent data
      recentUsers: recentUsersResult.data || [],
      recentReports: recentReportsResult.data || [],
      recentFeedback: recentFeedbackResult.data || [],
      recentActivity,

      // Charts data
      userGrowthByDay: Object.entries(userGrowthByDay).map(([day, count]) => ({ day, count })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

// POST - Admin actions (ban/unban user, verify user, handle reports)
export async function POST(request: Request) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { action, userId, reportId, email, reason } = body;

    switch (action) {
      case "ban_user": {
        const { error: banError } = await supabase
          .from("users")
          .update({ is_banned: true, ban_reason: reason || "Banned by admin" })
          .eq("id", userId);
        if (banError) throw banError;
        return NextResponse.json({ success: true, message: "User banned successfully" });
      }

      case "unban_user": {
        const { error: unbanError } = await supabase
          .from("users")
          .update({ is_banned: false, ban_reason: null })
          .eq("id", userId);
        if (unbanError) throw unbanError;
        return NextResponse.json({ success: true, message: "User unbanned successfully" });
      }

      case "verify_user": {
        const { error: verifyError } = await supabase
          .from("users")
          .update({ is_verified: true })
          .eq("id", userId);
        if (verifyError) throw verifyError;
        return NextResponse.json({ success: true, message: "User verified successfully" });
      }

      case "dismiss_report": {
        const { error: dismissError } = await supabase
          .from("reports")
          .update({ status: "dismissed", resolved_at: new Date().toISOString() })
          .eq("id", reportId);
        if (dismissError) throw dismissError;
        return NextResponse.json({ success: true, message: "Report dismissed" });
      }

      case "action_report": {
        // Mark report as actioned and optionally ban the reported user
        const { error: actionError } = await supabase
          .from("reports")
          .update({ status: "actioned", resolved_at: new Date().toISOString() })
          .eq("id", reportId);
        if (actionError) throw actionError;

        // If user email provided, ban them
        if (email) {
          await supabase
            .from("users")
            .update({ is_banned: true, ban_reason: reason || "Action taken on report" })
            .eq("email", email);
        }
        return NextResponse.json({ success: true, message: "Report actioned" });
      }

      case "resolve_feedback": {
        const { error: resolveError } = await supabase
          .from("feedback")
          .update({ status: "resolved" })
          .eq("id", body.feedbackId);
        if (resolveError) throw resolveError;
        return NextResponse.json({ success: true, message: "Feedback resolved" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
