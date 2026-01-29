"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { formatDistanceToNow } from "date-fns";

// Types
interface SearchUser {
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

interface SearchPost {
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

interface SearchJob {
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

interface SearchHashtag {
  id: string;
  tag: string;
  post_count: number;
}

type TabType = "all" | "people" | "posts" | "jobs" | "hashtags";

// Constants
const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: "all",
    label: "All",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "people",
    label: "People",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "posts",
    label: "Posts",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "hashtags",
    label: "Hashtags",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
  },
];

const SCHOOLS = [
  { value: "", label: "All Schools" },
  { value: "NUS", label: "NUS" },
  { value: "NTU", label: "NTU" },
  { value: "SMU", label: "SMU" },
  { value: "SUTD", label: "SUTD" },
  { value: "SIT", label: "SIT" },
  { value: "SUSS", label: "SUSS" },
];

const JOB_TYPES = [
  { value: "", label: "All Types" },
  { value: "internship", label: "Internship" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  bronze: { label: "Bronze", color: "text-amber-600", bgColor: "bg-amber-100" },
  silver: { label: "Silver", color: "text-slate-500", bgColor: "bg-slate-200" },
  gold: { label: "Gold", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  verified: { label: "Verified", color: "text-blue-500", bgColor: "bg-blue-100" },
  elite: { label: "Elite", color: "text-purple-500", bgColor: "bg-purple-100" },
};

const JOB_TYPE_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  internship: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  "full-time": { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
  "part-time": { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  contract: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
};

// Helper functions
function formatDate(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "recently";
  }
}

function formatSalary(min: number | null, max: number | null, currency: string = "SGD"): string {
  if (!min && !max) return "";
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min) return `From ${currency} ${min.toLocaleString()}`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  return "";
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-red-200 dark:bg-red-900/50 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Components
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

function UserCard({ user, isDark, query }: { user: SearchUser; isDark: boolean; query: string }) {
  return (
    <Link
      href={`/u/${user.username}`}
      className={`block rounded-xl border p-4 transition-all hover:shadow-lg ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:border-red-500/50"
          : "bg-white border-slate-200 hover:border-red-300"
      }`}
    >
      <div className="flex items-center gap-3">
        {user.image_url ? (
          <img
            src={user.image_url}
            alt={user.name}
            className={`w-12 h-12 rounded-full border-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? "bg-red-900/50" : "bg-red-100"
            }`}
          >
            <span className="text-red-600 font-semibold">{user.name?.charAt(0) || "?"}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
              {highlightText(user.name, query)}
            </span>
            <TierBadge tier={user.tier} isDark={isDark} />
          </div>
          <p className={`text-sm truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            @{highlightText(user.username, query)}
          </p>
          {user.school && (
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
              }`}
            >
              {highlightText(user.school, query)}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${isDark ? "text-red-400" : "text-red-600"}`}>
            {user.xp_points.toLocaleString()} XP
          </p>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post, isDark, query }: { post: SearchPost; isDark: boolean; query: string }) {
  // Render content with hashtags and mentions
  const renderContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return (
          <Link key={i} href={`/search?q=${encodeURIComponent(part)}&tab=posts`} className="text-red-500 hover:underline">
            {part}
          </Link>
        );
      }
      if (part.startsWith("@")) {
        return (
          <Link key={i} href={`/u/${part.slice(1)}`} className="text-blue-500 hover:underline">
            {part}
          </Link>
        );
      }
      return highlightText(part, query);
    });
  };

  return (
    <div
      className={`rounded-xl border p-4 ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <Link href={`/u/${post.author.username || post.author_email.split("@")[0]}`}>
          {post.author.image ? (
            <img src={post.author.image} alt={post.author.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDark ? "bg-red-900/50" : "bg-red-100"
              }`}
            >
              <span className="text-red-600 font-semibold">{post.author.name?.charAt(0) || "U"}</span>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/u/${post.author.username || post.author_email.split("@")[0]}`}
              className={`font-semibold hover:underline ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {post.author.name}
            </Link>
            {post.author.tier && <TierBadge tier={post.author.tier} isDark={isDark} />}
          </div>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {post.author.school && `${post.author.school} - `}
            {formatDate(post.created_at)}
          </p>
        </div>
      </div>
      <div className={`mt-3 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
        <p className="whitespace-pre-wrap line-clamp-4">{renderContent(post.content)}</p>
      </div>
      {post.image_url && (
        <div className="mt-3">
          <img src={post.image_url} alt="Post" className="rounded-lg max-h-48 object-cover" />
        </div>
      )}
      <div className={`mt-3 flex items-center gap-4 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          {post.reaction_count}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comment_count}
        </span>
      </div>
    </div>
  );
}

function JobCard({ job, isDark, query }: { job: SearchJob; isDark: boolean; query: string }) {
  const typeColors = JOB_TYPE_COLORS[job.job_type] || JOB_TYPE_COLORS.internship;

  return (
    <Link
      href={`/jobs?job=${job.id}`}
      className={`block rounded-xl border p-4 transition-all hover:shadow-lg ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:border-red-500/50"
          : "bg-white border-slate-200 hover:border-red-300"
      }`}
    >
      <div className="flex gap-3">
        {job.company?.logo_url ? (
          <img src={job.company.logo_url} alt={job.company.name} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <span className="text-white font-bold">
              {job.company?.name?.charAt(0) || "?"}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
            {highlightText(job.title, query)}
          </h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {job.company?.name || "Unknown Company"}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isDark ? typeColors.darkBg : typeColors.bg
              } ${isDark ? typeColors.darkText : typeColors.text}`}
            >
              {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
            </span>
            {job.is_remote && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isDark ? "bg-teal-900/50 text-teal-300" : "bg-teal-100 text-teal-700"
                }`}
              >
                Remote
              </span>
            )}
            {job.location && (
              <span className={`flex items-center gap-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {highlightText(job.location, query)}
              </span>
            )}
          </div>
          {(job.salary_min || job.salary_max) && (
            <p className={`mt-2 text-sm font-medium ${isDark ? "text-green-400" : "text-green-600"}`}>
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function HashtagCard({ hashtag, isDark, query }: { hashtag: SearchHashtag; isDark: boolean; query: string }) {
  return (
    <Link
      href={`/search?q=%23${hashtag.tag}&tab=posts`}
      className={`block rounded-xl border p-4 transition-all hover:shadow-lg ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:border-red-500/50"
          : "bg-white border-slate-200 hover:border-red-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            #{highlightText(hashtag.tag, query.replace("#", ""))}
          </p>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {hashtag.post_count.toLocaleString()} post{hashtag.post_count !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? "bg-red-900/50" : "bg-red-100"
          }`}
        >
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function RecentSearches({
  searches,
  isDark,
  onSelect,
  onClear,
}: {
  searches: string[];
  isDark: boolean;
  onSelect: (s: string) => void;
  onClear: () => void;
}) {
  if (searches.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Recent Searches</h3>
        <button
          onClick={onClear}
          className={`text-sm ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((search, i) => (
          <button
            key={i}
            onClick={() => onSelect(search)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              isDark
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {search}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  // URL params
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("tab") as TabType) || "all";

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: SearchUser[];
    posts: SearchPost[];
    jobs: SearchJob[];
    hashtags: SearchHashtag[];
    totalUsers: number;
    totalPosts: number;
    totalJobs: number;
    totalHashtags: number;
    isTrending?: boolean;
  } | null>(null);

  // Filters
  const [schoolFilter, setSchoolFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [remoteFilter, setRemoteFilter] = useState(false);

  // Recent searches (localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }, []);

  // Update URL
  const updateURL = useCallback(
    (query: string, tab: TabType) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (tab !== "all") params.set("tab", tab);
      router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    },
    [router]
  );

  // Perform search
  const performSearch = useCallback(
    async (query: string, tab: TabType) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          tab,
          limit: "20",
        });

        if (session?.user?.email) {
          params.set("email", session.user?.email);
        }

        if (tab === "people" && schoolFilter) {
          params.set("school", schoolFilter);
        }

        if (tab === "jobs") {
          if (jobTypeFilter) params.set("job_type", jobTypeFilter);
          if (remoteFilter) params.set("is_remote", "true");
        }

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.email, schoolFilter, jobTypeFilter, remoteFilter]
  );

  // Handle search submit
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      updateURL(searchQuery, activeTab);
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
      }
      performSearch(searchQuery, activeTab);
    },
    [searchQuery, activeTab, updateURL, saveRecentSearch, performSearch]
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      updateURL(searchQuery, tab);
      performSearch(searchQuery, tab);
    },
    [searchQuery, updateURL, performSearch]
  );

  // Initial search
  useEffect(() => {
    performSearch(initialQuery, initialTab);
  }, []);

  // Re-search when filters change
  useEffect(() => {
    if (searchQuery || activeTab !== "all") {
      performSearch(searchQuery, activeTab);
    }
  }, [schoolFilter, jobTypeFilter, remoteFilter]);

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex-shrink-0">
              <img
                src="/logo.png"
                alt="Internship.sg"
                className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`}
              />
            </Link>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDarkTheme ? "text-slate-500" : "text-slate-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, posts, jobs, hashtags..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-red-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500"
                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    performSearch("", activeTab);
                  }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                    isDarkTheme ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </form>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                isDarkTheme ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              {isDarkTheme ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div
        className={`border-b ${isDarkTheme ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : isDarkTheme
                    ? "border-transparent text-slate-400 hover:text-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                {tab.label}
                {results && activeTab === tab.id && !results.isTrending && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                      isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    {tab.id === "all"
                      ? results.totalUsers + results.totalPosts + results.totalJobs + results.totalHashtags
                      : tab.id === "people"
                      ? results.totalUsers
                      : tab.id === "posts"
                      ? results.totalPosts
                      : tab.id === "jobs"
                      ? results.totalJobs
                      : results.totalHashtags}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Filters */}
        {(activeTab === "people" || activeTab === "jobs") && (
          <div
            className={`rounded-xl p-4 mb-6 border ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Filters:
              </span>

              {activeTab === "people" && (
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {SCHOOLS.map((school) => (
                    <option key={school.value} value={school.value}>
                      {school.label}
                    </option>
                  ))}
                </select>
              )}

              {activeTab === "jobs" && (
                <>
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    {JOB_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remoteFilter}
                      onChange={(e) => setRemoteFilter(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Remote only
                    </span>
                  </label>
                </>
              )}

              {(schoolFilter || jobTypeFilter || remoteFilter) && (
                <button
                  onClick={() => {
                    setSchoolFilter("");
                    setJobTypeFilter("");
                    setRemoteFilter(false);
                  }}
                  className={`text-sm ${isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recent Searches (when empty) */}
        {!searchQuery && !loading && (
          <RecentSearches
            searches={recentSearches}
            isDark={isDarkTheme}
            onSelect={(s) => {
              setSearchQuery(s);
              updateURL(s, activeTab);
              performSearch(s, activeTab);
            }}
            onClear={clearRecentSearches}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div className="space-y-8">
            {/* Trending Label */}
            {results.isTrending && (
              <div className="flex items-center gap-2 mb-4">
                <svg className={`w-5 h-5 ${isDarkTheme ? "text-red-400" : "text-red-500"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Trending & Discover
                </h2>
              </div>
            )}

            {/* People Section */}
            {(activeTab === "all" || activeTab === "people") && results.users.length > 0 && (
              <section>
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      People {!results.isTrending && `(${results.totalUsers})`}
                    </h2>
                    {results.totalUsers > 3 && activeTab === "all" && (
                      <button
                        onClick={() => handleTabChange("people")}
                        className="text-sm text-red-500 hover:underline"
                      >
                        See all
                      </button>
                    )}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(activeTab === "all" ? results.users.slice(0, 6) : results.users).map((user) => (
                    <UserCard key={user.id} user={user} isDark={isDarkTheme} query={searchQuery} />
                  ))}
                </div>
              </section>
            )}

            {/* Posts Section */}
            {(activeTab === "all" || activeTab === "posts") && results.posts.length > 0 && (
              <section>
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      Posts {!results.isTrending && `(${results.totalPosts})`}
                    </h2>
                    {results.totalPosts > 3 && activeTab === "all" && (
                      <button
                        onClick={() => handleTabChange("posts")}
                        className="text-sm text-red-500 hover:underline"
                      >
                        See all
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {(activeTab === "all" ? results.posts.slice(0, 3) : results.posts).map((post) => (
                    <PostCard key={post.id} post={post} isDark={isDarkTheme} query={searchQuery} />
                  ))}
                </div>
              </section>
            )}

            {/* Jobs Section */}
            {(activeTab === "all" || activeTab === "jobs") && results.jobs.length > 0 && (
              <section>
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      Jobs {!results.isTrending && `(${results.totalJobs})`}
                    </h2>
                    {results.totalJobs > 3 && activeTab === "all" && (
                      <button
                        onClick={() => handleTabChange("jobs")}
                        className="text-sm text-red-500 hover:underline"
                      >
                        See all
                      </button>
                    )}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(activeTab === "all" ? results.jobs.slice(0, 4) : results.jobs).map((job) => (
                    <JobCard key={job.id} job={job} isDark={isDarkTheme} query={searchQuery} />
                  ))}
                </div>
              </section>
            )}

            {/* Hashtags Section */}
            {(activeTab === "all" || activeTab === "hashtags") && results.hashtags.length > 0 && (
              <section>
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      Hashtags {!results.isTrending && `(${results.totalHashtags})`}
                    </h2>
                    {results.totalHashtags > 4 && activeTab === "all" && (
                      <button
                        onClick={() => handleTabChange("hashtags")}
                        className="text-sm text-red-500 hover:underline"
                      >
                        See all
                      </button>
                    )}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(activeTab === "all" ? results.hashtags.slice(0, 6) : results.hashtags).map((hashtag) => (
                    <HashtagCard key={hashtag.id} hashtag={hashtag} isDark={isDarkTheme} query={searchQuery} />
                  ))}
                </div>
              </section>
            )}

            {/* No Results */}
            {searchQuery &&
              results.users.length === 0 &&
              results.posts.length === 0 &&
              results.jobs.length === 0 &&
              results.hashtags.length === 0 && (
                <div
                  className={`text-center py-16 rounded-xl border ${
                    isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    <svg
                      className={`w-8 h-8 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    No results found
                  </h3>
                  <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                    Try a different search term or adjust your filters
                  </p>
                </div>
              )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${
          isDarkTheme ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-around py-2">
          <Link href="/home" className={`p-3 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </Link>
          <Link href="/search" className="p-3 text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Link>
          <Link href="/jobs" className={`p-3 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </Link>
          <Link href="/network" className={`p-3 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
          <Link
            href={session ? `/u/${session.user?.email?.split("@")[0]}` : "/auth/signin"}
            className={`p-3 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
