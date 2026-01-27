"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalInterviews: number;
  averageScore: number;
  interviewsToday: number;
  interviewsThisWeek: number;
  interviewsThisMonth: number;
  newUsersThisMonth: number;
}

interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  interview_count: number;
  average_score: number | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users?limit=5"),
        ]);

        if (!statsRes.ok || !usersRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const statsData = await statsRes.json();
        const usersData = await usersRes.json();

        setStats(statsData);
        setRecentUsers(usersData.users || []);
      } catch (err) {
        setError("Failed to load admin data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Platform overview and analytics</p>
      </div>

      {/* Stats Grid */}
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
          <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-green-400 mt-1">+{stats?.newUsersThisMonth || 0} this month</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Total Interviews</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalInterviews || 0}</p>
          <p className="text-xs text-slate-400 mt-1">{stats?.interviewsThisMonth || 0} this month</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Avg Score</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.averageScore || 0}<span className="text-lg text-slate-400">/10</span></p>
          <p className="text-xs text-slate-400 mt-1">Across all interviews</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Today</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.interviewsToday || 0}</p>
          <p className="text-xs text-slate-400 mt-1">{stats?.interviewsThisWeek || 0} this week</p>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
            <p className="text-sm text-slate-400">Latest signups on the platform</p>
          </div>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
          >
            View All
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No users yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {recentUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name || "Unnamed"}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{user.interview_count} interviews</p>
                    <p className="text-xs text-slate-400">Joined {formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
