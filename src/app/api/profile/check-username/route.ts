import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 10;

// Check if username is available
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const currentEmail = searchParams.get("email");

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      return NextResponse.json({
        available: false,
        error: "Username must be 3-20 characters, lowercase letters, numbers, and underscores only",
      });
    }

    // Check reserved usernames
    const reservedUsernames = [
      "admin",
      "administrator",
      "root",
      "system",
      "internship",
      "internshipsg",
      "support",
      "help",
      "api",
      "www",
      "mail",
      "email",
      "test",
      "demo",
      "null",
      "undefined",
    ];

    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json({
        available: false,
        error: "This username is reserved",
      });
    }

    // Build query to check if username exists
    let query = supabase
      .from("profiles")
      .select("email")
      .eq("username", username.toLowerCase());

    // If checking for current user, exclude their email
    if (currentEmail) {
      query = query.neq("email", currentEmail);
    }

    const { data, error } = await query.single();

    if (error) {
      // PGRST116 means no rows found - username is available
      if (error.code === "PGRST116") {
        return NextResponse.json({ available: true });
      }
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If we got data, username is taken
    return NextResponse.json({
      available: false,
      error: "Username is already taken",
    });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { error: "Failed to check username" },
      { status: 500 }
    );
  }
}
