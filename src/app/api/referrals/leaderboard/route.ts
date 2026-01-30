import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { REFERRAL_XP } from "@/lib/referrals";

export interface ReferralLeaderboardUser {
  rank: number;
  email: string;
  name: string;
  avatar_url?: string;
  total_referrals: number;
  successful_referrals: number;
  xp_earned: number;
  is_current_user?: boolean;
}

export interface ReferralLeaderboardResponse {
  leaderboard: ReferralLeaderboardUser[];
  total: number;
}

/**
 * GET - Get referral leaderboard (top referrers)
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const currentUserEmail = searchParams.get("email");

    // Get all referrals grouped by referrer
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("referrer_email, status");

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError);
      return NextResponse.json(
        { error: "Failed to fetch referrals" },
        { status: 500 }
      );
    }

    // Aggregate referral stats by referrer
    const referrerStats: Record<
      string,
      { total: number; completed: number; rewarded: number }
    > = {};

    (referrals || []).forEach((referral) => {
      const email = referral.referrer_email;
      if (!referrerStats[email]) {
        referrerStats[email] = { total: 0, completed: 0, rewarded: 0 };
      }
      referrerStats[email].total++;
      if (referral.status === "completed") {
        referrerStats[email].completed++;
      } else if (referral.status === "rewarded") {
        referrerStats[email].rewarded++;
      }
    });

    // Get referrer emails that have at least one referral
    const referrerEmails = Object.keys(referrerStats);

    if (referrerEmails.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        total: 0,
      } as ReferralLeaderboardResponse);
    }

    // Get profile info for referrers
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, display_name, avatar_url")
      .in("email", referrerEmails);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.email, p])
    );

    // Build leaderboard data
    const leaderboardData: Omit<ReferralLeaderboardUser, "rank">[] = referrerEmails.map(
      (email) => {
        const stats = referrerStats[email];
        const profile = profileMap.get(email);
        const successfulReferrals = stats.rewarded;
        const xpEarned = successfulReferrals * REFERRAL_XP;

        return {
          email,
          name: profile?.display_name || email.split("@")[0],
          avatar_url: profile?.avatar_url,
          total_referrals: stats.total,
          successful_referrals: successfulReferrals,
          xp_earned: xpEarned,
        };
      }
    );

    // Sort by successful referrals (then by total as tiebreaker)
    leaderboardData.sort((a, b) => {
      if (b.successful_referrals !== a.successful_referrals) {
        return b.successful_referrals - a.successful_referrals;
      }
      return b.total_referrals - a.total_referrals;
    });

    // Apply ranking and limit
    const rankedLeaderboard: ReferralLeaderboardUser[] = leaderboardData
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        ...user,
        is_current_user: currentUserEmail === user.email,
      }));

    // If current user is not in top N, add them at their actual position
    if (currentUserEmail && !rankedLeaderboard.some((u) => u.email === currentUserEmail)) {
      const currentUserIndex = leaderboardData.findIndex(
        (u) => u.email === currentUserEmail
      );
      if (currentUserIndex !== -1) {
        const currentUserData = leaderboardData[currentUserIndex];
        rankedLeaderboard.push({
          rank: currentUserIndex + 1,
          ...currentUserData,
          is_current_user: true,
        });
      }
    }

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      total: leaderboardData.length,
    } as ReferralLeaderboardResponse);
  } catch (error) {
    console.error("Error fetching referral leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral leaderboard" },
      { status: 500 }
    );
  }
}
