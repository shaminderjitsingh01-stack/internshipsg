import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Get all public users
    const { data: publicUsers, error: usersError } = await supabase
      .from("users")
      .select("email, xp_points")
      .eq("is_public", true);

    if (usersError) throw usersError;

    // Get streak data for all public users
    const userEmails = (publicUsers || []).map(u => u.email);
    userEmails.push(email); // Include current user even if not public

    const { data: streaks } = await supabase
      .from("streaks")
      .select("user_email, longest_streak")
      .in("user_email", userEmails);

    // Get interview scores for all users
    const { data: interviews } = await supabase
      .from("interviews")
      .select("user_email, score")
      .in("user_email", userEmails)
      .not("score", "is", null);

    // Calculate scores for all public users
    const publicUserScores = (publicUsers || []).map(user => {
      const userStreak = streaks?.find(s => s.user_email === user.email);
      const userInterviews = (interviews || []).filter(i => i.user_email === user.email);

      const avgScore = userInterviews.length > 0
        ? userInterviews.reduce((acc, i) => acc + (i.score || 0), 0) / userInterviews.length
        : 0;

      const longestStreak = userStreak?.longest_streak || 0;
      const xpPoints = user.xp_points || 0;

      return calculateOverallScore(avgScore, longestStreak, xpPoints);
    });

    // Get current user's data
    const { data: currentUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!currentUser) {
      // User not found - return default rank
      return NextResponse.json({
        rank: null,
        total_users: publicUserScores.length,
        percentile: 0,
      });
    }

    // Calculate current user's score
    const currentUserStreak = streaks?.find(s => s.user_email === email);
    const currentUserInterviews = (interviews || []).filter(i => i.user_email === email);

    const avgScore = currentUserInterviews.length > 0
      ? currentUserInterviews.reduce((acc, i) => acc + (i.score || 0), 0) / currentUserInterviews.length
      : 0;

    const longestStreak = currentUserStreak?.longest_streak || 0;
    const xpPoints = currentUser.xp_points || 0;
    const currentUserScore = calculateOverallScore(avgScore, longestStreak, xpPoints);

    // Count users with higher scores
    const usersAhead = publicUserScores.filter(score => score > currentUserScore).length;
    const totalUsers = publicUserScores.length;

    // If user is public, include them in the count
    const isUserPublic = currentUser.is_public === true;
    const rank = usersAhead + 1;
    const effectiveTotal = isUserPublic ? totalUsers : totalUsers + 1;
    const percentile = effectiveTotal > 0 ? Math.round(((effectiveTotal - rank + 1) / effectiveTotal) * 100) : 0;

    return NextResponse.json({
      rank,
      total_users: effectiveTotal,
      percentile,
      tier: currentUser.tier || calculateTier(xpPoints),
      score: currentUserScore,
    });
  } catch (error) {
    console.error("Error fetching user rank:", error);
    return NextResponse.json({ error: "Failed to fetch rank" }, { status: 500 });
  }
}
