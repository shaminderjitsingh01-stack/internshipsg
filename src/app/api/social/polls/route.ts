import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch poll results for a post
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const userEmail = searchParams.get("userEmail");

  if (!postId) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  try {
    // Get poll options
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("*")
      .eq("post_id", postId)
      .order("display_order", { ascending: true });

    if (optionsError) throw optionsError;

    if (!options || options.length === 0) {
      return NextResponse.json({ error: "No poll found for this post" }, { status: 404 });
    }

    // Get post to check poll_ends_at
    const { data: post } = await supabase
      .from("posts")
      .select("poll_ends_at")
      .eq("id", postId)
      .single();

    // Calculate total votes
    const totalVotes = options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);

    // Check if user has voted
    let userVote = null;
    if (userEmail) {
      const optionIds = options.map(o => o.id);
      const { data: vote } = await supabase
        .from("poll_votes")
        .select("poll_option_id")
        .eq("user_email", userEmail)
        .in("poll_option_id", optionIds)
        .single();

      if (vote) {
        userVote = vote.poll_option_id;
      }
    }

    // Add percentage to each option
    const optionsWithPercentage = options.map(opt => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0,
    }));

    return NextResponse.json({
      options: optionsWithPercentage,
      totalVotes,
      userVote,
      pollEndsAt: post?.poll_ends_at || null,
      hasEnded: post?.poll_ends_at ? new Date(post.poll_ends_at) < new Date() : false,
    });
  } catch (error) {
    console.error("Poll GET error:", error);
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 });
  }
}

// POST - Create a poll (with post)
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      author_email,
      content,
      options, // array of option texts
      duration, // 1, 3, or 7 days
      visibility = "public",
    } = body;

    if (!author_email || !content) {
      return NextResponse.json({ error: "Author and content required" }, { status: 400 });
    }

    if (!options || options.length < 2 || options.length > 4) {
      return NextResponse.json({ error: "Poll requires 2-4 options" }, { status: 400 });
    }

    // Calculate poll end date
    const pollEndsAt = new Date();
    pollEndsAt.setDate(pollEndsAt.getDate() + (duration || 1));

    // Extract hashtags from content
    const hashtags = content.match(/#[\w]+/g) || [];

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        author_email,
        content,
        post_type: "poll",
        visibility,
        poll_ends_at: pollEndsAt.toISOString(),
      })
      .select()
      .single();

    if (postError) throw postError;

    // Create poll options
    const pollOptions = options.map((text: string, index: number) => ({
      post_id: post.id,
      option_text: text.trim(),
      display_order: index,
    }));

    const { data: createdOptions, error: optionsError } = await supabase
      .from("poll_options")
      .insert(pollOptions)
      .select();

    if (optionsError) throw optionsError;

    // Handle hashtags
    if (hashtags.length > 0) {
      for (const tag of hashtags) {
        const cleanTag = tag.toLowerCase().replace("#", "");

        const { data: hashtag } = await supabase
          .from("hashtags")
          .upsert({ tag: cleanTag }, { onConflict: "tag" })
          .select()
          .single();

        if (hashtag) {
          try {
            await supabase.from("post_hashtags").insert({
              post_id: post.id,
              hashtag_id: hashtag.id,
            });
          } catch {}

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

      const { data: mentionedUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username)
        .single();

      if (mentionedUser) {
        await supabase.from("mentions").insert({
          post_id: post.id,
          mentioned_email: mentionedUser.email,
        });

        await supabase.from("notifications").insert({
          user_email: mentionedUser.email,
          type: "mention",
          actor_email: author_email,
          post_id: post.id,
          title: "You were mentioned",
          body: "mentioned you in a poll",
          link: `/post/${post.id}`,
        });
      }
    }

    return NextResponse.json({
      post: {
        ...post,
        poll_options: createdOptions,
      },
      success: true,
    });
  } catch (error) {
    console.error("Create poll error:", error);
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}
