import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Available reaction types
const REACTION_TYPES = ["fire", "muscle", "clap", "target", "heart", "idea"];

// GET - Get reactions for a post
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const userEmail = searchParams.get("email");

  if (!postId) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  try {
    // Get reaction counts by type
    const { data: reactions, error } = await supabase
      .from("reactions")
      .select("reaction_type, user_email")
      .eq("post_id", postId);

    if (error) throw error;

    // Count by type
    const counts: Record<string, number> = {};
    REACTION_TYPES.forEach(type => counts[type] = 0);
    reactions?.forEach(r => {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
    });

    // Get user's reaction
    const userReaction = userEmail
      ? reactions?.find(r => r.user_email === userEmail)?.reaction_type || null
      : null;

    return NextResponse.json({
      counts,
      total: reactions?.length || 0,
      userReaction,
    });
  } catch (error) {
    console.error("Get reactions error:", error);
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}

// POST - Add or change reaction
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { post_id, user_email, reaction_type } = await request.json();

    if (!post_id || !user_email || !reaction_type) {
      return NextResponse.json({ error: "Post ID, user email, and reaction type required" }, { status: 400 });
    }

    if (!REACTION_TYPES.includes(reaction_type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Check if user already reacted
    const { data: existing } = await supabase
      .from("reactions")
      .select("id, reaction_type")
      .eq("post_id", post_id)
      .eq("user_email", user_email)
      .single();

    if (existing) {
      // If same reaction, remove it (toggle off)
      if (existing.reaction_type === reaction_type) {
        await supabase.from("reactions").delete().eq("id", existing.id);
        return NextResponse.json({ success: true, action: "removed" });
      }

      // Otherwise, update to new reaction
      await supabase
        .from("reactions")
        .update({ reaction_type })
        .eq("id", existing.id);

      return NextResponse.json({ success: true, action: "updated", reaction_type });
    }

    // Create new reaction
    const { error } = await supabase.from("reactions").insert({
      post_id,
      user_email,
      reaction_type,
    });

    if (error) throw error;

    // Get post author for notification
    const { data: post } = await supabase
      .from("posts")
      .select("author_email")
      .eq("id", post_id)
      .single();

    // Create notification (don't notify yourself)
    if (post && post.author_email !== user_email) {
      await supabase.from("notifications").insert({
        user_email: post.author_email,
        type: "reaction",
        actor_email: user_email,
        post_id,
        title: "New reaction",
        body: `reacted ${getReactionEmoji(reaction_type)} to your post`,
        link: `/post/${post_id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, action: "added", reaction_type });
  } catch (error) {
    console.error("Add reaction error:", error);
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}

// DELETE - Remove reaction
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const userEmail = searchParams.get("email");

  if (!postId || !userEmail) {
    return NextResponse.json({ error: "Post ID and email required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_email", userEmail);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove reaction error:", error);
    return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 });
  }
}

function getReactionEmoji(type: string): string {
  const emojis: Record<string, string> = {
    fire: "🔥",
    muscle: "💪",
    clap: "👏",
    target: "🎯",
    heart: "❤️",
    idea: "💡",
  };
  return emojis[type] || "👍";
}
