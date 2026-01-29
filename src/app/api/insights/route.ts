import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 30;

// GET user analytics/insights data
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please set up Supabase environment variables." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousThirtyDays = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const previousSevenDays = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [
      profileRes,
      profileViewsRes,
      previousProfileViewsRes,
      postsRes,
      followersCurrentRes,
      followersPreviousWeekRes,
      followersPreviousMonthRes,
      searchAppearancesRes,
      previousSearchAppearancesRes,
      viewerDemographicsRes,
    ] = await Promise.all([
      // User profile
      supabase.from("profiles").select("*").eq("email", email).single(),

      // Profile views (last 30 days)
      supabase
        .from("profile_views")
        .select("*")
        .eq("viewed_email", email)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true }),

      // Previous period profile views (30-60 days ago)
      supabase
        .from("profile_views")
        .select("id", { count: "exact" })
        .eq("viewed_email", email)
        .gte("created_at", previousThirtyDays.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString()),

      // User posts with engagement
      supabase
        .from("posts")
        .select("*")
        .eq("author_email", email)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),

      // Current followers (this week)
      supabase
        .from("follows")
        .select("created_at")
        .eq("following_email", email)
        .gte("created_at", sevenDaysAgo.toISOString()),

      // Previous week followers (7-14 days ago)
      supabase
        .from("follows")
        .select("id", { count: "exact" })
        .eq("following_email", email)
        .gte("created_at", previousSevenDays.toISOString())
        .lt("created_at", sevenDaysAgo.toISOString()),

      // Previous month followers count
      supabase
        .from("follows")
        .select("created_at")
        .eq("following_email", email)
        .gte("created_at", thirtyDaysAgo.toISOString()),

      // Search appearances (last 30 days)
      supabase
        .from("search_appearances")
        .select("*")
        .eq("appeared_email", email)
        .gte("created_at", thirtyDaysAgo.toISOString()),

      // Previous period search appearances
      supabase
        .from("search_appearances")
        .select("id", { count: "exact" })
        .eq("appeared_email", email)
        .gte("created_at", previousThirtyDays.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString()),

      // Viewer demographics
      supabase
        .from("profile_views")
        .select("viewer_email")
        .eq("viewed_email", email)
        .gte("created_at", thirtyDaysAgo.toISOString()),
    ]);

    // Get total followers count
    const { count: totalFollowers } = await supabase
      .from("follows")
      .select("id", { count: "exact" })
      .eq("following_email", email);

    // Process profile views into daily data for chart
    const profileViewsByDay: { date: string; count: number }[] = [];
    const viewsData = profileViewsRes.data || [];

    // Create a map for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      profileViewsByDay.push({ date: dateStr, count: 0 });
    }

    // Count views per day
    viewsData.forEach((view: { created_at: string }) => {
      const dateStr = view.created_at.split("T")[0];
      const dayData = profileViewsByDay.find(d => d.date === dateStr);
      if (dayData) {
        dayData.count++;
      }
    });

    // Calculate total views and comparison
    const totalViews = viewsData.length;
    const previousViews = previousProfileViewsRes.count || 0;
    const viewsChange = previousViews > 0
      ? Math.round(((totalViews - previousViews) / previousViews) * 100)
      : totalViews > 0 ? 100 : 0;

    // Process posts for performance metrics
    const posts = postsRes.data || [];
    const totalPosts = posts.length;
    const totalReactions = posts.reduce((sum: number, post: { reaction_count?: number }) => sum + (post.reaction_count || 0), 0);
    const totalComments = posts.reduce((sum: number, post: { comment_count?: number }) => sum + (post.comment_count || 0), 0);
    const totalShares = posts.reduce((sum: number, post: { share_count?: number }) => sum + (post.share_count || 0), 0);

    // Get top performing posts (by engagement)
    const topPosts = posts
      .map((post: { id: string; content: string; reaction_count?: number; comment_count?: number; share_count?: number; created_at: string }) => ({
        id: post.id,
        content: post.content?.substring(0, 100) + (post.content?.length > 100 ? "..." : ""),
        reactions: post.reaction_count || 0,
        comments: post.comment_count || 0,
        shares: post.share_count || 0,
        engagement: (post.reaction_count || 0) + (post.comment_count || 0) * 2 + (post.share_count || 0) * 3,
        createdAt: post.created_at,
      }))
      .sort((a: { engagement: number }, b: { engagement: number }) => b.engagement - a.engagement)
      .slice(0, 5);

    // Follower growth
    const newFollowersThisWeek = followersCurrentRes.data?.length || 0;
    const previousWeekFollowers = followersPreviousWeekRes.count || 0;
    const followerGrowthWeek = previousWeekFollowers > 0
      ? Math.round(((newFollowersThisWeek - previousWeekFollowers) / previousWeekFollowers) * 100)
      : newFollowersThisWeek > 0 ? 100 : 0;

    const newFollowersThisMonth = followersPreviousMonthRes.data?.length || 0;

    // Search appearances
    const searchAppearances = searchAppearancesRes.data?.length || 0;
    const previousSearchAppearances = previousSearchAppearancesRes.count || 0;
    const searchChange = previousSearchAppearances > 0
      ? Math.round(((searchAppearances - previousSearchAppearances) / previousSearchAppearances) * 100)
      : searchAppearances > 0 ? 100 : 0;

    // Profile completion calculation
    const profile = profileRes.data;
    const profileFields = {
      username: !!profile?.username,
      display_name: !!profile?.display_name,
      bio: !!profile?.bio && profile.bio.length > 0,
      school: !!profile?.school,
      skills: !!profile?.skills && profile.skills.length > 0,
      linkedin_url: !!profile?.linkedin_url,
      portfolio_url: !!profile?.portfolio_url,
      target_role: !!profile?.target_role,
      year_of_study: !!profile?.year_of_study,
    };

    const completedFields = Object.values(profileFields).filter(Boolean).length;
    const totalFields = Object.keys(profileFields).length;
    const profileCompletion = Math.round((completedFields / totalFields) * 100);

    const missingFields = Object.entries(profileFields)
      .filter(([, completed]) => !completed)
      .map(([field]) => {
        const labels: Record<string, string> = {
          username: "Set a username",
          display_name: "Add your display name",
          bio: "Write a bio",
          school: "Add your school",
          skills: "Add skills to showcase",
          linkedin_url: "Connect LinkedIn profile",
          portfolio_url: "Add portfolio link",
          target_role: "Set target role",
          year_of_study: "Add year of study",
        };
        return labels[field] || field;
      });

    // Get viewer demographics (anonymized by industry/school)
    const viewerEmails = viewerDemographicsRes.data?.map((v: { viewer_email: string }) => v.viewer_email).filter(Boolean) || [];
    let viewerIndustries: { name: string; count: number }[] = [];
    let viewerSchools: { name: string; count: number }[] = [];

    if (viewerEmails.length > 0) {
      const { data: viewerProfiles } = await supabase
        .from("profiles")
        .select("school, preferred_industries")
        .in("email", viewerEmails);

      // Count schools
      const schoolCounts: Record<string, number> = {};
      viewerProfiles?.forEach((p: { school?: string }) => {
        if (p.school) {
          schoolCounts[p.school] = (schoolCounts[p.school] || 0) + 1;
        }
      });
      viewerSchools = Object.entries(schoolCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Count industries
      const industryCounts: Record<string, number> = {};
      viewerProfiles?.forEach((p: { preferred_industries?: string[] }) => {
        if (p.preferred_industries && Array.isArray(p.preferred_industries)) {
          p.preferred_industries.forEach((industry: string) => {
            industryCounts[industry] = (industryCounts[industry] || 0) + 1;
          });
        }
      });
      viewerIndustries = Object.entries(industryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    return NextResponse.json({
      profileViews: {
        total: totalViews,
        change: viewsChange,
        chartData: profileViewsByDay,
      },
      postPerformance: {
        totalPosts,
        totalReactions,
        totalComments,
        totalShares,
        totalEngagement: totalReactions + totalComments + totalShares,
      },
      topPosts,
      followerGrowth: {
        total: totalFollowers || 0,
        thisWeek: newFollowersThisWeek,
        weekChange: followerGrowthWeek,
        thisMonth: newFollowersThisMonth,
      },
      profileCompletion: {
        percentage: profileCompletion,
        missingFields,
      },
      searchAppearances: {
        total: searchAppearances,
        change: searchChange,
      },
      viewerDemographics: {
        industries: viewerIndustries,
        schools: viewerSchools,
        totalViewers: viewerEmails.length,
      },
    });
  } catch (error) {
    console.error("Get insights error:", error);
    return NextResponse.json(
      { error: "Failed to get insights" },
      { status: 500 }
    );
  }
}
