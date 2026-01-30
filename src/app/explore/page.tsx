"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import PostCard from "@/components/social/PostCard";
import { formatDistanceToNow } from "date-fns";

// Types
interface TrendingHashtag {
  id: string;
  tag: string;
  post_count: number;
  follower_count?: number;
}

interface TrendingPost {
  id: string;
  author_email: string;
  content: string;
  post_type: string;
  image_url: string | null;
  achievement_type: string | null;
  achievement_data: Record<string, unknown>;
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
    level: number | null;
  };
  userReaction: string | null;
}

interface FeaturedUser {
  email: string;
  name: string;
  image_url: string | null;
  tier: string;
  level: number;
  xp_points: number;
  username: string;
  displayName: string;
  school: string | null;
  bio: string | null;
}

interface TrendingCompany {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  followers_count: number;
  activeJobs: number;
}

interface WhatsHappeningPost {
  id: string;
  author_email: string;
  content: string;
  post_type: string;
  achievement_type: string | null;
  achievement_data: Record<string, unknown>;
  created_at: string;
  author: {
    email: string;
    username: string | null;
    name: string;
    image: string | null;
  };
}

type Category = "all" | "tech" | "finance" | "startups" | "career";

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  {
    id: "all",
    label: "All",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "tech",
    label: "Tech",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "finance",
    label: "Finance",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "startups",
    label: "Startups",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "career",
    label: "Career Tips",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  bronze: { label: "Bronze", color: "text-amber-600", bgColor: "bg-amber-100" },
  silver: { label: "Silver", color: "text-slate-500", bgColor: "bg-slate-200" },
  gold: { label: "Gold", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  verified: { label: "Verified", color: "text-blue-500", bgColor: "bg-blue-100" },
  elite: { label: "Elite", color: "text-purple-500", bgColor: "bg-purple-100" },
};

function TierBadge({ tier, isDark }: { tier: string; isDark: boolean }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isDark
          ? `${config.bgColor.replace("100", "900/50")} ${config.color.replace("600", "400").replace("500", "400")}`
          : `${config.bgColor} ${config.color}`
      }`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "recently";
  }
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [category, setCategory] = useState<Category>("all");
  const [loading, setLoading] = useState(true);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [featuredUsers, setFeaturedUsers] = useState<FeaturedUser[]>([]);
  const [trendingCompanies, setTrendingCompanies] = useState<TrendingCompany[]>([]);
  const [whatsHappening, setWhatsHappening] = useState<WhatsHappeningPost[]>([]);

  // Fetch explore data
  const fetchExploreData = useCallback(async (selectedCategory: Category) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: selectedCategory });
      if (session?.user?.email) {
        params.set("email", session.user.email);
      }

      const res = await fetch(`/api/explore?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTrendingHashtags(data.trendingHashtags || []);
        setTrendingPosts(data.trendingPosts || []);
        setFeaturedUsers(data.featuredUsers || []);
        setTrendingCompanies(data.trendingCompanies || []);
        setWhatsHappening(data.whatsHappening || []);
      }
    } catch (error) {
      console.error("Failed to fetch explore data:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchExploreData(category);
  }, [category, fetchExploreData]);

  // Handle category change
  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
  };

  // Handle post deleted
  const handlePostDeleted = (postId: string) => {
    setTrendingPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Get news headline from post
  const getNewsHeadline = (post: WhatsHappeningPost) => {
    if (post.post_type === "achievement" && post.achievement_type) {
      const achievementTitles: Record<string, string> = {
        first_interview: "completed their first interview",
        streak_7: "achieved a 7-day streak",
        streak_30: "achieved a 30-day streak",
        level_up: "leveled up",
        job_offer: "received a job offer",
      };
      return achievementTitles[post.achievement_type] || "shared an achievement";
    }
    if (post.post_type === "milestone") {
      return "reached a milestone";
    }
    if (post.post_type === "job_offer") {
      return "got a job offer";
    }
    return post.content.slice(0, 60) + (post.content.length > 60 ? "..." : "");
  };

  if (loading && trendingPosts.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Internship.sg" className={`h-7 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
            </Link>
            <h1 className={`text-xl font-bold hidden sm:block ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              Explore
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Link */}
            <Link
              href="/search"
              className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              {isDarkTheme ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Profile */}
            {session?.user?.image ? (
              <Link href={`/u/${session.user?.email?.split("@")[0]}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.user?.image}
                  alt={session.user?.name || "Profile"}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700"
                />
              </Link>
            ) : session ? (
              <Link
                href={`/u/${session.user?.email?.split("@")[0]}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}
              >
                <span className="text-red-600 font-semibold">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mb-px">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-red-600 text-white'
                    : isDarkTheme
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 max-w-2xl space-y-6">
            {/* Trending Hashtags */}
            <section className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-4">
                <svg className={`w-5 h-5 ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Trending Hashtags
                </h2>
              </div>
              {trendingHashtags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.map((hashtag, index) => (
                    <Link
                      key={hashtag.id}
                      href={`/hashtag/${hashtag.tag}`}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        isDarkTheme
                          ? 'bg-slate-800 hover:bg-slate-700'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className={`font-medium ${isDarkTheme ? 'text-white group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-600'}`}>
                          #{hashtag.tag}
                        </p>
                        <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                          {hashtag.post_count.toLocaleString()} posts
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                  No trending hashtags yet
                </p>
              )}
            </section>

            {/* Trending Posts */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg className={`w-5 h-5 ${isDarkTheme ? 'text-orange-400' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Trending Posts
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkTheme ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  Last 24h
                </span>
              </div>
              {loading && trendingPosts.length === 0 ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : trendingPosts.length > 0 ? (
                <div className="space-y-4">
                  {trendingPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserEmail={session?.user?.email || ""}
                      onDelete={handlePostDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div className={`rounded-2xl p-8 text-center ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <svg className={`w-8 h-8 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    No trending posts in {category === "all" ? "this category" : category}
                  </h3>
                  <p className={`mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    Check back later or explore other categories
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            {/* What's Happening */}
            <section className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                What&apos;s Happening
              </h2>
              {whatsHappening.length > 0 ? (
                <div className="space-y-4">
                  {whatsHappening.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className={`block p-3 rounded-xl transition-colors ${
                        isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {post.author.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.author.image}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'
                          }`}>
                            <span className="text-red-600 font-semibold text-sm">
                              {post.author.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {post.author.name}
                          </p>
                          <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                            {getNewsHeadline(post)}
                          </p>
                          <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                  No recent news
                </p>
              )}
            </section>

            {/* Featured Users */}
            <section className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Featured Users
                </h2>
                <Link
                  href="/leaderboard"
                  className="text-sm text-red-500 hover:underline"
                >
                  See all
                </Link>
              </div>
              {featuredUsers.length > 0 ? (
                <div className="space-y-3">
                  {featuredUsers.slice(0, 5).map((user, index) => (
                    <Link
                      key={user.email}
                      href={`/u/${user.username}`}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                        isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-6 text-center text-sm font-bold ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-slate-400' :
                        index === 2 ? 'text-amber-600' :
                        isDarkTheme ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      {user.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image_url}
                          alt={user.displayName || user.name}
                          className={`w-10 h-10 rounded-full border-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'
                        }`}>
                          <span className="text-red-600 font-semibold text-sm">
                            {(user.displayName || user.name)?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-sm truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {user.displayName || user.name}
                          </p>
                          <TierBadge tier={user.tier} isDark={isDarkTheme} />
                        </div>
                        <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                          {user.xp_points.toLocaleString()} XP
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                  No featured users yet
                </p>
              )}
            </section>

            {/* Trending Companies */}
            <section className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Trending Companies
                </h2>
                <Link
                  href="/companies"
                  className="text-sm text-red-500 hover:underline"
                >
                  See all
                </Link>
              </div>
              {trendingCompanies.length > 0 ? (
                <div className="space-y-3">
                  {trendingCompanies.slice(0, 5).map((company) => (
                    <Link
                      key={company.id}
                      href={`/companies/${company.id}`}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                        isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                      }`}
                    >
                      {company.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {company.name?.charAt(0) || "C"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {company.name}
                        </p>
                        <div className={`flex items-center gap-2 text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                          {company.industry && (
                            <span className="truncate">{company.industry}</span>
                          )}
                          {company.activeJobs > 0 && (
                            <span className="text-green-500 flex-shrink-0">
                              {company.activeJobs} job{company.activeJobs !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-right ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        <p className="text-xs font-medium">{company.followers_count.toLocaleString()}</p>
                        <p className="text-xs">followers</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                  No trending companies yet
                </p>
              )}
            </section>

            {/* Quick Links */}
            <section className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Quick Links
              </h2>
              <div className="space-y-2">
                <Link
                  href="/home"
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home Feed
                </Link>
                <Link
                  href="/jobs"
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Browse Jobs
                </Link>
                <Link
                  href="/network"
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  My Network
                </Link>
                <Link
                  href="/leaderboard"
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Leaderboard
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-around py-2">
          <Link href="/home" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link href="/explore" className="p-3 text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link href="/jobs" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </Link>
          <Link href="/network" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <Link
            href={session ? `/u/${session.user?.email?.split("@")[0]}` : "/auth/signin"}
            className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </nav>
    </div>
  );
}
