import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendBulkEmails, isEmailConfigured } from "@/lib/email";

// This endpoint should be called by Vercel CRON every Sunday
// Vercel CRON config in vercel.json

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    // Calculate date range for this week (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString();

    // Get all users with email preferences for weekly digest
    const { data: preferences } = await supabase
      .from("email_preferences")
      .select("email, weekly_digest")
      .eq("weekly_digest", true);

    const enabledEmails = new Set(
      (preferences || []).map((p) => p.email)
    );

    // Get all users with streak data
    const { data: allStreaks, error: streakError } = await supabase
      .from("streaks")
      .select("*");

    if (streakError) {
      console.error("Error fetching streaks:", streakError);
      return NextResponse.json(
        { error: "Failed to fetch streak data" },
        { status: 500 }
      );
    }

    if (!allStreaks || allStreaks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users to send digest to",
        sent: 0,
      });
    }

    // Filter to users who have digest enabled (or no preference = default enabled)
    const eligibleUsers = allStreaks.filter((streak) => {
      const hasPref = preferences?.find((p) => p.email === streak.user_email);
      return !hasPref || enabledEmails.has(streak.user_email);
    });

    // Get user names
    const emails = eligibleUsers.map((u) => u.user_email);
    const { data: users } = await supabase
      .from("user accounts")
      .select("email, name")
      .in("email", emails);

    const userNameMap = new Map(
      (users || []).map((u) => [u.email, u.name || "there"])
    );

    // Get weekly interview stats for each user
    const { data: weeklyInterviews } = await supabase
      .from("interviews")
      .select("user_email, score, created_at")
      .in("user_email", emails)
      .gte("created_at", weekAgoStr);

    // Calculate weekly stats per user
    const weeklyStatsMap = new Map<
      string,
      { count: number; totalScore: number; scoredCount: number }
    >();
    (weeklyInterviews || []).forEach((interview) => {
      const current = weeklyStatsMap.get(interview.user_email) || {
        count: 0,
        totalScore: 0,
        scoredCount: 0,
      };
      current.count++;
      if (interview.score !== null) {
        current.totalScore += interview.score;
        current.scoredCount++;
      }
      weeklyStatsMap.set(interview.user_email, current);
    });

    // Get badges earned this week
    const { data: weeklyBadges } = await supabase
      .from("user_badges")
      .select("user_email, badge_id, unlocked_at")
      .in("user_email", emails)
      .gte("unlocked_at", weekAgoStr);

    const badgesMap = new Map<string, string[]>();
    (weeklyBadges || []).forEach((badge) => {
      const current = badgesMap.get(badge.user_email) || [];
      current.push(badge.badge_id);
      badgesMap.set(badge.user_email, current);
    });

    // Prepare email data
    const emailsToSend = eligibleUsers.map((streak) => {
      const weeklyStats = weeklyStatsMap.get(streak.user_email);
      const newBadges = badgesMap.get(streak.user_email) || [];

      return {
        email: streak.user_email,
        emailData: {
          type: "weekly-digest" as const,
          data: {
            name: userNameMap.get(streak.user_email) || "there",
            weeklyActivities: weeklyStats?.count || 0,
            currentStreak: streak.current_streak,
            longestStreak: streak.longest_streak,
            totalActivities: streak.total_activities,
            newBadges,
            interviewsCompleted: weeklyStats?.count || 0,
            avgScore:
              weeklyStats && weeklyStats.scoredCount > 0
                ? Math.round(weeklyStats.totalScore / weeklyStats.scoredCount)
                : null,
          },
        },
      };
    });

    // Send emails in bulk
    const result = await sendBulkEmails(emailsToSend);

    return NextResponse.json({
      success: true,
      message: "Weekly digest sent",
      totalUsers: allStreaks.length,
      eligibleUsers: eligibleUsers.length,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Weekly digest cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
