import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface BenchmarkData {
  overall: {
    averageScore: number;
    averageStreak: number;
    averageXP: number;
    totalUsers: number;
  };
  bySchool: {
    school: string;
    schoolFullName: string;
    averageScore: number;
    averageStreak: number;
    averageXP: number;
    totalStudents: number;
  }[];
  userPercentiles: {
    scorePercentile: number;
    streakPercentile: number;
    xpPercentile: number;
    overallPercentile: number;
    schoolRank: number;
    schoolTotal: number;
  } | null;
  skillBreakdown: {
    communication: number;
    technical: number;
    consistency: number;
    activity: number;
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

// Calculate percentile rank
function calculatePercentile(userValue: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  const sorted = [...allValues].sort((a, b) => a - b);
  const belowCount = sorted.filter(v => v < userValue).length;
  return Math.round((belowCount / sorted.length) * 100);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("email");

  try {
    // Get all public users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .eq("is_public", true);

    if (usersError) throw usersError;

    const allUsers = users || [];
    const userEmails = allUsers.map(u => u.email);

    // Get streak data for all users
    const { data: streaks } = await supabase
      .from("streaks")
      .select("*")
      .in("user_email", userEmails);

    // Get interview scores for all users
    const { data: interviews } = await supabase
      .from("interviews")
      .select("user_email, score, feedback, created_at")
      .in("user_email", userEmails)
      .not("score", "is", null);

    // Calculate user statistics
    const userStats = allUsers.map(user => {
      const userStreak = streaks?.find(s => s.user_email === user.email);
      const userInterviews = (interviews || []).filter(i => i.user_email === user.email);

      const avgScore = userInterviews.length > 0
        ? userInterviews.reduce((acc, i) => acc + (i.score || 0), 0) / userInterviews.length
        : 0;

      return {
        email: user.email,
        school: user.school || "OTHER",
        avgScore,
        longestStreak: userStreak?.longest_streak || 0,
        currentStreak: userStreak?.current_streak || 0,
        xpPoints: user.xp_points || 0,
        interviewCount: userInterviews.length,
      };
    });

    // Calculate overall averages
    const totalUsers = userStats.length;
    const averageScore = totalUsers > 0
      ? userStats.reduce((acc, u) => acc + u.avgScore, 0) / totalUsers
      : 0;
    const averageStreak = totalUsers > 0
      ? userStats.reduce((acc, u) => acc + u.longestStreak, 0) / totalUsers
      : 0;
    const averageXP = totalUsers > 0
      ? userStats.reduce((acc, u) => acc + u.xpPoints, 0) / totalUsers
      : 0;

    // Calculate school-level stats
    const schoolGroups: Record<string, typeof userStats> = {};
    userStats.forEach(user => {
      if (!schoolGroups[user.school]) {
        schoolGroups[user.school] = [];
      }
      schoolGroups[user.school].push(user);
    });

    const bySchool = Object.entries(schoolGroups).map(([school, students]) => ({
      school,
      schoolFullName: SCHOOL_NAMES[school] || school,
      averageScore: students.length > 0
        ? students.reduce((acc, s) => acc + s.avgScore, 0) / students.length
        : 0,
      averageStreak: students.length > 0
        ? students.reduce((acc, s) => acc + s.longestStreak, 0) / students.length
        : 0,
      averageXP: students.length > 0
        ? students.reduce((acc, s) => acc + s.xpPoints, 0) / students.length
        : 0,
      totalStudents: students.length,
    })).sort((a, b) => b.averageXP - a.averageXP);

    // Calculate user-specific percentiles if email provided
    let userPercentiles = null;
    let skillBreakdown = null;

    if (userEmail) {
      // Get current user data (even if private)
      const { data: currentUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (currentUser) {
        const { data: currentUserStreak } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_email", userEmail)
          .single();

        const { data: currentUserInterviews } = await supabase
          .from("interviews")
          .select("score, feedback")
          .eq("user_email", userEmail)
          .not("score", "is", null);

        const userAvgScore = currentUserInterviews && currentUserInterviews.length > 0
          ? currentUserInterviews.reduce((acc, i) => acc + (i.score || 0), 0) / currentUserInterviews.length
          : 0;
        const userStreak = currentUserStreak?.longest_streak || 0;
        const userXP = currentUser.xp_points || 0;
        const userSchool = currentUser.school || "OTHER";

        // Calculate percentiles
        const allScores = userStats.map(u => u.avgScore);
        const allStreaks = userStats.map(u => u.longestStreak);
        const allXP = userStats.map(u => u.xpPoints);

        const scorePercentile = calculatePercentile(userAvgScore, allScores);
        const streakPercentile = calculatePercentile(userStreak, allStreaks);
        const xpPercentile = calculatePercentile(userXP, allXP);
        const overallPercentile = Math.round((scorePercentile + streakPercentile + xpPercentile) / 3);

        // Calculate school rank
        const schoolStudents = schoolGroups[userSchool] || [];
        const schoolRanked = [...schoolStudents].sort((a, b) => b.xpPoints - a.xpPoints);
        const schoolRank = schoolRanked.findIndex(s => s.email === userEmail) + 1;

        userPercentiles = {
          scorePercentile,
          streakPercentile,
          xpPercentile,
          overallPercentile,
          schoolRank: schoolRank > 0 ? schoolRank : schoolStudents.length + 1,
          schoolTotal: schoolStudents.length || 1,
        };

        // Calculate skill breakdown from interview feedback (simulated analysis)
        // In production, this would analyze actual feedback using AI
        const interviewCount = currentUserInterviews?.length || 0;
        const currentStreakValue = currentUserStreak?.current_streak || 0;

        // Communication: Based on interview scores (higher scores = better communication)
        const communicationScore = Math.min(100, userAvgScore * 10 + (interviewCount * 2));

        // Technical: Based on average score weighted by interview count
        const technicalScore = Math.min(100, (userAvgScore * 8) + Math.min(interviewCount * 3, 20));

        // Consistency: Based on streak
        const consistencyScore = Math.min(100, (currentStreakValue * 8) + (userStreak * 3));

        // Activity: Based on XP and interview count
        const activityScore = Math.min(100, (userXP / 50) + (interviewCount * 5));

        skillBreakdown = {
          communication: Math.round(communicationScore),
          technical: Math.round(technicalScore),
          consistency: Math.round(consistencyScore),
          activity: Math.round(activityScore),
        };
      }
    }

    const response: BenchmarkData = {
      overall: {
        averageScore: Math.round(averageScore * 10) / 10,
        averageStreak: Math.round(averageStreak * 10) / 10,
        averageXP: Math.round(averageXP),
        totalUsers,
      },
      bySchool,
      userPercentiles,
      skillBreakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching benchmarks:", error);
    return NextResponse.json({ error: "Failed to fetch benchmarks" }, { status: 500 });
  }
}
