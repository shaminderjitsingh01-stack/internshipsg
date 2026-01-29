import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const limit = parseInt(searchParams.get("limit") || "50");
  const before = searchParams.get("before"); // cursor for pagination

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Verify user is participant in conversation
    const { data: participation, error: partError } = await supabase
      .from("conversation_participants")
      .select("user_email, last_read_at")
      .eq("conversation_id", conversationId)
      .eq("user_email", email)
      .single();

    if (partError || !participation) {
      return NextResponse.json({ error: "Not authorized to view this conversation" }, { status: 403 });
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, created_at, updated_at")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get other participant
    const { data: participants, error: allPartError } = await supabase
      .from("conversation_participants")
      .select("user_email, last_read_at")
      .eq("conversation_id", conversationId);

    if (allPartError) throw allPartError;

    const otherParticipant = participants?.find(p => p.user_email !== email);
    const otherEmail = otherParticipant?.user_email;

    // Get other user's profile
    let otherUser = null;
    if (otherEmail) {
      const [profileRes, accountRes] = await Promise.all([
        supabase.from("profiles").select("email, username, display_name, school").eq("email", otherEmail).single(),
        supabase.from("user accounts").select("email, name, image_url, tier, level").eq("email", otherEmail).single(),
      ]);

      const profile = profileRes.data;
      const account = accountRes.data;

      otherUser = {
        email: otherEmail,
        username: profile?.username,
        name: profile?.display_name || account?.name || "Anonymous",
        image: account?.image_url,
        school: profile?.school,
        tier: account?.tier,
        level: account?.level,
      };
    }

    // Build messages query
    let messagesQuery = supabase
      .from("messages")
      .select("id, content, sender_email, is_read, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      messagesQuery = messagesQuery.lt("created_at", before);
    }

    const { data: messages, error: msgError } = await messagesQuery;

    if (msgError) throw msgError;

    // Reverse messages for chronological order
    const sortedMessages = (messages || []).reverse();

    // Check if there are more messages
    let hasMore = false;
    if (messages && messages.length === limit) {
      const oldestMessage = messages[messages.length - 1];
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .lt("created_at", oldestMessage.created_at);
      hasMore = (count || 0) > 0;
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        participant: otherUser,
      },
      messages: sortedMessages,
      hasMore,
    });
  } catch (error) {
    console.error("Conversation GET error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
