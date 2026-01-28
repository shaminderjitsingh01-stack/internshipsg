import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // Check admin access
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const school = searchParams.get("school") || "";
  const tier = searchParams.get("tier") || "";
  const activity = searchParams.get("activity") || "";
  const offset = (page - 1) * limit;

  try {
    // Build base query
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Apply tier filter
    if (tier) {
      query = query.eq("subscription_tier", tier);
    }

    // Apply school filter (by email domain)
    if (school) {
      const schoolDomains: Record<string, string[]> = {
        NUS: ["nus.edu.sg", "u.nus.edu"],
        NTU: ["ntu.edu.sg", "e.ntu.edu.sg"],
        SMU: ["smu.edu.sg"],
        SUTD: ["sutd.edu.sg"],
        SIT: ["sit.edu.sg"],
        SUSS: ["suss.edu.sg"],
        Polytechnic: ["sp.edu.sg", "np.edu.sg", "tp.edu.sg", "rp.edu.sg", "nyp.edu.sg"],
      };

      const domains = schoolDomains[school];
      if (domains && domains.length > 0) {
        const orConditions = domains.map((d) => `email.ilike.%@${d}`).join(",");
        query = query.or(orConditions);
      } else if (school === "Other") {
        // Exclude all known school domains
        const allDomains = Object.values(schoolDomains).flat();
        for (const domain of allDomains) {
          query = query.not("email", "ilike", `%@${domain}`);
        }
      }
    }

    // Apply activity filter
    if (activity) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (activity) {
        case "active_today":
          query = query.gte("last_login_at", today.toISOString());
          break;
        case "active_week":
          query = query.gte("last_login_at", weekAgo.toISOString());
          break;
        case "active_month":
          query = query.gte("last_login_at", monthAgo.toISOString());
          break;
        case "inactive":
          query = query.lt("last_login_at", monthAgo.toISOString());
          break;
        case "never":
          query = query.is("last_login_at", null);
          break;
      }
    }

    const { data: users, count, error: usersError } = await query;

    if (usersError) throw usersError;

    // Get interview counts for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { count: interviewCount } = await supabase
          .from("interviews")
          .select("*", { count: "exact", head: true })
          .eq("user_email", user.email);

        const { data: lastInterview } = await supabase
          .from("interviews")
          .select("created_at, score")
          .eq("user_email", user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { data: avgScore } = await supabase
          .from("interviews")
          .select("score")
          .eq("user_email", user.email)
          .not("score", "is", null);

        const averageScore = avgScore && avgScore.length > 0
          ? avgScore.reduce((acc, i) => acc + (i.score || 0), 0) / avgScore.length
          : null;

        // Get school from email domain
        const school = getSchoolFromEmail(user.email);

        return {
          ...user,
          school,
          interview_count: interviewCount || 0,
          last_interview_at: lastInterview?.created_at || null,
          last_score: lastInterview?.score || null,
          average_score: averageScore ? Math.round(averageScore * 10) / 10 : null,
          current_streak: user.current_streak || 0,
          total_xp: user.total_xp || 0,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

function getSchoolFromEmail(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  const schoolMap: Record<string, string> = {
    "nus.edu.sg": "NUS",
    "u.nus.edu": "NUS",
    "ntu.edu.sg": "NTU",
    "e.ntu.edu.sg": "NTU",
    "smu.edu.sg": "SMU",
    "sutd.edu.sg": "SUTD",
    "sit.edu.sg": "SIT",
    "suss.edu.sg": "SUSS",
    "sp.edu.sg": "Singapore Poly",
    "np.edu.sg": "Ngee Ann Poly",
    "tp.edu.sg": "Temasek Poly",
    "rp.edu.sg": "Republic Poly",
    "nyp.edu.sg": "Nanyang Poly",
  };

  for (const [key, value] of Object.entries(schoolMap)) {
    if (domain.includes(key)) return value;
  }
  return null;
}
