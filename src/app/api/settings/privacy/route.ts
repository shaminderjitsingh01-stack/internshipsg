import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET: Fetch privacy settings
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

    // Fetch privacy settings from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "profile_visibility, message_privacy, email_visibility, show_activity_status, show_online_status, allow_search_engine_indexing"
      )
      .eq("email", email)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Fetch privacy settings error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch privacy settings" },
        { status: 500 }
      );
    }

    // Return default values if no profile exists
    const privacySettings = {
      profile_visibility: profile?.profile_visibility || "public",
      message_privacy: profile?.message_privacy || "everyone",
      email_visibility: profile?.email_visibility || "connections",
      show_activity_status: profile?.show_activity_status ?? true,
      show_online_status: profile?.show_online_status ?? true,
      allow_search_engine_indexing: profile?.allow_search_engine_indexing ?? true,
    };

    return NextResponse.json({ settings: privacySettings });
  } catch (error) {
    console.error("Get privacy settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch privacy settings" },
      { status: 500 }
    );
  }
}

// PUT: Update privacy settings
export async function PUT(request: NextRequest) {
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
      profile_visibility,
      message_privacy,
      email_visibility,
      show_activity_status,
      show_online_status,
      allow_search_engine_indexing,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate enum values
    const validVisibilityOptions = ["public", "connections", "private"];
    const validMessageOptions = ["everyone", "connections", "no_one"];
    const validEmailOptions = ["everyone", "connections", "no_one"];

    if (profile_visibility && !validVisibilityOptions.includes(profile_visibility)) {
      return NextResponse.json(
        { error: "Invalid profile visibility option" },
        { status: 400 }
      );
    }

    if (message_privacy && !validMessageOptions.includes(message_privacy)) {
      return NextResponse.json(
        { error: "Invalid message privacy option" },
        { status: 400 }
      );
    }

    if (email_visibility && !validEmailOptions.includes(email_visibility)) {
      return NextResponse.json(
        { error: "Invalid email visibility option" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      email,
      updated_at: new Date().toISOString(),
    };

    if (profile_visibility !== undefined) updateData.profile_visibility = profile_visibility;
    if (message_privacy !== undefined) updateData.message_privacy = message_privacy;
    if (email_visibility !== undefined) updateData.email_visibility = email_visibility;
    if (show_activity_status !== undefined) updateData.show_activity_status = show_activity_status;
    if (show_online_status !== undefined) updateData.show_online_status = show_online_status;
    if (allow_search_engine_indexing !== undefined) updateData.allow_search_engine_indexing = allow_search_engine_indexing;

    // Upsert profile with privacy settings
    const { data, error } = await supabase
      .from("profiles")
      .upsert(updateData, {
        onConflict: "email",
      })
      .select(
        "profile_visibility, message_privacy, email_visibility, show_activity_status, show_online_status, allow_search_engine_indexing"
      )
      .single();

    if (error) {
      console.error("Update privacy settings error:", error);
      return NextResponse.json(
        { error: "Failed to update privacy settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    return NextResponse.json(
      { error: "Failed to update privacy settings" },
      { status: 500 }
    );
  }
}
