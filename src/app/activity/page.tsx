"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format, subDays, startOfDay, endOfDay } from "date-fns";

interface Activity {
  id: string;
  type: "post" | "comment" | "reaction" | "follow";
  description: string;
  target_username?: string;
  target_id?: string;
  link: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface GroupedActivities {
  today: Activity[];
  yesterday: Activity[];
  thisWeek: Activity[];
  earlier: Activity[];
}

type TabType = "all" | "posts" | "comments" | "reactions" | "follows";

const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; bgClass: string }> = {
  post: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    bgClass: "bg-blue-500",
  },
  comment: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    bgClass: "bg-green-500",
  },
  reaction: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgClass: "bg-orange-500",
  },
  follow: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    bgClass: "bg-purple-500",
  },
};

const DATE_PRESETS = [
  { label: "All time", value: "all" },
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
];

function groupActivitiesByDate(activities: Activity[]): GroupedActivities {
  const groups: GroupedActivities = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  activities.forEach((activity) => {
    const date = new Date(activity.created_at);

    if (isToday(date)) {
      groups.today.push(activity);
    } else if (isYesterday(date)) {
      groups.yesterday.push(activity);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(activity);
    } else {
      groups.earlier.push(activity);
    }
  });

  return groups;
}

export default function ActivityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [datePreset, setDatePreset] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Calculate date range from preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (datePreset) {
      case "7days":
        return {
          startDate: startOfDay(subDays(now, 7)).toISOString(),
          endDate: endOfDay(now).toISOString(),
        };
      case "30days":
        return {
          startDate: startOfDay(subDays(now, 30)).toISOString(),
          endDate: endOfDay(now).toISOString(),
        };
      case "90days":
        return {
          startDate: startOfDay(subDays(now, 90)).toISOString(),
          endDate: endOfDay(now).toISOString(),
        };
      default:
        return { startDate: null, endDate: null };
    }
  }, [datePreset]);

  // Fetch activities
  const fetchActivities = useCallback(async (offset = 0) => {
    if (!session?.user?.email) return;

    try {
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams({
        email: session.user.email,
        type: activeTab,
        limit: "50",
        offset: offset.toString(),
      });

      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/activity?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        if (offset === 0) {
          setActivities(data.activities || []);
        } else {
          setActivities(prev => [...prev, ...(data.activities || [])]);
        }
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [session?.user?.email, activeTab, getDateRange]);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetchActivities(0);
    }
  }, [status, fetchActivities]);

  // Reset and refetch when tab or date changes
  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      setActivities([]);
      fetchActivities(0);
    }
  }, [activeTab, datePreset]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    setLoadingMore(true);
    fetchActivities(activities.length);
  };

  if (status === "loading" || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkTheme ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const groupedActivities = groupActivitiesByDate(activities);

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "posts", label: "Posts" },
    { id: "comments", label: "Comments" },
    { id: "reactions", label: "Reactions" },
    { id: "follows", label: "Follows" },
  ];

  const renderActivityGroup = (title: string, items: Activity[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3
          className={`text-sm font-semibold mb-3 px-1 ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((activity) => {
            const iconConfig = ACTIVITY_ICONS[activity.type];

            return (
              <Link
                key={activity.id}
                href={activity.link}
                className={`block rounded-xl p-4 transition-all ${
                  isDarkTheme
                    ? "bg-slate-900/50 hover:bg-slate-800/50 border-slate-800"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                } border`}
              >
                <div className="flex items-start gap-3">
                  {/* Activity Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconConfig.bgClass} text-white`}
                  >
                    {iconConfig.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        isDarkTheme ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {activity.description}
                    </p>
                    {typeof activity.metadata?.preview === "string" && activity.metadata.preview && (
                      <p
                        className={`text-xs mt-1 truncate ${
                          isDarkTheme ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        "{activity.metadata.preview}..."
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isDarkTheme ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 ${
                        isDarkTheme ? "text-slate-600" : "text-slate-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const hasActivities = activities.length > 0;

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkTheme ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme
            ? "bg-slate-950/80 border-white/10"
            : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Internship.sg"
              className={`h-7 sm:h-8 w-auto ${
                isDarkTheme ? "brightness-0 invert" : ""
              }`}
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDarkTheme
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg font-medium text-sm ${
                isDarkTheme
                  ? "text-slate-300 hover:bg-white/10"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Dashboard
            </Link>

            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                }`}
              >
                <span className="text-red-600 font-semibold text-sm">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              isDarkTheme ? "text-white" : "text-slate-900"
            }`}
          >
            Activity History
          </h1>
          <p
            className={`text-sm mt-1 ${
              isDarkTheme ? "text-slate-400" : "text-slate-600"
            }`}
          >
            See everything you have done on the platform
          </p>
        </div>

        {/* Tabs */}
        <div
          className={`flex overflow-x-auto gap-1 p-1 rounded-xl mb-4 ${
            isDarkTheme ? "bg-slate-900/50" : "bg-slate-100"
          }`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? isDarkTheme
                    ? "bg-white/10 text-white"
                    : "bg-white text-slate-900 shadow-sm"
                  : isDarkTheme
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isDarkTheme
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {DATE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Activities List */}
        {hasActivities ? (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDarkTheme
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="p-4">
              {renderActivityGroup("Today", groupedActivities.today)}
              {renderActivityGroup("Yesterday", groupedActivities.yesterday)}
              {renderActivityGroup("This Week", groupedActivities.thisWeek)}
              {renderActivityGroup("Earlier", groupedActivities.earlier)}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkTheme
                        ? "bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
                    }`}
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Loading...
                      </span>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div
            className={`rounded-2xl border p-12 text-center ${
              isDarkTheme
                ? "bg-slate-900/50 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  isDarkTheme ? "text-slate-600" : "text-slate-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2
              className={`text-xl font-semibold mb-2 ${
                isDarkTheme ? "text-white" : "text-slate-900"
              }`}
            >
              No activity yet
            </h2>
            <p
              className={`text-sm mb-6 ${
                isDarkTheme ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {activeTab === "all"
                ? "Start engaging with the community to see your activity here!"
                : `You have no ${activeTab} activity in this time period.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/home"
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-500/25"
              >
                Explore Feed
              </Link>
              <Link
                href="/network"
                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Find People
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 mt-12 ${
          isDarkTheme ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div
          className={`max-w-3xl mx-auto px-4 text-center text-sm ${
            isDarkTheme ? "text-slate-500" : "text-slate-500"
          }`}
        >
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
