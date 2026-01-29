import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

// POST /api/events/[eventId]/rsvp - Create or update RSVP
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { eventId } = await params;

  try {
    const body = await request.json();
    const { user_email, status } = body;

    // Validate required fields
    if (!user_email || !status) {
      return NextResponse.json(
        { error: "User email and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["going", "interested", "not_going"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid RSVP status. Must be: going, interested, or not_going" },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, max_attendees, start_time")
      .eq("id", eventId)
      .single();

    if (eventError) {
      if (eventError.code === "PGRST116") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      throw eventError;
    }

    // Check if event has already passed
    if (new Date(event.start_time) < new Date()) {
      return NextResponse.json(
        { error: "Cannot RSVP to past events" },
        { status: 400 }
      );
    }

    // If status is 'going', check max attendees
    if (status === "going" && event.max_attendees) {
      const { count } = await supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "going")
        .neq("user_email", user_email);

      if (count !== null && count >= event.max_attendees) {
        return NextResponse.json(
          { error: "Event is at full capacity" },
          { status: 400 }
        );
      }
    }

    // Check for existing RSVP
    const { data: existingRsvp } = await supabase
      .from("event_rsvps")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_email", user_email)
      .single();

    let rsvp;
    if (existingRsvp) {
      // Update existing RSVP
      const { data, error } = await supabase
        .from("event_rsvps")
        .update({ status })
        .eq("event_id", eventId)
        .eq("user_email", user_email)
        .select()
        .single();

      if (error) throw error;
      rsvp = data;
    } else {
      // Create new RSVP
      const { data, error } = await supabase
        .from("event_rsvps")
        .insert({
          event_id: eventId,
          user_email,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      rsvp = data;
    }

    // Get updated counts
    const { count: attendeeCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going");

    const { count: interestedCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "interested");

    return NextResponse.json({
      success: true,
      rsvp,
      attendee_count: attendeeCount || 0,
      interested_count: interestedCount || 0,
    });
  } catch (error) {
    console.error("Error updating RSVP:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId]/rsvp - Remove RSVP
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { eventId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const user_email = searchParams.get("user_email");

    if (!user_email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Delete RSVP
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_email", user_email);

    if (error) throw error;

    // Get updated counts
    const { count: attendeeCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going");

    const { count: interestedCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "interested");

    return NextResponse.json({
      success: true,
      message: "RSVP removed",
      attendee_count: attendeeCount || 0,
      interested_count: interestedCount || 0,
    });
  } catch (error) {
    console.error("Error removing RSVP:", error);
    return NextResponse.json(
      { error: "Failed to remove RSVP" },
      { status: 500 }
    );
  }
}
