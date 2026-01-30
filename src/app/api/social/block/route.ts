import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Check if user is blocked OR list all blocked users
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const blockerEmail = searchParams.get("blocker");
  const blockedEmail = searchParams.get("blocked");

  if (!blockerEmail) {
    return NextResponse.json({ error: "Blocker email required" }, { status: 400 });
  }

  try {
    // If blocked email is provided, check specific block status
    if (blockedEmail) {
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
    }

    // Otherwise, list all blocked users for this blocker
    const { data: blockedList, error: listError } = await supabase
      .from("blocked_users")
      .select("blocked_email, created_at")
      .eq("blocker_email", blockerEmail)
      .order("created_at", { ascending: false });

    if (listError) {
      throw listError;
    }

    // Fetch profile info for each blocked user
    const blockedEmails = blockedList?.map(b => b.blocked_email) || [];

    if (blockedEmails.length === 0) {
      return NextResponse.json({ blockedUsers: [] });
    }

    // Get user accounts info
    const { data: userAccounts } = await supabase
      .from("user accounts")
      .select("email, name, image_url")
      .in("email", blockedEmails);

    // Get profiles info for usernames
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, username")
      .in("email", blockedEmails);

    // Combine the data
    const blockedUsers = blockedList?.map(blocked => {
      const account = userAccounts?.find(a => a.email === blocked.blocked_email);
      const profile = profiles?.find(p => p.email === blocked.blocked_email);

      return {
        email: blocked.blocked_email,
        name: account?.name || blocked.blocked_email.split("@")[0],
        image_url: account?.image_url || null,
        username: profile?.username || blocked.blocked_email.split("@")[0],
        blocked_at: blocked.created_at,
      };
    }) || [];

    return NextResponse.json({ blockedUsers });
  } catch (error) {
    console.error("Block check/list error:", error);
    return NextResponse.json({ error: "Failed to fetch blocked users" }, { status: 500 });
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
