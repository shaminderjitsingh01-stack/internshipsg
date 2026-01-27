import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, password_hash")
      .eq("email", email)
      .single();

    if (existingUser) {
      // If user exists but has no password (Google user), allow setting password
      if (!existingUser.password_hash) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase
          .from("users")
          .update({
            password_hash: hashedPassword,
            name: name || undefined,
          })
          .eq("email", email);

        return NextResponse.json({ success: true, message: "Password set successfully" });
      }

      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const { error } = await supabase.from("users").insert({
      email,
      name: name || email.split("@")[0],
      password_hash: hashedPassword,
      auth_provider: "credentials",
      role: "user",
      subscription_tier: "free",
    });

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
