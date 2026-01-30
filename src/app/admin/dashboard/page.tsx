"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalInterviews: number;
  averageScore: number;
  interviewsToday: number;
  interviewsThisWeek: number;
  interviewsThisMonth: number;
  newUsersThisMonth: number;
  totalPosts: number;
  postsToday: number;
  totalJobs: number;
  activeJobs: number;
  totalReports: number;
  pendingReports: number;
  totalFeedback: number;
  newFeedback: number;
  recentUsers: RecentUser[];
  recentReports: Report[];
  recentFeedback: Feedback[];
  recentActivity: Activity[];
  userGrowthByDay: { day: string; count: number }[];
}

interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  role: string;
  subscription_tier: string;
  created_at: string;
  is_banned?: boolean;
  is_verified?: boolean;
}

interface Report {
  id: string;
  reporter_email: string;
  reported_email: string | null;
  post_id: string | null;
  comment_id: string | null;
  report_type: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface Feedback {
  id: string;
  type: string;
  content: string;
  email: string | null;
  page: string | null;
  status: string;
  created_at: string;
}

interface Activity {
  type: string;
  email: string;
  content: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError("Failed to load admin data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleAction = async (action: string, params: Record<string, string>) => {
    setActionLoading(`${action}-${params.userId || params.reportId || params.feedbackId}`);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });
      if (!res.ok) throw new Error("Action failed");
      await fetchStats();
    } catch (err) {
      console.error(err);
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Simple bar chart component with inline styles
  const BarChart = ({ data, maxValue }: { data: { day: string; count: number }[]; maxValue: number }) => {
    const chartHeight = 120;
    const barWidth = 36;
    const gap = 8;

    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: `${gap}px`, height: `${chartHeight}px`, paddingTop: "8px" }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.count / maxValue) * (chartHeight - 24) : 0;
          return (
            <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: `${barWidth}px` }}>
              <div
                style={{
                  width: `${barWidth - 8}px`,
                  height: `${Math.max(barHeight, 4)}px`,
                  backgroundColor: "#dc2626",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.3s ease",
                }}
                title={`${item.day}: ${item.count}`}
              />
              <span style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>{item.day}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-red-200 px-6 py-4 rounded-xl">
        {error}
      </div>
    );
  }

  const maxUserGrowth = Math.max(...(stats?.userGrowthByDay.map((d) => d.count) || [1]));

  // Mock engagement data (you can extend the API to return real data)
  const engagementData = [
    { day: "Mon", count: stats?.interviewsThisWeek ? Math.floor(stats.interviewsThisWeek / 7) : 0 },
    { day: "Tue", count: stats?.interviewsThisWeek ? Math.floor(stats.interviewsThisWeek / 6) : 0 },
    { day: "Wed", count: stats?.interviewsThisWeek ? Math.floor(stats.interviewsThisWeek / 5) : 0 },
    { day: "Thu", count: stats?.interviewsThisWeek ? Math.floor(stats.interviewsThisWeek / 4) : 0 },
    { day: "Fri", count: stats?.interviewsThisWeek ? Math.floor(stats.interviewsThisWeek / 3) : 0 },
    { day: "Sat", count: stats?.interviewsToday || 0 },
    { day: "Sun", count: stats?.interviewsToday || 0 },
  ];
  const maxEngagement = Math.max(...engagementData.map((d) => d.count), 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Platform overview, analytics, and quick actions</p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalUsers.toLocaleString() || 0}</p>
          <p className="text-xs text-green-400 mt-1">+{stats?.newUsersThisMonth || 0} this month</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Posts Today</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.postsToday || 0}</p>
          <p className="text-xs text-slate-400 mt-1">{stats?.totalPosts.toLocaleString() || 0} total posts</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Active Jobs</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.activeJobs || 0}</p>
          <p className="text-xs text-slate-400 mt-1">{stats?.totalJobs || 0} total listings</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Pending Reports</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.pendingReports || 0}</p>
          <p className="text-xs text-slate-400 mt-1">{stats?.totalReports || 0} total reports</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Manage Users
          </Link>
          <Link
            href="#reports"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("reports")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            View Reports
            {(stats?.pendingReports || 0) > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                {stats?.pendingReports}
              </span>
            )}
          </Link>
          <Link
            href="#feedback"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("feedback")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            View Feedback
            {(stats?.newFeedback || 0) > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                {stats?.newFeedback}
              </span>
            )}
          </Link>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
          <Link
            href="/admin/content"
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Content
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth (Last 7 Days)</h3>
          <div className="flex justify-center">
            <BarChart data={stats?.userGrowthByDay || []} maxValue={maxUserGrowth} />
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            {stats?.newUsersThisMonth || 0} new users this month
          </p>
        </div>

        {/* Engagement Chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Interview Activity (Last 7 Days)</h3>
          <div className="flex justify-center">
            <BarChart data={engagementData} maxValue={maxEngagement} />
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            {stats?.interviewsThisWeek || 0} interviews this week
          </p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <p className="text-sm text-slate-400">Latest posts and activity on the platform</p>
        </div>
        {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700 max-h-64 overflow-y-auto">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === "post" ? "bg-blue-600/20" : "bg-green-600/20"
                  }`}>
                    {activity.type === "post" ? (
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">
                      <span className="font-medium text-white">{activity.email}</span>
                      {" "}
                      {activity.type === "post" ? "created a post" : "completed an interview"}
                    </p>
                    {activity.content && (
                      <p className="text-sm text-slate-400 truncate mt-1">{activity.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tables Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Users</h2>
              <p className="text-sm text-slate-400">Latest signups</p>
            </div>
            <Link
              href="/admin/users"
              className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
            >
              View All
            </Link>
          </div>
          {(!stats?.recentUsers || stats.recentUsers.length === 0) ? (
            <div className="p-12 text-center">
              <p className="text-slate-400">No users yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700 max-h-80 overflow-y-auto">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.image_url ? (
                        <img src={user.image_url} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{user.name || "Unnamed"}</p>
                          {user.is_verified && (
                            <span className="text-blue-400" title="Verified">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          {user.is_banned && (
                            <span className="px-1.5 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">Banned</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!user.is_verified && (
                        <button
                          onClick={() => handleAction("verify_user", { userId: user.id })}
                          disabled={actionLoading === `verify_user-${user.id}`}
                          className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded transition-colors disabled:opacity-50"
                          title="Verify User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {user.is_banned ? (
                        <button
                          onClick={() => handleAction("unban_user", { userId: user.id })}
                          disabled={actionLoading === `unban_user-${user.id}`}
                          className="p-1.5 text-green-400 hover:bg-green-600/20 rounded transition-colors disabled:opacity-50"
                          title="Unban User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to ban this user?")) {
                              handleAction("ban_user", { userId: user.id });
                            }
                          }}
                          disabled={actionLoading === `ban_user-${user.id}`}
                          className="p-1.5 text-red-400 hover:bg-red-600/20 rounded transition-colors disabled:opacity-50"
                          title="Ban User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Joined {formatRelativeTime(user.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Reports Table */}
        <div id="reports" className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Pending Reports</h2>
            <p className="text-sm text-slate-400">Reports requiring review</p>
          </div>
          {(!stats?.recentReports || stats.recentReports.length === 0) ? (
            <div className="p-12 text-center">
              <p className="text-slate-400">No pending reports</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700 max-h-80 overflow-y-auto">
              {stats.recentReports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          report.report_type === "spam" ? "bg-yellow-600/20 text-yellow-400" :
                          report.report_type === "harassment" ? "bg-red-600/20 text-red-400" :
                          report.report_type === "inappropriate" ? "bg-orange-600/20 text-orange-400" :
                          "bg-slate-600/20 text-slate-400"
                        }`}>
                          {report.report_type}
                        </span>
                        <span className="text-xs text-slate-500">{formatRelativeTime(report.created_at)}</span>
                      </div>
                      <p className="text-sm text-white">
                        {report.reported_email ? `User: ${report.reported_email}` :
                         report.post_id ? `Post ID: ${report.post_id}` :
                         `Comment ID: ${report.comment_id}`}
                      </p>
                      {report.description && (
                        <p className="text-sm text-slate-400 truncate mt-1">{report.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">By: {report.reporter_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction("dismiss_report", { reportId: report.id })}
                        disabled={actionLoading === `dismiss_report-${report.id}`}
                        className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Take action on this report? This may ban the reported user.")) {
                            handleAction("action_report", {
                              reportId: report.id,
                              email: report.reported_email || "",
                            });
                          }
                        }}
                        disabled={actionLoading === `action_report-${report.id}`}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Action
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest Feedback */}
      <div id="feedback" className="mt-6 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Latest Feedback</h2>
          <p className="text-sm text-slate-400">User feedback and suggestions</p>
        </div>
        {(!stats?.recentFeedback || stats.recentFeedback.length === 0) ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No feedback yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {stats.recentFeedback.slice(0, 5).map((feedback) => (
              <div key={feedback.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        feedback.type === "bug" ? "bg-red-600/20 text-red-400" :
                        feedback.type === "feature" ? "bg-blue-600/20 text-blue-400" :
                        "bg-slate-600/20 text-slate-400"
                      }`}>
                        {feedback.type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        feedback.status === "new" ? "bg-green-600/20 text-green-400" :
                        feedback.status === "resolved" ? "bg-slate-600/20 text-slate-400" :
                        "bg-yellow-600/20 text-yellow-400"
                      }`}>
                        {feedback.status}
                      </span>
                      <span className="text-xs text-slate-500">{formatRelativeTime(feedback.created_at)}</span>
                    </div>
                    <p className="text-sm text-white">{feedback.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {feedback.email && <span>From: {feedback.email}</span>}
                      {feedback.page && <span>Page: {feedback.page}</span>}
                    </div>
                  </div>
                  {feedback.status !== "resolved" && (
                    <button
                      onClick={() => handleAction("resolve_feedback", { feedbackId: feedback.id })}
                      disabled={actionLoading === `resolve_feedback-${feedback.id}`}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
