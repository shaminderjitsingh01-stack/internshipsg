import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy Supabase client initialization
let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

function isSupabaseConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

// GET /api/groups/[groupId]/posts - Get posts in group
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { groupId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("user_email") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const pinnedOnly = searchParams.get("pinned_only") === "true";

  try {
    // Verify group exists and user has access
    const { data: group } = await db
      .from("groups")
      .select("privacy, is_active")
      .eq("id", groupId)
      .single();

    if (!group || !group.is_active) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // For non-public groups, check membership
    if (group.privacy !== "public") {
      if (!userEmail) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const { data: membership } = await db
        .from("group_members")
        .select("status")
        .eq("group_id", groupId)
        .eq("user_email", userEmail)
        .single();

      if (!membership || membership.status !== "active") {
        return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
      }
    }

    // Build query
    let query = db
      .from("group_posts")
      .select("*", { count: "exact" })
      .eq("group_id", groupId)
      .is("deleted_at", null);

    if (pinnedOnly) {
      query = query.eq("is_pinned", true);
    }

    // Sort: pinned first, then by date
    query = query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) throw error;

    // Enrich posts with author info and user reactions
    if (posts && posts.length > 0) {
      const authorEmails = [...new Set(posts.map((p) => p.author_email))];
      const postIds = posts.map((p) => p.id);

      const [profilesRes, accountsRes, reactionsRes] = await Promise.all([
        db.from("profiles").select("email, username, display_name, school").in("email", authorEmails),
        db.from("user accounts").select("email, name, image_url, tier, level").in("email", authorEmails),
        userEmail
          ? db
              .from("group_post_reactions")
              .select("post_id, reaction_type")
              .eq("user_email", userEmail)
              .in("post_id", postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const userReactions = new Map(
        (reactionsRes.data || []).map((r) => [r.post_id, r.reaction_type])
      );

      const enrichedPosts = posts.map((post) => {
        const profile = profilesRes.data?.find((p) => p.email === post.author_email);
        const account = accountsRes.data?.find((a) => a.email === post.author_email);

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
          user_reaction: userReactions.get(post.id) || null,
        };
      });

      return NextResponse.json({
        posts: enrichedPosts,
        total: count || 0,
        page,
        limit,
      });
    }

    return NextResponse.json({
      posts: [],
      total: 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching group posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/groups/[groupId]/posts - Create post in group
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { groupId } = await params;

  try {
    const body = await request.json();
    const {
      author_email,
      content,
      post_type = "text",
      image_url,
      link_url,
      is_announcement = false,
    } = body;

    if (!author_email || !content) {
      return NextResponse.json({ error: "Author and content required" }, { status: 400 });
    }

    // Check if user is a member
    const { data: membership } = await db
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_email", author_email)
      .single();

    if (!membership || membership.status !== "active") {
      return NextResponse.json({ error: "Must be a member to post" }, { status: 403 });
    }

    // Only admins/creators can make announcements
    const canMakeAnnouncement = ["creator", "admin"].includes(membership.role);
    const finalIsAnnouncement = is_announcement && canMakeAnnouncement;

    // Create the post
    const { data: post, error } = await db
      .from("group_posts")
      .insert({
        group_id: groupId,
        author_email,
        content,
        post_type,
        image_url,
        link_url,
        is_announcement: finalIsAnnouncement,
      })
      .select()
      .single();

    if (error) throw error;

    // Get author info for response
    const [profileRes, accountRes] = await Promise.all([
      db.from("profiles").select("username, display_name, school").eq("email", author_email).single(),
      db.from("user accounts").select("name, image_url, tier, level").eq("email", author_email).single(),
    ]);

    const enrichedPost = {
      ...post,
      author: {
        email: author_email,
        username: profileRes.data?.username,
        name: profileRes.data?.display_name || accountRes.data?.name || "Anonymous",
        image: accountRes.data?.image_url,
        school: profileRes.data?.school,
        tier: accountRes.data?.tier,
        level: accountRes.data?.level,
      },
      user_reaction: null,
    };

    return NextResponse.json({ success: true, post: enrichedPost }, { status: 201 });
  } catch (error) {
    console.error("Error creating group post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// PUT /api/groups/[groupId]/posts - Update post (author or admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { groupId } = await params;

  try {
    const body = await request.json();
    const { post_id, user_email, content, is_pinned } = body;

    if (!post_id || !user_email) {
      return NextResponse.json({ error: "Post ID and user email required" }, { status: 400 });
    }

    // Get post and user's membership
    const [postRes, membershipRes] = await Promise.all([
      db.from("group_posts").select("author_email").eq("id", post_id).eq("group_id", groupId).single(),
      db.from("group_members").select("role").eq("group_id", groupId).eq("user_email", user_email).single(),
    ]);

    const post = postRes.data;
    const membership = membershipRes.data;

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAuthor = post.author_email === user_email;
    const isAdmin = membership && ["creator", "admin", "moderator"].includes(membership.role);

    // Content can only be updated by author
    if (content !== undefined && !isAuthor) {
      return NextResponse.json({ error: "Only the author can edit content" }, { status: 403 });
    }

    // Pinning can only be done by admins
    if (is_pinned !== undefined && !isAdmin) {
      return NextResponse.json({ error: "Only admins can pin posts" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;

    const { data: updatedPost, error } = await db
      .from("group_posts")
      .update(updates)
      .eq("id", post_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Error updating group post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]/posts - Delete post (author or admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { groupId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get("post_id");
  const userEmail = searchParams.get("user_email");

  if (!postId || !userEmail) {
    return NextResponse.json({ error: "Post ID and user email required" }, { status: 400 });
  }

  try {
    // Get post and user's membership
    const [postRes, membershipRes] = await Promise.all([
      db.from("group_posts").select("author_email").eq("id", postId).eq("group_id", groupId).single(),
      db.from("group_members").select("role").eq("group_id", groupId).eq("user_email", userEmail).single(),
    ]);

    const post = postRes.data;
    const membership = membershipRes.data;

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAuthor = post.author_email === userEmail;
    const isAdmin = membership && ["creator", "admin", "moderator"].includes(membership.role);

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to delete this post" }, { status: 403 });
    }

    // Soft delete
    const { error } = await db
      .from("group_posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", postId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
