import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Get comments for a post
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!postId) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  try {
    // Get top-level comments (no parent)
    const { data: comments, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .is("parent_comment_id", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Get replies for each comment
    const commentIds = comments?.map(c => c.id) || [];
    const { data: replies } = await supabase
      .from("comments")
      .select("*")
      .in("parent_comment_id", commentIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    // Get author info
    const authorEmails = [...new Set([
      ...(comments?.map(c => c.author_email) || []),
      ...(replies?.map(r => r.author_email) || []),
    ])];

    const [profilesRes, accountsRes] = await Promise.all([
      supabase.from("profiles").select("email, username, display_name").in("email", authorEmails),
      supabase.from("user accounts").select("email, name, image_url, tier").in("email", authorEmails),
    ]);

    const getAuthor = (email: string) => {
      const profile = profilesRes.data?.find(p => p.email === email);
      const account = accountsRes.data?.find(a => a.email === email);
      return {
        email,
        username: profile?.username,
        name: profile?.display_name || account?.name || "Anonymous",
        image: account?.image_url,
        tier: account?.tier,
      };
    };

    // Enrich comments with author info and replies
    const enrichedComments = comments?.map(comment => ({
      ...comment,
      author: getAuthor(comment.author_email),
      replies: replies
        ?.filter(r => r.parent_comment_id === comment.id)
        .map(reply => ({
          ...reply,
          author: getAuthor(reply.author_email),
        })) || [],
    })) || [];

    return NextResponse.json({ comments: enrichedComments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST - Create a comment
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { post_id, author_email, content, parent_comment_id } = await request.json();

    if (!post_id || !author_email || !content) {
      return NextResponse.json({ error: "Post ID, author, and content required" }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id,
        author_email,
        content,
        parent_comment_id: parent_comment_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Get post author for notification
    const { data: post } = await supabase
      .from("posts")
      .select("author_email")
      .eq("id", post_id)
      .single();

    // Notify post author (unless commenting on own post)
    if (post && post.author_email !== author_email) {
      await supabase.from("notifications").insert({
        user_email: post.author_email,
        type: "comment",
        actor_email: author_email,
        post_id,
        comment_id: comment.id,
        title: "New comment",
        body: "commented on your post",
        link: `/post/${post_id}`,
      }).catch(() => {});
    }

    // If replying to a comment, notify the original commenter
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("author_email")
        .eq("id", parent_comment_id)
        .single();

      if (parentComment && parentComment.author_email !== author_email) {
        await supabase.from("notifications").insert({
          user_email: parentComment.author_email,
          type: "comment",
          actor_email: author_email,
          post_id,
          comment_id: comment.id,
          title: "New reply",
          body: "replied to your comment",
          link: `/post/${post_id}`,
        }).catch(() => {});
      }
    }

    // Extract mentions
    const mentions = content.match(/@[\w]+/g) || [];
    for (const mention of mentions) {
      const username = mention.replace("@", "").toLowerCase();
      const { data: mentionedUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username)
        .single();

      if (mentionedUser && mentionedUser.email !== author_email) {
        await supabase.from("notifications").insert({
          user_email: mentionedUser.email,
          type: "mention",
          actor_email: author_email,
          post_id,
          comment_id: comment.id,
          title: "You were mentioned",
          body: "mentioned you in a comment",
          link: `/post/${post_id}`,
        });
      }
    }

    // Get author info for response
    const [profileRes, accountRes] = await Promise.all([
      supabase.from("profiles").select("username, display_name").eq("email", author_email).single(),
      supabase.from("user accounts").select("name, image_url, tier").eq("email", author_email).single(),
    ]);

    return NextResponse.json({
      comment: {
        ...comment,
        author: {
          email: author_email,
          username: profileRes.data?.username,
          name: profileRes.data?.display_name || accountRes.data?.name || "Anonymous",
          image: accountRes.data?.image_url,
          tier: accountRes.data?.tier,
        },
        replies: [],
      },
      success: true,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

// DELETE - Delete a comment (soft delete)
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("id");
  const authorEmail = searchParams.get("author");

  if (!commentId || !authorEmail) {
    return NextResponse.json({ error: "Comment ID and author required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("author_email", authorEmail);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
