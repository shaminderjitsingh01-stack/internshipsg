import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// Save interview record
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }
    const body = await request.json();
    const {
      userEmail,
      userName,
      targetRole,
      videoUrl,
      transcript,
      score,
      feedback
    } = body;

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        user_email: userEmail,
        user_name: userName,
        target_role: targetRole,
        video_url: videoUrl,
        transcript: JSON.stringify(transcript),
        score: score,
        feedback: feedback,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ interview: data, success: true });
  } catch (error) {
    console.error("Save interview error:", error);
    return NextResponse.json(
      { error: "Failed to save interview" },
      { status: 500 }
    );
  }
}

// Get user's interviews
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ interviews: data });
  } catch (error) {
    console.error("Get interviews error:", error);
    return NextResponse.json(
      { error: "Failed to get interviews" },
      { status: 500 }
    );
  }
}
