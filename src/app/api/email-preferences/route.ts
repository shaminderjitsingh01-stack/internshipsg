import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch email preferences for a user
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
      .from("email_preferences")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error fetching email preferences:", error);
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
          weekly_digest: true,
          streak_reminders: true,
          achievement_notifications: true,
        },
      });
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error("Email preferences GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update email preferences
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      weekly_digest,
      streak_reminders,
      achievement_notifications,
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

    // Upsert preferences (insert or update)
    const { data, error } = await supabase
      .from("email_preferences")
      .upsert(
        {
          email,
          weekly_digest: weekly_digest ?? true,
          streak_reminders: streak_reminders ?? true,
          achievement_notifications: achievement_notifications ?? true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating email preferences:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error("Email preferences PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
