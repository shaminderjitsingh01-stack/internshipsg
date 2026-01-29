import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Event {
  id: string;
  organizer_email: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  start_time: string;
  end_time: string | null;
  max_attendees: number | null;
  cover_image: string | null;
  is_public: boolean;
  created_at: string;
  attendee_count?: number;
  user_rsvp_status?: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/events - Get events list with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const event_type = searchParams.get("event_type") || "";
  const is_virtual = searchParams.get("is_virtual");
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const upcoming_only = searchParams.get("upcoming_only") !== "false";
  const organizer_email = searchParams.get("organizer_email");
  const user_email = searchParams.get("user_email");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort_by = searchParams.get("sort_by") || "start_time";
  const sort_order = searchParams.get("sort_order") || "asc";

  try {
    // Build query
    let query = supabase
      .from("events")
      .select("*", { count: "exact" });

    // Only show public events unless filtering by organizer
    if (!organizer_email) {
      query = query.eq("is_public", true);
    }

    // Apply filters
    if (organizer_email) {
      query = query.eq("organizer_email", organizer_email);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (event_type) {
      query = query.eq("event_type", event_type);
    }

    if (is_virtual === "true") {
      query = query.eq("is_virtual", true);
    } else if (is_virtual === "false") {
      query = query.eq("is_virtual", false);
    }

    if (upcoming_only) {
      query = query.gte("start_time", new Date().toISOString());
    }

    if (start_date) {
      query = query.gte("start_time", start_date);
    }

    if (end_date) {
      query = query.lte("start_time", end_date);
    }

    // Apply sorting
    const ascending = sort_order === "asc";
    query = query.order(sort_by, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: events, error, count } = await query;

    if (error) throw error;

    // Get attendee counts for all events
    const eventIds = (events || []).map((e) => e.id);
    let attendeeCounts: Record<string, number> = {};
    let userRsvps: Record<string, string> = {};

    if (eventIds.length > 0) {
      // Get counts of 'going' RSVPs
      const { data: rsvpCounts } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("status", "going");

      if (rsvpCounts) {
        rsvpCounts.forEach((rsvp) => {
          attendeeCounts[rsvp.event_id] = (attendeeCounts[rsvp.event_id] || 0) + 1;
        });
      }

      // Get user's RSVP status if user_email provided
      if (user_email) {
        const { data: userRsvpData } = await supabase
          .from("event_rsvps")
          .select("event_id, status")
          .in("event_id", eventIds)
          .eq("user_email", user_email);

        if (userRsvpData) {
          userRsvpData.forEach((rsvp) => {
            userRsvps[rsvp.event_id] = rsvp.status;
          });
        }
      }
    }

    // Add attendee counts and user RSVP status to events
    const eventsWithCounts = (events || []).map((event) => ({
      ...event,
      attendee_count: attendeeCounts[event.id] || 0,
      user_rsvp_status: userRsvps[event.id] || null,
    }));

    return NextResponse.json({
      events: eventsWithCounts,
      total: count || 0,
      page,
      limit,
    } as EventsResponse);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      organizer_email,
      title,
      description,
      event_type = "meetup",
      location,
      is_virtual = false,
      virtual_link,
      start_time,
      end_time,
      max_attendees,
      cover_image,
      is_public = true,
    } = body;

    // Validate required fields
    if (!organizer_email || !title || !start_time) {
      return NextResponse.json(
        { error: "Organizer email, title, and start time are required" },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ["meetup", "workshop", "webinar", "career_fair", "networking"];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    // Create the event
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        organizer_email,
        title,
        description,
        event_type,
        location,
        is_virtual,
        virtual_link,
        start_time,
        end_time,
        max_attendees,
        cover_image,
        is_public,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-RSVP the organizer as going
    await supabase
      .from("event_rsvps")
      .insert({
        event_id: event.id,
        user_email: organizer_email,
        status: "going",
      });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
