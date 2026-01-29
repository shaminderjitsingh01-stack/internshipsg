import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch posts (feed or user posts)
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email"); // current user
  const authorEmail = searchParams.get("author"); // specific user's posts
  const type = searchParams.get("type"); // 'feed', 'user', 'single'
  const postId = searchParams.get("postId");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Get single post
    if (type === "single" && postId) {
      const { data: post, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .is("deleted_at", null)
        .single();

      if (error || !post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const enrichedPost = await enrichPosts([post], email);
      return NextResponse.json({ post: enrichedPost[0] });
    }

    // Get user's posts
    if (type === "user" && authorEmail) {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_email", authorEmail)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const enrichedPosts = await enrichPosts(posts || [], email);
      return NextResponse.json({ posts: enrichedPosts });
    }

    // Get feed (posts from people user follows + own posts)
    if (type === "feed" && email) {
      // Get who user follows
      const { data: following } = await supabase
        .from("follows")
        .select("following_email")
        .eq("follower_email", email);

      const followingEmails = following?.map(f => f.following_email) || [];
      followingEmails.push(email); // Include own posts

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .in("author_email", followingEmails)
        .is("deleted_at", null)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const enrichedPosts = await enrichPosts(posts || [], email);
      return NextResponse.json({ posts: enrichedPosts });
    }

    // Default: get public posts (discover)
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .is("deleted_at", null)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const enrichedPosts = await enrichPosts(posts || [], email);
    return NextResponse.json({ posts: enrichedPosts });
  } catch (error) {
    console.error("Posts GET error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// Helper: Enrich posts with author info and user's reaction
async function enrichPosts(posts: any[], currentUserEmail: string | null) {
  if (!posts.length) return [];

  const authorEmails = [...new Set(posts.map(p => p.author_email))];

  // Fetch author profiles and accounts
  const [profilesRes, accountsRes] = await Promise.all([
    supabase.from("profiles").select("email, username, display_name, school").in("email", authorEmails),
    supabase.from("user accounts").select("email, name, image_url, tier, level").in("email", authorEmails),
  ]);

  // Fetch user's reactions if logged in
  let userReactions: any[] = [];
  if (currentUserEmail) {
    const postIds = posts.map(p => p.id);
    const { data } = await supabase
      .from("reactions")
      .select("post_id, reaction_type")
      .eq("user_email", currentUserEmail)
      .in("post_id", postIds);
    userReactions = data || [];
  }

  return posts.map(post => {
    const profile = profilesRes.data?.find(p => p.email === post.author_email);
    const account = accountsRes.data?.find(a => a.email === post.author_email);
    const userReaction = userReactions.find(r => r.post_id === post.id);

    return {
      ...post,
      author: {
        email: post.author_email,
        username: profile?.username,
        name: profile?.display_name || account?.name || "Anonymous",
        image: account?.image_url,
        school: profile?.school,
        tier: account?.tier,
        level: account?.level,
      },
      userReaction: userReaction?.reaction_type || null,
    };
  });
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      author_email,
      content,
      post_type = "text",
      image_url,
      link_url,
      visibility = "public",
      achievement_type,
      achievement_data,
    } = body;

    if (!author_email || !content) {
      return NextResponse.json({ error: "Author and content required" }, { status: 400 });
    }

    // Extract hashtags from content
    const hashtags = content.match(/#[\w]+/g) || [];

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_email,
        content,
        post_type,
        image_url,
        link_url,
        visibility,
        achievement_type,
        achievement_data,
      })
      .select()
      .single();

    if (error) throw error;

    // Handle hashtags
    if (hashtags.length > 0) {
      for (const tag of hashtags) {
        const cleanTag = tag.toLowerCase().replace("#", "");

        // Upsert hashtag
        const { data: hashtag } = await supabase
          .from("hashtags")
          .upsert({ tag: cleanTag }, { onConflict: "tag" })
          .select()
          .single();

        if (hashtag) {
          // Link post to hashtag
          try {
            await supabase.from("post_hashtags").insert({
              post_id: post.id,
              hashtag_id: hashtag.id,
            });
          } catch {}

          // Increment hashtag count
          await supabase
            .from("hashtags")
            .update({ post_count: hashtag.post_count + 1 })
            .eq("id", hashtag.id);
        }
      }
    }

    // Extract mentions
    const mentions = content.match(/@[\w]+/g) || [];
    for (const mention of mentions) {
      const username = mention.replace("@", "").toLowerCase();

      // Find user by username
      const { data: mentionedUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username)
        .single();

      if (mentionedUser) {
        // Create mention record
        await supabase.from("mentions").insert({
          post_id: post.id,
          mentioned_email: mentionedUser.email,
        });

        // Create notification
        await supabase.from("notifications").insert({
          user_email: mentionedUser.email,
          type: "mention",
          actor_email: author_email,
          post_id: post.id,
          title: "You were mentioned",
          body: "mentioned you in a post",
          link: `/post/${post.id}`,
        });
      }
    }

    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// PUT - Update a post
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, author_email, content, visibility } = body;

    if (!id || !author_email) {
      return NextResponse.json({ error: "Post ID and author required" }, { status: 400 });
    }

    const { data: post, error } = await supabase
      .from("posts")
      .update({
        content,
        visibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("author_email", author_email) // Ensure ownership
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE - Delete a post (soft delete)
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("id");
  const authorEmail = searchParams.get("author");

  if (!postId || !authorEmail) {
    return NextResponse.json({ error: "Post ID and author required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", postId)
      .eq("author_email", authorEmail);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
