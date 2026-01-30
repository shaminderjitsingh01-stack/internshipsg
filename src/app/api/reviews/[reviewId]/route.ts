import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ reviewId: string }>;
}

// GET /api/reviews/[reviewId] - Get single review with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { reviewId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const currentUser = searchParams.get("current_user");

  try {
    // Get review
    const { data: review, error } = await supabase
      .from("company_reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("status", "published")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }
      throw error;
    }

    // Get company info
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, logo_url, industry, location")
      .eq("id", review.company_id)
      .single();

    // Get author info if not anonymous
    let author = null;
    if (!review.is_anonymous) {
      const [profileRes, accountRes] = await Promise.all([
        supabase.from("profiles").select("email, username, display_name").eq("email", review.user_email).single(),
        supabase.from("user accounts").select("email, name, image_url").eq("email", review.user_email).single(),
      ]);

      author = {
        email: review.user_email,
        username: profileRes.data?.username,
        name: profileRes.data?.display_name || accountRes.data?.name || "Anonymous",
        image: accountRes.data?.image_url,
      };
    }

    // Check if current user has voted helpful
    let hasVotedHelpful = false;
    if (currentUser) {
      const { data: vote } = await supabase
        .from("review_helpful_votes")
        .select("review_id")
        .eq("review_id", reviewId)
        .eq("user_email", currentUser)
        .single();
      hasVotedHelpful = !!vote;
    }

    // Get helpful vote count
    const { count: helpfulCount } = await supabase
      .from("review_helpful_votes")
      .select("*", { count: "exact", head: true })
      .eq("review_id", reviewId);

    return NextResponse.json({
      review: {
        ...review,
        company,
        author,
        hasVotedHelpful,
        helpful_count: helpfulCount || review.helpful_count,
      },
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[reviewId] - Update a review
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { reviewId } = await params;

  try {
    const body = await request.json();
    const { user_email } = body;

    // Check authorization
    if (!user_email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify review ownership
    const { data: existingReview } = await supabase
      .from("company_reviews")
      .select("user_email")
      .eq("id", reviewId)
      .single();

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview.user_email !== user_email) {
      return NextResponse.json(
        { error: "You can only update your own reviews" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "employment_type",
      "department",
      "start_date",
      "end_date",
      "is_current_employee",
      "overall_rating",
      "work_life_rating",
      "culture_rating",
      "growth_rating",
      "compensation_rating",
      "pros",
      "cons",
      "interview_tips",
      "is_anonymous",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (updateData.overall_rating !== undefined) {
      const rating = updateData.overall_rating as number;
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }
    }

    // Update the review
    const { data: review, error } = await supabase
      .from("company_reviews")
      .update(updateData)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[reviewId] - Delete a review
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { reviewId } = await params;

  try {
    const searchParams = request.nextUrl.searchParams;
    const userEmail = searchParams.get("user_email");

    // Check authorization
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify review ownership
    const { data: existingReview } = await supabase
      .from("company_reviews")
      .select("user_email")
      .eq("id", reviewId)
      .single();

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview.user_email !== userEmail) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      );
    }

    // Soft delete the review
    const { error } = await supabase
      .from("company_reviews")
      .update({ status: "deleted" })
      .eq("id", reviewId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
