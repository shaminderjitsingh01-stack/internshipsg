import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getCurrentWeekInfo,
  getChallengesForWeek,
  getOrCreateUserChallenges,
  calculateChallengeProgress,
  updateChallengeProgress,
  getWeeklyLeaderboard,
  getPastWeekResults,
  syncUserChallenges,
  getDaysRemainingInWeek,
  CHALLENGE_XP_REWARDS,
  CHALLENGE_POINTS,
  CHALLENGE_BADGES,
} from "@/lib/challenges";

// GET: Get current week's challenges, user progress, leaderboard, and past results
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("email");
  const weekParam = searchParams.get("week");
  const yearParam = searchParams.get("year");
  const leaderboardOnly = searchParams.get("leaderboard") === "true";
  const pastResults = searchParams.get("past_results") === "true";

  try {
    const { weekNumber: currentWeek, year: currentYear } = getCurrentWeekInfo();
    const weekNumber = weekParam ? parseInt(weekParam) : currentWeek;
    const year = yearParam ? parseInt(yearParam) : currentYear;

    // If only leaderboard requested
    if (leaderboardOnly) {
      const leaderboard = await getWeeklyLeaderboard(weekNumber, year, userEmail || undefined);
      return NextResponse.json({
        success: true,
        leaderboard,
        weekNumber,
        year,
      });
    }

    // If only past results requested
    if (pastResults && userEmail) {
      const results = await getPastWeekResults(userEmail);
      return NextResponse.json({
        success: true,
        pastResults: results,
      });
    }

    // Get challenges for the week
    const challenges = getChallengesForWeek(weekNumber, year);

    // Get user progress if email provided
    let userProgress: Record<string, number> = {};
    let userChallenges: Awaited<ReturnType<typeof getOrCreateUserChallenges>> = [];

    if (userEmail) {
      // Sync challenges first
      await syncUserChallenges(userEmail);

      userChallenges = await getOrCreateUserChallenges(userEmail, weekNumber, year);
      userProgress = await calculateChallengeProgress(userEmail, weekNumber, year);
    }

    // Get leaderboard
    const leaderboard = await getWeeklyLeaderboard(weekNumber, year, userEmail || undefined);

    // Calculate user's stats
    const completedCount = userChallenges.filter(c => c.completed).length;
    const totalXPEarned = userChallenges
      .filter(c => c.completed)
      .reduce((sum, c) => {
        const challenge = challenges.find(ch => ch.id === c.challenge_id);
        return sum + (challenge ? CHALLENGE_XP_REWARDS[challenge.difficulty] : 0);
      }, 0);
    const totalPointsEarned = userChallenges
      .filter(c => c.completed)
      .reduce((sum, c) => {
        const challenge = challenges.find(ch => ch.id === c.challenge_id);
        return sum + (challenge ? CHALLENGE_POINTS[challenge.difficulty] : 0);
      }, 0);

    // Get user's rank in leaderboard
    const userRank = userEmail
      ? leaderboard.find(e => e.user_email === userEmail)?.rank || null
      : null;

    // Merge challenge definitions with user progress
    const challengesWithProgress = challenges.map(challenge => {
      const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
      return {
        ...challenge,
        progress: userProgress[challenge.id] || 0,
        completed: userChallenge?.completed || false,
        completedAt: userChallenge?.completed_at || null,
        xpReward: CHALLENGE_XP_REWARDS[challenge.difficulty],
        pointsReward: CHALLENGE_POINTS[challenge.difficulty],
      };
    });

    return NextResponse.json({
      success: true,
      weekNumber,
      year,
      daysRemaining: weekNumber === currentWeek && year === currentYear
        ? getDaysRemainingInWeek()
        : 0,
      challenges: challengesWithProgress,
      leaderboard: leaderboard.slice(0, 10), // Top 10
      userStats: userEmail ? {
        completedCount,
        totalChallenges: challenges.length,
        totalXPEarned,
        totalPointsEarned,
        rank: userRank,
        percentile: leaderboard.length > 0 && userRank
          ? Math.round(((leaderboard.length - userRank + 1) / leaderboard.length) * 100)
          : null,
      } : null,
      badges: CHALLENGE_BADGES,
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}

// POST: Update challenge progress or manually trigger sync
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const session = await getServerSession();
    const body = await request.json();
    const { userEmail, challengeId, progress, action } = body;

    // Use session email if not provided
    const email = userEmail || session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Sync action - updates all challenges based on current activity
    if (action === "sync") {
      await syncUserChallenges(email);

      const { weekNumber, year } = getCurrentWeekInfo();
      const challenges = getChallengesForWeek(weekNumber, year);
      const userChallenges = await getOrCreateUserChallenges(email, weekNumber, year);
      const userProgress = await calculateChallengeProgress(email, weekNumber, year);

      const challengesWithProgress = challenges.map(challenge => {
        const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
        return {
          ...challenge,
          progress: userProgress[challenge.id] || 0,
          completed: userChallenge?.completed || false,
          completedAt: userChallenge?.completed_at || null,
          xpReward: CHALLENGE_XP_REWARDS[challenge.difficulty],
          pointsReward: CHALLENGE_POINTS[challenge.difficulty],
        };
      });

      return NextResponse.json({
        success: true,
        message: "Challenges synced",
        challenges: challengesWithProgress,
      });
    }

    // Update specific challenge
    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID required" }, { status: 400 });
    }

    const result = await updateChallengeProgress(email, challengeId, progress || 0);

    if (!result.success) {
      return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      completed: result.completed,
      reward: result.reward,
      xpAwarded: result.xpAwarded,
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}
