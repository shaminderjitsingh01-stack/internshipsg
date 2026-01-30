import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// POST /api/reviews/helpful - Mark a review as helpful
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { review_id, user_email } = body;

    if (!review_id || !user_email) {
      return NextResponse.json(
        { error: "Review ID and user email are required" },
        { status: 400 }
      );
    }

    // Check if review exists
    const { data: review } = await supabase
      .from("company_reviews")
      .select("id, user_email")
      .eq("id", review_id)
      .eq("status", "published")
      .single();

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Prevent voting on own review
    if (review.user_email === user_email) {
      return NextResponse.json(
        { error: "You cannot mark your own review as helpful" },
        { status: 400 }
      );
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from("review_helpful_votes")
      .select("review_id")
      .eq("review_id", review_id)
      .eq("user_email", user_email)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already marked this review as helpful" },
        { status: 409 }
      );
    }

    // Add vote
    const { error: voteError } = await supabase
      .from("review_helpful_votes")
      .insert({
        review_id,
        user_email,
      });

    if (voteError) throw voteError;

    // Increment helpful count
    const { error: updateError } = await supabase.rpc("increment_review_helpful", {
      review_id_param: review_id,
    });

    if (updateError) {
      // Fallback if RPC not available
      await supabase
        .from("company_reviews")
        .update({ helpful_count: (review as any).helpful_count + 1 })
        .eq("id", review_id);
    }

    // Get updated count
    const { count } = await supabase
      .from("review_helpful_votes")
      .select("*", { count: "exact", head: true })
      .eq("review_id", review_id);

    return NextResponse.json({
      success: true,
      helpful_count: count || 0,
    });
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    return NextResponse.json(
      { error: "Failed to mark review as helpful" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/helpful - Remove helpful vote
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const reviewId = searchParams.get("review_id");
  const userEmail = searchParams.get("user_email");

  if (!reviewId || !userEmail) {
    return NextResponse.json(
      { error: "Review ID and user email are required" },
      { status: 400 }
    );
  }

  try {
    // Check if vote exists
    const { data: existingVote } = await supabase
      .from("review_helpful_votes")
      .select("review_id")
      .eq("review_id", reviewId)
      .eq("user_email", userEmail)
      .single();

    if (!existingVote) {
      return NextResponse.json(
        { error: "You have not marked this review as helpful" },
        { status: 404 }
      );
    }

    // Remove vote
    const { error: deleteError } = await supabase
      .from("review_helpful_votes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_email", userEmail);

    if (deleteError) throw deleteError;

    // Decrement helpful count
    const { error: updateError } = await supabase.rpc("decrement_review_helpful", {
      review_id_param: reviewId,
    });

    if (updateError) {
      // Fallback if RPC not available
      const { data: review } = await supabase
        .from("company_reviews")
        .select("helpful_count")
        .eq("id", reviewId)
        .single();

      if (review) {
        await supabase
          .from("company_reviews")
          .update({ helpful_count: Math.max(0, (review.helpful_count || 1) - 1) })
          .eq("id", reviewId);
      }
    }

    // Get updated count
    const { count } = await supabase
      .from("review_helpful_votes")
      .select("*", { count: "exact", head: true })
      .eq("review_id", reviewId);

    return NextResponse.json({
      success: true,
      helpful_count: count || 0,
    });
  } catch (error) {
    console.error("Error removing helpful vote:", error);
    return NextResponse.json(
      { error: "Failed to remove helpful vote" },
      { status: 500 }
    );
  }
}
