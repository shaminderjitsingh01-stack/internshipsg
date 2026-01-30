import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch notification preferences for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error fetching notification preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // Return defaults if no preferences exist yet
    if (!data) {
      return NextResponse.json({
        preferences: {
          email,
          // Email notifications - all enabled by default
          email_new_follower: true,
          email_post_likes: true,
          email_comments: true,
          email_mentions: true,
          email_direct_messages: true,
          email_job_alerts: true,
          email_weekly_digest: true,
          // Push notifications - all enabled by default except weekly digest
          push_new_follower: true,
          push_post_likes: true,
          push_comments: true,
          push_mentions: true,
          push_direct_messages: true,
          push_job_alerts: true,
          push_weekly_digest: false,
          // Quiet hours - disabled by default
          quiet_hours_enabled: false,
          quiet_hours_start: "22:00",
          quiet_hours_end: "08:00",
        },
      });
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error("Notification preferences GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update notification preferences
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      // Email notifications
      email_new_follower,
      email_post_likes,
      email_comments,
      email_mentions,
      email_direct_messages,
      email_job_alerts,
      email_weekly_digest,
      // Push notifications
      push_new_follower,
      push_post_likes,
      push_comments,
      push_mentions,
      push_direct_messages,
      push_job_alerts,
      push_weekly_digest,
      // Quiet hours
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    // Validate quiet hours times if provided
    if (quiet_hours_start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_start)) {
      return NextResponse.json(
        { error: "Invalid start time format. Use HH:MM" },
        { status: 400 }
      );
    }

    if (quiet_hours_end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_end)) {
      return NextResponse.json(
        { error: "Invalid end time format. Use HH:MM" },
        { status: 400 }
      );
    }

    // Upsert preferences (insert or update)
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          email,
          // Email notifications
          email_new_follower: email_new_follower ?? true,
          email_post_likes: email_post_likes ?? true,
          email_comments: email_comments ?? true,
          email_mentions: email_mentions ?? true,
          email_direct_messages: email_direct_messages ?? true,
          email_job_alerts: email_job_alerts ?? true,
          email_weekly_digest: email_weekly_digest ?? true,
          // Push notifications
          push_new_follower: push_new_follower ?? true,
          push_post_likes: push_post_likes ?? true,
          push_comments: push_comments ?? true,
          push_mentions: push_mentions ?? true,
          push_direct_messages: push_direct_messages ?? true,
          push_job_alerts: push_job_alerts ?? true,
          push_weekly_digest: push_weekly_digest ?? false,
          // Quiet hours
          quiet_hours_enabled: quiet_hours_enabled ?? false,
          quiet_hours_start: quiet_hours_start ?? "22:00",
          quiet_hours_end: quiet_hours_end ?? "08:00",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating notification preferences:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error("Notification preferences PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
