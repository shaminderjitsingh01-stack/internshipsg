import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Mentor {
  id: string;
  user_email: string;
  title: string | null;
  bio: string | null;
  expertise_areas: string[] | null;
  industries: string[] | null;
  skills: string[] | null;
  years_experience: number | null;
  company: string | null;
  position: string | null;
  hourly_rate: number | null;
  is_free: boolean;
  max_mentees: number;
  current_mentees: number;
  availability: Record<string, string[]> | null;
  timezone: string;
  is_active: boolean;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  total_sessions: number;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
  // Enriched fields
  name?: string;
  image_url?: string;
  school?: string;
}

// GET /api/mentorship - Get mentors list with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const industry = searchParams.get("industry") || "";
  const skill = searchParams.get("skill") || "";
  const is_free = searchParams.get("is_free");
  const is_available = searchParams.get("is_available");
  const min_rating = searchParams.get("min_rating");
  const user_email = searchParams.get("user_email");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort_by = searchParams.get("sort_by") || "rating";
  const sort_order = searchParams.get("sort_order") || "desc";

  try {
    // Build query
    let query = supabase
      .from("mentors")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,bio.ilike.%${search}%,company.ilike.%${search}%`);
    }

    if (industry) {
      query = query.contains("industries", [industry]);
    }

    if (skill) {
      query = query.contains("skills", [skill]);
    }

    if (is_free === "true") {
      query = query.eq("is_free", true);
    }

    if (is_available === "true") {
      query = query.lt("current_mentees", supabase.rpc("get_max_mentees"));
    }

    if (min_rating) {
      query = query.gte("rating", parseFloat(min_rating));
    }

    // Apply sorting
    const ascending = sort_order === "asc";
    if (sort_by === "rating") {
      query = query.order("rating", { ascending: false }).order("total_reviews", { ascending: false });
    } else if (sort_by === "sessions") {
      query = query.order("total_sessions", { ascending: false });
    } else if (sort_by === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order(sort_by, { ascending });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: mentors, error, count } = await query;

    if (error) throw error;

    // Enrich mentors with user profile data
    const enrichedMentors = await enrichMentors(mentors || []);

    return NextResponse.json({
      mentors: enrichedMentors,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentors" },
      { status: 500 }
    );
  }
}

// Helper: Enrich mentors with user profile data
async function enrichMentors(mentors: any[]): Promise<Mentor[]> {
  if (!mentors.length) return [];

  const emails = mentors.map((m) => m.user_email);

  const [profilesRes, accountsRes] = await Promise.all([
    supabase.from("profiles").select("email, username, display_name, school").in("email", emails),
    supabase.from("user accounts").select("email, name, image_url").in("email", emails),
  ]);

  return mentors.map((mentor) => {
    const profile = profilesRes.data?.find((p) => p.email === mentor.user_email);
    const account = accountsRes.data?.find((a) => a.email === mentor.user_email);

    return {
      ...mentor,
      name: profile?.display_name || account?.name || mentor.user_email.split("@")[0],
      image_url: account?.image_url,
      school: profile?.school,
      username: profile?.username,
    };
  });
}

// POST /api/mentorship - Register as a mentor
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      user_email,
      title,
      bio,
      expertise_areas,
      industries,
      skills,
      years_experience,
      company,
      position,
      hourly_rate,
      is_free = true,
      max_mentees = 5,
      availability,
      timezone = "Asia/Singapore",
      linkedin_url,
      website_url,
    } = body;

    if (!user_email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Check if user is already a mentor
    const { data: existing } = await supabase
      .from("mentors")
      .select("id")
      .eq("user_email", user_email)
      .single();

    if (existing) {
      // Update existing mentor profile
      const { data: mentor, error } = await supabase
        .from("mentors")
        .update({
          title,
          bio,
          expertise_areas,
          industries,
          skills,
          years_experience,
          company,
          position,
          hourly_rate,
          is_free,
          max_mentees,
          availability,
          timezone,
          linkedin_url,
          website_url,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", user_email)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, mentor, updated: true });
    }

    // Create new mentor profile
    const { data: mentor, error } = await supabase
      .from("mentors")
      .insert({
        user_email,
        title,
        bio,
        expertise_areas,
        industries,
        skills,
        years_experience,
        company,
        position,
        hourly_rate,
        is_free,
        max_mentees,
        availability,
        timezone,
        linkedin_url,
        website_url,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, mentor }, { status: 201 });
  } catch (error) {
    console.error("Error registering mentor:", error);
    return NextResponse.json(
      { error: "Failed to register as mentor" },
      { status: 500 }
    );
  }
}

// PUT /api/mentorship - Update mentor profile
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { user_email, ...updates } = body;

    if (!user_email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    const { data: mentor, error } = await supabase
      .from("mentors")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", user_email)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, mentor });
  } catch (error) {
    console.error("Error updating mentor:", error);
    return NextResponse.json(
      { error: "Failed to update mentor profile" },
      { status: 500 }
    );
  }
}

// DELETE /api/mentorship - Deactivate mentor profile
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const user_email = searchParams.get("user_email");

  if (!user_email) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from("mentors")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_email", user_email);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating mentor:", error);
    return NextResponse.json(
      { error: "Failed to deactivate mentor profile" },
      { status: 500 }
    );
  }
}
