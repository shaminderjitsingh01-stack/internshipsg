import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/explore - Fetch trending data
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category") || "all";
  const email = searchParams.get("email"); // current user

  try {
    // Calculate date for 24h trending
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const twentyFourHoursAgoISO = twentyFourHoursAgo.toISOString();

    // Calculate date for 7 days (for news/what's happening)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Parallel fetch all trending data
    const [
      trendingHashtagsRes,
      trendingPostsRes,
      featuredUsersRes,
      trendingCompaniesRes,
      recentNewsPostsRes,
    ] = await Promise.all([
      // Trending hashtags - most posts in last 24h
      supabase
        .from("hashtags")
        .select("*")
        .order("post_count", { ascending: false })
        .limit(10),

      // Trending posts - most engagement in last 24h
      buildTrendingPostsQuery(twentyFourHoursAgoISO, category),

      // Featured users - top XP earners
      supabase
        .from("user accounts")
        .select("email, name, image_url, tier, level, xp_points")
        .order("xp_points", { ascending: false })
        .limit(10),

      // Trending companies - most followers
      supabase
        .from("companies")
        .select("id, name, logo_url, industry, followers_count, jobs_count")
        .order("followers_count", { ascending: false })
        .limit(10),

      // Recent news-worthy posts (achievements, milestones)
      supabase
        .from("posts")
        .select("*")
        .is("deleted_at", null)
        .eq("visibility", "public")
        .in("post_type", ["achievement", "milestone", "job_offer"])
        .gte("created_at", sevenDaysAgoISO)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Filter by category if not "all"
    let filteredPosts = trendingPostsRes.data || [];
    if (category !== "all" && filteredPosts.length > 0) {
      filteredPosts = await filterPostsByCategory(filteredPosts, category);
    }

    // Enrich posts with author info
    const enrichedTrendingPosts = await enrichPosts(filteredPosts, email);
    const enrichedNewsPosts = await enrichPosts(recentNewsPostsRes.data || [], email);

    // Enrich featured users with profile info
    const enrichedFeaturedUsers = await enrichUsers(featuredUsersRes.data || []);

    // Enrich companies with job counts if not present
    const enrichedCompanies = await enrichCompanies(trendingCompaniesRes.data || []);

    return NextResponse.json({
      trendingHashtags: trendingHashtagsRes.data || [],
      trendingPosts: enrichedTrendingPosts,
      featuredUsers: enrichedFeaturedUsers,
      trendingCompanies: enrichedCompanies,
      whatsHappening: enrichedNewsPosts,
      category,
    });
  } catch (error) {
    console.error("Explore GET error:", error);
    return NextResponse.json({ error: "Failed to fetch explore data" }, { status: 500 });
  }
}

// Build trending posts query
async function buildTrendingPostsQuery(since: string, category: string) {
  let query = supabase
    .from("posts")
    .select("*")
    .is("deleted_at", null)
    .eq("visibility", "public")
    .gte("created_at", since)
    .order("reaction_count", { ascending: false })
    .limit(20);

  return query;
}

// Filter posts by category based on hashtags or content
async function filterPostsByCategory(posts: any[], category: string): Promise<any[]> {
  const categoryKeywords: Record<string, string[]> = {
    tech: ["tech", "technology", "coding", "programming", "software", "developer", "ai", "machinelearning", "data", "web", "mobile", "startup"],
    finance: ["finance", "fintech", "banking", "investment", "trading", "accounting", "financial", "money", "economics"],
    startups: ["startup", "entrepreneurship", "founder", "venture", "funding", "vc", "accelerator", "incubator", "innovation"],
    career: ["career", "interview", "resume", "job", "internship", "hiring", "work", "tips", "advice", "professional"],
  };

  const keywords = categoryKeywords[category.toLowerCase()];
  if (!keywords) return posts;

  return posts.filter(post => {
    const content = post.content?.toLowerCase() || "";
    return keywords.some(keyword => content.includes(keyword) || content.includes(`#${keyword}`));
  });
}

// Enrich posts with author info
async function enrichPosts(posts: any[], currentUserEmail: string | null) {
  if (!posts.length) return [];

  const authorEmails = [...new Set(posts.map(p => p.author_email))];

  const [profilesRes, accountsRes] = await Promise.all([
    supabase.from("profiles").select("email, username, display_name, school").in("email", authorEmails),
    supabase.from("user accounts").select("email, name, image_url, tier, level").in("email", authorEmails),
  ]);

  // Fetch user's reactions if logged in
  let userReactions: { post_id: string; reaction_type: string }[] = [];
  if (currentUserEmail) {
    const postIds = posts.map(p => p.id);
    const { data } = await supabase
      .from("reactions")
      .select("post_id, reaction_type")
      .eq("user_email", currentUserEmail)
      .in("post_id", postIds);
    userReactions = data || [];
  }

  return posts.map(post => {
    const profile = profilesRes.data?.find(p => p.email === post.author_email);
    const account = accountsRes.data?.find(a => a.email === post.author_email);
    const userReaction = userReactions.find(r => r.post_id === post.id);

    return {
      ...post,
      author: {
        email: post.author_email,
        username: profile?.username,
        name: profile?.display_name || account?.name || "Anonymous",
        image: account?.image_url,
        school: profile?.school,
        tier: account?.tier,
        level: account?.level,
      },
      userReaction: userReaction?.reaction_type || null,
    };
  });
}

// Enrich users with profile info
async function enrichUsers(users: any[]) {
  if (!users.length) return [];

  const emails = users.map(u => u.email);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, username, display_name, school, bio")
    .in("email", emails);

  return users.map(user => {
    const profile = profiles?.find(p => p.email === user.email);
    return {
      ...user,
      username: profile?.username || user.email?.split("@")[0],
      displayName: profile?.display_name || user.name,
      school: profile?.school,
      bio: profile?.bio,
    };
  });
}

// Enrich companies with job counts
async function enrichCompanies(companies: any[]) {
  if (!companies.length) return companies;

  const companyIds = companies.map(c => c.id);

  const { data: jobCounts } = await supabase
    .from("jobs")
    .select("company_id")
    .in("company_id", companyIds)
    .eq("status", "active");

  // Count jobs per company
  const countMap: Record<string, number> = {};
  jobCounts?.forEach(j => {
    countMap[j.company_id] = (countMap[j.company_id] || 0) + 1;
  });

  return companies.map(company => ({
    ...company,
    activeJobs: countMap[company.id] || company.jobs_count || 0,
  }));
}
