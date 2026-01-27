import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "Email, token, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid reset token
    const { data: resetData } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("email", email)
      .eq("token", hashedToken)
      .single();

    if (!resetData) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(resetData.expires) < new Date()) {
      // Delete expired token
      await supabase
        .from("password_reset_tokens")
        .delete()
        .eq("email", email);

      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from("user accounts")
      .update({ password_hash: hashedPassword })
      .eq("email", email);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Delete used reset token
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("email", email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
