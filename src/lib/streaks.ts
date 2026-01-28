import { supabase, isSupabaseConfigured } from "./supabase";
import { awardXP, XP_REWARDS } from "./xp";

// Badge definitions
export const BADGES = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Completed your first activity",
    icon: "🌱",
    requirement: 1,
    type: "activity" as const,
  },
  committed: {
    id: "committed",
    name: "Committed",
    description: "3-day streak achieved",
    icon: "🔥",
    requirement: 3,
    type: "streak" as const,
  },
  consistent: {
    id: "consistent",
    name: "Consistent",
    description: "7-day streak achieved",
    icon: "✨",
    requirement: 7,
    type: "streak" as const,
  },
  dedicated: {
    id: "dedicated",
    name: "Dedicated",
    description: "14-day streak achieved",
    icon: "⭐",
    requirement: 14,
    type: "streak" as const,
  },
  unstoppable: {
    id: "unstoppable",
    name: "Unstoppable",
    description: "30-day streak achieved",
    icon: "💎",
    requirement: 30,
    type: "streak" as const,
  },
  interview_ready: {
    id: "interview_ready",
    name: "Interview Ready",
    description: "60-day streak achieved",
    icon: "🏆",
    requirement: 60,
    type: "streak" as const,
  },
};

export type BadgeId = keyof typeof BADGES;

export interface Streak {
  id: string;
  user_email: string;
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  last_activity_date: string | null;
  streak_started_at: string | null;
  created_at: string;
  updated_at: string;
  // Streak freeze fields
  streak_freezes: number;
  last_freeze_used: string | null;
  freeze_used_today: boolean;
}

export interface UserBadge {
  id: string;
  user_email: string;
  badge_id: string;
  unlocked_at: string;
}

// Get streak titles based on current streak
export function getStreakTitle(streak: number): string {
  if (streak >= 60) return "Interview Ready";
  if (streak >= 30) return "Unstoppable";
  if (streak >= 14) return "Dedicated";
  if (streak >= 7) return "Consistent";
  if (streak >= 3) return "Committed";
  if (streak >= 1) return "Getting Started";
  return "Start Your Journey";
}

// Get next badge info
export function getNextBadge(currentStreak: number): { badge: typeof BADGES[BadgeId]; daysRemaining: number } | null {
  const streakBadges = Object.values(BADGES)
    .filter(b => b.type === "streak")
    .sort((a, b) => a.requirement - b.requirement);

  for (const badge of streakBadges) {
    if (currentStreak < badge.requirement) {
      return {
        badge,
        daysRemaining: badge.requirement - currentStreak,
      };
    }
  }
  return null;
}

// Check which badges should be unlocked based on streak/activity
export function checkBadgeEligibility(
  currentStreak: number,
  totalActivities: number,
  existingBadges: string[]
): BadgeId[] {
  const newBadges: BadgeId[] = [];

  for (const [badgeId, badge] of Object.entries(BADGES)) {
    if (existingBadges.includes(badgeId)) continue;

    if (badge.type === "streak" && currentStreak >= badge.requirement) {
      newBadges.push(badgeId as BadgeId);
    }
    if (badge.type === "activity" && totalActivities >= badge.requirement) {
      newBadges.push(badgeId as BadgeId);
    }
  }

  return newBadges;
}

// Constants for streak freeze system
export const MAX_STREAK_FREEZES = 2;
export const DAYS_FOR_FREEZE = 7; // Earn 1 freeze per 7-day streak milestone

// Get or create streak record for user
export async function getOrCreateStreak(userEmail: string): Promise<Streak | null> {
  if (!isSupabaseConfigured()) return null;

  // Try to get existing streak
  const { data: existing } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_email", userEmail)
    .single();

  if (existing) return existing;

  // Create new streak record
  const { data: newStreak, error } = await supabase
    .from("streaks")
    .insert({
      user_email: userEmail,
      current_streak: 0,
      longest_streak: 0,
      total_activities: 0,
      streak_freezes: 0,
      last_freeze_used: null,
      freeze_used_today: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating streak:", error);
    return null;
  }

  return newStreak;
}

// Check if user should earn a streak freeze (every 7 days)
export function shouldEarnStreakFreeze(oldStreak: number, newStreak: number): boolean {
  // Earn a freeze when crossing a 7-day milestone
  const oldMilestones = Math.floor(oldStreak / DAYS_FOR_FREEZE);
  const newMilestones = Math.floor(newStreak / DAYS_FOR_FREEZE);
  return newMilestones > oldMilestones;
}

// Check if streak needs freeze protection and apply if available
export async function checkAndApplyStreakFreeze(userEmail: string): Promise<{
  freezeUsed: boolean;
  streak: Streak | null;
}> {
  if (!isSupabaseConfigured()) {
    return { freezeUsed: false, streak: null };
  }

  const streak = await getOrCreateStreak(userEmail);
  if (!streak || streak.current_streak === 0) {
    return { freezeUsed: false, streak };
  }

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const lastActivityDate = streak.last_activity_date;

  // Check if user missed yesterday (and hasn't done activity today)
  if (lastActivityDate && lastActivityDate !== today && lastActivityDate !== yesterday) {
    // User missed a day - check if we can use a freeze
    if (streak.streak_freezes > 0) {
      // Use a freeze to protect the streak
      const { data: updatedStreak, error } = await supabase
        .from("streaks")
        .update({
          streak_freezes: streak.streak_freezes - 1,
          last_freeze_used: new Date().toISOString(),
          freeze_used_today: true,
          last_activity_date: yesterday, // Pretend we did activity yesterday
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", userEmail)
        .select()
        .single();

      if (error) {
        console.error("Error applying streak freeze:", error);
        return { freezeUsed: false, streak };
      }

      return { freezeUsed: true, streak: updatedStreak };
    }
  }

  // Reset freeze_used_today if it's a new day
  if (streak.freeze_used_today && streak.last_activity_date !== today) {
    await supabase
      .from("streaks")
      .update({ freeze_used_today: false })
      .eq("user_email", userEmail);
  }

  return { freezeUsed: false, streak };
}

// Update streak when activity is completed
export async function recordActivity(userEmail: string): Promise<{
  streak: Streak | null;
  newBadges: BadgeId[];
  isNewDay: boolean;
  freezeEarned: boolean;
  xpAwarded: number;
}> {
  if (!isSupabaseConfigured()) {
    return { streak: null, newBadges: [], isNewDay: false, freezeEarned: false, xpAwarded: 0 };
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Get current streak
  let streak = await getOrCreateStreak(userEmail);
  if (!streak) {
    return { streak: null, newBadges: [], isNewDay: false, freezeEarned: false, xpAwarded: 0 };
  }

  const lastActivityDate = streak.last_activity_date;
  const oldStreak = streak.current_streak;
  let newStreak = streak.current_streak;
  let isNewDay = false;

  // Calculate new streak value
  if (!lastActivityDate) {
    // First activity ever
    newStreak = 1;
    isNewDay = true;
  } else if (lastActivityDate === today) {
    // Already did activity today - no change to streak
    isNewDay = false;
  } else if (lastActivityDate === yesterday) {
    // Consecutive day - increment streak
    newStreak = streak.current_streak + 1;
    isNewDay = true;
  } else {
    // Streak broken - reset to 1
    newStreak = 1;
    isNewDay = true;
  }

  // Check if user earned a freeze
  const freezeEarned = isNewDay && shouldEarnStreakFreeze(oldStreak, newStreak);

  // Update streak record
  const updateData: Partial<Streak> = {
    total_activities: streak.total_activities + 1,
    updated_at: new Date().toISOString(),
  };

  if (isNewDay) {
    updateData.current_streak = newStreak;
    updateData.last_activity_date = today;
    updateData.longest_streak = Math.max(newStreak, streak.longest_streak);
    updateData.freeze_used_today = false; // Reset since user is active today

    if (newStreak === 1) {
      updateData.streak_started_at = new Date().toISOString();
    }

    // Award freeze if earned (max 2)
    if (freezeEarned && (streak.streak_freezes || 0) < MAX_STREAK_FREEZES) {
      updateData.streak_freezes = Math.min((streak.streak_freezes || 0) + 1, MAX_STREAK_FREEZES);
    }
  }

  const { data: updatedStreak, error } = await supabase
    .from("streaks")
    .update(updateData)
    .eq("user_email", userEmail)
    .select()
    .single();

  if (error) {
    console.error("Error updating streak:", error);
    return { streak, newBadges: [], isNewDay, freezeEarned: false, xpAwarded: 0 };
  }

  // Check for new badges
  const { data: existingBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_email", userEmail);

  const existingBadgeIds = (existingBadges || []).map(b => b.badge_id);
  const newBadges = checkBadgeEligibility(
    updatedStreak.current_streak,
    updatedStreak.total_activities,
    existingBadgeIds
  );

  // Award new badges
  if (newBadges.length > 0) {
    const badgeInserts = newBadges.map(badgeId => ({
      user_email: userEmail,
      badge_id: badgeId,
    }));

    await supabase.from("user_badges").insert(badgeInserts);
  }

  // Award XP for streak milestones
  let xpAwarded = 0;
  if (isNewDay) {
    // Award XP for 7-day streak milestone (every 7 days)
    const oldMilestones = Math.floor(oldStreak / 7);
    const newMilestones = Math.floor(newStreak / 7);
    if (newMilestones > oldMilestones) {
      // User just crossed a 7-day milestone
      await awardXP(userEmail, XP_REWARDS.SEVEN_DAY_STREAK, "SEVEN_DAY_STREAK");
      xpAwarded += XP_REWARDS.SEVEN_DAY_STREAK;
    }
  }

  return { streak: updatedStreak, newBadges, isNewDay, freezeEarned, xpAwarded };
}

// Get user's badges
export async function getUserBadges(userEmail: string): Promise<UserBadge[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_email", userEmail)
    .order("unlocked_at", { ascending: true });

  if (error) {
    console.error("Error fetching badges:", error);
    return [];
  }

  return data || [];
}

// Get full streak data with badges
export async function getStreakWithBadges(userEmail: string): Promise<{
  streak: Streak | null;
  badges: UserBadge[];
  nextBadge: { badge: typeof BADGES[BadgeId]; daysRemaining: number } | null;
  title: string;
  freezeUsed: boolean;
}> {
  // First check if freeze needs to be applied
  const { freezeUsed, streak: checkedStreak } = await checkAndApplyStreakFreeze(userEmail);

  const streak = checkedStreak || await getOrCreateStreak(userEmail);
  const badges = await getUserBadges(userEmail);
  const nextBadge = streak ? getNextBadge(streak.current_streak) : null;
  const title = streak ? getStreakTitle(streak.current_streak) : "Start Your Journey";

  return { streak, badges, nextBadge, title, freezeUsed };
}

// Get days until next freeze
export function getDaysUntilNextFreeze(currentStreak: number): number {
  const nextMilestone = Math.ceil((currentStreak + 1) / DAYS_FOR_FREEZE) * DAYS_FOR_FREEZE;
  return nextMilestone - currentStreak;
}

// Motivational messages based on streak
export function getMotivationalMessage(streak: number, isNewDay: boolean): string {
  if (!isNewDay) {
    return "You've already practiced today. Great job staying consistent!";
  }

  if (streak === 1) {
    return "Day 1. The beginning of something great. Every expert was once a beginner.";
  }
  if (streak === 3) {
    return "3 days strong! You're building a habit. This is when most people quit. Not you.";
  }
  if (streak === 7) {
    return "A full week! You're in the top 20% who make it this far. Keep going!";
  }
  if (streak === 14) {
    return "Two weeks of consistent effort. Your future self is already thanking you.";
  }
  if (streak === 30) {
    return "30 days! You're not preparing anymore — you're prepared. Keep sharpening.";
  }
  if (streak >= 60) {
    return "Legendary commitment. You're interview ready. The job is yours to lose.";
  }

  // Generic messages for other days
  const messages = [
    `Day ${streak}. Consistency compounds. Keep showing up.`,
    `${streak} days and counting. Your discipline is your superpower.`,
    `${streak}-day streak! Every practice session brings you closer to your dream job.`,
  ];
  return messages[streak % messages.length];
}
