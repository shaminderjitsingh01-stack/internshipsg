import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface WaitlistEntry {
  email: string;
  company_name: string;
  contact_name?: string;
  role?: string;
  company_size?: string;
  message?: string;
  created_at?: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if email is a work email (not common personal email providers)
function isWorkEmail(email: string): boolean {
  const personalDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "mail.com",
    "protonmail.com",
    "aol.com",
    "live.com",
    "msn.com",
  ];
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? !personalDomains.includes(domain) : false;
}

// POST: Add to waitlist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, companyName, yourName, role, companySize, message } = body;

    // Validate required fields
    if (!email || !companyName) {
      return NextResponse.json(
        { error: "Email and company name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Warn about personal emails (but still allow)
    const isWork = isWorkEmail(email);

    if (!isSupabaseConfigured()) {
      // For demo/development, just log and return success
      console.log("Employer waitlist submission (no DB):", {
        email,
        companyName,
        yourName,
        role,
        companySize,
        message,
        isWorkEmail: isWork,
      });
      return NextResponse.json({
        success: true,
        message: "Added to waitlist",
        warning: !isWork ? "We recommend using a work email for faster verification" : undefined,
      });
    }

    // Check for duplicate email
    const { data: existingEntry } = await supabase
      .from("employer_waitlist")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    if (existingEntry) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 400 }
      );
    }

    // Insert into database
    const { error } = await supabase.from("employer_waitlist").insert({
      email: email.toLowerCase(),
      company_name: companyName,
      contact_name: yourName || null,
      role: role || null,
      company_size: companySize || null,
      message: message || null,
      is_work_email: isWork,
    });

    if (error) {
      console.error("Error adding to employer waitlist:", error);
      return NextResponse.json(
        { error: "Failed to join waitlist. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added to waitlist",
      warning: !isWork ? "We recommend using a work email for faster verification" : undefined,
    });
  } catch (error: any) {
    console.error("Employer waitlist error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

// GET: Get waitlist stats (for admin) or public stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";
    const getStats = searchParams.get("stats") === "true";

    // Public stats for the employer page
    if (getStats) {
      if (!isSupabaseConfigured()) {
        // Return demo stats
        return NextResponse.json({
          stats: {
            studentsCount: 1250,
            interviewsCount: 8400,
            avgStreakDays: 7,
          },
        });
      }

      // Get real stats from database
      const [usersResult, interviewsResult, streaksResult] = await Promise.all([
        supabase.from("user accounts").select("id", { count: "exact", head: true }),
        supabase.from("interviews").select("id", { count: "exact", head: true }),
        supabase.from("user accounts").select("current_streak"),
      ]);

      const studentsCount = usersResult.count || 0;
      const interviewsCount = interviewsResult.count || 0;

      // Calculate average streak
      let avgStreakDays = 0;
      if (streaksResult.data && streaksResult.data.length > 0) {
        const totalStreaks = streaksResult.data.reduce(
          (sum, user) => sum + (user.current_streak || 0),
          0
        );
        avgStreakDays = Math.round(totalStreaks / streaksResult.data.length);
      }

      return NextResponse.json({
        stats: {
          studentsCount: Math.max(studentsCount, 100), // Minimum display value
          interviewsCount: Math.max(interviewsCount, 500),
          avgStreakDays: Math.max(avgStreakDays, 3),
        },
      });
    }

    // Admin endpoint - list all waitlist entries
    if (isAdmin) {
      // TODO: Add proper admin authentication
      const adminKey = searchParams.get("key");
      if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (!isSupabaseConfigured()) {
        return NextResponse.json({
          waitlist: [],
          count: 0,
        });
      }

      const { data: waitlist, error, count } = await supabase
        .from("employer_waitlist")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching waitlist:", error);
        return NextResponse.json(
          { error: "Failed to fetch waitlist" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        waitlist: waitlist || [],
        count: count || 0,
      });
    }

    // Default: return waitlist count only
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ count: 0 });
    }

    const { count } = await supabase
      .from("employer_waitlist")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({ count: count || 0 });
  } catch (error: any) {
    console.error("Employer waitlist GET error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
