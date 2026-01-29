"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface TopPost {
  id: string;
  content: string;
  reactions: number;
  comments: number;
  shares: number;
  engagement: number;
  createdAt: string;
}

interface InsightsData {
  profileViews: {
    total: number;
    change: number;
    chartData: ChartDataPoint[];
  };
  postPerformance: {
    totalPosts: number;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    totalEngagement: number;
  };
  topPosts: TopPost[];
  followerGrowth: {
    total: number;
    thisWeek: number;
    weekChange: number;
    thisMonth: number;
  };
  profileCompletion: {
    percentage: number;
    missingFields: string[];
  };
  searchAppearances: {
    total: number;
    change: number;
  };
  viewerDemographics: {
    industries: { name: string; count: number }[];
    schools: { name: string; count: number }[];
    totalViewers: number;
  };
}

export default function InsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch insights data
  useEffect(() => {
    const fetchInsights = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`/api/insights?email=${encodeURIComponent(session.user.email)}`);
        if (!res.ok) throw new Error("Failed to fetch insights");
        const data = await res.json();
        setInsights(data);
      } catch (err) {
        setError("Failed to load insights data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchInsights();
    }
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) return null;

  if (error || !insights) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className={`p-6 rounded-xl border ${isDarkTheme ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {error || "No data available"}
          </div>
        </div>
      </div>
    );
  }

  // Find max value for chart scaling
  const maxViews = Math.max(...insights.profileViews.chartData.map(d => d.count), 1);

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Dashboard</Link>
            <Link href="/network" className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Network</Link>
            <Link href="/settings" className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Settings</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
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

            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                <span className="text-red-600 font-semibold text-sm">{session.user?.name?.charAt(0) || "U"}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Your Insights
          </h1>
          <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Track your profile performance and engagement over the last 30 days
          </p>
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Profile Views"
            value={insights.profileViews.total}
            change={insights.profileViews.change}
            icon={<EyeIcon />}
            isDarkTheme={isDarkTheme}
          />
          <StatCard
            title="Total Followers"
            value={insights.followerGrowth.total}
            subtitle={`+${insights.followerGrowth.thisWeek} this week`}
            icon={<UsersIcon />}
            isDarkTheme={isDarkTheme}
          />
          <StatCard
            title="Search Appearances"
            value={insights.searchAppearances.total}
            change={insights.searchAppearances.change}
            icon={<SearchIcon />}
            isDarkTheme={isDarkTheme}
          />
          <StatCard
            title="Total Engagement"
            value={insights.postPerformance.totalEngagement}
            subtitle={`${insights.postPerformance.totalPosts} posts`}
            icon={<ChartIcon />}
            isDarkTheme={isDarkTheme}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Views Chart */}
            <div className={`rounded-xl border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Profile Views
                </h2>
                <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Last 30 days
                </span>
              </div>

              {/* SVG Line/Bar Chart */}
              <div className="h-48 flex items-end gap-1">
                {insights.profileViews.chartData.map((point, index) => {
                  const height = maxViews > 0 ? (point.count / maxViews) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 relative group"
                    >
                      <div
                        className={`w-full rounded-t transition-all ${isDarkTheme ? 'bg-red-600/80 hover:bg-red-500' : 'bg-red-500 hover:bg-red-600'}`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {/* Tooltip */}
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isDarkTheme ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>
                        {point.date}: {point.count} views
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{insights.profileViews.chartData[0]?.date}</span>
                <span>{insights.profileViews.chartData[insights.profileViews.chartData.length - 1]?.date}</span>
              </div>
            </div>

            {/* Post Performance */}
            <div className={`rounded-xl border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Post Performance
              </h2>

              <div className="grid grid-cols-4 gap-4">
                <div className={`text-center p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {insights.postPerformance.totalPosts}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Posts</p>
                </div>
                <div className={`text-center p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-2xl font-bold text-red-500`}>
                    {insights.postPerformance.totalReactions}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Reactions</p>
                </div>
                <div className={`text-center p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-2xl font-bold text-blue-500`}>
                    {insights.postPerformance.totalComments}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Comments</p>
                </div>
                <div className={`text-center p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-2xl font-bold text-green-500`}>
                    {insights.postPerformance.totalShares}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Shares</p>
                </div>
              </div>
            </div>

            {/* Top Performing Posts */}
            <div className={`rounded-xl border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Top Performing Posts
              </h2>

              {insights.topPosts.length === 0 ? (
                <div className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  <p className="mb-2">No posts yet</p>
                  <Link href="/home" className="text-red-500 hover:underline text-sm">
                    Create your first post
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.topPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className={`p-4 rounded-xl flex items-start gap-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}
                    >
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        isDarkTheme ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {post.content}
                        </p>
                        <div className={`flex items-center gap-4 mt-2 text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>{post.reactions} reactions</span>
                          <span>{post.comments} comments</span>
                          <span>{post.shares} shares</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Follower Growth */}
            <div className={`rounded-xl border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Follower Growth
              </h2>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>This Week</span>
                    <ChangeIndicator value={insights.followerGrowth.weekChange} isDarkTheme={isDarkTheme} />
                  </div>
                  <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    +{insights.followerGrowth.thisWeek}
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>This Month</span>
                  <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    +{insights.followerGrowth.thisMonth}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className={`rounded-xl border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Profile Completion
              </h2>

              {/* Progress Ring */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={isDarkTheme ? "#1e293b" : "#e2e8f0"}
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={insights.profileCompletion.percentage === 100 ? "#22c55e" : "#ef4444"}
                      strokeWidth="3"
                      strokeDasharray={`${insights.profileCompletion.percentage} ${100 - insights.profileCompletion.percentage}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      {insights.profileCompletion.percentage}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {insights.profileCompletion.percentage === 100 ? "Complete!" : "Almost there!"}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    {insights.profileCompletion.missingFields.length} items remaining
                  </p>
                </div>
              </div>

              {/* Missing Fields */}
              {insights.profileCompletion.missingFields.length > 0 && (
                <div className="space-y-2">
                  {insights.profileCompletion.missingFields.slice(0, 3).map((field, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}`}
                    >
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {field}
                    </div>
                  ))}
                  <Link
                    href="/settings"
                    className="block text-center py-2 text-sm text-red-500 hover:underline"
                  >
                    Complete your profile
                  </Link>
                </div>
              )}
            </div>

            {/* Who's Viewing */}
            <div className={`rounded-xl border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Who's Viewing
              </h2>

              <p className={`text-sm mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                {insights.viewerDemographics.totalViewers} unique viewers this month
              </p>

              {/* Industries */}
              {insights.viewerDemographics.industries.length > 0 && (
                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    By Industry
                  </h3>
                  <div className="space-y-2">
                    {insights.viewerDemographics.industries.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={`w-16 h-2 rounded-full overflow-hidden ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{
                                width: `${(item.count / insights.viewerDemographics.industries[0].count) * 100}%`
                              }}
                            />
                          </div>
                          <span className={`text-sm font-medium w-6 text-right ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schools */}
              {insights.viewerDemographics.schools.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    By School
                  </h3>
                  <div className="space-y-2">
                    {insights.viewerDemographics.schools.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className={`text-sm truncate mr-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.name}
                        </span>
                        <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.viewerDemographics.industries.length === 0 && insights.viewerDemographics.schools.length === 0 && (
                <p className={`text-sm text-center py-4 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  Not enough data yet
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 mt-12 ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`max-w-6xl mx-auto px-4 text-center text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  subtitle,
  icon,
  isDarkTheme,
}: {
  title: string;
  value: number;
  change?: number;
  subtitle?: string;
  icon: React.ReactNode;
  isDarkTheme: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
        {value.toLocaleString()}
      </p>
      <div className="flex items-center justify-between mt-1">
        <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
        {change !== undefined && <ChangeIndicator value={change} isDarkTheme={isDarkTheme} />}
        {subtitle && (
          <span className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

// Change Indicator Component
function ChangeIndicator({ value, isDarkTheme }: { value: number; isDarkTheme: boolean }) {
  if (value === 0) return null;

  const isPositive = value > 0;

  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${
      isPositive
        ? 'text-green-500'
        : 'text-red-500'
    }`}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {Math.abs(value)}%
    </span>
  );
}

// Icons
function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
