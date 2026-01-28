"use client";

import { useState, useEffect } from "react";

interface OverviewStats {
  totalUsers: number;
  totalInterviews: number;
  averageScore: number;
  dailyActiveUsers: number;
}

interface ChartDataPoint {
  date: string;
  count?: number;
  avgScore?: number;
}

interface NameCountItem {
  name: string;
  count: number;
}

interface RetentionMetrics {
  weeklyRetention: number;
  monthlyRetention: number;
  totalActiveUsers: number;
}

interface AnalyticsData {
  overview: OverviewStats;
  userGrowth: ChartDataPoint[];
  interviewGrowth: ChartDataPoint[];
  averageScores: ChartDataPoint[];
  dailyActiveUsers: ChartDataPoint[];
  popularCompanies: NameCountItem[];
  schoolDistribution: NameCountItem[];
  signUpSources: NameCountItem[];
  retentionMetrics: RetentionMetrics;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChart, setActiveChart] = useState<"users" | "interviews" | "scores" | "dau">("users");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const analyticsData = await res.json();
        setData(analyticsData);
      } catch (err) {
        setError("Failed to load analytics data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-900/50 text-red-200 px-6 py-4 rounded-xl">
        {error || "No data available"}
      </div>
    );
  }

  const getChartData = () => {
    switch (activeChart) {
      case "users":
        return data.userGrowth;
      case "interviews":
        return data.interviewGrowth;
      case "scores":
        return data.averageScores;
      case "dau":
        return data.dailyActiveUsers;
      default:
        return data.userGrowth;
    }
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map((d) => d.count || d.avgScore || 0));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">Comprehensive platform metrics and insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={data.overview.totalUsers}
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Daily Active Users"
          value={data.overview.dailyActiveUsers}
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Total Interviews"
          value={data.overview.totalInterviews}
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="Avg Score"
          value={data.overview.averageScore}
          suffix="/10"
          icon={
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          color="yellow"
        />
      </div>

      {/* Main Chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Growth Trends</h2>
          <div className="flex gap-2">
            {[
              { key: "users", label: "Users" },
              { key: "interviews", label: "Interviews" },
              { key: "scores", label: "Avg Score" },
              { key: "dau", label: "DAU" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeChart === tab.key
                    ? "bg-red-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="h-64 flex items-end gap-1">
          {chartData.slice(-30).map((point, index) => {
            const value = point.count || point.avgScore || 0;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div
                key={index}
                className="flex-1 bg-red-600/80 hover:bg-red-500 rounded-t transition-colors relative group"
                style={{ height: `${Math.max(height, 2)}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {point.date}: {activeChart === "scores" ? value.toFixed(1) : value}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{chartData[0]?.date}</span>
          <span>{chartData[chartData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Grid: Popular Companies, School Distribution, Sign-up Sources, Retention */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Popular Roles/Companies */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Popular Roles</h2>
          <div className="space-y-3">
            {data.popularCompanies.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-slate-300">{item.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${(item.count / data.popularCompanies[0].count) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-medium w-10 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School Distribution (Pie Chart) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">School Distribution</h2>
          <div className="flex items-center gap-6">
            {/* Simple Donut visualization */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                {(() => {
                  const total = data.schoolDistribution.reduce((acc, s) => acc + s.count, 0);
                  let offset = 0;
                  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

                  return data.schoolDistribution.map((school, i) => {
                    const percentage = (school.count / total) * 100;
                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                    const strokeDashoffset = -offset;
                    offset += percentage;

                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={colors[i % colors.length]}
                        strokeWidth="3"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 18 18)"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {data.schoolDistribution.reduce((acc, s) => acc + s.count, 0)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {data.schoolDistribution.slice(0, 6).map((school, i) => {
                const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-cyan-500", "bg-blue-500"];
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
                    <span className="text-slate-300 flex-1">{school.name}</span>
                    <span className="text-white font-medium">{school.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sign-up Sources */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Sign-up Sources</h2>
          <div className="space-y-4">
            {data.signUpSources.map((source, index) => {
              const total = data.signUpSources.reduce((acc, s) => acc + s.count, 0);
              const percentage = Math.round((source.count / total) * 100);
              const icons: Record<string, React.ReactNode> = {
                Google: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                ),
                "Email/Password": (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                LinkedIn: (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                ),
              };

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {icons[source.name] || (
                      <div className="w-5 h-5 rounded-full bg-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300">{source.name}</span>
                      <span className="text-white font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Retention */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">User Retention</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {data.retentionMetrics.weeklyRetention}%
              </div>
              <div className="text-sm text-slate-400">7-Day Retention</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {data.retentionMetrics.monthlyRetention}%
              </div>
              <div className="text-sm text-slate-400">30-Day Retention</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-900 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Users (7 days)</span>
              <span className="text-white font-bold text-xl">
                {data.retentionMetrics.totalActiveUsers}
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Retention measures the percentage of users who return to the platform within the specified timeframe after initial signup.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "yellow";
}) {
  const colorClasses = {
    blue: "bg-blue-600/20",
    green: "bg-green-600/20",
    purple: "bg-purple-600/20",
    yellow: "bg-yellow-600/20",
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-slate-400 text-sm">{title}</span>
      </div>
      <p className="text-3xl font-bold text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-lg text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}
