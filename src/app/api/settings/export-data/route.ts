import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Fetch all user data from various tables
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      email,
    };

    // 1. Profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (profile) {
      exportData.profile = {
        username: profile.username,
        displayName: profile.display_name,
        school: profile.school,
        yearOfStudy: profile.year_of_study,
        targetRole: profile.target_role,
        bio: profile.bio,
        linkedinUrl: profile.linkedin_url,
        portfolioUrl: profile.portfolio_url,
        skills: profile.skills,
        preferredIndustries: profile.preferred_industries,
        isPublic: profile.is_public,
        isLooking: profile.is_looking,
        showOnLeaderboard: profile.show_on_leaderboard,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    }

    // 2. User account data (excluding sensitive info)
    const { data: userAccount } = await supabase
      .from("user accounts")
      .select("id, email, name, image_url, role, subscription_tier, auth_provider, created_at, last_login_at")
      .eq("email", email)
      .single();

    if (userAccount) {
      exportData.account = {
        name: userAccount.name,
        imageUrl: userAccount.image_url,
        role: userAccount.role,
        subscriptionTier: userAccount.subscription_tier,
        authProvider: userAccount.auth_provider,
        createdAt: userAccount.created_at,
        lastLoginAt: userAccount.last_login_at,
      };
    }

    // 3. Interviews
    const { data: interviews } = await supabase
      .from("interviews")
      .select("id, target_role, score, feedback, duration, created_at")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (interviews && interviews.length > 0) {
      exportData.interviews = interviews.map((interview) => ({
        id: interview.id,
        targetRole: interview.target_role,
        score: interview.score,
        feedback: interview.feedback,
        duration: interview.duration,
        createdAt: interview.created_at,
      }));
    }

    // 4. Streak data
    const { data: streaks } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_email", email)
      .single();

    if (streaks) {
      exportData.streaks = {
        currentStreak: streaks.current_streak,
        longestStreak: streaks.longest_streak,
        lastActivityDate: streaks.last_activity_date,
        totalActivities: streaks.total_activities,
      };
    }

    // 5. Badges/Achievements
    const { data: badges } = await supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_email", email);

    if (badges && badges.length > 0) {
      exportData.badges = badges.map((badge) => ({
        badgeId: badge.badge_id,
        unlockedAt: badge.unlocked_at,
      }));
    }

    // 6. XP data
    const { data: xp } = await supabase
      .from("user_xp")
      .select("*")
      .eq("user_email", email)
      .single();

    if (xp) {
      exportData.xp = {
        totalXp: xp.total_xp,
        level: xp.level,
        weeklyXp: xp.weekly_xp,
        monthlyXp: xp.monthly_xp,
      };
    }

    // 7. Activity history
    const { data: activities } = await supabase
      .from("user_activity")
      .select("activity_type, activity_data, created_at")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(100);

    if (activities && activities.length > 0) {
      exportData.recentActivity = activities.map((activity) => ({
        type: activity.activity_type,
        data: activity.activity_data,
        createdAt: activity.created_at,
      }));
    }

    // 8. Email preferences
    const { data: emailPrefs } = await supabase
      .from("email_preferences")
      .select("weekly_digest, streak_reminders, achievement_notifications")
      .eq("email", email)
      .single();

    if (emailPrefs) {
      exportData.emailPreferences = {
        weeklyDigest: emailPrefs.weekly_digest,
        streakReminders: emailPrefs.streak_reminders,
        achievementNotifications: emailPrefs.achievement_notifications,
      };
    }

    // 9. Referrals
    const { data: referralsSent } = await supabase
      .from("referrals")
      .select("referred_email, status, created_at")
      .eq("referrer_email", email);

    if (referralsSent && referralsSent.length > 0) {
      exportData.referralsSent = referralsSent.map((ref) => ({
        referredEmail: ref.referred_email,
        status: ref.status,
        createdAt: ref.created_at,
      }));
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
