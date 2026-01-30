import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface InterviewSchedule {
  id: string;
  user_email: string;
  title: string;
  interview_type: string;
  company_name: string | null;
  job_title: string | null;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  reminder_sent: boolean;
  status: string;
  created_at: string;
}

export interface SchedulesResponse {
  schedules: InterviewSchedule[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/schedule - Get interview schedules list with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const user_email = searchParams.get("user_email");
  const status = searchParams.get("status") || "";
  const interview_type = searchParams.get("interview_type") || "";
  const upcoming_only = searchParams.get("upcoming_only") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const sort_by = searchParams.get("sort_by") || "scheduled_at";
  const sort_order = searchParams.get("sort_order") || "asc";

  if (!user_email) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    // Build query
    let query = supabase
      .from("interview_schedules")
      .select("*", { count: "exact" })
      .eq("user_email", user_email);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (interview_type) {
      query = query.eq("interview_type", interview_type);
    }

    if (upcoming_only) {
      query = query.gte("scheduled_at", new Date().toISOString());
    }

    // Apply sorting
    const ascending = sort_order === "asc";
    query = query.order(sort_by, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: schedules, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      schedules: schedules || [],
      total: count || 0,
      page,
      limit,
    } as SchedulesResponse);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST /api/schedule - Create a new interview schedule
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      user_email,
      title,
      interview_type = "mock",
      company_name,
      job_title,
      scheduled_at,
      duration_minutes = 30,
      notes,
    } = body;

    // Validate required fields
    if (!user_email || !title || !scheduled_at) {
      return NextResponse.json(
        { error: "User email, title, and scheduled time are required" },
        { status: 400 }
      );
    }

    // Validate interview_type
    const validTypes = ["mock", "real", "coaching"];
    if (!validTypes.includes(interview_type)) {
      return NextResponse.json(
        { error: "Invalid interview type. Must be mock, real, or coaching" },
        { status: 400 }
      );
    }

    // Create the schedule
    const { data: schedule, error } = await supabase
      .from("interview_schedules")
      .insert({
        user_email,
        title,
        interview_type,
        company_name,
        job_title,
        scheduled_at,
        duration_minutes,
        notes,
        status: "scheduled",
        reminder_sent: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
