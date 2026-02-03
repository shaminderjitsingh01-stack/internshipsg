'use client';

import { useState, useEffect } from 'react';
import { Header, Footer } from '@/components';

interface ScraperResult {
  success?: boolean;
  message?: string;
  error?: string;
  jobsScraped?: number;
  companiesUpdated?: number;
  newJobs?: number;
  duration?: string;
}

export default function AdminScraperPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ScraperResult | null>(null);
  const [stats, setStats] = useState<{ jobs: number; companies: number } | null>(null);
  const [error, setError] = useState('');

  // Simple password check (set ADMIN_PASSWORD in env)
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'internship2026';

  useEffect(() => {
    // Check if already authenticated
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
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const runScraper = async () => {
    setIsRunning(true);
    setResult(null);
    setError('');

    const startTime = Date.now();

    try {
      const res = await fetch('/api/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (res.ok) {
        setResult({ ...data, duration: `${duration}s` });
        fetchStats(); // Refresh stats after scraping
      } else {
        setError(data.error || 'Scraper failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsRunning(false);
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Access</h1>
                <p className="text-[var(--muted)] mt-2">Enter password to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Scraper Admin</h1>
              <p className="text-[var(--muted)] mt-1">Manage job scraping operations</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{stats?.jobs ?? '-'}</p>
                  <p className="text-[var(--muted)]">Total Jobs</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--foreground)]">{stats?.companies ?? '-'}</p>
                  <p className="text-[var(--muted)]">Companies</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scraper Control */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Run Scraper</h2>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <button
                onClick={runScraper}
                disabled={isRunning}
                className={`px-8 py-4 font-semibold rounded-xl transition-all flex items-center gap-3 ${
                  isRunning
                    ? 'bg-zinc-700 text-[var(--muted)] cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                }`}
              >
                {isRunning ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scraping...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Run Scraper Now
                  </>
                )}
              </button>

              <p className="text-[var(--muted)] text-sm">
                Scrapes job listings from company career pages and updates the database.
                <br />
                Auto-runs daily at 6:00 AM SGT via Vercel Cron.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="mt-6 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Scraper Completed</span>
                  {result.duration && (
                    <span className="text-emerald-500/70">({result.duration})</span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.jobsScraped !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-[var(--foreground)]">{result.jobsScraped}</p>
                      <p className="text-xs text-[var(--muted)]">Jobs Scraped</p>
                    </div>
                  )}
                  {result.newJobs !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-emerald-400">{result.newJobs}</p>
                      <p className="text-xs text-[var(--muted)]">New Jobs</p>
                    </div>
                  )}
                  {result.companiesUpdated !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-[var(--foreground)]">{result.companiesUpdated}</p>
                      <p className="text-xs text-[var(--muted)]">Companies</p>
                    </div>
                  )}
                </div>

                {result.message && (
                  <p className="mt-4 text-[var(--muted)] text-sm">{result.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Scraper Info</h3>
            <ul className="space-y-3 text-[var(--muted)] text-sm">
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-0.5">*</span>
                <span>The scraper fetches internship listings from major Singapore companies</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-0.5">*</span>
                <span>Duplicate jobs are automatically detected and skipped</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-0.5">*</span>
                <span>Jobs older than 90 days are automatically marked inactive</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-0.5">*</span>
                <span>Vercel Cron runs this automatically every day at 6:00 AM SGT</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
