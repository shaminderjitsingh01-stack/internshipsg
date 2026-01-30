import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface MentorshipRequest {
  id: string;
  mentor_id: string;
  mentee_email: string;
  message: string | null;
  goals: string | null;
  areas_of_interest: string[] | null;
  preferred_schedule: string | null;
  status: string;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  // Enriched fields
  mentor?: any;
  mentee?: any;
}

// GET /api/mentorship/requests - Get mentorship requests
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const user_email = searchParams.get("user_email");
  const type = searchParams.get("type") || "received"; // received, sent
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!user_email) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from("mentorship_requests")
      .select("*", { count: "exact" });

    if (type === "sent") {
      // Requests sent by user as a mentee
      query = query.eq("mentee_email", user_email);
    } else {
      // Requests received by user as a mentor
      // First get mentor ID
      const { data: mentor } = await supabase
        .from("mentors")
        .select("id")
        .eq("user_email", user_email)
        .single();

      if (!mentor) {
        return NextResponse.json({ requests: [], total: 0, page, limit });
      }

      query = query.eq("mentor_id", mentor.id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Order by created_at descending
    query = query.order("created_at", { ascending: false });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: requests, error, count } = await query;

    if (error) throw error;

    // Enrich requests with mentor and mentee info
    const enrichedRequests = await enrichRequests(requests || [], type);

    return NextResponse.json({
      requests: enrichedRequests,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching mentorship requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentorship requests" },
      { status: 500 }
    );
  }
}

// Helper: Enrich requests with user data
async function enrichRequests(requests: any[], type: string): Promise<MentorshipRequest[]> {
  if (!requests.length) return [];

  // Get mentor IDs and mentee emails
  const mentorIds = [...new Set(requests.map((r) => r.mentor_id))];
  const menteeEmails = [...new Set(requests.map((r) => r.mentee_email))];

  // Fetch mentor data
  const { data: mentors } = await supabase
    .from("mentors")
    .select("id, user_email, title, company, position")
    .in("id", mentorIds);

  // Get mentor user emails for profile lookup
  const mentorEmails = mentors?.map((m) => m.user_email) || [];
  const allEmails = [...new Set([...mentorEmails, ...menteeEmails])];

  // Fetch profiles and accounts
  const [profilesRes, accountsRes] = await Promise.all([
    supabase.from("profiles").select("email, username, display_name, school").in("email", allEmails),
    supabase.from("user accounts").select("email, name, image_url").in("email", allEmails),
  ]);

  return requests.map((request) => {
    const mentor = mentors?.find((m) => m.id === request.mentor_id);
    const mentorProfile = profilesRes.data?.find((p) => p.email === mentor?.user_email);
    const mentorAccount = accountsRes.data?.find((a) => a.email === mentor?.user_email);
    const menteeProfile = profilesRes.data?.find((p) => p.email === request.mentee_email);
    const menteeAccount = accountsRes.data?.find((a) => a.email === request.mentee_email);

    return {
      ...request,
      mentor: mentor
        ? {
            ...mentor,
            name: mentorProfile?.display_name || mentorAccount?.name || mentor.user_email.split("@")[0],
            image_url: mentorAccount?.image_url,
            username: mentorProfile?.username,
          }
        : null,
      mentee: {
        email: request.mentee_email,
        name: menteeProfile?.display_name || menteeAccount?.name || request.mentee_email.split("@")[0],
        image_url: menteeAccount?.image_url,
        school: menteeProfile?.school,
        username: menteeProfile?.username,
      },
    };
  });
}

// POST /api/mentorship/requests - Create a mentorship request
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      mentor_id,
      mentee_email,
      message,
      goals,
      areas_of_interest,
      preferred_schedule,
    } = body;

    if (!mentor_id || !mentee_email) {
      return NextResponse.json(
        { error: "Mentor ID and mentee email are required" },
        { status: 400 }
      );
    }

    // Check if mentor exists and is active
    const { data: mentor } = await supabase
      .from("mentors")
      .select("id, user_email, max_mentees, current_mentees, is_active")
      .eq("id", mentor_id)
      .single();

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }

    if (!mentor.is_active) {
      return NextResponse.json(
        { error: "This mentor is not currently accepting new mentees" },
        { status: 400 }
      );
    }

    // Check if mentor has reached max mentees
    if (mentor.current_mentees >= mentor.max_mentees) {
      return NextResponse.json(
        { error: "This mentor has reached their maximum number of mentees" },
        { status: 400 }
      );
    }

    // Check if user is trying to request themselves
    if (mentor.user_email === mentee_email) {
      return NextResponse.json(
        { error: "You cannot request mentorship from yourself" },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from("mentorship_requests")
      .select("id, status")
      .eq("mentor_id", mentor_id)
      .eq("mentee_email", mentee_email)
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request with this mentor" },
        { status: 400 }
      );
    }

    // Check for existing active mentorship
    const { data: existingMentorship } = await supabase
      .from("mentorships")
      .select("id")
      .eq("mentor_id", mentor_id)
      .eq("mentee_email", mentee_email)
      .eq("status", "active")
      .single();

    if (existingMentorship) {
      return NextResponse.json(
        { error: "You already have an active mentorship with this mentor" },
        { status: 400 }
      );
    }

    // Create the request
    const { data: mentorshipRequest, error } = await supabase
      .from("mentorship_requests")
      .insert({
        mentor_id,
        mentee_email,
        message,
        goals,
        areas_of_interest,
        preferred_schedule,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for mentor
    await supabase.from("notifications").insert({
      user_email: mentor.user_email,
      type: "mentorship_request",
      actor_email: mentee_email,
      title: "New Mentorship Request",
      body: "Someone has requested you as their mentor",
      link: "/mentorship/my",
    });

    return NextResponse.json({ success: true, request: mentorshipRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating mentorship request:", error);
    return NextResponse.json(
      { error: "Failed to create mentorship request" },
      { status: 500 }
    );
  }
}

// PUT /api/mentorship/requests - Accept or decline a request
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { request_id, user_email, action, decline_reason } = body;

    if (!request_id || !user_email || !action) {
      return NextResponse.json(
        { error: "Request ID, user email, and action are required" },
        { status: 400 }
      );
    }

    if (!["accept", "decline", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept, decline, or cancel" },
        { status: 400 }
      );
    }

    // Get the request
    const { data: mentorshipRequest } = await supabase
      .from("mentorship_requests")
      .select("*, mentors!inner(user_email, id)")
      .eq("id", request_id)
      .single();

    if (!mentorshipRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Verify authorization
    const isMentor = (mentorshipRequest as any).mentors.user_email === user_email;
    const isMentee = mentorshipRequest.mentee_email === user_email;

    if (action === "cancel" && !isMentee) {
      return NextResponse.json(
        { error: "Only the mentee can cancel their request" },
        { status: 403 }
      );
    }

    if ((action === "accept" || action === "decline") && !isMentor) {
      return NextResponse.json(
        { error: "Only the mentor can accept or decline requests" },
        { status: 403 }
      );
    }

    if (mentorshipRequest.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Update request status
    const newStatus = action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled";

    const { error: updateError } = await supabase
      .from("mentorship_requests")
      .update({
        status: newStatus,
        decline_reason: action === "decline" ? decline_reason : null,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) throw updateError;

    // If accepted, create a mentorship
    if (action === "accept") {
      const { error: mentorshipError } = await supabase
        .from("mentorships")
        .insert({
          mentor_id: mentorshipRequest.mentor_id,
          mentee_email: mentorshipRequest.mentee_email,
          request_id: request_id,
          goals: mentorshipRequest.goals,
        });

      if (mentorshipError) throw mentorshipError;

      // Create notification for mentee
      await supabase.from("notifications").insert({
        user_email: mentorshipRequest.mentee_email,
        type: "mentorship_accepted",
        actor_email: (mentorshipRequest as any).mentors.user_email,
        title: "Mentorship Request Accepted",
        body: "Your mentorship request has been accepted!",
        link: "/mentorship/my",
      });
    } else if (action === "decline") {
      // Create notification for mentee
      await supabase.from("notifications").insert({
        user_email: mentorshipRequest.mentee_email,
        type: "mentorship_declined",
        actor_email: (mentorshipRequest as any).mentors.user_email,
        title: "Mentorship Request Declined",
        body: decline_reason || "Your mentorship request was declined",
        link: "/mentorship",
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error updating mentorship request:", error);
    return NextResponse.json(
      { error: "Failed to update mentorship request" },
      { status: 500 }
    );
  }
}
