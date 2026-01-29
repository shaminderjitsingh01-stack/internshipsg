import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Get user's notifications
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Get actor info
    const actorEmails = [...new Set(notifications?.filter(n => n.actor_email).map(n => n.actor_email) || [])];

    const [profilesRes, accountsRes] = await Promise.all([
      supabase.from("profiles").select("email, username, display_name").in("email", actorEmails),
      supabase.from("user accounts").select("email, name, image_url").in("email", actorEmails),
    ]);

    const enrichedNotifications = notifications?.map(notification => {
      const profile = profilesRes.data?.find(p => p.email === notification.actor_email);
      const account = accountsRes.data?.find(a => a.email === notification.actor_email);

      return {
        ...notification,
        actor: notification.actor_email ? {
          email: notification.actor_email,
          username: profile?.username,
          name: profile?.display_name || account?.name || "Someone",
          image: account?.image_url,
        } : null,
      };
    }) || [];

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_email", email)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: enrichedNotifications,
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { email, notification_ids, mark_all } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (mark_all) {
      // Mark all as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_email", email)
        .eq("is_read", false);

      if (error) throw error;
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_email", email)
        .in("id", notification_ids);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const notificationId = searchParams.get("id");
  const deleteAll = searchParams.get("all") === "true";

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    if (deleteAll) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_email", email);

      if (error) throw error;
    } else if (notificationId) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_email", email);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
