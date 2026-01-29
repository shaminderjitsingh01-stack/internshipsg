import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

// GET /api/events/[eventId] - Get single event details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const user_email = searchParams.get("user_email");

  try {
    // Get event details
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      throw error;
    }

    // Get attendee count (going only)
    const { count: attendeeCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going");

    // Get interested count
    const { count: interestedCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "interested");

    // Get attendees list (going)
    const { data: attendees } = await supabase
      .from("event_rsvps")
      .select("user_email, status, created_at")
      .eq("event_id", eventId)
      .eq("status", "going")
      .order("created_at", { ascending: true })
      .limit(50);

    // Get user's RSVP status
    let userRsvpStatus = null;
    if (user_email) {
      const { data: userRsvp } = await supabase
        .from("event_rsvps")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_email", user_email)
        .single();

      userRsvpStatus = userRsvp?.status || null;
    }

    return NextResponse.json({
      event: {
        ...event,
        attendee_count: attendeeCount || 0,
        interested_count: interestedCount || 0,
        attendees: attendees || [],
        user_rsvp_status: userRsvpStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[eventId] - Update an event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { eventId } = await params;

  try {
    const body = await request.json();
    const userEmail = body.user_email;

    // First verify ownership
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", eventId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check if user owns the event
    if (existingEvent.organizer_email !== userEmail) {
      return NextResponse.json(
        { error: "You don't have permission to update this event" },
        { status: 403 }
      );
    }

    // Update the event
    const {
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
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (event_type !== undefined) updateData.event_type = event_type;
    if (location !== undefined) updateData.location = location;
    if (is_virtual !== undefined) updateData.is_virtual = is_virtual;
    if (virtual_link !== undefined) updateData.virtual_link = virtual_link;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (max_attendees !== undefined) updateData.max_attendees = max_attendees;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (is_public !== undefined) updateData.is_public = is_public;

    const { data: event, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId] - Delete an event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { eventId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("user_email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // First verify ownership
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", eventId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check if user owns the event
    if (existingEvent.organizer_email !== userEmail) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    // Delete the event (cascades to RSVPs)
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
