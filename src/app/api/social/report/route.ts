import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// POST - Submit a report
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { reporter_email, reported_email, post_id, comment_id, report_type, description } = body;

    if (!reporter_email) {
      return NextResponse.json({ error: "Reporter email required" }, { status: 400 });
    }

    if (!report_type) {
      return NextResponse.json({ error: "Report type required" }, { status: 400 });
    }

    if (!reported_email && !post_id && !comment_id) {
      return NextResponse.json({ error: "Must report a user, post, or comment" }, { status: 400 });
    }

    const validTypes = ["spam", "harassment", "inappropriate", "fake", "other"];
    if (!validTypes.includes(report_type)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_email,
        reported_email: reported_email || null,
        post_id: post_id || null,
        comment_id: comment_id || null,
        report_type,
        description: description || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Report submitted. We'll review it shortly.",
      report: data
    });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

// GET - Get reports (admin only - for future use)
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ reports: data });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json({ error: "Failed to get reports" }, { status: 500 });
  }
}
