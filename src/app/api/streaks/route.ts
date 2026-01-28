import { NextRequest, NextResponse } from "next/server";
import { getStreakWithBadges, recordActivity, BADGES } from "@/lib/streaks";
import { isSupabaseConfigured } from "@/lib/supabase";
import { checkAndRewardReferrer } from "@/lib/referrals";

// GET - Fetch user's streak and badges
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
    const data = await getStreakWithBadges(userEmail);

    // Enrich badges with full info
    const enrichedBadges = data.badges.map(badge => ({
      ...badge,
      ...BADGES[badge.badge_id as keyof typeof BADGES],
    }));

    return NextResponse.json({
      streak: data.streak,
      badges: enrichedBadges,
      nextBadge: data.nextBadge,
      title: data.title,
      badgeDefinitions: BADGES,
      freezeUsed: data.freezeUsed,
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    return NextResponse.json({ error: "Failed to fetch streak" }, { status: 500 });
  }
}

// POST - Record an activity and update streak
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const result = await recordActivity(userEmail);

    // Enrich new badges with full info
    const enrichedNewBadges = result.newBadges.map(badgeId => BADGES[badgeId]);

    // Check if this is the user's first activity (total_activities === 1)
    // If so, reward their referrer
    let referralReward = null;
    if (result.streak && result.streak.total_activities === 1) {
      const rewardResult = await checkAndRewardReferrer(userEmail);
      if (rewardResult.success && rewardResult.xpAwarded) {
        referralReward = {
          referrerEmail: rewardResult.referrerEmail,
          xpAwarded: rewardResult.xpAwarded,
        };
      }
    }

    return NextResponse.json({
      streak: result.streak,
      newBadges: enrichedNewBadges,
      isNewDay: result.isNewDay,
      freezeEarned: result.freezeEarned,
      referralReward,
      success: true,
    });
  } catch (error) {
    console.error("Error recording activity:", error);
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  }
}
