import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, feedback, email, page, userAgent, timestamp } = body;

    if (!feedback?.trim()) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    // Store in Supabase
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        type: type || "general",
        content: feedback.trim(),
        email: email || null,
        page: page || null,
        user_agent: userAgent || null,
        created_at: timestamp || new Date().toISOString(),
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save feedback:", error);
      // Still return success - we don't want to show error to user
      // In production, you might want to log this to an error service
      return NextResponse.json({ success: true, message: "Feedback received" });
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ success: true, message: "Feedback received" });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple admin endpoint to view feedback
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}
