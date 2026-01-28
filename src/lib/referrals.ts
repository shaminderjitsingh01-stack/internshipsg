import { supabase, isSupabaseConfigured } from "./supabase";

// Referral XP reward for successful referral
const REFERRAL_XP_REWARD = 100;

// Referral statuses
export type ReferralStatus = "pending" | "completed" | "rewarded";

export interface Referral {
  id: string;
  referrer_email: string;
  referred_email: string;
  referral_code: string;
  status: ReferralStatus;
  created_at: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

export interface ReferralStats {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  rewarded_referrals: number;
  total_xp_earned: number;
  referrals: Referral[];
}

/**
 * Generate a unique 8-character referral code
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0, O, I, 1
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get the full referral link for a given code
 */
export function getReferralLink(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://internship.sg";
  return `${baseUrl}/auth/signin?ref=${code}`;
}

/**
 * Get or create a referral code for a user
 */
export async function getOrCreateReferralCode(userEmail: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  // Check if user already has a referral code
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("email", userEmail)
    .single();

  if (profile?.referral_code) {
    return profile.referral_code;
  }

  // Generate a unique code
  let code = generateReferralCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure uniqueness
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("referral_code", code)
      .single();

    if (!existing) break;
    code = generateReferralCode();
    attempts++;
  }

  // Save the code to user's profile
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        email: userEmail,
        referral_code: code,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) {
    console.error("Error saving referral code:", error);
    return null;
  }

  return code;
}

/**
 * Track a new referral when a user signs up with a referral code
 */
export async function trackReferral(
  referrerCode: string,
  newUserEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Database not configured" };
  }

  // Find the referrer by their code
  const { data: referrer } = await supabase
    .from("profiles")
    .select("email")
    .eq("referral_code", referrerCode)
    .single();

  if (!referrer) {
    return { success: false, error: "Invalid referral code" };
  }

  // Don't allow self-referral
  if (referrer.email === newUserEmail) {
    return { success: false, error: "Cannot refer yourself" };
  }

  // Check if this user was already referred
  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_email", newUserEmail)
    .single();

  if (existingReferral) {
    return { success: false, error: "User already has a referrer" };
  }

  // Create the referral record
  const { error } = await supabase.from("referrals").insert({
    referrer_email: referrer.email,
    referred_email: newUserEmail,
    referral_code: referrerCode,
    status: "pending",
  });

  if (error) {
    console.error("Error tracking referral:", error);
    return { success: false, error: "Failed to track referral" };
  }

  // Also store referred_by on the new user's profile
  await supabase
    .from("profiles")
    .upsert(
      {
        email: newUserEmail,
        referred_by: referrer.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  return { success: true };
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userEmail: string): Promise<ReferralStats | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_email", userEmail)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching referrals:", error);
    return null;
  }

  const stats: ReferralStats = {
    total_referrals: referrals?.length || 0,
    pending_referrals: referrals?.filter((r) => r.status === "pending").length || 0,
    completed_referrals: referrals?.filter((r) => r.status === "completed").length || 0,
    rewarded_referrals: referrals?.filter((r) => r.status === "rewarded").length || 0,
    total_xp_earned:
      (referrals?.filter((r) => r.status === "rewarded").length || 0) * REFERRAL_XP_REWARD,
    referrals: referrals || [],
  };

  return stats;
}

/**
 * Mark a referral as completed (user has verified/completed signup)
 */
export async function completeReferral(
  referredEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Database not configured" };
  }

  const { error } = await supabase
    .from("referrals")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("referred_email", referredEmail)
    .eq("status", "pending");

  if (error) {
    console.error("Error completing referral:", error);
    return { success: false, error: "Failed to complete referral" };
  }

  return { success: true };
}

/**
 * Check and reward the referrer when a referred user completes their first activity
 */
export async function checkAndRewardReferrer(
  referredEmail: string
): Promise<{ success: boolean; referrerEmail?: string; xpAwarded?: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Database not configured" };
  }

  // Find the referral record that's completed but not yet rewarded
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_email", referredEmail)
    .eq("status", "completed")
    .single();

  if (!referral) {
    // No referral to reward, this is fine
    return { success: true };
  }

  // Award XP to the referrer
  const { data: referrerProfile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("email", referral.referrer_email)
    .single();

  const currentXP = referrerProfile?.xp || 0;
  const newXP = currentXP + REFERRAL_XP_REWARD;

  // Update referrer's XP
  const { error: xpError } = await supabase
    .from("profiles")
    .upsert(
      {
        email: referral.referrer_email,
        xp: newXP,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (xpError) {
    console.error("Error awarding XP:", xpError);
    return { success: false, error: "Failed to award XP" };
  }

  // Mark referral as rewarded
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      status: "rewarded",
      rewarded_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  if (updateError) {
    console.error("Error marking referral as rewarded:", updateError);
    return { success: false, error: "Failed to update referral status" };
  }

  return {
    success: true,
    referrerEmail: referral.referrer_email,
    xpAwarded: REFERRAL_XP_REWARD,
  };
}

/**
 * Get the referrer info for a referred user
 */
export async function getReferrerInfo(
  referredEmail: string
): Promise<{ referrerEmail: string; referrerName: string } | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: referral } = await supabase
    .from("referrals")
    .select("referrer_email")
    .eq("referred_email", referredEmail)
    .single();

  if (!referral) return null;

  const { data: referrerProfile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("email", referral.referrer_email)
    .single();

  return {
    referrerEmail: referral.referrer_email,
    referrerName: referrerProfile?.display_name || referral.referrer_email.split("@")[0],
  };
}

/**
 * Get referred friends list with their profile info
 */
export async function getReferredFriends(
  userEmail: string
): Promise<
  Array<{
    email: string;
    name: string;
    status: ReferralStatus;
    created_at: string;
    avatar_url?: string;
  }>
> {
  if (!isSupabaseConfigured()) return [];

  const { data: referrals } = await supabase
    .from("referrals")
    .select("referred_email, status, created_at")
    .eq("referrer_email", userEmail)
    .order("created_at", { ascending: false });

  if (!referrals || referrals.length === 0) return [];

  // Get profiles for referred users
  const referredEmails = referrals.map((r) => r.referred_email);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, display_name, avatar_url")
    .in("email", referredEmails);

  const profileMap = new Map(profiles?.map((p) => [p.email, p]) || []);

  return referrals.map((r) => {
    const profile = profileMap.get(r.referred_email);
    return {
      email: r.referred_email,
      name: profile?.display_name || r.referred_email.split("@")[0],
      status: r.status as ReferralStatus,
      created_at: r.created_at,
      avatar_url: profile?.avatar_url,
    };
  });
}

export const REFERRAL_XP = REFERRAL_XP_REWARD;
