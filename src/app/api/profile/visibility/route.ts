import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, is_public } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (typeof is_public !== "boolean") {
      return NextResponse.json({ error: "is_public must be a boolean" }, { status: 400 });
    }

    // Update profile visibility
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          email,
          is_public,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Also update users table if it exists
    const { error: userError } = await supabase
      .from("users")
      .update({ is_public })
      .eq("email", email);

    if (userError) {
      console.error("User update error:", userError);
      // Don't fail - profiles table is the primary source
    }

    return NextResponse.json({
      success: true,
      is_public,
    });
  } catch (error) {
    console.error("Visibility update error:", error);
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
  }
}
