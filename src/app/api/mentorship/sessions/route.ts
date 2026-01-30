import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface MentorshipSession {
  id: string;
  mentorship_id: string;
  mentor_id: string;
  mentee_email: string;
  title: string | null;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  meeting_type: string;
  location: string | null;
  status: string;
  notes: string | null;
  mentor_notes: string | null;
  mentee_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  // Enriched fields
  mentor?: any;
  mentee?: any;
}

// GET /api/mentorship/sessions - Get scheduled sessions
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const user_email = searchParams.get("user_email");
  const mentorship_id = searchParams.get("mentorship_id");
  const status = searchParams.get("status") || "";
  const upcoming_only = searchParams.get("upcoming_only") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!user_email) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    // Get mentor ID if user is a mentor
    const { data: mentor } = await supabase
      .from("mentors")
      .select("id")
      .eq("user_email", user_email)
      .single();

    let query = supabase
      .from("mentorship_sessions")
      .select("*", { count: "exact" });

    // Filter by user (as mentor or mentee)
    if (mentor) {
      query = query.or(`mentor_id.eq.${mentor.id},mentee_email.eq.${user_email}`);
    } else {
      query = query.eq("mentee_email", user_email);
    }

    if (mentorship_id) {
      query = query.eq("mentorship_id", mentorship_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (upcoming_only) {
      query = query
        .gte("scheduled_at", new Date().toISOString())
        .in("status", ["scheduled"]);
    }

    // Order by scheduled_at
    query = query.order("scheduled_at", { ascending: upcoming_only });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: sessions, error, count } = await query;

    if (error) throw error;

    // Enrich sessions with user data
    const enrichedSessions = await enrichSessions(sessions || []);

    return NextResponse.json({
      sessions: enrichedSessions,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching mentorship sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentorship sessions" },
      { status: 500 }
    );
  }
}

// Helper: Enrich sessions with user data
async function enrichSessions(sessions: any[]): Promise<MentorshipSession[]> {
  if (!sessions.length) return [];

  // Get mentor IDs and mentee emails
  const mentorIds = [...new Set(sessions.map((s) => s.mentor_id))];
  const menteeEmails = [...new Set(sessions.map((s) => s.mentee_email))];

  // Fetch mentor data
  const { data: mentors } = await supabase
    .from("mentors")
    .select("id, user_email, title, company")
    .in("id", mentorIds);

  // Get all relevant emails
  const mentorEmails = mentors?.map((m) => m.user_email) || [];
  const allEmails = [...new Set([...mentorEmails, ...menteeEmails])];

  // Fetch profiles and accounts
  const [profilesRes, accountsRes] = await Promise.all([
    supabase.from("profiles").select("email, username, display_name").in("email", allEmails),
    supabase.from("user accounts").select("email, name, image_url").in("email", allEmails),
  ]);

  return sessions.map((session) => {
    const mentor = mentors?.find((m) => m.id === session.mentor_id);
    const mentorProfile = profilesRes.data?.find((p) => p.email === mentor?.user_email);
    const mentorAccount = accountsRes.data?.find((a) => a.email === mentor?.user_email);
    const menteeProfile = profilesRes.data?.find((p) => p.email === session.mentee_email);
    const menteeAccount = accountsRes.data?.find((a) => a.email === session.mentee_email);

    return {
      ...session,
      mentor: mentor
        ? {
            ...mentor,
            name: mentorProfile?.display_name || mentorAccount?.name || mentor.user_email.split("@")[0],
            image_url: mentorAccount?.image_url,
            username: mentorProfile?.username,
          }
        : null,
      mentee: {
        email: session.mentee_email,
        name: menteeProfile?.display_name || menteeAccount?.name || session.mentee_email.split("@")[0],
        image_url: menteeAccount?.image_url,
        username: menteeProfile?.username,
      },
    };
  });
}

// POST /api/mentorship/sessions - Schedule a new session
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      mentorship_id,
      user_email,
      title,
      description,
      scheduled_at,
      duration_minutes = 60,
      meeting_link,
      meeting_type = "video_call",
      location,
    } = body;

    if (!mentorship_id || !user_email || !scheduled_at) {
      return NextResponse.json(
        { error: "Mentorship ID, user email, and scheduled time are required" },
        { status: 400 }
      );
    }

    // Get the mentorship
    const { data: mentorship } = await supabase
      .from("mentorships")
      .select("*, mentors!inner(id, user_email)")
      .eq("id", mentorship_id)
      .single();

    if (!mentorship) {
      return NextResponse.json(
        { error: "Mentorship not found" },
        { status: 404 }
      );
    }

    // Verify user is part of this mentorship
    const isMentor = (mentorship as any).mentors.user_email === user_email;
    const isMentee = mentorship.mentee_email === user_email;

    if (!isMentor && !isMentee) {
      return NextResponse.json(
        { error: "You are not part of this mentorship" },
        { status: 403 }
      );
    }

    // Check if mentorship is active
    if (mentorship.status !== "active") {
      return NextResponse.json(
        { error: "This mentorship is not active" },
        { status: 400 }
      );
    }

    // Create the session
    const { data: session, error } = await supabase
      .from("mentorship_sessions")
      .insert({
        mentorship_id,
        mentor_id: (mentorship as any).mentors.id,
        mentee_email: mentorship.mentee_email,
        title,
        description,
        scheduled_at,
        duration_minutes,
        meeting_link,
        meeting_type,
        location,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify the other party
    const notifyEmail = isMentor ? mentorship.mentee_email : (mentorship as any).mentors.user_email;
    await supabase.from("notifications").insert({
      user_email: notifyEmail,
      type: "mentorship_session_scheduled",
      actor_email: user_email,
      title: "New Mentorship Session",
      body: `A new session has been scheduled for ${new Date(scheduled_at).toLocaleString()}`,
      link: "/mentorship/my",
    });

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error("Error scheduling session:", error);
    return NextResponse.json(
      { error: "Failed to schedule session" },
      { status: 500 }
    );
  }
}

// PUT /api/mentorship/sessions - Update a session
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      session_id,
      user_email,
      action, // complete, cancel, reschedule
      scheduled_at,
      cancel_reason,
      notes,
      mentor_notes,
      mentee_notes,
    } = body;

    if (!session_id || !user_email) {
      return NextResponse.json(
        { error: "Session ID and user email are required" },
        { status: 400 }
      );
    }

    // Get the session
    const { data: session } = await supabase
      .from("mentorship_sessions")
      .select("*, mentors!inner(user_email)")
      .eq("id", session_id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify user is part of this session
    const isMentor = (session as any).mentors.user_email === user_email;
    const isMentee = session.mentee_email === user_email;

    if (!isMentor && !isMentee) {
      return NextResponse.json(
        { error: "You are not part of this session" },
        { status: 403 }
      );
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    if (action === "complete") {
      if (!isMentor) {
        return NextResponse.json(
          { error: "Only the mentor can mark a session as complete" },
          { status: 403 }
        );
      }
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
      if (notes) updateData.notes = notes;
      if (mentor_notes) updateData.mentor_notes = mentor_notes;
    } else if (action === "cancel") {
      updateData.status = "cancelled";
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancel_reason = cancel_reason;
    } else if (action === "reschedule") {
      if (!scheduled_at) {
        return NextResponse.json(
          { error: "New scheduled time is required for rescheduling" },
          { status: 400 }
        );
      }
      updateData.scheduled_at = scheduled_at;
    } else {
      // Just updating notes
      if (isMentor && mentor_notes !== undefined) {
        updateData.mentor_notes = mentor_notes;
      }
      if (isMentee && mentee_notes !== undefined) {
        updateData.mentee_notes = mentee_notes;
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }
    }

    const { error } = await supabase
      .from("mentorship_sessions")
      .update(updateData)
      .eq("id", session_id);

    if (error) throw error;

    // Notify the other party for complete, cancel, or reschedule
    if (action) {
      const notifyEmail = isMentor ? session.mentee_email : (session as any).mentors.user_email;
      let notificationBody = "";

      if (action === "complete") {
        notificationBody = "Your mentorship session has been marked as complete";
      } else if (action === "cancel") {
        notificationBody = `A mentorship session has been cancelled${cancel_reason ? `: ${cancel_reason}` : ""}`;
      } else if (action === "reschedule") {
        notificationBody = `A session has been rescheduled to ${new Date(scheduled_at).toLocaleString()}`;
      }

      if (notificationBody) {
        await supabase.from("notifications").insert({
          user_email: notifyEmail,
          type: `mentorship_session_${action}`,
          actor_email: user_email,
          title: `Session ${action.charAt(0).toUpperCase() + action.slice(1)}d`,
          body: notificationBody,
          link: "/mentorship/my",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
