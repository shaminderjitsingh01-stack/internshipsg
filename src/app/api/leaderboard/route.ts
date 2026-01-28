import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  name: string;
  image_url: string | null;
  school: string | null;
  tier: string;
  score: number;
  longest_streak: number;
  xp_points: number;
  is_current_user?: boolean;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  total: number;
  userRank: {
    rank: number;
    percentile: number;
    user: LeaderboardUser;
  } | null;
}

// Calculate tier based on XP
function calculateTier(xp: number): string {
  if (xp >= 10000) return "elite";
  if (xp >= 5000) return "verified";
  if (xp >= 2000) return "gold";
  if (xp >= 500) return "silver";
  return "bronze";
}

// Calculate overall score (weighted combination)
function calculateOverallScore(
  interviewAvg: number,
  longestStreak: number,
  xpPoints: number
): number {
  // Weighted formula: 40% interview score, 30% streak, 30% XP (normalized)
  const normalizedInterview = interviewAvg * 10; // 0-100
  const normalizedStreak = Math.min(longestStreak * 1.5, 100); // Cap at ~67 days
  const normalizedXP = Math.min(xpPoints / 100, 100); // 10000 XP = 100

  return Math.round(
    normalizedInterview * 0.4 +
    normalizedStreak * 0.3 +
    normalizedXP * 0.3
  );
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const sortBy = searchParams.get("sort_by") || "score"; // score, streak, xp
  const school = searchParams.get("school") || "all";
  const timePeriod = searchParams.get("time_period") || "all"; // all, month, week
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const currentUserEmail = searchParams.get("email");

  try {
    // Build query for public users
    let query = supabase
      .from("users")
      .select("*")
      .eq("is_public", true);

    // Filter by school if specified
    if (school !== "all") {
      query = query.eq("school", school);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) throw usersError;

    // Get streak data for all public users
    const userEmails = (users || []).map(u => u.email);

    const { data: streaks } = await supabase
      .from("streaks")
      .select("*")
      .in("user_email", userEmails);

    // Get interview scores for all users
    const { data: interviews } = await supabase
      .from("interviews")
      .select("user_email, score, created_at")
      .in("user_email", userEmails)
      .not("score", "is", null);

    // Calculate time filter
    let startDate: Date | null = null;
    if (timePeriod === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timePeriod === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }

    // Build leaderboard data
    const leaderboardData = (users || []).map(user => {
      const userStreak = streaks?.find(s => s.user_email === user.email);

      // Filter interviews by time period
      let userInterviews = (interviews || []).filter(i => i.user_email === user.email);
      if (startDate) {
        userInterviews = userInterviews.filter(i => new Date(i.created_at) >= startDate!);
      }

      const avgScore = userInterviews.length > 0
        ? userInterviews.reduce((acc, i) => acc + (i.score || 0), 0) / userInterviews.length
        : 0;

      const longestStreak = userStreak?.longest_streak || 0;
      const xpPoints = user.xp_points || 0;

      return {
        id: user.id,
        username: user.username || user.email.split("@")[0],
        name: user.name || "Anonymous",
        image_url: user.image_url,
        school: user.school,
        tier: user.tier || calculateTier(xpPoints),
        score: calculateOverallScore(avgScore, longestStreak, xpPoints),
        longest_streak: longestStreak,
        xp_points: xpPoints,
        interview_avg: avgScore,
      };
    });

    // Sort based on selected criteria
    if (sortBy === "streak") {
      leaderboardData.sort((a, b) => b.longest_streak - a.longest_streak);
    } else if (sortBy === "xp") {
      leaderboardData.sort((a, b) => b.xp_points - a.xp_points);
    } else {
      leaderboardData.sort((a, b) => b.score - a.score);
    }

    // Apply ranking
    const rankedData: LeaderboardUser[] = leaderboardData.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    // Get total count
    const total = rankedData.length;

    // Find current user's rank if email provided
    let userRank = null;
    if (currentUserEmail) {
      // First check if user is public
      const { data: currentUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", currentUserEmail)
        .single();

      if (currentUser) {
        // Get current user's stats
        const { data: currentUserStreak } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_email", currentUserEmail)
          .single();

        const { data: currentUserInterviews } = await supabase
          .from("interviews")
          .select("score")
          .eq("user_email", currentUserEmail)
          .not("score", "is", null);

        const avgScore = currentUserInterviews && currentUserInterviews.length > 0
          ? currentUserInterviews.reduce((acc, i) => acc + (i.score || 0), 0) / currentUserInterviews.length
          : 0;

        const longestStreak = currentUserStreak?.longest_streak || 0;
        const xpPoints = currentUser.xp_points || 0;
        const overallScore = calculateOverallScore(avgScore, longestStreak, xpPoints);

        // Calculate rank by counting users with higher scores
        const usersAhead = rankedData.filter(u => {
          if (sortBy === "streak") return u.longest_streak > longestStreak;
          if (sortBy === "xp") return u.xp_points > xpPoints;
          return u.score > overallScore;
        }).length;

        const rank = usersAhead + 1;
        const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;

        userRank = {
          rank,
          percentile,
          user: {
            rank,
            id: currentUser.id,
            username: currentUser.username || currentUserEmail.split("@")[0],
            name: currentUser.name || "Anonymous",
            image_url: currentUser.image_url,
            school: currentUser.school,
            tier: currentUser.tier || calculateTier(xpPoints),
            score: overallScore,
            longest_streak: longestStreak,
            xp_points: xpPoints,
            is_current_user: true,
          },
        };
      }
    }

    // Apply pagination
    const paginatedData = rankedData.slice(offset, offset + limit);

    // Mark current user in the list
    if (currentUserEmail) {
      paginatedData.forEach(user => {
        if (user.username === currentUserEmail.split("@")[0] ||
            rankedData.find(r => r.id === user.id)?.is_current_user) {
          user.is_current_user = true;
        }
      });
    }

    return NextResponse.json({
      users: paginatedData,
      total,
      userRank,
    } as LeaderboardResponse);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
