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
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "hello@shaminder.sg";
const FROM_EMAIL = process.env.EMAIL_FROM || "Internship.sg <support@internship.sg>";
const BASE_URL = process.env.NEXTAUTH_URL || "https://internship.sg";

// Email template for support confirmation to user
function generateUserConfirmationEmail(name: string, subject: string, ticketId: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #f8fafc;">
        <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">Internship.sg</h1>
            <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">Help & Support</p>
          </div>
          <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px;">We've received your request</h2>
            <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
              Hey ${name},
            </p>
            <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
              Thank you for contacting Internship.sg support. We've received your message and our team will get back to you within <strong>24-48 hours</strong>.
            </p>
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase;">Ticket Reference</p>
              <p style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">${ticketId}</p>
              <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Subject</p>
              <p style="color: #1e293b; margin: 0; font-size: 14px;">${subject}</p>
            </div>
            <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px;">
              Please save this ticket reference for future correspondence.
            </p>
            <div style="text-align: center; margin-top: 32px;">
              <a href="${BASE_URL}/help" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Visit Help Center
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 32px; padding: 0 20px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              You're receiving this email because you submitted a support request.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Email template for support team notification
function generateSupportNotificationEmail(
  ticketId: string,
  name: string,
  email: string,
  subject: string,
  message: string,
  timestamp: string,
  userAgent?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
              <h2 style="color: #dc2626; margin: 0 0 8px 0; font-size: 20px;">New Support Ticket</h2>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Ticket ID: <strong>${ticketId}</strong></p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">From:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;"><strong>${name}</strong> &lt;${email}&gt;</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subject:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;"><strong>${subject}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${new Date(timestamp).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</td>
              </tr>
            </table>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase;">Message</p>
              <p style="color: #1e293b; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            ${userAgent ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; margin: 0; font-size: 11px;">
                <strong>User Agent:</strong> ${userAgent}
              </p>
            </div>
            ` : ""}
            <div style="margin-top: 24px;">
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)} [${ticketId}]" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Reply to Ticket
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Generate a unique ticket ID
function generateTicketId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ISG-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, timestamp, userAgent } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const ticketId = generateTicketId();
    const db = getSupabase();
    let ticketData = null;
    let dbError = null;

    // Store in Supabase if configured
    if (db) {
      const result = await db
        .from("support_tickets")
        .insert({
          id: ticketId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim(),
          user_agent: userAgent || null,
          status: "open",
          created_at: timestamp || new Date().toISOString(),
        })
        .select()
        .single();

      ticketData = result.data;
      dbError = result.error;

      if (dbError) {
        console.error("Failed to save support ticket:", dbError);
        // Continue anyway - we'll still send emails
      }
    }

    // Send email notifications
    if (resend) {
      try {
        // Send confirmation to user
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email.trim(),
          subject: `Support Request Received - ${ticketId}`,
          html: generateUserConfirmationEmail(name, subject, ticketId),
        });
      } catch (emailError) {
        console.error("Failed to send user confirmation email:", emailError);
        // Don't fail the request if user email fails
      }

      try {
        // Send notification to support team
        await resend.emails.send({
          from: FROM_EMAIL,
          to: SUPPORT_EMAIL,
          replyTo: email.trim(),
          subject: `[${ticketId}] New Support Ticket: ${subject}`,
          html: generateSupportNotificationEmail(
            ticketId,
            name,
            email,
            subject,
            message,
            timestamp || new Date().toISOString(),
            userAgent
          ),
        });
      } catch (emailError) {
        console.error("Failed to send support notification email:", emailError);
        // Don't fail the request if support email fails
      }
    }

    return NextResponse.json({
      success: true,
      ticketId,
      ticket: ticketData,
      message: "Support ticket submitted successfully",
    });
  } catch (error) {
    console.error("Support ticket error:", error);
    return NextResponse.json(
      { error: "Failed to submit support ticket" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tickets (admin use)
export async function GET(request: NextRequest) {
  try {
    const db = getSupabase();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = db
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (email) {
      query = query.eq("email", email.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: data });
  } catch (error) {
    console.error("Failed to fetch support tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// PATCH endpoint to update ticket status
export async function PATCH(request: NextRequest) {
  try {
    const db = getSupabase();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { ticketId, status, notes } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await db
      .from("support_tickets")
      .update(updateData)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (error) {
    console.error("Failed to update support ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
