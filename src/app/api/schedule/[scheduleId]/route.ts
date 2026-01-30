import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ scheduleId: string }>;
}

// GET /api/schedule/[scheduleId] - Get single schedule details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { scheduleId } = await params;

  try {
    const { data: schedule, error } = await supabase
      .from("interview_schedules")
      .select("*")
      .eq("id", scheduleId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// PUT /api/schedule/[scheduleId] - Update a schedule
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { scheduleId } = await params;

  try {
    const body = await request.json();
    const userEmail = body.user_email;

    // First verify ownership
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("interview_schedules")
      .select("user_email")
      .eq("id", scheduleId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check if user owns the schedule
    if (existingSchedule.user_email !== userEmail) {
      return NextResponse.json(
        { error: "You don't have permission to update this schedule" },
        { status: 403 }
      );
    }

    // Update the schedule
    const {
      title,
      interview_type,
      company_name,
      job_title,
      scheduled_at,
      duration_minutes,
      notes,
      status,
      reminder_sent,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (interview_type !== undefined) {
      const validTypes = ["mock", "real", "coaching"];
      if (!validTypes.includes(interview_type)) {
        return NextResponse.json(
          { error: "Invalid interview type" },
          { status: 400 }
        );
      }
      updateData.interview_type = interview_type;
    }
    if (company_name !== undefined) updateData.company_name = company_name;
    if (job_title !== undefined) updateData.job_title = job_title;
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) {
      const validStatuses = ["scheduled", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (reminder_sent !== undefined) updateData.reminder_sent = reminder_sent;

    const { data: schedule, error } = await supabase
      .from("interview_schedules")
      .update(updateData)
      .eq("id", scheduleId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule/[scheduleId] - Delete a schedule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { scheduleId } = await params;

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
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("interview_schedules")
      .select("user_email")
      .eq("id", scheduleId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Check if user owns the schedule
    if (existingSchedule.user_email !== userEmail) {
      return NextResponse.json(
        { error: "You don't have permission to delete this schedule" },
        { status: 403 }
      );
    }

    // Delete the schedule
    const { error } = await supabase
      .from("interview_schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
