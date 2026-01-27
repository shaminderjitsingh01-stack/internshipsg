import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check if user exists
    const { data: user } = await supabase
      .from("user accounts")
      .select("id, email, name")
      .eq("email", email)
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token
    await supabase.from("password_reset_tokens").upsert({
      email,
      token: hashedToken,
      expires: expires.toISOString(),
    });

    // Send reset email
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resetUrl = `${process.env.NEXTAUTH_URL || "https://internship.sg"}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Internship.sg <noreply@internship.sg>",
        to: email,
        subject: "Reset your Internship.sg password",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 24px;">Internship.sg</h1>
              <p style="color: #64748b; margin-top: 8px;">AI-Powered Interview Prep</p>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Reset your password</h2>
              <p style="color: #64748b; margin: 0 0 24px 0;">Click the button below to reset your password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
}
