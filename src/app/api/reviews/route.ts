import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Review {
  id: string;
  company_id: string;
  user_email: string;
  employment_type: "intern" | "full-time" | "part-time" | "contract";
  department: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current_employee: boolean;
  overall_rating: number;
  work_life_rating: number | null;
  culture_rating: number | null;
  growth_rating: number | null;
  compensation_rating: number | null;
  pros: string;
  cons: string;
  interview_tips: string | null;
  is_anonymous: boolean;
  helpful_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/reviews - Get reviews with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("company_id");
  const userEmail = searchParams.get("user_email");
  const employmentType = searchParams.get("employment_type");
  const minRating = searchParams.get("min_rating");
  const maxRating = searchParams.get("max_rating");
  const department = searchParams.get("department");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const type = searchParams.get("type"); // 'recent', 'featured', 'user'

  try {
    let query = supabase
      .from("company_reviews")
      .select("*", { count: "exact" })
      .eq("status", "published");

    // Apply filters
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (userEmail && type === "user") {
      query = query.eq("user_email", userEmail);
    }

    if (employmentType) {
      query = query.eq("employment_type", employmentType);
    }

    if (minRating) {
      query = query.gte("overall_rating", parseInt(minRating));
    }

    if (maxRating) {
      query = query.lte("overall_rating", parseInt(maxRating));
    }

    if (department) {
      query = query.ilike("department", `%${department}%`);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    if (sortBy === "helpful") {
      query = query.order("helpful_count", { ascending: false });
    } else if (sortBy === "rating") {
      query = query.order("overall_rating", { ascending });
    } else {
      query = query.order("created_at", { ascending });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reviews, error, count } = await query;

    if (error) throw error;

    // Get company info for each review
    const companyIds = [...new Set(reviews?.map(r => r.company_id) || [])];
    let companiesMap: Record<string, any> = {};

    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, logo_url, industry")
        .in("id", companyIds);

      companies?.forEach(c => {
        companiesMap[c.id] = c;
      });
    }

    // Get user info for non-anonymous reviews
    const nonAnonEmails = reviews?.filter(r => !r.is_anonymous).map(r => r.user_email) || [];
    let usersMap: Record<string, any> = {};

    if (nonAnonEmails.length > 0) {
      const [profilesRes, accountsRes] = await Promise.all([
        supabase.from("profiles").select("email, username, display_name").in("email", nonAnonEmails),
        supabase.from("user accounts").select("email, name, image_url").in("email", nonAnonEmails),
      ]);

      nonAnonEmails.forEach(email => {
        const profile = profilesRes.data?.find(p => p.email === email);
        const account = accountsRes.data?.find(a => a.email === email);
        usersMap[email] = {
          username: profile?.username,
          name: profile?.display_name || account?.name || "Anonymous",
          image: account?.image_url,
        };
      });
    }

    // Check if current user has voted helpful on each review
    let helpfulVotes: string[] = [];
    const currentUser = searchParams.get("current_user");
    if (currentUser && reviews?.length) {
      const reviewIds = reviews.map(r => r.id);
      const { data: votes } = await supabase
        .from("review_helpful_votes")
        .select("review_id")
        .eq("user_email", currentUser)
        .in("review_id", reviewIds);
      helpfulVotes = votes?.map(v => v.review_id) || [];
    }

    // Enrich reviews with company and user info
    const enrichedReviews = reviews?.map(review => ({
      ...review,
      company: companiesMap[review.company_id] || null,
      author: review.is_anonymous ? null : usersMap[review.user_email] || null,
      hasVotedHelpful: helpfulVotes.includes(review.id),
    }));

    return NextResponse.json({
      reviews: enrichedReviews || [],
      total: count || 0,
      page,
      limit,
    } as ReviewsResponse);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Submit a new review
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      company_id,
      user_email,
      employment_type,
      department,
      start_date,
      end_date,
      is_current_employee,
      overall_rating,
      work_life_rating,
      culture_rating,
      growth_rating,
      compensation_rating,
      pros,
      cons,
      interview_tips,
      is_anonymous,
    } = body;

    // Validate required fields
    if (!company_id || !user_email || !employment_type || !overall_rating || !pros || !cons) {
      return NextResponse.json(
        { error: "Missing required fields: company_id, user_email, employment_type, overall_rating, pros, cons" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate employment type
    const validTypes = ["intern", "full-time", "part-time", "contract"];
    if (!validTypes.includes(employment_type)) {
      return NextResponse.json(
        { error: "Invalid employment type" },
        { status: 400 }
      );
    }

    // Check if company exists
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("id", company_id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if user already reviewed this company
    const { data: existingReview } = await supabase
      .from("company_reviews")
      .select("id")
      .eq("company_id", company_id)
      .eq("user_email", user_email)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this company. You can update your existing review instead." },
        { status: 409 }
      );
    }

    // Create the review
    const { data: review, error } = await supabase
      .from("company_reviews")
      .insert({
        company_id,
        user_email,
        employment_type,
        department,
        start_date,
        end_date,
        is_current_employee: is_current_employee || false,
        overall_rating,
        work_life_rating,
        culture_rating,
        growth_rating,
        compensation_rating,
        pros,
        cons,
        interview_tips,
        is_anonymous: is_anonymous || false,
        status: "published",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
