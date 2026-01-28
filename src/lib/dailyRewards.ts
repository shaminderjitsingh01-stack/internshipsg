import { supabase, isSupabaseConfigured } from "./supabase";

// Daily login reward constants
export const DAILY_LOGIN_XP = 5;

export interface DailyReward {
  id: string;
  user_email: string;
  reward_date: string;
  reward_type: "daily_login" | "daily_challenge";
  xp_awarded: number;
  created_at: string;
}

// Check if user has claimed daily login reward today
export async function hasClaimedDailyLogin(userEmail: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_rewards")
    .select("id")
    .eq("user_email", userEmail)
    .eq("reward_date", today)
    .eq("reward_type", "daily_login")
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking daily login:", error);
  }

  return !!data;
}

// Claim daily login reward
export async function claimDailyLoginReward(userEmail: string): Promise<{
  success: boolean;
  alreadyClaimed: boolean;
  xpAwarded: number;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, alreadyClaimed: false, xpAwarded: 0 };
  }

  const today = new Date().toISOString().split("T")[0];

  // Check if already claimed
  const alreadyClaimed = await hasClaimedDailyLogin(userEmail);
  if (alreadyClaimed) {
    return { success: true, alreadyClaimed: true, xpAwarded: 0 };
  }

  // Insert reward record
  const { error: insertError } = await supabase.from("daily_rewards").insert({
    user_email: userEmail,
    reward_date: today,
    reward_type: "daily_login",
    xp_awarded: DAILY_LOGIN_XP,
  });

  if (insertError) {
    console.error("Error claiming daily login:", insertError);
    return { success: false, alreadyClaimed: false, xpAwarded: 0 };
  }

  // Update user's total XP in profiles table
  const { error: updateError } = await supabase.rpc("increment_xp", {
    user_email_param: userEmail,
    xp_amount: DAILY_LOGIN_XP,
  });

  if (updateError) {
    // RPC might not exist, but that's ok - XP is handled separately via user_xp table
    console.log("RPC increment_xp not available, skipping direct update");
  }

  return { success: true, alreadyClaimed: false, xpAwarded: DAILY_LOGIN_XP };
}

// Get user's daily reward history
export async function getDailyRewardHistory(
  userEmail: string,
  days: number = 7
): Promise<DailyReward[]> {
  if (!isSupabaseConfigured()) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("daily_rewards")
    .select("*")
    .eq("user_email", userEmail)
    .gte("reward_date", startDate.toISOString().split("T")[0])
    .order("reward_date", { ascending: false });

  if (error) {
    console.error("Error fetching reward history:", error);
    return [];
  }

  return data || [];
}

// Get total XP earned from daily rewards
export async function getTotalDailyRewardXP(userEmail: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { data, error } = await supabase
    .from("daily_rewards")
    .select("xp_awarded")
    .eq("user_email", userEmail);

  if (error) {
    console.error("Error fetching total reward XP:", error);
    return 0;
  }

  return (data || []).reduce((sum, reward) => sum + (reward.xp_awarded || 0), 0);
}

// Check login streak for consecutive daily logins
export async function getDailyLoginStreak(userEmail: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { data, error } = await supabase
    .from("daily_rewards")
    .select("reward_date")
    .eq("user_email", userEmail)
    .eq("reward_type", "daily_login")
    .order("reward_date", { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) return 0;

  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);

  for (const reward of data) {
    const rewardDate = new Date(reward.reward_date);
    rewardDate.setHours(0, 0, 0, 0);

    // Check if this date is expected (today, yesterday, etc.)
    const diffDays = Math.round(
      (expectedDate.getTime() - rewardDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (diffDays === 1 && streak === 0) {
      // First entry is yesterday
      streak++;
      expectedDate = new Date(rewardDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
