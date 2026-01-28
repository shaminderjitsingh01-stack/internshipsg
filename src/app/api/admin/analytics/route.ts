import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  // Check admin access
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    // Return mock data for development
    return NextResponse.json(getMockAnalytics());
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel
    const [
      totalUsersResult,
      totalInterviewsResult,
      recentUsersResult,
      recentInterviewsResult,
      scoreDataResult,
      dailyActiveResult,
      companyStatsResult,
      schoolStatsResult,
      authProviderStatsResult,
      retentionDataResult,
    ] = await Promise.all([
      // Total users
      supabase.from("users").select("*", { count: "exact", head: true }),

      // Total interviews
      supabase.from("interviews").select("*", { count: "exact", head: true }),

      // User growth over last 30 days
      supabase
        .from("users")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true }),

      // Interview growth over last 30 days
      supabase
        .from("interviews")
        .select("created_at, score")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true }),

      // Score data for averages
      supabase
        .from("interviews")
        .select("score, created_at")
        .not("score", "is", null)
        .gte("created_at", thirtyDaysAgo.toISOString()),

      // Daily active users (users with activity in last 7 days)
      supabase
        .from("interviews")
        .select("user_email, created_at")
        .gte("created_at", sevenDaysAgo.toISOString()),

      // Popular companies/roles
      supabase
        .from("interviews")
        .select("target_role")
        .not("target_role", "is", null),

      // School distribution (from user emails)
      supabase
        .from("users")
        .select("email"),

      // Sign-up sources (auth providers)
      supabase
        .from("users")
        .select("auth_provider"),

      // Retention data (users who came back within 7 days)
      supabase
        .from("users")
        .select("email, created_at, last_login_at")
        .not("last_login_at", "is", null),
    ]);

    // Process user growth chart data
    const userGrowthData = processGrowthData(recentUsersResult.data || [], thirtyDaysAgo, today);

    // Process interview growth chart data
    const interviewGrowthData = processGrowthData(recentInterviewsResult.data || [], thirtyDaysAgo, today);

    // Calculate average scores over time
    const averageScoresData = processScoreData(scoreDataResult.data || [], thirtyDaysAgo, today);

    // Calculate daily active users
    const dailyActiveUsers = calculateDailyActiveUsers(dailyActiveResult.data || [], sevenDaysAgo, today);

    // Calculate overall average score
    const avgScore = scoreDataResult.data && scoreDataResult.data.length > 0
      ? scoreDataResult.data.reduce((acc, i) => acc + (i.score || 0), 0) / scoreDataResult.data.length
      : 0;

    // Calculate popular companies/roles
    const popularCompanies = calculatePopularItems(companyStatsResult.data || [], "target_role");

    // Calculate school distribution
    const schoolDistribution = calculateSchoolDistribution(schoolStatsResult.data || []);

    // Calculate sign-up sources
    const signUpSources = calculateSignUpSources(authProviderStatsResult.data || []);

    // Calculate retention metrics
    const retentionMetrics = calculateRetention(retentionDataResult.data || []);

    return NextResponse.json({
      overview: {
        totalUsers: totalUsersResult.count || 0,
        totalInterviews: totalInterviewsResult.count || 0,
        averageScore: Math.round(avgScore * 10) / 10,
        dailyActiveUsers: dailyActiveUsers.todayCount,
      },
      userGrowth: userGrowthData,
      interviewGrowth: interviewGrowthData,
      averageScores: averageScoresData,
      dailyActiveUsers: dailyActiveUsers.data,
      popularCompanies,
      schoolDistribution,
      signUpSources,
      retentionMetrics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

function processGrowthData(data: any[], startDate: Date, endDate: Date) {
  const result: { date: string; count: number }[] = [];
  let cumulativeCount = 0;

  // Create a map of dates to counts
  const dateCountMap: Record<string, number> = {};
  data.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split("T")[0];
    dateCountMap[date] = (dateCountMap[date] || 0) + 1;
  });

  // Fill in all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dailyCount = dateCountMap[dateStr] || 0;
    cumulativeCount += dailyCount;
    result.push({
      date: dateStr,
      count: cumulativeCount,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

function processScoreData(data: any[], startDate: Date, endDate: Date) {
  const result: { date: string; avgScore: number }[] = [];

  // Group scores by date
  const dateScoresMap: Record<string, number[]> = {};
  data.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split("T")[0];
    if (!dateScoresMap[date]) dateScoresMap[date] = [];
    dateScoresMap[date].push(item.score);
  });

  // Fill in all dates with weekly averages
  const currentDate = new Date(startDate);
  const weekScores: number[] = [];

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dailyScores = dateScoresMap[dateStr] || [];
    weekScores.push(...dailyScores);

    // Keep only last 7 days of scores
    if (weekScores.length > 100) weekScores.splice(0, weekScores.length - 100);

    const avgScore = weekScores.length > 0
      ? weekScores.reduce((a, b) => a + b, 0) / weekScores.length
      : 0;

    result.push({
      date: dateStr,
      avgScore: Math.round(avgScore * 10) / 10,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

function calculateDailyActiveUsers(data: any[], startDate: Date, endDate: Date) {
  const result: { date: string; count: number }[] = [];

  // Group unique users by date
  const dateUsersMap: Record<string, Set<string>> = {};
  data.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split("T")[0];
    if (!dateUsersMap[date]) dateUsersMap[date] = new Set();
    dateUsersMap[date].add(item.user_email);
  });

  const currentDate = new Date(startDate);
  let todayCount = 0;
  const todayStr = endDate.toISOString().split("T")[0];

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const count = dateUsersMap[dateStr]?.size || 0;
    result.push({ date: dateStr, count });
    if (dateStr === todayStr) todayCount = count;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { data: result, todayCount };
}

function calculatePopularItems(data: any[], field: string) {
  const countMap: Record<string, number> = {};
  data.forEach((item) => {
    const value = item[field];
    if (value) {
      countMap[value] = (countMap[value] || 0) + 1;
    }
  });

  return Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateSchoolDistribution(data: any[]) {
  const schoolDomains: Record<string, string> = {
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

  const countMap: Record<string, number> = { "Other": 0 };

  data.forEach((item) => {
    const email = item.email?.toLowerCase() || "";
    const domain = email.split("@")[1];
    let matched = false;

    for (const [schoolDomain, schoolName] of Object.entries(schoolDomains)) {
      if (domain?.includes(schoolDomain)) {
        countMap[schoolName] = (countMap[schoolName] || 0) + 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      countMap["Other"]++;
    }
  });

  return Object.entries(countMap)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function calculateSignUpSources(data: any[]) {
  const countMap: Record<string, number> = {};

  data.forEach((item) => {
    const provider = item.auth_provider || "credentials";
    countMap[provider] = (countMap[provider] || 0) + 1;
  });

  const providerLabels: Record<string, string> = {
    google: "Google",
    credentials: "Email/Password",
    github: "GitHub",
    linkedin: "LinkedIn",
  };

  return Object.entries(countMap)
    .map(([name, count]) => ({
      name: providerLabels[name] || name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function calculateRetention(data: any[]) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let weekRetention = 0;
  let monthRetention = 0;
  let weekTotal = 0;
  let monthTotal = 0;

  data.forEach((user) => {
    const createdAt = new Date(user.created_at);
    const lastLogin = new Date(user.last_login_at);
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation >= 7) {
      weekTotal++;
      if (lastLogin >= sevenDaysAgo) weekRetention++;
    }

    if (daysSinceCreation >= 30) {
      monthTotal++;
      if (lastLogin >= thirtyDaysAgo) monthRetention++;
    }
  });

  return {
    weeklyRetention: weekTotal > 0 ? Math.round((weekRetention / weekTotal) * 100) : 0,
    monthlyRetention: monthTotal > 0 ? Math.round((monthRetention / monthTotal) * 100) : 0,
    totalActiveUsers: data.filter((u) => new Date(u.last_login_at) >= sevenDaysAgo).length,
  };
}

function getMockAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Generate mock growth data
  const userGrowth = [];
  const interviewGrowth = [];
  const averageScores = [];
  const dailyActiveUsers = [];

  let userCount = 100;
  let interviewCount = 500;

  for (let i = 0; i <= 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];

    userCount += Math.floor(Math.random() * 10) + 2;
    interviewCount += Math.floor(Math.random() * 30) + 10;

    userGrowth.push({ date: dateStr, count: userCount });
    interviewGrowth.push({ date: dateStr, count: interviewCount });
    averageScores.push({ date: dateStr, avgScore: 6 + Math.random() * 2 });
    dailyActiveUsers.push({ date: dateStr, count: Math.floor(Math.random() * 50) + 20 });
  }

  return {
    overview: {
      totalUsers: userCount,
      totalInterviews: interviewCount,
      averageScore: 7.2,
      dailyActiveUsers: 45,
    },
    userGrowth,
    interviewGrowth,
    averageScores,
    dailyActiveUsers,
    popularCompanies: [
      { name: "Software Engineer", count: 120 },
      { name: "Data Analyst", count: 85 },
      { name: "Product Manager", count: 62 },
      { name: "Marketing", count: 45 },
      { name: "Consulting", count: 38 },
      { name: "Finance", count: 32 },
      { name: "Business Analyst", count: 28 },
      { name: "UX Designer", count: 24 },
    ],
    schoolDistribution: [
      { name: "NUS", count: 85 },
      { name: "NTU", count: 72 },
      { name: "SMU", count: 45 },
      { name: "SUTD", count: 18 },
      { name: "SIT", count: 12 },
      { name: "Singapore Poly", count: 25 },
      { name: "Other", count: 93 },
    ],
    signUpSources: [
      { name: "Google", count: 180 },
      { name: "Email/Password", count: 120 },
      { name: "LinkedIn", count: 45 },
    ],
    retentionMetrics: {
      weeklyRetention: 68,
      monthlyRetention: 42,
      totalActiveUsers: 145,
    },
  };
}
