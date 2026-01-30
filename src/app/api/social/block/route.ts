import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Check if user is blocked
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const blockerEmail = searchParams.get("blocker");
  const blockedEmail = searchParams.get("blocked");

  if (!blockerEmail || !blockedEmail) {
    return NextResponse.json({ error: "Both emails required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("blocked_users")
      .select("*")
      .eq("blocker_email", blockerEmail)
      .eq("blocked_email", blockedEmail)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({ isBlocked: !!data });
  } catch (error) {
    console.error("Block check error:", error);
    return NextResponse.json({ error: "Failed to check block status" }, { status: 500 });
  }
}

// POST - Block a user
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { blocker_email, blocked_email } = await request.json();

    if (!blocker_email || !blocked_email) {
      return NextResponse.json({ error: "Both emails required" }, { status: 400 });
    }

    if (blocker_email === blocked_email) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const { error } = await supabase
      .from("blocked_users")
      .insert({ blocker_email, blocked_email });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Already blocked" });
      }
      throw error;
    }

    // Also unfollow if following
    try {
      await supabase
        .from("follows")
        .delete()
        .or(`and(follower_email.eq.${blocker_email},following_email.eq.${blocked_email}),and(follower_email.eq.${blocked_email},following_email.eq.${blocker_email})`);
    } catch {}

    return NextResponse.json({ success: true, message: "User blocked" });
  } catch (error) {
    console.error("Block error:", error);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}

// DELETE - Unblock a user
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const blockerEmail = searchParams.get("blocker");
  const blockedEmail = searchParams.get("blocked");

  if (!blockerEmail || !blockedEmail) {
    return NextResponse.json({ error: "Both emails required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("blocker_email", blockerEmail)
      .eq("blocked_email", blockedEmail);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "User unblocked" });
  } catch (error) {
    console.error("Unblock error:", error);
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
  }
}
