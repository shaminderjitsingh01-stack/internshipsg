import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getOrCreateReferralCode,
  getReferralLink,
  getReferralStats,
  getReferredFriends,
  trackReferral,
  completeReferral,
  checkAndRewardReferrer,
  REFERRAL_XP,
} from "@/lib/referrals";

export const maxDuration = 30;

/**
 * GET - Get user's referral code, link, and stats
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Get or create referral code
    const referralCode = await getOrCreateReferralCode(email);
    if (!referralCode) {
      return NextResponse.json(
        { error: "Failed to get referral code" },
        { status: 500 }
      );
    }

    // Get referral link
    const referralLink = getReferralLink(referralCode);

    // Get referral stats
    const stats = await getReferralStats(email);

    // Get referred friends with profile info
    const referredFriends = await getReferredFriends(email);

    return NextResponse.json({
      referralCode,
      referralLink,
      stats,
      referredFriends,
      xpPerReferral: REFERRAL_XP,
    });
  } catch (error) {
    console.error("Error fetching referral data:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral data" },
      { status: 500 }
    );
  }
}

/**
 * POST - Track a new referral or complete/reward a referral
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, referralCode, newUserEmail, referredEmail } = body;

    // Track new referral
    if (action === "track" || (!action && referralCode && newUserEmail)) {
      if (!referralCode || !newUserEmail) {
        return NextResponse.json(
          { error: "Referral code and new user email required" },
          { status: 400 }
        );
      }

      const result = await trackReferral(referralCode, newUserEmail);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Referral tracked" });
    }

    // Complete a referral (user finished signup)
    if (action === "complete") {
      if (!referredEmail) {
        return NextResponse.json(
          { error: "Referred email required" },
          { status: 400 }
        );
      }

      const result = await completeReferral(referredEmail);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Referral completed" });
    }

    // Reward referrer (referred user did first activity)
    if (action === "reward") {
      if (!referredEmail) {
        return NextResponse.json(
          { error: "Referred email required" },
          { status: 400 }
        );
      }

      const result = await checkAndRewardReferrer(referredEmail);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Referrer rewarded",
        referrerEmail: result.referrerEmail,
        xpAwarded: result.xpAwarded,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing referral:", error);
    return NextResponse.json(
      { error: "Failed to process referral" },
      { status: 500 }
    );
  }
}
