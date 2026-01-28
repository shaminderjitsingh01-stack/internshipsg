import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ALL_BADGES, Badge, BadgeCategory, calculateBadgeProgress, UserBadgeProgress } from "@/data/badges";
import { getOrCreateUserXP } from "@/lib/xp";

interface UserAchievements {
  totalBadges: number;
  earnedBadges: number;
  totalXP: number;
  currentTier: string;
  badges: {
    badge: Badge;
    progress: UserBadgeProgress;
  }[];
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalInterviews: number;
    averageScore: number;
    perfectScores: number;
    highScores: number; // 8+ scores
    referrals: number;
    profileComplete: boolean;
    consecutiveImprovements: number;
  };
}

// Calculate consecutive score improvements
function calculateConsecutiveImprovements(scores: number[]): number {
  if (scores.length < 2) return 0;

  let maxConsecutive = 0;
  let currentConsecutive = 0;

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[i - 1]) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutive;
}

// Check if profile is complete
function isProfileComplete(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;

  const requiredFields = ['username', 'school', 'graduation_year', 'field_of_study', 'bio'];
  return requiredFields.every(field => profile[field]);
}

// GET - Fetch user's achievements and badge progress
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("email");

  if (!userEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Fetch all necessary data in parallel
    const [
      streakResult,
      interviewsResult,
      badgesResult,
      profileResult,
      referralsResult,
      userXPResult,
    ] = await Promise.all([
      // Streak data
      supabase
        .from("streaks")
        .select("*")
        .eq("user_email", userEmail)
        .single(),

      // Interviews with scores
      supabase
        .from("interviews")
        .select("score, created_at")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: true }),

      // Earned badges
      supabase
        .from("user_badges")
        .select("*")
        .eq("user_email", userEmail),

      // Profile data
      supabase
        .from("profiles")
        .select("*")
        .eq("user_email", userEmail)
        .single(),

      // Referral data
      supabase
        .from("referrals")
        .select("*")
        .eq("referrer_email", userEmail)
        .eq("completed", true),

      // XP data
      getOrCreateUserXP(userEmail),
    ]);

    // Extract data with defaults
    const streak = streakResult.data || { current_streak: 0, longest_streak: 0, total_activities: 0 };
    const interviews = interviewsResult.data || [];
    const earnedBadges = badgesResult.data || [];
    const profile = profileResult.data;
    const referrals = referralsResult.data || [];
    const userXP = userXPResult;

    // Calculate interview stats
    const scores = interviews.map((i: { score: number }) => i.score || 0);
    const totalInterviews = interviews.length;
    const averageScore = totalInterviews > 0
      ? scores.reduce((a: number, b: number) => a + b, 0) / totalInterviews
      : 0;
    const perfectScores = scores.filter((s: number) => s === 10).length;
    const highScores = scores.filter((s: number) => s >= 8).length;
    const consecutiveImprovements = calculateConsecutiveImprovements(scores);
    const profileComplete = isProfileComplete(profile);

    // Create a map of earned badges with their unlock dates
    const earnedBadgeMap = new Map<string, string>();
    earnedBadges.forEach((badge: { badge_id: string; unlocked_at: string }) => {
      earnedBadgeMap.set(badge.badge_id, badge.unlocked_at);
    });

    // Stats for badge calculations
    const stats = {
      currentStreak: streak.current_streak || 0,
      longestStreak: streak.longest_streak || 0,
      totalInterviews,
      averageScore: Math.round(averageScore * 10) / 10,
      perfectScores,
      highScores,
      referrals: referrals.length,
      profileComplete,
      consecutiveImprovements,
    };

    // Calculate progress for each badge
    const badgesWithProgress = ALL_BADGES.map(badge => {
      let currentValue = 0;

      // Determine current value based on requirement type
      switch (badge.requirementType) {
        case 'streak_days':
          currentValue = stats.currentStreak;
          break;
        case 'total_interviews':
          currentValue = stats.totalInterviews;
          break;
        case 'perfect_scores':
          currentValue = stats.perfectScores;
          break;
        case 'high_scores':
          currentValue = stats.highScores;
          break;
        case 'consecutive_improvements':
          currentValue = stats.consecutiveImprovements;
          break;
        case 'profile_complete':
          currentValue = stats.profileComplete ? 1 : 0;
          break;
        case 'referrals':
          currentValue = stats.referrals;
          break;
        case 'early_adopter':
          // Check if user joined before a certain date
          const earlyAdopterCutoff = new Date('2026-03-01');
          const userJoinDate = profile?.created_at ? new Date(profile.created_at) : new Date();
          currentValue = userJoinDate < earlyAdopterCutoff ? 1 : 0;
          break;
        // Special badges need custom tracking (night_practice, early_practice, etc.)
        // These would need to be tracked separately in the database
        default:
          currentValue = 0;
      }

      const isEarned = earnedBadgeMap.has(badge.id);
      const earnedAt = earnedBadgeMap.get(badge.id);

      const progress = calculateBadgeProgress(badge, currentValue);
      progress.isEarned = isEarned;
      progress.earnedAt = earnedAt;

      return {
        badge,
        progress,
      };
    });

    // Calculate tier based on XP
    const totalXP = userXP?.total_xp || 0;
    let currentTier = 'bronze';
    if (totalXP >= 10000) currentTier = 'elite';
    else if (totalXP >= 5000) currentTier = 'verified';
    else if (totalXP >= 2000) currentTier = 'gold';
    else if (totalXP >= 500) currentTier = 'silver';

    const response: UserAchievements = {
      totalBadges: ALL_BADGES.length,
      earnedBadges: earnedBadges.length,
      totalXP,
      currentTier,
      badges: badgesWithProgress,
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}

// POST - Award a badge to user (called when badge conditions are met)
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { userEmail, badgeId } = body;

    if (!userEmail || !badgeId) {
      return NextResponse.json({ error: "Email and badge ID required" }, { status: 400 });
    }

    // Verify badge exists
    const badge = ALL_BADGES.find(b => b.id === badgeId);
    if (!badge) {
      return NextResponse.json({ error: "Invalid badge ID" }, { status: 400 });
    }

    // Check if already earned
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_email", userEmail)
      .eq("badge_id", badgeId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Badge already earned" }, { status: 400 });
    }

    // Award the badge
    const { error: insertError } = await supabase
      .from("user_badges")
      .insert({
        user_email: userEmail,
        badge_id: badgeId,
        unlocked_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error awarding badge:", insertError);
      return NextResponse.json({ error: "Failed to award badge" }, { status: 500 });
    }

    // Award XP for the badge
    const { data: userXP } = await supabase
      .from("user_xp")
      .select("total_xp")
      .eq("user_email", userEmail)
      .single();

    if (userXP) {
      await supabase
        .from("user_xp")
        .update({ total_xp: userXP.total_xp + badge.xpReward })
        .eq("user_email", userEmail);
    } else {
      await supabase
        .from("user_xp")
        .insert({ user_email: userEmail, total_xp: badge.xpReward });
    }

    // Log XP transaction
    await supabase
      .from("xp_transactions")
      .insert({
        user_email: userEmail,
        amount: badge.xpReward,
        reason: `Earned badge: ${badge.name}`,
      });

    return NextResponse.json({
      success: true,
      badge,
      xpAwarded: badge.xpReward,
    });
  } catch (error) {
    console.error("Error in badge award:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
