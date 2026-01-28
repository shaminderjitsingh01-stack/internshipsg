"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  auth_provider: string | null;
  role: string;
  subscription_tier: string;
  school: string | null;
  created_at: string;
  last_login_at: string | null;
  interview_count: number;
  average_score: number | null;
  last_interview_at: string | null;
  current_streak: number;
  total_xp: number;
}

interface UserFilters {
  school: string;
  tier: string;
  activity: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilters>({
    school: "",
    tier: "",
    activity: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(search && { search }),
        ...(filters.school && { school: filters.school }),
        ...(filters.tier && { tier: filters.tier }),
        ...(filters.activity && { activity: filters.activity }),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const applyFilters = () => {
    setPage(1);
    fetchUsers();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ school: "", tier: "", activity: "" });
    setPage(1);
    fetchUsers();
    setShowFilters(false);
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "School",
      "Auth Provider",
      "Subscription Tier",
      "Interviews",
      "Avg Score",
      "Streak",
      "XP",
      "Joined",
      "Last Login",
      "Last Interview",
    ];

    const csvContent = [
      headers.join(","),
      ...users.map((u) =>
        [
          `"${u.name || ""}"`,
          u.email,
          `"${u.school || getSchoolFromEmail(u.email)}"`,
          u.auth_provider || "credentials",
          u.subscription_tier,
          u.interview_count,
          u.average_score?.toFixed(1) || "",
          u.current_streak || 0,
          u.total_xp || 0,
          u.created_at,
          u.last_login_at || "",
          u.last_interview_at || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSchoolFromEmail = (email: string): string => {
    const domain = email.split("@")[1]?.toLowerCase() || "";
    const schoolMap: Record<string, string> = {
      "nus.edu.sg": "NUS",
      "u.nus.edu": "NUS",
      "ntu.edu.sg": "NTU",
      "e.ntu.edu.sg": "NTU",
      "smu.edu.sg": "SMU",
      "sutd.edu.sg": "SUTD",
      "sit.edu.sg": "SIT",
      "suss.edu.sg": "SUSS",
      "sp.edu.sg": "Singapore Poly",
      "np.edu.sg": "Ngee Ann Poly",
      "tp.edu.sg": "Temasek Poly",
      "rp.edu.sg": "Republic Poly",
      "nyp.edu.sg": "Nanyang Poly",
    };

    for (const [key, value] of Object.entries(schoolMap)) {
      if (domain.includes(key)) return value;
    }
    return "Other";
  };

  const getActivityStatus = (user: User): { label: string; color: string } => {
    if (!user.last_login_at) return { label: "Never Active", color: "text-slate-500" };

    const lastLogin = new Date(user.last_login_at);
    const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLogin <= 1) return { label: "Active Today", color: "text-green-400" };
    if (daysSinceLogin <= 7) return { label: "Active This Week", color: "text-blue-400" };
    if (daysSinceLogin <= 30) return { label: "Active This Month", color: "text-yellow-400" };
    return { label: "Inactive", color: "text-red-400" };
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
          <p className="text-slate-400">Manage and view all platform users</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Search
          </button>
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-xl font-medium transition-colors flex items-center gap-2 ${
            showFilters || filters.school || filters.tier || filters.activity
              ? "bg-red-600 border-red-600 text-white"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {(filters.school || filters.tier || filters.activity) && (
            <span className="w-2 h-2 bg-white rounded-full" />
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">School</label>
              <select
                value={filters.school}
                onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              >
                <option value="">All Schools</option>
                <option value="NUS">NUS</option>
                <option value="NTU">NTU</option>
                <option value="SMU">SMU</option>
                <option value="SUTD">SUTD</option>
                <option value="SIT">SIT</option>
                <option value="SUSS">SUSS</option>
                <option value="Polytechnic">Polytechnic</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Subscription Tier</label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              >
                <option value="">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Activity</label>
              <select
                value={filters.activity}
                onChange={(e) => setFilters({ ...filters, activity: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              >
                <option value="">All Activity</option>
                <option value="active_today">Active Today</option>
                <option value="active_week">Active This Week</option>
                <option value="active_month">Active This Month</option>
                <option value="inactive">Inactive (30+ days)</option>
                <option value="never">Never Active</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 text-sm text-slate-400">
        Showing {users.length} of {total} users
      </div>

      <div className="flex gap-6">
        {/* Users Table */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">School</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Interviews</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => {
                    const activityStatus = getActivityStatus(user);
                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-700/50 transition-colors cursor-pointer ${
                          selectedUser?.id === user.id ? "bg-slate-700/50" : ""
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-6 py-4">
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
                              <p className="font-medium text-white">{user.name || "Unnamed"}</p>
                              <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300">{user.school || getSchoolFromEmail(user.email)}</span>
                        </td>
                        <td className="px-6 py-4 text-white">{user.interview_count}</td>
                        <td className="px-6 py-4">
                          {user.average_score !== null ? (
                            <span className="text-white">{user.average_score.toFixed(1)}/10</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${activityStatus.color}`}>{activityStatus.label}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">{formatDate(user.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-700 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* User Detail Panel */}
        {selectedUser && (
          <div className="w-80 bg-slate-800 rounded-xl border border-slate-700 p-6 sticky top-24 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {selectedUser.image_url ? (
                <img src={selectedUser.image_url} alt="" className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{selectedUser.name || "Unnamed"}</p>
                <p className="text-sm text-slate-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{selectedUser.interview_count}</div>
                  <div className="text-xs text-slate-400">Interviews</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {selectedUser.average_score?.toFixed(1) || "-"}
                  </div>
                  <div className="text-xs text-slate-400">Avg Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">{selectedUser.current_streak || 0}</div>
                  <div className="text-xs text-slate-400">Day Streak</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">{selectedUser.total_xp || 0}</div>
                  <div className="text-xs text-slate-400">Total XP</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">School</span>
                  <span className="text-white">{selectedUser.school || getSchoolFromEmail(selectedUser.email)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth</span>
                  <span className="text-white capitalize">{selectedUser.auth_provider || "credentials"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tier</span>
                  <span className={`capitalize font-medium ${
                    selectedUser.subscription_tier === "pro" ? "text-yellow-400" :
                    selectedUser.subscription_tier === "premium" ? "text-purple-400" : "text-slate-300"
                  }`}>
                    {selectedUser.subscription_tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Joined</span>
                  <span className="text-white">{formatDate(selectedUser.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Login</span>
                  <span className="text-white">{formatDate(selectedUser.last_login_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Interview</span>
                  <span className="text-white">{formatDate(selectedUser.last_interview_at)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
