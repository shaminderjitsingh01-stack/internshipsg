import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { recordActivity, getMotivationalMessage } from "@/lib/streaks";

export const maxDuration = 30;

// Save interview record
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }
    const body = await request.json();
    const {
      userEmail,
      userName,
      targetRole,
      videoUrl,
      transcript,
      score,
      feedback
    } = body;

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        user_email: userEmail,
        user_name: userName,
        target_role: targetRole,
        video_url: videoUrl,
        transcript: JSON.stringify(transcript),
        score: score,
        feedback: feedback,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update streak after successful interview save
    let streakResult = null;
    if (userEmail) {
      try {
        streakResult = await recordActivity(userEmail);
      } catch (streakError) {
        console.error("Streak update error:", streakError);
        // Don't fail the request if streak update fails
      }
    }

    return NextResponse.json({
      interview: data,
      success: true,
      streak: streakResult?.streak || null,
      newBadges: streakResult?.newBadges || [],
      streakMessage: streakResult?.streak
        ? getMotivationalMessage(streakResult.streak.current_streak, streakResult.isNewDay)
        : null,
    });
  } catch (error) {
    console.error("Save interview error:", error);
    return NextResponse.json(
      { error: "Failed to save interview" },
      { status: 500 }
    );
  }
}

// Get user's interviews with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");
    const interviewId = searchParams.get("id");

    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // If specific interview ID is requested, return single interview
    if (interviewId) {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .eq("user_email", userEmail)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ interview: data });
    }

    // Parse filter parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100);
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const scoreMin = searchParams.get("scoreMin") || "";
    const scoreMax = searchParams.get("scoreMax") || "";
    const company = searchParams.get("company") || "";
    const targetRole = searchParams.get("role") || "";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Determine sort order
    let sortColumn = "created_at";
    let sortAscending = false;

    switch (sort) {
      case "oldest":
        sortColumn = "created_at";
        sortAscending = true;
        break;
      case "highest":
        sortColumn = "score";
        sortAscending = false;
        break;
      case "lowest":
        sortColumn = "score";
        sortAscending = true;
        break;
      case "newest":
      default:
        sortColumn = "created_at";
        sortAscending = false;
        break;
    }

    // Build query
    let query = supabase
      .from("interviews")
      .select("*", { count: "exact" })
      .eq("user_email", userEmail);

    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      query = query.gte("created_at", fromDate.toISOString());
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte("created_at", toDate.toISOString());
    }

    // Apply score filters
    if (scoreMin) {
      const minScore = parseFloat(scoreMin);
      if (!isNaN(minScore)) {
        query = query.gte("score", minScore);
      }
    }

    if (scoreMax) {
      const maxScore = parseFloat(scoreMax);
      if (!isNaN(maxScore)) {
        query = query.lte("score", maxScore);
      }
    }

    // Apply company filter if column exists
    if (company) {
      query = query.ilike("company_name", `%${company}%`);
    }

    // Apply target role filter
    if (targetRole) {
      query = query.ilike("target_role", `%${targetRole}%`);
    }

    // Apply search filter (searches in feedback)
    if (search) {
      query = query.ilike("feedback", `%${search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortColumn, { ascending: sortAscending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      interviews: data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Get interviews error:", error);
    return NextResponse.json(
      { error: "Failed to get interviews" },
      { status: 500 }
    );
  }
}
