import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch hashtag info and posts
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const email = searchParams.get("email"); // current user for enrichment
  const sort = searchParams.get("sort") || "recent"; // recent, popular
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!tag) {
    return NextResponse.json({ error: "Tag is required" }, { status: 400 });
  }

  const cleanTag = tag.toLowerCase().replace("#", "").trim();

  try {
    // Get hashtag info
    const { data: hashtag, error: hashtagError } = await supabase
      .from("hashtags")
      .select("*")
      .eq("tag", cleanTag)
      .single();

    if (hashtagError && hashtagError.code !== "PGRST116") {
      throw hashtagError;
    }

    // If hashtag doesn't exist in table, still try to find posts
    const hashtagInfo = hashtag || {
      id: null,
      tag: cleanTag,
      post_count: 0,
      follower_count: 0,
    };

    // Get posts containing this hashtag
    let postsQuery = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .eq("visibility", "public")
      .ilike("content", `%#${cleanTag}%`);

    // Apply sorting
    if (sort === "popular") {
      postsQuery = postsQuery.order("reaction_count", { ascending: false });
    } else {
      postsQuery = postsQuery.order("created_at", { ascending: false });
    }

    const { data: posts, error: postsError, count } = await postsQuery
      .range(offset, offset + limit - 1);

    if (postsError) throw postsError;

    // Enrich posts with author info
    const enrichedPosts = await enrichPosts(posts || [], email);

    // Get related/trending hashtags
    const { data: relatedHashtags } = await supabase
      .from("hashtags")
      .select("*")
      .neq("tag", cleanTag)
      .order("post_count", { ascending: false })
      .limit(10);

    // Check if user follows this hashtag
    let isFollowing = false;
    if (email && hashtag?.id) {
      const { data: followData } = await supabase
        .from("hashtag_follows")
        .select("id")
        .eq("user_email", email)
        .eq("hashtag_id", hashtag.id)
        .single();

      isFollowing = !!followData;
    }

    return NextResponse.json({
      hashtag: {
        ...hashtagInfo,
        post_count: count || hashtagInfo.post_count,
      },
      posts: enrichedPosts,
      relatedHashtags: relatedHashtags || [],
      totalPosts: count || 0,
      isFollowing,
    });
  } catch (error) {
    console.error("Hashtag GET error:", error);
    return NextResponse.json({ error: "Failed to fetch hashtag data" }, { status: 500 });
  }
}

// POST - Follow/unfollow hashtag
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { tag, user_email, action } = body;

    if (!tag || !user_email) {
      return NextResponse.json({ error: "Tag and user email are required" }, { status: 400 });
    }

    const cleanTag = tag.toLowerCase().replace("#", "").trim();

    // Get or create hashtag
    let { data: hashtag } = await supabase
      .from("hashtags")
      .select("*")
      .eq("tag", cleanTag)
      .single();

    if (!hashtag) {
      const { data: newHashtag, error: createError } = await supabase
        .from("hashtags")
        .insert({ tag: cleanTag, post_count: 0, follower_count: 0 })
        .select()
        .single();

      if (createError) throw createError;
      hashtag = newHashtag;
    }

    if (action === "follow") {
      // Add follow
      const { error: followError } = await supabase
        .from("hashtag_follows")
        .upsert({
          user_email,
          hashtag_id: hashtag.id,
        }, { onConflict: "user_email,hashtag_id" });

      if (followError && followError.code !== "23505") throw followError;

      // Increment follower count
      await supabase
        .from("hashtags")
        .update({ follower_count: (hashtag.follower_count || 0) + 1 })
        .eq("id", hashtag.id);

      return NextResponse.json({ success: true, action: "followed" });
    } else if (action === "unfollow") {
      // Remove follow
      const { error: unfollowError } = await supabase
        .from("hashtag_follows")
        .delete()
        .eq("user_email", user_email)
        .eq("hashtag_id", hashtag.id);

      if (unfollowError) throw unfollowError;

      // Decrement follower count
      await supabase
        .from("hashtags")
        .update({ follower_count: Math.max(0, (hashtag.follower_count || 1) - 1) })
        .eq("id", hashtag.id);

      return NextResponse.json({ success: true, action: "unfollowed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Hashtag POST error:", error);
    return NextResponse.json({ error: "Failed to update hashtag follow" }, { status: 500 });
  }
}

// Helper: Enrich posts with author info
async function enrichPosts(posts: Record<string, unknown>[], currentUserEmail: string | null) {
  if (!posts.length) return [];

  const authorEmails = [...new Set(posts.map(p => p.author_email as string))];

  // Fetch author profiles and accounts
  const [profilesRes, accountsRes] = await Promise.all([
    supabase.from("profiles").select("email, username, display_name, school").in("email", authorEmails),
    supabase.from("user accounts").select("email, name, image_url, tier, level").in("email", authorEmails),
  ]);

  // Fetch user's reactions if logged in
  let userReactions: { post_id: string; reaction_type: string }[] = [];
  if (currentUserEmail) {
    const postIds = posts.map(p => p.id as string);
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
