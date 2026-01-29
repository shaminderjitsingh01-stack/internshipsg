import { supabase, isSupabaseConfigured } from "./supabase";

// XP amounts for different actions
export const XP_REWARDS = {
  INTERVIEW_COMPLETE: 50,
  INTERVIEW_SCORE_8_PLUS: 25,
  SEVEN_DAY_STREAK: 30,
  CHALLENGE_COMPLETE: 25,
  CHALLENGE_EASY: 15,
  CHALLENGE_MEDIUM: 25,
  CHALLENGE_HARD: 50,
  WEEKLY_WINNER: 100,
  WEEKLY_TOP_3: 50,
  ALL_CHALLENGES: 40,
  PROFILE_COMPLETE: 20,
  DAILY_LOGIN: 10,
  REFERRAL_SIGNUP: 100,
};

// Tier thresholds (designed for quick progression to encourage participation)
// Bronze: 0 XP (start) | Silver: 50 XP (1 interview) | Gold: 200 XP (4 interviews)
// Diamond: 500 XP (10 interviews) | Elite: Top 5% percentile
export const TIERS = {
  bronze: { min: 0, max: 49, color: "#CD7F32", label: "Bronze" },
  silver: { min: 50, max: 199, color: "#C0C0C0", label: "Silver" },
  gold: { min: 200, max: 499, color: "#FFD700", label: "Gold" },
  diamond: { min: 500, max: Infinity, color: "#06B6D4", label: "Diamond" },
  elite: { min: 0, max: Infinity, color: "#7C3AED", label: "Elite" }, // Percentile-based
};

export type TierName = keyof typeof TIERS;
export type XPRewardType = keyof typeof XP_REWARDS;

export interface XPTransaction {
  id: string;
  user_email: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface UserXP {
  id: string;
  user_email: string;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

// Level calculation (1-50)
// Uses a quadratic formula: level n requires n^2 * 20 total XP
// Level 1: 0-19 XP, Level 2: 20-79 XP, Level 3: 80-179 XP, etc.
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  // Formula: level = floor(sqrt(xp / 20)) + 1, capped at 50
  const level = Math.floor(Math.sqrt(xp / 20)) + 1;
  return Math.min(Math.max(level, 1), 50);
}

// Get XP required for a specific level
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  // XP required to reach level n: (n-1)^2 * 20
  return Math.pow(level - 1, 2) * 20;
}

// Get XP required to reach the next level
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= 50) return Infinity;
  return getXPForLevel(currentLevel + 1);
}

// Get progress percentage to next level
export function getLevelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  if (currentLevel >= 50) return 100;

  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  return Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100);
}

// Tier calculation
export function calculateTier(xp: number, percentile?: number): TierName {
  // Elite is purely percentile-based: Top 5%
  if (percentile !== undefined && percentile >= 95) {
    return "elite";
  }

  // Otherwise, base tier on XP thresholds
  if (xp >= TIERS.diamond.min) return "diamond";
  if (xp >= TIERS.gold.min) return "gold";
  if (xp >= TIERS.silver.min) return "silver";
  return "bronze";
}

// Get tier info
export function getTierInfo(tier: TierName) {
  return TIERS[tier];
}

// Get or create user XP record
export async function getOrCreateUserXP(userEmail: string): Promise<UserXP | null> {
  if (!isSupabaseConfigured()) return null;

  // Try to get existing XP record
  const { data: existing } = await supabase
    .from("user_xp")
    .select("*")
    .eq("user_email", userEmail)
    .single();

  if (existing) return existing;

  // Create new XP record
  const { data: newRecord, error } = await supabase
    .from("user_xp")
    .insert({
      user_email: userEmail,
      total_xp: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user XP record:", error);
    return null;
  }

  return newRecord;
}

// Award XP to a user
export async function awardXP(
  userEmail: string,
  amount: number,
  reason: string
): Promise<{
  success: boolean;
  newTotal: number;
  levelUp: boolean;
  previousLevel: number;
  newLevel: number;
  tierChange: boolean;
  previousTier: TierName;
  newTier: TierName;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      newTotal: 0,
      levelUp: false,
      previousLevel: 1,
      newLevel: 1,
      tierChange: false,
      previousTier: "bronze",
      newTier: "bronze",
    };
  }

  // Get current XP
  const userXP = await getOrCreateUserXP(userEmail);
  if (!userXP) {
    return {
      success: false,
      newTotal: 0,
      levelUp: false,
      previousLevel: 1,
      newLevel: 1,
      tierChange: false,
      previousTier: "bronze",
      newTier: "bronze",
    };
  }

  const previousXP = userXP.total_xp;
  const newTotal = previousXP + amount;
  const previousLevel = calculateLevel(previousXP);
  const newLevel = calculateLevel(newTotal);
  const previousTier = calculateTier(previousXP);
  const newTier = calculateTier(newTotal);

  // Update total XP
  const { error: updateError } = await supabase
    .from("user_xp")
    .update({
      total_xp: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail);

  if (updateError) {
    console.error("Error updating XP:", updateError);
    return {
      success: false,
      newTotal: previousXP,
      levelUp: false,
      previousLevel,
      newLevel: previousLevel,
      tierChange: false,
      previousTier,
      newTier: previousTier,
    };
  }

  // Record the transaction
  await supabase.from("xp_transactions").insert({
    user_email: userEmail,
    amount,
    reason,
  });

  return {
    success: true,
    newTotal,
    levelUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
    tierChange: newTier !== previousTier,
    previousTier,
    newTier,
  };
}

// Get user's percentile ranking
export async function getUserPercentile(userEmail: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  // Get user's XP
  const userXP = await getOrCreateUserXP(userEmail);
  if (!userXP) return 0;

  // Count total users
  const { count: totalUsers } = await supabase
    .from("user_xp")
    .select("*", { count: "exact", head: true });

  if (!totalUsers || totalUsers === 0) return 100;

  // Count users with less XP
  const { count: usersBelow } = await supabase
    .from("user_xp")
    .select("*", { count: "exact", head: true })
    .lt("total_xp", userXP.total_xp);

  const percentile = Math.round(((usersBelow || 0) / totalUsers) * 100);
  return percentile;
}

// Get recent XP transactions for a user
export async function getRecentXPTransactions(
  userEmail: string,
  limit: number = 10
): Promise<XPTransaction[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("xp_transactions")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching XP transactions:", error);
    return [];
  }

  return data || [];
}

// Get full XP data for a user
export async function getUserXPData(userEmail: string): Promise<{
  totalXP: number;
  level: number;
  tier: TierName;
  tierInfo: typeof TIERS[TierName];
  percentile: number;
  levelProgress: number;
  xpToNextLevel: number;
  recentTransactions: XPTransaction[];
}> {
  const userXP = await getOrCreateUserXP(userEmail);
  const totalXP = userXP?.total_xp || 0;
  const level = calculateLevel(totalXP);
  const percentile = await getUserPercentile(userEmail);
  const tier = calculateTier(totalXP, percentile);
  const tierInfo = getTierInfo(tier);
  const levelProgress = getLevelProgress(totalXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const xpToNextLevel = level >= 50 ? 0 : nextLevelXP - totalXP;
  const recentTransactions = await getRecentXPTransactions(userEmail);

  return {
    totalXP,
    level,
    tier,
    tierInfo,
    percentile,
    levelProgress,
    xpToNextLevel,
    recentTransactions,
  };
}

// Helper function to get XP reward amount by type
export function getXPRewardAmount(rewardType: XPRewardType): number {
  return XP_REWARDS[rewardType];
}

// Format XP reason for display
export function formatXPReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    INTERVIEW_COMPLETE: "Completed an interview",
    INTERVIEW_SCORE_8_PLUS: "Scored 8+ on interview",
    SEVEN_DAY_STREAK: "Achieved 7-day streak",
    CHALLENGE_COMPLETE: "Completed a challenge",
    CHALLENGE_EASY: "Completed easy challenge",
    CHALLENGE_MEDIUM: "Completed medium challenge",
    CHALLENGE_HARD: "Completed hard challenge",
    WEEKLY_WINNER: "Weekly challenges winner",
    WEEKLY_TOP_3: "Top 3 in weekly challenges",
    ALL_CHALLENGES: "Completed all weekly challenges",
    PROFILE_COMPLETE: "Completed profile",
    DAILY_LOGIN: "Daily login bonus",
    REFERRAL_SIGNUP: "Friend signed up via referral",
  };

  // Handle dynamic challenge reasons (CHALLENGE_COMPLETE-3-INTERVIEWS etc)
  if (reason.startsWith("CHALLENGE_")) {
    return "Completed weekly challenge";
  }

  return reasonMap[reason] || reason;
}
