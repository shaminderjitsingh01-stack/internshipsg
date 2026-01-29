import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FEEDBACK_EMAIL = "hello@shaminder.sg";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, feedback, email, page, userAgent, timestamp } = body;

    if (!feedback?.trim()) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    const db = getSupabase();
    let data = null;
    let error = null;

    // Store in Supabase if configured
    if (db) {
      const result = await db
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
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Failed to save feedback:", error);
    }

    // Send email notification
    if (resend) {
      try {
        const typeEmoji = type === "bug" ? "🐛" : type === "feature" ? "💡" : "💬";
        await resend.emails.send({
          from: "Internship.sg <feedback@internship.sg>",
          to: FEEDBACK_EMAIL,
          subject: `${typeEmoji} New ${type || "general"} feedback from Internship.sg`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">New Feedback Received</h2>
              <p><strong>Type:</strong> ${typeEmoji} ${type || "general"}</p>
              <p><strong>Page:</strong> ${page || "Unknown"}</p>
              <p><strong>User Email:</strong> ${email || "Not provided"}</p>
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${feedback}</p>
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #64748b; font-size: 12px;">
                Submitted at: ${timestamp || new Date().toISOString()}<br />
                User Agent: ${userAgent || "Unknown"}
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send feedback email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ success: true, message: "Feedback received" });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getSupabase();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Simple admin endpoint to view feedback
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = db
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
