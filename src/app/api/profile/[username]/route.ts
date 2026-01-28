import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// GET - Fetch public profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    // Fetch user by username from "user accounts" table
    const { data: user, error: userError } = await supabase
      .from("user accounts")
      .select("*")
      .eq("username", username.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if profile is public
    if (!user.is_public) {
      return NextResponse.json(
        { error: "This profile is private" },
        { status: 404 }
      );
    }

    // Fetch user's streak data
    const { data: streakData } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_email", user.email)
      .single();

    // Fetch user's badges
    const { data: badges } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_email", user.email)
      .order("unlocked_at", { ascending: true });

    // Fetch interview stats
    const { data: interviews } = await supabase
      .from("interviews")
      .select("score")
      .eq("user_email", user.email)
      .not("score", "is", null);

    const averageScore =
      interviews && interviews.length > 0
        ? Math.round(
            (interviews.reduce((acc, i) => acc + (i.score || 0), 0) /
              interviews.length) *
              10
          ) / 10
        : null;

    // Build public profile response (exclude sensitive data)
    const publicProfile = {
      username: user.username,
      name: user.name,
      image: user.image,
      school: user.school,
      year_of_study: user.year_of_study,
      target_role: user.target_role,
      bio: user.bio,
      linkedin_url: user.linkedin_url,
      portfolio_url: user.portfolio_url,
      skills: user.skills || [],
      preferred_industries: user.preferred_industries || [],
      is_looking: user.is_looking,
      xp: user.xp || 0,
      level: user.level || 1,
      tier: user.tier || "bronze",
      profile_views: user.profile_views || 0,
      created_at: user.created_at,
      // Streak data
      current_streak: streakData?.current_streak || 0,
      longest_streak: streakData?.longest_streak || 0,
      total_activities: streakData?.total_activities || 0,
      // Computed stats
      average_score: averageScore,
      total_interviews: interviews?.length || 0,
      // Badges
      badges: badges || [],
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// POST - Record profile view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const viewerEmail = body.viewer_email || null;
    const viewerType = body.viewer_type || "anonymous";

    // Verify user exists and is public
    const { data: user, error: userError } = await supabase
      .from("user accounts")
      .select("email, is_public, profile_views")
      .eq("username", username.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.is_public) {
      return NextResponse.json(
        { error: "This profile is private" },
        { status: 404 }
      );
    }

    // Don't count self-views
    if (viewerEmail && viewerEmail === user.email) {
      return NextResponse.json({ success: true, self_view: true });
    }

    // Record the view in profile_views table
    await supabase.from("profile_views").insert({
      viewed_username: username.toLowerCase(),
      viewer_email: viewerEmail,
      viewer_type: viewerType,
    });

    // Increment profile_views counter on user account
    await supabase
      .from("user accounts")
      .update({ profile_views: (user.profile_views || 0) + 1 })
      .eq("email", user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording profile view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}
