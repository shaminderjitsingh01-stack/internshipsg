import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch user's conversations with last message preview
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Get all conversations for the user
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_email", email);

    if (partError) throw partError;

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const conversationIds = participations.map(p => p.conversation_id);

    // Get conversation details
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, created_at, updated_at")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (convError) throw convError;

    // Get all participants for these conversations
    const { data: allParticipants, error: allPartError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_email, last_read_at")
      .in("conversation_id", conversationIds);

    if (allPartError) throw allPartError;

    // Get other user emails (not current user)
    const otherUserEmails = [...new Set(
      allParticipants
        ?.filter(p => p.user_email !== email)
        .map(p => p.user_email) || []
    )];

    // Fetch profiles and accounts for other users
    const [profilesRes, accountsRes] = await Promise.all([
      supabase.from("profiles").select("email, username, display_name, school").in("email", otherUserEmails),
      supabase.from("user accounts").select("email, name, image_url, tier, level").in("email", otherUserEmails),
    ]);

    // Get last message for each conversation
    const lastMessagesPromises = conversationIds.map(async (convId) => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, sender_email, created_at, is_read")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return { conversationId: convId, message: data };
    });

    const lastMessagesResults = await Promise.all(lastMessagesPromises);
    const lastMessagesMap = new Map(
      lastMessagesResults.map(r => [r.conversationId, r.message])
    );

    // Get unread counts for each conversation
    const unreadCountsPromises = conversationIds.map(async (convId) => {
      const userParticipation = participations.find(p => p.conversation_id === convId);
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convId)
        .neq("sender_email", email)
        .gt("created_at", userParticipation?.last_read_at || "1970-01-01");
      return { conversationId: convId, unreadCount: count || 0 };
    });

    const unreadCountsResults = await Promise.all(unreadCountsPromises);
    const unreadCountsMap = new Map(
      unreadCountsResults.map(r => [r.conversationId, r.unreadCount])
    );

    // Build enriched conversations
    const enrichedConversations = conversations?.map(conv => {
      const participants = allParticipants?.filter(p => p.conversation_id === conv.id) || [];
      const otherParticipant = participants.find(p => p.user_email !== email);
      const otherEmail = otherParticipant?.user_email;
      const profile = profilesRes.data?.find(p => p.email === otherEmail);
      const account = accountsRes.data?.find(a => a.email === otherEmail);
      const lastMessage = lastMessagesMap.get(conv.id);
      const unreadCount = unreadCountsMap.get(conv.id) || 0;

      return {
        id: conv.id,
        updated_at: conv.updated_at,
        participant: otherEmail ? {
          email: otherEmail,
          username: profile?.username,
          name: profile?.display_name || account?.name || "Anonymous",
          image: account?.image_url,
          school: profile?.school,
          tier: account?.tier,
          level: account?.level,
        } : null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          sender_email: lastMessage.sender_email,
          created_at: lastMessage.created_at,
          is_read: lastMessage.is_read,
        } : null,
        unreadCount,
      };
    }) || [];

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST - Send a new message (creates conversation if needed)
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { sender_email, recipient_email, content, conversation_id } = body;

    if (!sender_email || !content) {
      return NextResponse.json({ error: "Sender and content required" }, { status: 400 });
    }

    let targetConversationId = conversation_id;

    // If no conversation_id provided, find or create one
    if (!targetConversationId && recipient_email) {
      // Check if conversation exists between these users
      const { data: existingParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_email", sender_email);

      if (existingParticipations && existingParticipations.length > 0) {
        const senderConvIds = existingParticipations.map(p => p.conversation_id);

        const { data: recipientParticipation } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_email", recipient_email)
          .in("conversation_id", senderConvIds)
          .limit(1)
          .single();

        if (recipientParticipation) {
          targetConversationId = recipientParticipation.conversation_id;
        }
      }

      // Create new conversation if none exists
      if (!targetConversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({})
          .select()
          .single();

        if (convError) throw convError;

        targetConversationId = newConv.id;

        // Add participants
        const { error: partError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: targetConversationId, user_email: sender_email },
            { conversation_id: targetConversationId, user_email: recipient_email },
          ]);

        if (partError) throw partError;
      }
    }

    if (!targetConversationId) {
      return NextResponse.json({ error: "Conversation ID or recipient required" }, { status: 400 });
    }

    // Create the message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: targetConversationId,
        sender_email,
        content,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", targetConversationId);

    // Update sender's last_read_at
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", targetConversationId)
      .eq("user_email", sender_email);

    // Create notification for recipient
    if (recipient_email || !conversation_id) {
      // Get recipient from conversation participants
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_email")
        .eq("conversation_id", targetConversationId)
        .neq("user_email", sender_email);

      const recipientFromConv = participants?.[0]?.user_email;

      if (recipientFromConv) {
        await supabase.from("notifications").insert({
          user_email: recipientFromConv,
          type: "message",
          actor_email: sender_email,
          title: "New message",
          body: content.length > 50 ? content.substring(0, 50) + "..." : content,
          link: `/messages?conversation=${targetConversationId}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message,
      conversation_id: targetConversationId,
    });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { conversation_id, user_email } = body;

    if (!conversation_id || !user_email) {
      return NextResponse.json({ error: "Conversation ID and user email required" }, { status: 400 });
    }

    // Update last_read_at for the user
    const { error: partError } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversation_id)
      .eq("user_email", user_email);

    if (partError) throw partError;

    // Mark messages as read
    const { error: msgError } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversation_id)
      .neq("sender_email", user_email);

    if (msgError) throw msgError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Messages PUT error:", error);
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
  }
}
