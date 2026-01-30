import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// POST - Save onboarding progress
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      email,
      step,
      display_name,
      username,
      bio,
      profile_picture,
      education,
      interests,
      skills,
      followed_users,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Build update object for profile
    const profileUpdate: Record<string, unknown> = {
      email,
      updated_at: new Date().toISOString(),
      onboarding_step: step,
    };

    if (display_name !== undefined) profileUpdate.display_name = display_name;
    if (username !== undefined) profileUpdate.username = username.toLowerCase();
    if (bio !== undefined) profileUpdate.bio = bio;
    if (profile_picture !== undefined) profileUpdate.profile_picture = profile_picture;
    if (interests !== undefined) profileUpdate.interests = interests;
    if (skills !== undefined) profileUpdate.skills = skills;

    // Check username availability if provided
    if (username) {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username.toLowerCase())
        .neq("email", email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    // Upsert profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profileUpdate, { onConflict: "email" })
      .select()
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Handle education if provided
    if (education && education.school) {
      const { error: eduError } = await supabase
        .from("user_education")
        .upsert({
          user_email: email,
          school: education.school,
          degree: education.degree,
          field_of_study: education.field_of_study,
          start_date: education.start_date,
          end_date: education.end_date,
          is_current: education.is_current,
        }, { onConflict: "user_email,school" });

      if (eduError) {
        console.error("Education update error:", eduError);
      }
    }

    // Handle skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      // Get existing skills for the user
      const { data: existingSkills } = await supabase
        .from("user_skills")
        .select("skill_name")
        .eq("user_email", email);

      const existingSkillNames = new Set(existingSkills?.map(s => s.skill_name.toLowerCase()) || []);

      // Only insert new skills
      const newSkills = skills.filter((skill: string) => !existingSkillNames.has(skill.toLowerCase()));

      if (newSkills.length > 0) {
        const skillsToInsert = newSkills.map((skill: string) => ({
          user_email: email,
          skill_name: skill.trim().split(" ").map((word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(" "),
          proficiency: "intermediate",
        }));

        const { error: skillsError } = await supabase
          .from("user_skills")
          .insert(skillsToInsert);

        if (skillsError) {
          console.error("Skills insert error:", skillsError);
        }
      }
    }

    // Handle followed users if provided
    if (followed_users && Array.isArray(followed_users) && followed_users.length > 0) {
      const followsToInsert = followed_users.map((followingEmail: string) => ({
        follower_email: email,
        following_email: followingEmail,
      }));

      // Use upsert to avoid duplicate follow errors
      const { error: followError } = await supabase
        .from("follows")
        .upsert(followsToInsert, {
          onConflict: "follower_email,following_email",
          ignoreDuplicates: true
        });

      if (followError) {
        console.error("Follow insert error:", followError);
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      message: "Progress saved",
    });
  } catch (error) {
    console.error("Onboarding POST error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding progress" },
      { status: 500 }
    );
  }
}

// PUT - Mark onboarding complete
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Update profile to mark onboarding as completed
    const { data, error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: 6,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select()
      .single();

    if (error) {
      console.error("Onboarding complete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: data,
      message: "Onboarding completed",
    });
  } catch (error) {
    console.error("Onboarding PUT error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

// GET - Get onboarding progress
export async function GET(request: NextRequest) {
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

  try {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError;
    }

    // Get education
    const { data: education } = await supabase
      .from("user_education")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    // Get skills
    const { data: skills } = await supabase
      .from("user_skills")
      .select("skill_name")
      .eq("user_email", email);

    // Get followed users
    const { data: follows } = await supabase
      .from("follows")
      .select("following_email")
      .eq("follower_email", email);

    return NextResponse.json({
      profile: profile || null,
      education: education?.[0] || null,
      skills: skills?.map(s => s.skill_name) || [],
      followed_users: follows?.map(f => f.following_email) || [],
      onboarding_completed: profile?.onboarding_completed || false,
      current_step: profile?.onboarding_step || 1,
    });
  } catch (error) {
    console.error("Onboarding GET error:", error);
    return NextResponse.json(
      { error: "Failed to get onboarding progress" },
      { status: 500 }
    );
  }
}
