'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components';

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalCompanies: number;
  verifiedCompanies: number;
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  jobsThisMonth: number;
  applicationsThisMonth: number;
}

interface RecentActivity {
  type: 'job' | 'application' | 'company' | 'user';
  title: string;
  description: string;
  time: string;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'internship2026';

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchStats();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      fetchStats();
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
                <p className="text-[var(--muted)] mt-2">Enter password to access</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin Password"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:opacity-90"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
              <p className="text-[var(--muted)] mt-1">Monitor and manage internship.sg</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/scraper"
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
              >
                Scraper
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Logout
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-[var(--muted)] text-sm">Total Jobs</span>
                  </div>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{stats?.totalJobs || 0}</p>
                  <p className="text-sm text-emerald-400 mt-1">{stats?.activeJobs || 0} active</p>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-[var(--muted)] text-sm">Companies</span>
                  </div>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{stats?.totalCompanies || 0}</p>
                  <p className="text-sm text-emerald-400 mt-1">{stats?.verifiedCompanies || 0} verified</p>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-[var(--muted)] text-sm">Users</span>
                  </div>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{stats?.totalUsers || 0}</p>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-[var(--muted)] text-sm">Applications</span>
                  </div>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{stats?.totalApplications || 0}</p>
                  <p className="text-sm text-yellow-400 mt-1">{stats?.pendingApplications || 0} pending</p>
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">This Month</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted)]">New Jobs Posted</span>
                      <span className="text-2xl font-bold text-[var(--foreground)]">{stats?.jobsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted)]">Applications Received</span>
                      <span className="text-2xl font-bold text-[var(--foreground)]">{stats?.applicationsThisMonth || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/admin/scraper"
                      className="p-4 bg-zinc-800 rounded-xl text-center hover:bg-zinc-700 transition-colors"
                    >
                      <svg className="w-6 h-6 mx-auto text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-white text-sm">Run Scraper</span>
                    </Link>
                    <Link
                      href="/companies"
                      className="p-4 bg-zinc-800 rounded-xl text-center hover:bg-zinc-700 transition-colors"
                    >
                      <svg className="w-6 h-6 mx-auto text-pink-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                      <span className="text-white text-sm">Companies</span>
                    </Link>
                    <Link
                      href="/jobs"
                      className="p-4 bg-zinc-800 rounded-xl text-center hover:bg-zinc-700 transition-colors"
                    >
                      <svg className="w-6 h-6 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                      </svg>
                      <span className="text-white text-sm">Jobs</span>
                    </Link>
                    <Link
                      href="/admin/privacy"
                      className="p-4 bg-zinc-800 rounded-xl text-center hover:bg-zinc-700 transition-colors"
                    >
                      <svg className="w-6 h-6 mx-auto text-emerald-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-white text-sm">PDPA Settings</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* PDPA Compliance Status */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  PDPA Compliance Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Consent Collection</span>
                    </div>
                    <p className="text-[var(--muted)] text-sm">Cookie consent banner active</p>
                  </div>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Data Access</span>
                    </div>
                    <p className="text-[var(--muted)] text-sm">Users can view/export data</p>
                  </div>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Data Deletion</span>
                    </div>
                    <p className="text-[var(--muted)] text-sm">Account deletion available</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
