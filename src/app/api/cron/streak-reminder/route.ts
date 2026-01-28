import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendBulkEmails, isEmailConfigured } from "@/lib/email";
import { getStreakTitle } from "@/lib/streaks";

// This endpoint should be called by Vercel CRON at 6pm SGT daily
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

    // Get today's date in SGT (UTC+8)
    const now = new Date();
    const sgtOffset = 8 * 60; // SGT is UTC+8
    const sgtDate = new Date(now.getTime() + sgtOffset * 60 * 1000);
    const today = sgtDate.toISOString().split("T")[0];

    // Find users who:
    // 1. Have an active streak (current_streak > 0)
    // 2. Haven't practiced today (last_activity_date != today)
    // 3. Have streak reminders enabled in their preferences
    const { data: usersToRemind, error: fetchError } = await supabase
      .from("streaks")
      .select(
        `
        user_email,
        current_streak,
        last_activity_date
      `
      )
      .gt("current_streak", 0)
      .neq("last_activity_date", today);

    if (fetchError) {
      console.error("Error fetching streaks:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch streak data" },
        { status: 500 }
      );
    }

    if (!usersToRemind || usersToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users need streak reminders",
        sent: 0,
      });
    }

    // Get user email preferences
    const emails = usersToRemind.map((u) => u.user_email);
    const { data: preferences } = await supabase
      .from("email_preferences")
      .select("email, streak_reminders")
      .in("email", emails)
      .eq("streak_reminders", true);

    const enabledEmails = new Set(
      (preferences || []).map((p) => p.email)
    );

    // Get user names for personalization
    const { data: users } = await supabase
      .from("user accounts")
      .select("email, name")
      .in("email", emails);

    const userNameMap = new Map(
      (users || []).map((u) => [u.email, u.name || "there"])
    );

    // Filter to only users who have reminders enabled (or no preference record = default enabled)
    // For users without a preference record, we'll include them (opt-out model)
    const usersWithPreferences = usersToRemind.filter((user) => {
      // Check if they have explicitly disabled reminders
      const hasPref = preferences?.find((p) => p.email === user.user_email);
      // If no preference exists, default to sending (opt-out model)
      // If preference exists, check if streak_reminders is true
      return !hasPref || enabledEmails.has(user.user_email);
    });

    // Prepare email data
    const emailsToSend = usersWithPreferences.map((user) => ({
      email: user.user_email,
      emailData: {
        type: "streak-reminder" as const,
        data: {
          name: userNameMap.get(user.user_email) || "there",
          currentStreak: user.current_streak,
          streakTitle: getStreakTitle(user.current_streak),
        },
      },
    }));

    // Send emails in bulk
    const result = await sendBulkEmails(emailsToSend);

    return NextResponse.json({
      success: true,
      message: `Streak reminders sent`,
      totalUsers: usersToRemind.length,
      eligibleUsers: usersWithPreferences.length,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Streak reminder cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
