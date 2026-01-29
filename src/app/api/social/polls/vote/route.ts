import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// POST - Vote on a poll option
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { poll_option_id, user_email } = body;

    if (!poll_option_id || !user_email) {
      return NextResponse.json({ error: "Option ID and user email required" }, { status: 400 });
    }

    // Get the poll option to find the post
    const { data: option, error: optionError } = await supabase
      .from("poll_options")
      .select("post_id")
      .eq("id", poll_option_id)
      .single();

    if (optionError || !option) {
      return NextResponse.json({ error: "Poll option not found" }, { status: 404 });
    }

    // Check if poll has ended
    const { data: post } = await supabase
      .from("posts")
      .select("poll_ends_at, author_email")
      .eq("id", option.post_id)
      .single();

    if (post?.poll_ends_at && new Date(post.poll_ends_at) < new Date()) {
      return NextResponse.json({ error: "Poll has ended" }, { status: 400 });
    }

    // Check if user has already voted on this poll
    const { data: allOptions } = await supabase
      .from("poll_options")
      .select("id")
      .eq("post_id", option.post_id);

    const optionIds = allOptions?.map(o => o.id) || [];

    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("id, poll_option_id")
      .eq("user_email", user_email)
      .in("poll_option_id", optionIds)
      .single();

    if (existingVote) {
      // If voting for the same option, do nothing
      if (existingVote.poll_option_id === poll_option_id) {
        return NextResponse.json({ message: "Already voted for this option", action: "none" });
      }

      // Change vote: delete old vote and create new one
      await supabase
        .from("poll_votes")
        .delete()
        .eq("id", existingVote.id);

      const { error: insertError } = await supabase
        .from("poll_votes")
        .insert({
          poll_option_id,
          user_email,
        });

      if (insertError) throw insertError;

      return NextResponse.json({
        success: true,
        action: "changed",
        previousOptionId: existingVote.poll_option_id,
        newOptionId: poll_option_id,
      });
    }

    // New vote
    const { error: insertError } = await supabase
      .from("poll_votes")
      .insert({
        poll_option_id,
        user_email,
      });

    if (insertError) throw insertError;

    // Notify post author (if not self)
    if (post && post.author_email !== user_email) {
      await supabase.from("notifications").insert({
        user_email: post.author_email,
        type: "poll_vote",
        actor_email: user_email,
        post_id: option.post_id,
        title: "New poll vote",
        body: "voted on your poll",
        link: `/post/${option.post_id}`,
      });
    }

    return NextResponse.json({
      success: true,
      action: "voted",
      optionId: poll_option_id,
    });
  } catch (error) {
    console.error("Poll vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
