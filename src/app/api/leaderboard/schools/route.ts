import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface SchoolRanking {
  rank: number;
  school: string;
  school_full_name: string;
  total_students: number;
  average_score: number;
  total_xp: number;
  top_student: {
    name: string;
    username: string;
    xp_points: number;
  } | null;
}

const SCHOOL_NAMES: Record<string, string> = {
  NUS: "National University of Singapore",
  NTU: "Nanyang Technological University",
  SMU: "Singapore Management University",
  SUTD: "Singapore University of Technology and Design",
  SIT: "Singapore Institute of Technology",
  SUSS: "Singapore University of Social Sciences",
  SP: "Singapore Polytechnic",
  NP: "Ngee Ann Polytechnic",
  TP: "Temasek Polytechnic",
  RP: "Republic Polytechnic",
  NYP: "Nanyang Polytechnic",
  OTHER: "Other Institutions",
};

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const timePeriod = searchParams.get("time_period") || "all";

  try {
    // Get all public users with school info
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .eq("is_public", true)
      .not("school", "is", null);

    if (usersError) throw usersError;

    // Get all user emails
    const userEmails = (users || []).map(u => u.email);

    // Get streak data
    const { data: streaks } = await supabase
      .from("streaks")
      .select("*")
      .in("user_email", userEmails);

    // Get interview scores
    let interviewQuery = supabase
      .from("interviews")
      .select("user_email, score, created_at")
      .in("user_email", userEmails)
      .not("score", "is", null);

    // Apply time filter
    if (timePeriod === "month") {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      interviewQuery = interviewQuery.gte("created_at", startDate.toISOString());
    } else if (timePeriod === "week") {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      interviewQuery = interviewQuery.gte("created_at", startDate.toISOString());
    }

    const { data: interviews } = await interviewQuery;

    // Group users by school
    const schoolGroups: Record<string, typeof users> = {};
    (users || []).forEach(user => {
      const school = user.school || "OTHER";
      if (!schoolGroups[school]) {
        schoolGroups[school] = [];
      }
      schoolGroups[school].push(user);
    });

    // Calculate stats for each school
    const schoolStats: SchoolRanking[] = Object.entries(schoolGroups).map(([school, schoolUsers]) => {
      const studentEmails = schoolUsers.map(u => u.email);

      // Calculate average interview score for the school
      const schoolInterviews = (interviews || []).filter(i => studentEmails.includes(i.user_email));
      const avgScore = schoolInterviews.length > 0
        ? schoolInterviews.reduce((acc, i) => acc + (i.score || 0), 0) / schoolInterviews.length
        : 0;

      // Calculate total XP
      const totalXP = schoolUsers.reduce((acc, u) => acc + (u.xp_points || 0), 0);

      // Find top student by XP
      const topStudentData = schoolUsers.reduce((top, user) => {
        if (!top || (user.xp_points || 0) > (top.xp_points || 0)) {
          return user;
        }
        return top;
      }, null as typeof schoolUsers[0] | null);

      const topStudent = topStudentData ? {
        name: topStudentData.name || "Anonymous",
        username: topStudentData.username || topStudentData.email.split("@")[0],
        xp_points: topStudentData.xp_points || 0,
      } : null;

      return {
        rank: 0, // Will be set after sorting
        school,
        school_full_name: SCHOOL_NAMES[school] || school,
        total_students: schoolUsers.length,
        average_score: Math.round(avgScore * 10) / 10,
        total_xp: totalXP,
        top_student: topStudent,
      };
    });

    // Sort by total XP (can be changed to average_score if preferred)
    schoolStats.sort((a, b) => b.total_xp - a.total_xp);

    // Apply rankings
    schoolStats.forEach((school, index) => {
      school.rank = index + 1;
    });

    return NextResponse.json({
      schools: schoolStats,
      total: schoolStats.length,
    });
  } catch (error) {
    console.error("Error fetching school rankings:", error);
    return NextResponse.json({ error: "Failed to fetch school rankings" }, { status: 500 });
  }
}
