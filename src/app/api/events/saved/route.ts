import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/events/saved - Get user's saved (interested) events
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("user_email");

  if (!userEmail) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    // Get user's RSVPs with status "interested" or "going"
    const { data: rsvps, error: rsvpsError } = await supabase
      .from("event_rsvps")
      .select("event_id, status, created_at")
      .eq("user_email", userEmail)
      .in("status", ["interested", "going"])
      .order("created_at", { ascending: false });

    if (rsvpsError) throw rsvpsError;

    if (!rsvps || rsvps.length === 0) {
      return NextResponse.json({ events: [], total: 0 });
    }

    const eventIds = rsvps.map((r) => r.event_id);

    // Get events details
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .in("id", eventIds);

    if (eventsError) throw eventsError;

    // Create a map of RSVP status and saved_at timestamp
    const rsvpMap = new Map(
      rsvps.map((r) => [r.event_id, { status: r.status, saved_at: r.created_at }])
    );

    // Get attendee counts for all events
    const attendeeCounts: Record<string, number> = {};
    if (eventIds.length > 0) {
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
    }

    // Enrich events with saved_at timestamp, RSVP status, and attendee count
    const enrichedEvents = (events || [])
      .map((event) => ({
        ...event,
        saved_at: rsvpMap.get(event.id)?.saved_at,
        user_rsvp_status: rsvpMap.get(event.id)?.status,
        attendee_count: attendeeCounts[event.id] || 0,
      }))
      .sort((a, b) => {
        // Sort by saved_at descending
        const timeA = a.saved_at || "";
        const timeB = b.saved_at || "";
        return timeB.localeCompare(timeA);
      });

    return NextResponse.json({
      events: enrichedEvents,
      total: enrichedEvents.length,
    });
  } catch (error) {
    console.error("Error fetching saved events:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved events" },
      { status: 500 }
    );
  }
}
