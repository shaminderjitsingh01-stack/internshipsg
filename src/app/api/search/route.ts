import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface SearchUser {
  id: string;
  email: string;
  username: string;
  name: string;
  image_url: string | null;
  school: string | null;
  tier: string;
  xp_points: number;
  bio?: string;
}

export interface SearchPost {
  id: string;
  author_email: string;
  content: string;
  post_type: string;
  image_url: string | null;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  author: {
    email: string;
    username: string | null;
    name: string;
    image: string | null;
    school: string | null;
    tier: string | null;
  };
}

export interface SearchJob {
  id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  is_remote: boolean;
  created_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
  };
}

export interface SearchHashtag {
  id: string;
  tag: string;
  post_count: number;
}

export interface SearchResponse {
  users: SearchUser[];
  posts: SearchPost[];
  jobs: SearchJob[];
  hashtags: SearchHashtag[];
  totalUsers: number;
  totalPosts: number;
  totalJobs: number;
  totalHashtags: number;
}

// GET /api/search - Global search across users, posts, jobs, hashtags
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const tab = searchParams.get("tab") || "all"; // all, people, posts, jobs, hashtags
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const currentUserEmail = searchParams.get("email");

  // Filters
  const school = searchParams.get("school");
  const tier = searchParams.get("tier");
  const jobType = searchParams.get("job_type");
  const location = searchParams.get("location");
  const isRemote = searchParams.get("is_remote");

  if (!query && tab === "all") {
    // Return trending/recent data when no query
    return getTrendingData(limit, currentUserEmail);
  }

  try {
    const results: SearchResponse = {
      users: [],
      posts: [],
      jobs: [],
      hashtags: [],
      totalUsers: 0,
      totalPosts: 0,
      totalJobs: 0,
      totalHashtags: 0,
    };

    // Search Users
    if (tab === "all" || tab === "people") {
      const usersResult = await searchUsers(query, { school, tier }, limit, offset);
      results.users = usersResult.users;
      results.totalUsers = usersResult.total;
    }

    // Search Posts
    if (tab === "all" || tab === "posts") {
      const postsResult = await searchPosts(query, currentUserEmail, limit, offset);
      results.posts = postsResult.posts;
      results.totalPosts = postsResult.total;
    }

    // Search Jobs
    if (tab === "all" || tab === "jobs") {
      const jobsResult = await searchJobs(query, { jobType, location, isRemote }, limit, offset);
      results.jobs = jobsResult.jobs;
      results.totalJobs = jobsResult.total;
    }

    // Search Hashtags
    if (tab === "all" || tab === "hashtags") {
      const hashtagsResult = await searchHashtags(query, limit, offset);
      results.hashtags = hashtagsResult.hashtags;
      results.totalHashtags = hashtagsResult.total;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}

// Search users by name, username, school
async function searchUsers(
  query: string,
  filters: { school?: string | null; tier?: string | null },
  limit: number,
  offset: number
): Promise<{ users: SearchUser[]; total: number }> {
  let dbQuery = supabase
    .from("users")
    .select("*", { count: "exact" })
    .eq("is_public", true);

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%,school.ilike.%${query}%`
    );
  }

  if (filters.school) {
    dbQuery = dbQuery.eq("school", filters.school);
  }

  if (filters.tier) {
    dbQuery = dbQuery.eq("tier", filters.tier);
  }

  const { data: users, error, count } = await dbQuery
    .order("xp_points", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error searching users:", error);
    return { users: [], total: 0 };
  }

  return {
    users: (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username || u.email.split("@")[0],
      name: u.name || "Anonymous",
      image_url: u.image_url,
      school: u.school,
      tier: u.tier || "bronze",
      xp_points: u.xp_points || 0,
      bio: u.bio,
    })),
    total: count || 0,
  };
}

// Search posts by content and hashtags
async function searchPosts(
  query: string,
  currentUserEmail: string | null,
  limit: number,
  offset: number
): Promise<{ posts: SearchPost[]; total: number }> {
  let dbQuery = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .eq("visibility", "public");

  if (query) {
    // Check if searching for hashtag
    if (query.startsWith("#")) {
      dbQuery = dbQuery.ilike("content", `%${query}%`);
    } else {
      dbQuery = dbQuery.ilike("content", `%${query}%`);
    }
  }

  const { data: posts, error, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error searching posts:", error);
    return { posts: [], total: 0 };
  }

  if (!posts || posts.length === 0) {
    return { posts: [], total: 0 };
  }

  // Enrich posts with author info
  const authorEmails = [...new Set(posts.map((p) => p.author_email))];

  const [usersRes] = await Promise.all([
    supabase.from("users").select("email, username, name, image_url, school, tier").in("email", authorEmails),
  ]);

  return {
    posts: posts.map((post) => {
      const user = usersRes.data?.find((u) => u.email === post.author_email);
      return {
        id: post.id,
        author_email: post.author_email,
        content: post.content,
        post_type: post.post_type,
        image_url: post.image_url,
        reaction_count: post.reaction_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at,
        author: {
          email: post.author_email,
          username: user?.username || post.author_email.split("@")[0],
          name: user?.name || "Anonymous",
          image: user?.image_url,
          school: user?.school,
          tier: user?.tier,
        },
      };
    }),
    total: count || 0,
  };
}

// Search jobs by title, company, location
async function searchJobs(
  query: string,
  filters: { jobType?: string | null; location?: string | null; isRemote?: string | null },
  limit: number,
  offset: number
): Promise<{ jobs: SearchJob[]; total: number }> {
  let dbQuery = supabase
    .from("jobs")
    .select(
      `
      *,
      company:companies (
        id,
        name,
        logo_url,
        industry
      )
    `,
      { count: "exact" }
    )
    .eq("status", "active");

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (filters.jobType) {
    dbQuery = dbQuery.eq("job_type", filters.jobType);
  }

  if (filters.location) {
    dbQuery = dbQuery.ilike("location", `%${filters.location}%`);
  }

  if (filters.isRemote === "true") {
    dbQuery = dbQuery.eq("is_remote", true);
  }

  const { data: jobs, error, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error searching jobs:", error);
    return { jobs: [], total: 0 };
  }

  return {
    jobs: (jobs || []).map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      job_type: job.job_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      is_remote: job.is_remote,
      created_at: job.created_at,
      company: job.company,
    })),
    total: count || 0,
  };
}

// Search hashtags
async function searchHashtags(
  query: string,
  limit: number,
  offset: number
): Promise<{ hashtags: SearchHashtag[]; total: number }> {
  const cleanQuery = query.replace("#", "");

  let dbQuery = supabase.from("hashtags").select("*", { count: "exact" });

  if (cleanQuery) {
    dbQuery = dbQuery.ilike("tag", `%${cleanQuery}%`);
  }

  const { data: hashtags, error, count } = await dbQuery
    .order("post_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error searching hashtags:", error);
    return { hashtags: [], total: 0 };
  }

  return {
    hashtags: (hashtags || []).map((h) => ({
      id: h.id,
      tag: h.tag,
      post_count: h.post_count || 0,
    })),
    total: count || 0,
  };
}

// Get trending data when no search query
async function getTrendingData(limit: number, currentUserEmail: string | null) {
  try {
    // Get trending hashtags
    const { data: trendingHashtags } = await supabase
      .from("hashtags")
      .select("*")
      .order("post_count", { ascending: false })
      .limit(10);

    // Get suggested users (top performers)
    const { data: suggestedUsers } = await supabase
      .from("users")
      .select("*")
      .eq("is_public", true)
      .order("xp_points", { ascending: false })
      .limit(6);

    // Get recent popular posts
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*")
      .is("deleted_at", null)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(5);

    // Enrich posts with author info if available
    let enrichedPosts: SearchPost[] = [];
    if (recentPosts && recentPosts.length > 0) {
      const authorEmails = [...new Set(recentPosts.map((p) => p.author_email))];
      const { data: users } = await supabase
        .from("users")
        .select("email, username, name, image_url, school, tier")
        .in("email", authorEmails);

      enrichedPosts = recentPosts.map((post) => {
        const user = users?.find((u) => u.email === post.author_email);
        return {
          id: post.id,
          author_email: post.author_email,
          content: post.content,
          post_type: post.post_type,
          image_url: post.image_url,
          reaction_count: post.reaction_count || 0,
          comment_count: post.comment_count || 0,
          created_at: post.created_at,
          author: {
            email: post.author_email,
            username: user?.username || post.author_email.split("@")[0],
            name: user?.name || "Anonymous",
            image: user?.image_url,
            school: user?.school,
            tier: user?.tier,
          },
        };
      });
    }

    // Get recent jobs
    const { data: recentJobs } = await supabase
      .from("jobs")
      .select(
        `
        *,
        company:companies (
          id,
          name,
          logo_url,
          industry
        )
      `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      users: (suggestedUsers || []).map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username || u.email.split("@")[0],
        name: u.name || "Anonymous",
        image_url: u.image_url,
        school: u.school,
        tier: u.tier || "bronze",
        xp_points: u.xp_points || 0,
      })),
      posts: enrichedPosts,
      jobs: (recentJobs || []).map((job) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        job_type: job.job_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency,
        is_remote: job.is_remote,
        created_at: job.created_at,
        company: job.company,
      })),
      hashtags: (trendingHashtags || []).map((h) => ({
        id: h.id,
        tag: h.tag,
        post_count: h.post_count || 0,
      })),
      totalUsers: suggestedUsers?.length || 0,
      totalPosts: enrichedPosts.length,
      totalJobs: recentJobs?.length || 0,
      totalHashtags: trendingHashtags?.length || 0,
      isTrending: true,
    });
  } catch (error) {
    console.error("Error fetching trending data:", error);
    return NextResponse.json({ error: "Failed to fetch trending data" }, { status: 500 });
  }
}
