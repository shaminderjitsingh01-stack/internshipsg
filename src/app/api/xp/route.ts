import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  getUserXPData,
  awardXP,
  XP_REWARDS,
  XPRewardType,
} from "@/lib/xp";

// GET: Get user's XP, level, tier, percentile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const xpData = await getUserXPData(session.user.email);

    return NextResponse.json({
      success: true,
      data: {
        totalXP: xpData.totalXP,
        level: xpData.level,
        tier: xpData.tier,
        tierInfo: xpData.tierInfo,
        percentile: xpData.percentile,
        levelProgress: xpData.levelProgress,
        xpToNextLevel: xpData.xpToNextLevel,
        recentTransactions: xpData.recentTransactions,
      },
    });
  } catch (error) {
    console.error("Error fetching XP data:", error);
    return NextResponse.json(
      { error: "Failed to fetch XP data" },
      { status: 500 }
    );
  }
}

// POST: Award XP (with reason)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason, amount: customAmount } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    // Determine XP amount - use predefined reward or custom amount
    let xpAmount: number;

    if (reason in XP_REWARDS) {
      xpAmount = XP_REWARDS[reason as XPRewardType];
    } else if (typeof customAmount === "number" && customAmount > 0) {
      // Allow custom amounts for admin/special cases, but cap it
      xpAmount = Math.min(customAmount, 500);
    } else {
      return NextResponse.json(
        { error: "Invalid reward reason or amount" },
        { status: 400 }
      );
    }

    const result = await awardXP(session.user.email, xpAmount, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to award XP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        awarded: xpAmount,
        reason,
        newTotal: result.newTotal,
        levelUp: result.levelUp,
        previousLevel: result.previousLevel,
        newLevel: result.newLevel,
        tierChange: result.tierChange,
        previousTier: result.previousTier,
        newTier: result.newTier,
      },
    });
  } catch (error) {
    console.error("Error awarding XP:", error);
    return NextResponse.json(
      { error: "Failed to award XP" },
      { status: 500 }
    );
  }
}
