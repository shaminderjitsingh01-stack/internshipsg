import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isEmailConfigured } from "@/lib/email";
import {
  getSubject,
  type TopPost,
  type NewFollower,
  type RecommendedJob,
  type UpcomingEvent,
} from "@/emails/weekly-digest";

const BASE_URL = process.env.NEXTAUTH_URL || "https://internship.sg";

// GET: Preview digest data for a user
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter required" },
      { status: 400 }
    );
  }

  try {
    const digestData = await getDigestData(email);

    if (!digestData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: digestData,
      preview: {
        subject: getSubject(digestData.xpEarned, digestData.currentStreak),
      },
    });
  } catch (error) {
    console.error("Error fetching digest data:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest data" },
      { status: 500 }
    );
  }
}

// POST: Generate and send weekly digest for a user
export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user has digest emails enabled
    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("weekly_digest")
      .eq("email", email)
      .single();

    // Default to enabled if no preference set
    if (prefs && prefs.weekly_digest === false) {
      return NextResponse.json(
        { error: "User has disabled weekly digest emails" },
        { status: 400 }
      );
    }

    // Get digest data
    const digestData = await getDigestData(email);

    if (!digestData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate HTML email using plain template
    const fullHtml = generateDigestEmailHtml({
      ...digestData,
      baseUrl: BASE_URL,
    });

    // Send email using the existing email service
    // Note: We're using a custom send since the email type is more complex
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM_EMAIL =
      process.env.EMAIL_FROM || "Internship.sg <noreply@internship.sg>";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: getSubject(digestData.xpEarned, digestData.currentStreak),
      html: fullHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Weekly digest sent successfully",
      recipient: email,
      subject: getSubject(digestData.xpEarned, digestData.currentStreak),
    });
  } catch (error) {
    console.error("Error sending digest:", error);
    return NextResponse.json(
      { error: "Failed to send weekly digest" },
      { status: 500 }
    );
  }
}

// Helper function to get all digest data for a user
async function getDigestData(email: string) {
  // Calculate date range for this week (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString();

  // Get user info
  const { data: user } = await supabase
    .from("user accounts")
    .select("email, name, xp, level, tier")
    .eq("email", email)
    .single();

  if (!user) {
    return null;
  }

  // Run parallel queries for better performance
  const [
    streakData,
    weeklyInterviews,
    weeklyXPTransactions,
    newFollowersData,
    topPostsData,
    recommendedJobsData,
    upcomingEventsData,
    totalInterviewsData,
  ] = await Promise.all([
    // Get streak data
    supabase
      .from("streaks")
      .select("current_streak, longest_streak")
      .eq("user_email", email)
      .single(),

    // Get weekly interviews
    supabase
      .from("interviews")
      .select("score, created_at")
      .eq("user_email", email)
      .gte("created_at", weekAgoStr),

    // Get weekly XP transactions
    supabase
      .from("xp_transactions")
      .select("amount")
      .eq("user_email", email)
      .gte("created_at", weekAgoStr),

    // Get new followers this week
    getNewFollowers(email, weekAgoStr),

    // Get top posts from network
    getTopPosts(email, weekAgoStr),

    // Get recommended jobs
    getRecommendedJobs(),

    // Get upcoming events
    getUpcomingEvents(email),

    // Get total interviews
    supabase
      .from("interviews")
      .select("id", { count: "exact" })
      .eq("user_email", email),
  ]);

  // Calculate weekly stats
  const weeklyInterviewCount = weeklyInterviews.data?.length || 0;
  const weeklyScores = (weeklyInterviews.data || [])
    .filter((i) => i.score !== null)
    .map((i) => i.score);
  const avgScore =
    weeklyScores.length > 0
      ? Math.round(
          weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length
        )
      : null;

  // Calculate total XP earned this week
  const xpEarned = (weeklyXPTransactions.data || []).reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );

  return {
    name: user.name || "there",
    xpEarned,
    interviewsCompleted: weeklyInterviewCount,
    currentStreak: streakData.data?.current_streak || 0,
    avgScore,
    topPosts: topPostsData,
    newFollowers: newFollowersData.followers,
    newFollowersCount: newFollowersData.count,
    recommendedJobs: recommendedJobsData,
    upcomingEvents: upcomingEventsData,
    totalXP: user.xp || 0,
    longestStreak: streakData.data?.longest_streak || 0,
    totalInterviews: totalInterviewsData.count || 0,
  };
}

// Get new followers this week
async function getNewFollowers(
  email: string,
  weekAgoStr: string
): Promise<{ followers: NewFollower[]; count: number }> {
  const { data: follows, count } = await supabase
    .from("follows")
    .select("follower_email, created_at", { count: "exact" })
    .eq("following_email", email)
    .gte("created_at", weekAgoStr)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!follows || follows.length === 0) {
    return { followers: [], count: 0 };
  }

  const followerEmails = follows.map((f) => f.follower_email);

  // Get follower details
  const [profilesRes, accountsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, username, display_name")
      .in("email", followerEmails),
    supabase
      .from("user accounts")
      .select("email, name, image_url")
      .in("email", followerEmails),
  ]);

  const followers: NewFollower[] = follows.map((f) => {
    const profile = profilesRes.data?.find((p) => p.email === f.follower_email);
    const account = accountsRes.data?.find((a) => a.email === f.follower_email);
    return {
      name: profile?.display_name || account?.name || "Anonymous",
      username: profile?.username,
      image: account?.image_url,
    };
  });

  return { followers, count: count || 0 };
}

// Get top posts from user's network this week
async function getTopPosts(
  email: string,
  weekAgoStr: string
): Promise<TopPost[]> {
  // Get who the user follows
  const { data: following } = await supabase
    .from("follows")
    .select("following_email")
    .eq("follower_email", email);

  const followingEmails = following?.map((f) => f.following_email) || [];

  if (followingEmails.length === 0) {
    // If not following anyone, get popular public posts
    const { data: posts } = await supabase
      .from("posts")
      .select("id, author_email, content, likes_count, comments_count")
      .eq("visibility", "public")
      .is("deleted_at", null)
      .gte("created_at", weekAgoStr)
      .order("likes_count", { ascending: false })
      .limit(3);

    if (!posts || posts.length === 0) return [];

    return enrichPosts(posts);
  }

  // Get top posts from followed users
  const { data: posts } = await supabase
    .from("posts")
    .select("id, author_email, content, likes_count, comments_count")
    .in("author_email", followingEmails)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .gte("created_at", weekAgoStr)
    .order("likes_count", { ascending: false })
    .limit(3);

  if (!posts || posts.length === 0) return [];

  return enrichPosts(posts);
}

// Enrich posts with author names
async function enrichPosts(
  posts: Array<{
    id: string;
    author_email: string;
    content: string;
    likes_count: number;
    comments_count: number;
  }>
): Promise<TopPost[]> {
  const authorEmails = [...new Set(posts.map((p) => p.author_email))];

  const [profilesRes, accountsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, display_name")
      .in("email", authorEmails),
    supabase
      .from("user accounts")
      .select("email, name, image_url")
      .in("email", authorEmails),
  ]);

  return posts.map((post) => {
    const profile = profilesRes.data?.find((p) => p.email === post.author_email);
    const account = accountsRes.data?.find((a) => a.email === post.author_email);
    return {
      id: post.id,
      authorName: profile?.display_name || account?.name || "Anonymous",
      authorImage: account?.image_url,
      content: post.content,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
    };
  });
}

// Get recommended jobs (latest active internships)
async function getRecommendedJobs(): Promise<RecommendedJob[]> {
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      location,
      job_type,
      company:companies (
        name,
        logo_url
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!jobs) return [];

  return jobs.map((job) => {
    const company = Array.isArray(job.company) ? job.company[0] : job.company;
    return {
      id: job.id,
      title: job.title,
      company: company?.name || "Unknown Company",
      companyLogo: company?.logo_url ?? undefined,
      location: job.location ?? undefined,
      jobType: job.job_type || "internship",
    };
  });
}

// Get upcoming events
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getUpcomingEvents(_email: string): Promise<UpcomingEvent[]> {
  const now = new Date().toISOString();

  // Get events user has RSVP'd to or public events
  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_time, event_type, is_virtual")
    .eq("is_public", true)
    .gte("start_time", now)
    .order("start_time", { ascending: true })
    .limit(3);

  if (!events) return [];

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    startTime: event.start_time,
    eventType: event.event_type,
    isVirtual: event.is_virtual,
  }));
}

// Generate digest email HTML (plain template to avoid react-dom/server)
function generateDigestEmailHtml(data: {
  name: string;
  xpEarned: number;
  interviewsCompleted: number;
  currentStreak: number;
  avgScore: number | null;
  topPosts: TopPost[];
  newFollowers: NewFollower[];
  newFollowersCount: number;
  recommendedJobs: RecommendedJob[];
  upcomingEvents: UpcomingEvent[];
  baseUrl: string;
}): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const topPostsHtml = data.topPosts.length > 0
    ? data.topPosts.map(post => `
      <div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">${post.authorName}</p>
        <p style="margin: 0; color: #4b5563;">${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">${post.likes} likes · ${post.comments} comments</p>
      </div>
    `).join('')
    : '<p style="color: #9ca3af;">No posts this week</p>';

  const newFollowersHtml = data.newFollowersCount > 0
    ? `<p>${data.newFollowersCount} new follower${data.newFollowersCount > 1 ? 's' : ''} this week!</p>`
    : '';

  const jobsHtml = data.recommendedJobs.length > 0
    ? data.recommendedJobs.map(job => `
      <div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
        <p style="margin: 0; font-weight: 600;">${job.title}</p>
        <p style="margin: 4px 0 0 0; color: #4b5563;">${job.company}${job.location ? ` · ${job.location}` : ''}</p>
      </div>
    `).join('')
    : '<p style="color: #9ca3af;">No new jobs</p>';

  const eventsHtml = data.upcomingEvents.length > 0
    ? data.upcomingEvents.map(event => `
      <div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
        <p style="margin: 0; font-weight: 600;">${event.title}</p>
        <p style="margin: 4px 0 0 0; color: #4b5563;">${formatDate(event.startTime)}${event.isVirtual ? ' · Virtual' : ''}</p>
      </div>
    `).join('')
    : '<p style="color: #9ca3af;">No upcoming events</p>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 16px 16px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Your Weekly Digest</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Hey ${data.name}!</p>
    </div>

    <!-- Stats -->
    <div style="background: white; padding: 24px; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px;">This Week's Highlights</h2>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 100px; text-align: center; padding: 16px; background: #fef2f2; border-radius: 12px;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #dc2626;">${data.xpEarned}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">XP Earned</p>
        </div>
        <div style="flex: 1; min-width: 100px; text-align: center; padding: 16px; background: #f0fdf4; border-radius: 12px;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16a34a;">${data.interviewsCompleted}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Interviews</p>
        </div>
        <div style="flex: 1; min-width: 100px; text-align: center; padding: 16px; background: #fef3c7; border-radius: 12px;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #d97706;">${data.currentStreak}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Day Streak</p>
        </div>
      </div>
      ${newFollowersHtml}
    </div>

    <!-- Top Posts -->
    <div style="background: white; padding: 24px; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px;">Top Posts from Your Network</h2>
      ${topPostsHtml}
    </div>

    <!-- Jobs -->
    <div style="background: white; padding: 24px; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px;">Recommended Internships</h2>
      ${jobsHtml}
      <a href="${data.baseUrl}/jobs" style="display: inline-block; margin-top: 12px; color: #dc2626; text-decoration: none; font-weight: 500;">View all jobs →</a>
    </div>

    <!-- Events -->
    <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px;">Upcoming Events</h2>
      ${eventsHtml}
      <a href="${data.baseUrl}/events" style="display: inline-block; margin-top: 12px; color: #dc2626; text-decoration: none; font-weight: 500;">View all events →</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">Keep up the great work!</p>
      <a href="${data.baseUrl}/settings/notifications" style="color: #9ca3af;">Manage email preferences</a>
      <p style="margin: 16px 0 0 0;">© ${new Date().getFullYear()} Internship.sg</p>
    </div>
  </div>
</body>
</html>`;
}
