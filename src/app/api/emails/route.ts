import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  isEmailConfigured,
  EmailData,
  WelcomeEmailData,
  StreakReminderEmailData,
  WeeklyDigestEmailData,
  AchievementEmailData,
  ReferralSuccessEmailData,
} from "@/lib/email";

// Validate email data based on type
function validateEmailData(type: string, data: unknown): EmailData | null {
  switch (type) {
    case "welcome": {
      const d = data as WelcomeEmailData;
      if (!d.name) return null;
      return { type: "welcome", data: d };
    }
    case "streak-reminder": {
      const d = data as StreakReminderEmailData;
      if (!d.name || d.currentStreak === undefined || !d.streakTitle)
        return null;
      return { type: "streak-reminder", data: d };
    }
    case "weekly-digest": {
      const d = data as WeeklyDigestEmailData;
      if (
        !d.name ||
        d.weeklyActivities === undefined ||
        d.currentStreak === undefined
      )
        return null;
      return { type: "weekly-digest", data: d };
    }
    case "achievement": {
      const d = data as AchievementEmailData;
      if (!d.name || !d.badgeName || !d.badgeIcon || !d.badgeDescription)
        return null;
      return { type: "achievement", data: d };
    }
    case "referral-success": {
      const d = data as ReferralSuccessEmailData;
      if (
        !d.name ||
        !d.referredName ||
        d.rewardPoints === undefined ||
        d.totalReferrals === undefined
      )
        return null;
      return { type: "referral-success", data: d };
    }
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check API key for security (optional - can use different auth)
    const authHeader = req.headers.get("authorization");
    const apiKey = process.env.INTERNAL_API_KEY;

    // If INTERNAL_API_KEY is set, require it for this endpoint
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { type, recipient, data } = body;

    // Validate required fields
    if (!type || !recipient || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type, recipient, data" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return NextResponse.json(
        { error: "Invalid recipient email format" },
        { status: 400 }
      );
    }

    // Validate email data based on type
    const emailData = validateEmailData(type, data);
    if (!emailData) {
      return NextResponse.json(
        { error: `Invalid data for email type: ${type}` },
        { status: 400 }
      );
    }

    // Send the email
    const result = await sendEmail(recipient, emailData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check / info endpoint
export async function GET() {
  return NextResponse.json({
    configured: isEmailConfigured(),
    supportedTypes: [
      "welcome",
      "streak-reminder",
      "weekly-digest",
      "achievement",
      "referral-success",
    ],
  });
}
