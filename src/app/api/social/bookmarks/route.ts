import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - List user's bookmarked posts with full post details
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("email");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!userEmail) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  try {
    // Get user's bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("post_id, created_at")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookmarksError) throw bookmarksError;

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({ posts: [], total: 0 });
    }

    const postIds = bookmarks.map(b => b.post_id);

    // Get the posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .is("deleted_at", null);

    if (postsError) throw postsError;

    // Enrich posts with author info
    const enrichedPosts = await enrichPosts(posts || [], userEmail, bookmarks);

    // Get total count
    const { count } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_email", userEmail);

    return NextResponse.json({
      posts: enrichedPosts,
      total: count || 0
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

// POST - Bookmark a post
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { post_id, user_email } = await request.json();

    if (!post_id || !user_email) {
      return NextResponse.json({ error: "Post ID and user email required" }, { status: 400 });
    }

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_email", user_email)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: "Already bookmarked" });
    }

    // Create bookmark
    const { error } = await supabase.from("bookmarks").insert({
      post_id,
      user_email,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, action: "added" });
  } catch (error) {
    console.error("Create bookmark error:", error);
    return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 });
  }
}

// DELETE - Remove bookmark
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
      .from("bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_email", userEmail);

    if (error) throw error;

    return NextResponse.json({ success: true, action: "removed" });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}

// Helper: Enrich posts with author info and bookmark timestamp
async function enrichPosts(posts: any[], currentUserEmail: string, bookmarks: any[]) {
  if (!posts.length) return [];

  const authorEmails = [...new Set(posts.map(p => p.author_email))];

  // Fetch author profiles and accounts
  const [profilesRes, accountsRes] = await Promise.all([
    supabase.from("profiles").select("email, username, display_name, school").in("email", authorEmails),
    supabase.from("user accounts").select("email, name, image_url, tier, level").in("email", authorEmails),
  ]);

  // Fetch user's reactions
  const postIds = posts.map(p => p.id);
  const { data: userReactions } = await supabase
    .from("reactions")
    .select("post_id, reaction_type")
    .eq("user_email", currentUserEmail)
    .in("post_id", postIds);

  // Create bookmark timestamp map
  const bookmarkMap = new Map(bookmarks.map(b => [b.post_id, b.created_at]));

  // Sort posts by bookmark time (most recent first)
  const sortedPosts = posts.sort((a, b) => {
    const timeA = bookmarkMap.get(a.id) || "";
    const timeB = bookmarkMap.get(b.id) || "";
    return timeB.localeCompare(timeA);
  });

  return sortedPosts.map(post => {
    const profile = profilesRes.data?.find(p => p.email === post.author_email);
    const account = accountsRes.data?.find(a => a.email === post.author_email);
    const userReaction = userReactions?.find(r => r.post_id === post.id);

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
      isBookmarked: true,
      bookmarkedAt: bookmarkMap.get(post.id),
    };
  });
}
