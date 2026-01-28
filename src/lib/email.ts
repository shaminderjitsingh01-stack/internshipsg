import { Resend } from "resend";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "Internship.sg <noreply@internship.sg>";
const BASE_URL = process.env.NEXTAUTH_URL || "https://internship.sg";

// Email types
export type EmailType =
  | "welcome"
  | "streak-reminder"
  | "weekly-digest"
  | "achievement"
  | "referral-success";

// Email data interfaces
export interface WelcomeEmailData {
  name: string;
}

export interface StreakReminderEmailData {
  name: string;
  currentStreak: number;
  streakTitle: string;
}

export interface WeeklyDigestEmailData {
  name: string;
  weeklyActivities: number;
  currentStreak: number;
  longestStreak: number;
  totalActivities: number;
  newBadges: string[];
  interviewsCompleted: number;
  avgScore: number | null;
}

export interface AchievementEmailData {
  name: string;
  badgeName: string;
  badgeIcon: string;
  badgeDescription: string;
}

export interface ReferralSuccessEmailData {
  name: string;
  referredName: string;
  rewardPoints: number;
  totalReferrals: number;
}

export type EmailData =
  | { type: "welcome"; data: WelcomeEmailData }
  | { type: "streak-reminder"; data: StreakReminderEmailData }
  | { type: "weekly-digest"; data: WeeklyDigestEmailData }
  | { type: "achievement"; data: AchievementEmailData }
  | { type: "referral-success"; data: ReferralSuccessEmailData };

// Check if email service is configured
export function isEmailConfigured(): boolean {
  return resend !== null;
}

// Send email function
export async function sendEmail(
  to: string,
  emailData: EmailData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("Email service not configured - RESEND_API_KEY missing");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { subject, html } = generateEmailContent(emailData);

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Generate email content based on type
function generateEmailContent(emailData: EmailData): {
  subject: string;
  html: string;
} {
  switch (emailData.type) {
    case "welcome":
      return generateWelcomeEmail(emailData.data);
    case "streak-reminder":
      return generateStreakReminderEmail(emailData.data);
    case "weekly-digest":
      return generateWeeklyDigestEmail(emailData.data);
    case "achievement":
      return generateAchievementEmail(emailData.data);
    case "referral-success":
      return generateReferralSuccessEmail(emailData.data);
  }
}

// Email wrapper template
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #f8fafc;">
        <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">Internship.sg</h1>
            <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">AI-Powered Interview Prep</p>
          </div>

          <!-- Content -->
          <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${content}
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; padding: 0 20px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
              You're receiving this because you have an account at Internship.sg
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="${BASE_URL}/settings" style="color: #64748b; text-decoration: underline;">Manage email preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Welcome email
function generateWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
} {
  const content = `
    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px;">Welcome to Internship.sg!</h2>
    <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
      Hey ${data.name},
    </p>
    <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
      You're now part of the community of ambitious students preparing for their dream internships.
      We're here to help you ace every interview with AI-powered practice and feedback.
    </p>

    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 16px;">Get started:</h3>
      <ul style="color: #475569; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
        <li>Practice with our AI interviewer</li>
        <li>Upload your resume for personalized questions</li>
        <li>Build your streak and earn badges</li>
        <li>Climb the leaderboard</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/dashboard" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Start Practicing
      </a>
    </div>

    <p style="color: #64748b; margin: 32px 0 0 0; font-size: 14px; text-align: center;">
      Good luck with your interview prep!
    </p>
  `;

  return {
    subject: "Welcome to Internship.sg - Let's ace your interviews!",
    html: emailWrapper(content),
  };
}

// Streak reminder email
function generateStreakReminderEmail(data: StreakReminderEmailData): {
  subject: string;
  html: string;
} {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 64px;">🔥</span>
    </div>

    <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 24px; text-align: center;">
      Don't lose your streak!
    </h2>
    <p style="color: #dc2626; margin: 0 0 24px 0; font-size: 20px; text-align: center; font-weight: 600;">
      ${data.currentStreak}-day streak
    </p>

    <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; text-align: center;">
      Hey ${data.name}, you haven't practiced today yet!
      Your ${data.streakTitle} status is at risk.
    </p>

    <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Tip:</strong> Even a quick 5-minute practice session keeps your streak alive!
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/dashboard" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Practice Now
      </a>
    </div>

    <p style="color: #94a3b8; margin: 32px 0 0 0; font-size: 12px; text-align: center;">
      Streaks reset at midnight SGT if you miss a day.
    </p>
  `;

  return {
    subject: `Your ${data.currentStreak}-day streak is about to expire!`,
    html: emailWrapper(content),
  };
}

// Weekly digest email
function generateWeeklyDigestEmail(data: WeeklyDigestEmailData): {
  subject: string;
  html: string;
} {
  const badgesHtml =
    data.newBadges.length > 0
      ? `
        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 16px;">New Badges Earned!</h3>
          <p style="color: #475569; margin: 0; font-size: 14px;">
            ${data.newBadges.join(", ")}
          </p>
        </div>
      `
      : "";

  const content = `
    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px;">Your Weekly Progress</h2>
    <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
      Hey ${data.name}, here's how you did this week:
    </p>

    <!-- Stats Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Activities This Week</p>
        <p style="color: #1e293b; margin: 0; font-size: 32px; font-weight: bold;">${data.weeklyActivities}</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Current Streak</p>
        <p style="color: #dc2626; margin: 0; font-size: 32px; font-weight: bold;">${data.currentStreak} 🔥</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Interviews Completed</p>
        <p style="color: #1e293b; margin: 0; font-size: 32px; font-weight: bold;">${data.interviewsCompleted}</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Avg. Score</p>
        <p style="color: #1e293b; margin: 0; font-size: 32px; font-weight: bold;">${data.avgScore !== null ? data.avgScore + "%" : "-"}</p>
      </div>
    </div>

    ${badgesHtml}

    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: #1e293b; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">All-time Stats</p>
      <p style="color: #64748b; margin: 0; font-size: 14px;">
        Total activities: <strong>${data.totalActivities}</strong> |
        Longest streak: <strong>${data.longestStreak} days</strong>
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/dashboard" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Keep Practicing
      </a>
    </div>
  `;

  return {
    subject: `Your weekly progress: ${data.weeklyActivities} activities, ${data.currentStreak}-day streak`,
    html: emailWrapper(content),
  };
}

// Achievement email
function generateAchievementEmail(data: AchievementEmailData): {
  subject: string;
  html: string;
} {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 80px;">${data.badgeIcon}</span>
    </div>

    <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 24px; text-align: center;">
      Badge Unlocked!
    </h2>
    <p style="color: #dc2626; margin: 0 0 24px 0; font-size: 28px; text-align: center; font-weight: bold;">
      ${data.badgeName}
    </p>

    <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; text-align: center;">
      Congratulations ${data.name}! You've earned a new badge:
    </p>

    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #1e293b; margin: 0; font-size: 16px; font-style: italic;">
        "${data.badgeDescription}"
      </p>
    </div>

    <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; text-align: center;">
      Your dedication is paying off. Keep up the great work!
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/dashboard" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
        View Your Badges
      </a>
    </div>
  `;

  return {
    subject: `You unlocked a new badge: ${data.badgeName}!`,
    html: emailWrapper(content),
  };
}

// Referral success email
function generateReferralSuccessEmail(data: ReferralSuccessEmailData): {
  subject: string;
  html: string;
} {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 64px;">🎉</span>
    </div>

    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px; text-align: center;">
      Your Referral Signed Up!
    </h2>

    <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; text-align: center;">
      Great news ${data.name}! <strong>${data.referredName}</strong> just joined Internship.sg using your referral link.
    </p>

    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #166534; margin: 0 0 8px 0; font-size: 14px;">You earned</p>
      <p style="color: #166534; margin: 0; font-size: 36px; font-weight: bold;">
        +${data.rewardPoints} XP
      </p>
    </div>

    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Total Referrals</p>
      <p style="color: #1e293b; margin: 0; font-size: 32px; font-weight: bold;">${data.totalReferrals}</p>
    </div>

    <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; text-align: center;">
      Keep sharing your link to earn more rewards!
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/dashboard" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Share More
      </a>
    </div>
  `;

  return {
    subject: `${data.referredName} joined using your referral - You earned ${data.rewardPoints} XP!`,
    html: emailWrapper(content),
  };
}

// Bulk send emails (for cron jobs)
export async function sendBulkEmails(
  recipients: Array<{ email: string; emailData: EmailData }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Send in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((r) => sendEmail(r.email, r.emailData))
    );

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.success) {
        sent++;
      } else {
        failed++;
      }
    });

    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { sent, failed };
}
