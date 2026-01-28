import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// Get user profile
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      // If no profile exists, return empty profile
      if (error.code === "PGRST116") {
        return NextResponse.json({ profile: null });
      }
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      email,
      username,
      display_name,
      school,
      year_of_study,
      target_role,
      bio,
      linkedin_url,
      portfolio_url,
      skills,
      preferred_industries,
      is_public,
      is_looking,
      show_on_leaderboard,
      onboarding_completed,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // If username is being set, check availability first
    if (username) {
      const { data: existingUser, error: checkError } = await supabase
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

      // Ignore PGRST116 (no rows returned) - that means username is available
      if (checkError && checkError.code !== "PGRST116") {
        console.error("Username check error:", checkError);
        return NextResponse.json({ error: checkError.message }, { status: 500 });
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      email,
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updateData.username = username.toLowerCase();
    if (display_name !== undefined) updateData.display_name = display_name;
    if (school !== undefined) updateData.school = school;
    if (year_of_study !== undefined) updateData.year_of_study = year_of_study;
    if (target_role !== undefined) updateData.target_role = target_role;
    if (bio !== undefined) updateData.bio = bio;
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (portfolio_url !== undefined) updateData.portfolio_url = portfolio_url;
    if (skills !== undefined) updateData.skills = skills;
    if (preferred_industries !== undefined) updateData.preferred_industries = preferred_industries;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (is_looking !== undefined) updateData.is_looking = is_looking;
    if (show_on_leaderboard !== undefined) updateData.show_on_leaderboard = show_on_leaderboard;
    if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed;

    // Upsert profile (insert if not exists, update if exists)
    const { data, error } = await supabase
      .from("profiles")
      .upsert(updateData, {
        onConflict: "email",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data, success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
