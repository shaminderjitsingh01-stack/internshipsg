import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface ActivityItem {
  id: string;
  type: "post" | "comment" | "reaction" | "follow";
  description: string;
  target_username?: string;
  target_id?: string;
  link: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// GET - Fetch user's activity history
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const type = searchParams.get("type"); // 'all', 'posts', 'comments', 'reactions', 'follows'
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const activities: ActivityItem[] = [];

    // Helper to get username from email
    const getUsernameMap = async (emails: string[]): Promise<Record<string, string>> => {
      if (emails.length === 0) return {};
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, username, display_name")
        .in("email", emails);

      const { data: accounts } = await supabase
        .from("user accounts")
        .select("email, name")
        .in("email", emails);

      const map: Record<string, string> = {};
      emails.forEach(e => {
        const profile = profiles?.find(p => p.email === e);
        const account = accounts?.find(a => a.email === e);
        map[e] = profile?.username || profile?.display_name || account?.name || "someone";
      });
      return map;
    };

    // Build date filter - uses 'any' because query type varies by select columns
    const buildDateFilter = <T>(query: T): T => {
      let q = query as any;
      if (startDate) {
        q = q.gte("created_at", startDate);
      }
      if (endDate) {
        q = q.lte("created_at", endDate);
      }
      return q as T;
    };

    // Fetch posts
    if (!type || type === "all" || type === "posts") {
      let query = supabase
        .from("posts")
        .select("id, content, created_at")
        .eq("author_email", email)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      query = buildDateFilter(query);
      const { data: posts } = await query;

      posts?.forEach(post => {
        activities.push({
          id: `post-${post.id}`,
          type: "post",
          description: "You created a post",
          target_id: post.id,
          link: `/home?post=${post.id}`,
          created_at: post.created_at,
          metadata: { preview: post.content?.substring(0, 100) },
        });
      });
    }

    // Fetch comments
    if (!type || type === "all" || type === "comments") {
      let query = supabase
        .from("comments")
        .select("id, post_id, content, created_at")
        .eq("author_email", email)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      query = buildDateFilter(query);
      const { data: comments } = await query;

      if (comments && comments.length > 0) {
        // Get post authors
        const postIds = [...new Set(comments.map(c => c.post_id))];
        const { data: posts } = await supabase
          .from("posts")
          .select("id, author_email")
          .in("id", postIds);

        const postAuthorEmails = [...new Set(posts?.map(p => p.author_email) || [])];
        const usernameMap = await getUsernameMap(postAuthorEmails);

        comments.forEach(comment => {
          const post = posts?.find(p => p.id === comment.post_id);
          const authorUsername = post ? usernameMap[post.author_email] : "someone";

          activities.push({
            id: `comment-${comment.id}`,
            type: "comment",
            description: `You commented on a post by @${authorUsername}`,
            target_username: authorUsername,
            target_id: comment.post_id,
            link: `/home?post=${comment.post_id}`,
            created_at: comment.created_at,
            metadata: { preview: comment.content?.substring(0, 100) },
          });
        });
      }
    }

    // Fetch reactions
    if (!type || type === "all" || type === "reactions") {
      let query = supabase
        .from("reactions")
        .select("id, post_id, reaction_type, created_at")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      query = buildDateFilter(query);
      const { data: reactions } = await query;

      if (reactions && reactions.length > 0) {
        // Get post authors
        const postIds = [...new Set(reactions.map(r => r.post_id))];
        const { data: posts } = await supabase
          .from("posts")
          .select("id, author_email")
          .in("id", postIds);

        const postAuthorEmails = [...new Set(posts?.map(p => p.author_email) || [])];
        const usernameMap = await getUsernameMap(postAuthorEmails);

        const reactionEmojis: Record<string, string> = {
          fire: "fire",
          muscle: "muscle",
          clap: "clap",
          target: "target",
          heart: "heart",
          idea: "idea",
          like: "like",
        };

        reactions.forEach(reaction => {
          const post = posts?.find(p => p.id === reaction.post_id);
          const authorUsername = post ? usernameMap[post.author_email] : "someone";
          const reactionName = reactionEmojis[reaction.reaction_type] || reaction.reaction_type;

          activities.push({
            id: `reaction-${reaction.id}`,
            type: "reaction",
            description: `You reacted with ${reactionName} to a post by @${authorUsername}`,
            target_username: authorUsername,
            target_id: reaction.post_id,
            link: `/home?post=${reaction.post_id}`,
            created_at: reaction.created_at,
            metadata: { reaction_type: reaction.reaction_type },
          });
        });
      }
    }

    // Fetch follows
    if (!type || type === "all" || type === "follows") {
      let query = supabase
        .from("follows")
        .select("id, following_email, created_at")
        .eq("follower_email", email)
        .order("created_at", { ascending: false });

      query = buildDateFilter(query);
      const { data: follows } = await query;

      if (follows && follows.length > 0) {
        const followingEmails = follows.map(f => f.following_email);
        const usernameMap = await getUsernameMap(followingEmails);

        // Get profile usernames for links
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email, username")
          .in("email", followingEmails);

        follows.forEach(follow => {
          const displayName = usernameMap[follow.following_email];
          const profile = profiles?.find(p => p.email === follow.following_email);
          const linkUsername = profile?.username || follow.following_email;

          activities.push({
            id: `follow-${follow.id}`,
            type: "follow",
            description: `You started following @${displayName}`,
            target_username: displayName,
            link: `/u/${linkUsername}`,
            created_at: follow.created_at,
          });
        });
      }
    }

    // Sort all activities by date
    activities.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    return NextResponse.json({
      activities: paginatedActivities,
      total: activities.length,
      hasMore: offset + limit < activities.length,
    });
  } catch (error) {
    console.error("Activity GET error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
