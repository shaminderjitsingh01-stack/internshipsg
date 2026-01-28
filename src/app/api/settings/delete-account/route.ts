import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Delete user data from all tables
    // Order matters due to foreign key constraints

    // 1. Delete interviews
    const { error: interviewsError } = await supabase
      .from("interviews")
      .delete()
      .eq("user_email", email);

    if (interviewsError) {
      console.error("Delete interviews error:", interviewsError);
    }

    // 2. Delete streak data
    const { error: streaksError } = await supabase
      .from("streaks")
      .delete()
      .eq("user_email", email);

    if (streaksError) {
      console.error("Delete streaks error:", streaksError);
    }

    // 3. Delete badges/achievements
    const { error: badgesError } = await supabase
      .from("user_badges")
      .delete()
      .eq("user_email", email);

    if (badgesError) {
      console.error("Delete badges error:", badgesError);
    }

    // 4. Delete activity data
    const { error: activityError } = await supabase
      .from("user_activity")
      .delete()
      .eq("user_email", email);

    if (activityError) {
      console.error("Delete activity error:", activityError);
    }

    // 5. Delete email preferences
    const { error: emailPrefsError } = await supabase
      .from("email_preferences")
      .delete()
      .eq("email", email);

    if (emailPrefsError) {
      console.error("Delete email preferences error:", emailPrefsError);
    }

    // 6. Delete XP data
    const { error: xpError } = await supabase
      .from("user_xp")
      .delete()
      .eq("user_email", email);

    if (xpError) {
      console.error("Delete XP error:", xpError);
    }

    // 7. Delete referrals
    const { error: referralsError } = await supabase
      .from("referrals")
      .delete()
      .or(`referrer_email.eq.${email},referred_email.eq.${email}`);

    if (referralsError) {
      console.error("Delete referrals error:", referralsError);
    }

    // 8. Delete profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("email", email);

    if (profileError) {
      console.error("Delete profile error:", profileError);
    }

    // 9. Delete user account (main table)
    const { error: userError } = await supabase
      .from("user accounts")
      .delete()
      .eq("email", email);

    if (userError) {
      console.error("Delete user account error:", userError);
      return NextResponse.json(
        { error: "Failed to delete user account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
