import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PublicProfileClient from "./PublicProfileClient";

// Create server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

interface PageProps {
  params: Promise<{ username: string }>;
}

// Fetch profile data for metadata and initial render
async function getProfile(username: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { data: user, error } = await supabase
    .from("user accounts")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !user || !user.is_public) {
    return null;
  }

  // Fetch streak data
  const { data: streakData } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_email", user.email)
    .single();

  // Fetch badges
  const { data: badges } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_email", user.email)
    .order("unlocked_at", { ascending: true });

  // Fetch interview stats
  const { data: interviews } = await supabase
    .from("interviews")
    .select("score")
    .eq("user_email", user.email)
    .not("score", "is", null);

  const averageScore =
    interviews && interviews.length > 0
      ? Math.round(
          (interviews.reduce((acc, i) => acc + (i.score || 0), 0) /
            interviews.length) *
            10
        ) / 10
      : null;

  return {
    username: user.username,
    name: user.name,
    image: user.image,
    school: user.school,
    year_of_study: user.year_of_study,
    target_role: user.target_role,
    bio: user.bio,
    linkedin_url: user.linkedin_url,
    portfolio_url: user.portfolio_url,
    skills: user.skills || [],
    preferred_industries: user.preferred_industries || [],
    is_looking: user.is_looking,
    xp: user.xp || 0,
    level: user.level || 1,
    tier: user.tier || "bronze",
    profile_views: user.profile_views || 0,
    created_at: user.created_at,
    current_streak: streakData?.current_streak || 0,
    longest_streak: streakData?.longest_streak || 0,
    total_activities: streakData?.total_activities || 0,
    average_score: averageScore,
    total_interviews: interviews?.length || 0,
    badges: badges || [],
  };
}

// Dynamic metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return {
      title: "Profile Not Found | internship.sg",
      description: "This profile could not be found or is private.",
    };
  }

  const description = profile.bio
    ? `${profile.bio} | Level ${profile.level} ${profile.tier} tier with ${profile.current_streak} day streak.`
    : `${profile.name} is a Level ${profile.level} ${profile.tier} tier member on internship.sg with a ${profile.current_streak} day interview practice streak.`;

  // Build dynamic OG image URL
  const ogImageParams = new URLSearchParams({
    type: "profile",
    username: profile.name,
    tier: profile.tier,
    level: String(profile.level),
    xp: String(profile.xp),
    school: profile.school || "",
  });
  const ogImageUrl = `https://internship.sg/api/og?${ogImageParams.toString()}`;

  return {
    title: `${profile.name} | internship.sg`,
    description,
    openGraph: {
      title: `${profile.name} | internship.sg`,
      description,
      type: "profile",
      url: `https://internship.sg/u/${profile.username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.name}'s profile on internship.sg`,
        },
      ],
      siteName: "internship.sg",
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.name} | internship.sg`,
      description,
      images: [ogImageUrl],
      creator: "@internshipsg",
    },
    alternates: {
      canonical: `https://internship.sg/u/${profile.username}`,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  return <PublicProfileClient profile={profile} />;
}
