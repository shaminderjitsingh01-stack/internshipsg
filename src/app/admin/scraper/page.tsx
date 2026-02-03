'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, Footer } from '@/components';

// Types
interface ScraperCompany {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  careers_url: string;
  industry: string | null;
  size: string | null;
  is_enabled: boolean;
  last_scraped_at: string | null;
  last_jobs_found: number;
  created_at: string;
  updated_at: string;
}

interface ScraperLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';
  companies_processed: number;
  jobs_found: number;
  jobs_added: number;
  jobs_skipped: number;
  errors: { company: string; error: string }[];
  created_at: string;
}

interface ScraperResult {
  success?: boolean;
  message?: string;
  error?: string;
  jobsScraped?: number;
  companiesUpdated?: number;
  newJobs?: number;
  duration?: string;
}

type TabType = 'scraper' | 'companies' | 'logs';

const INDUSTRIES = [
  'Technology',
  'Banking',
  'Fintech',
  'Consulting',
  'E-commerce',
  'FMCG',
  'Government',
  'Semiconductor',
  'Aviation',
  'Other',
];

const SIZES = ['50+', '100+', '500+', '1000+', '5000+', '10000+'];

export default function AdminScraperPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('scraper');

  // Scraper state
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ScraperResult | null>(null);
  const [stats, setStats] = useState<{ jobs: number; companies: number } | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<ScraperCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ScraperCompany | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website: '',
    careers_url: '',
    industry: '',
    size: '',
  });

  // Logs state
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'internship2026';

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchStats();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'companies') {
      fetchCompanies();
    } else if (isAuthenticated && activeTab === 'logs') {
      fetchLogs();
    }
  }, [isAuthenticated, activeTab]);

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
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

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const params = new URLSearchParams();
      if (companySearch) params.set('search', companySearch);
      const res = await fetch(`/api/admin/companies?${params}`);
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setCompaniesLoading(false);
    }
  }, [companySearch]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/scraper-logs?page=${logsPage}&limit=10`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLogsTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'companies') {
      const timer = setTimeout(() => fetchCompanies(), 300);
      return () => clearTimeout(timer);
    }
  }, [companySearch, fetchCompanies, isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'logs') {
      fetchLogs();
    }
  }, [logsPage, fetchLogs, isAuthenticated, activeTab]);

  const runScraper = async () => {
    setIsRunning(true);
    setResult(null);
    setError('');
    const startTime = Date.now();

    try {
      const res = await fetch('/api/scraper', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (res.ok) {
        setResult({ ...data, duration: `${duration}s` });
        fetchStats();
        if (activeTab === 'logs') fetchLogs();
      } else {
        setError(data.error || 'Scraper failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleCompany = async (company: ScraperCompany) => {
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !company.is_enabled }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === company.id ? { ...c, is_enabled: !c.is_enabled } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle company:', err);
    }
  };

  const deleteCompany = async (company: ScraperCompany) => {
    if (!confirm(`Are you sure you want to delete ${company.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      }
    } catch (err) {
      console.error('Failed to delete company:', err);
    }
  };

  const openAddModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', logo_url: '', website: '', careers_url: '', industry: '', size: '' });
    setShowModal(true);
  };

  const openEditModal = (company: ScraperCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      logo_url: company.logo_url || '',
      website: company.website || '',
      careers_url: company.careers_url,
      industry: company.industry || '',
      size: company.size || '',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        const res = await fetch(`/api/admin/companies/${editingCompany.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const data = await res.json();
          setCompanies((prev) =>
            prev.map((c) => (c.id === editingCompany.id ? data.company : c))
          );
          setShowModal(false);
        }
      } else {
        const res = await fetch('/api/admin/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const data = await res.json();
          setCompanies((prev) => [...prev, data.company].sort((a, b) => a.name.localeCompare(b.name)));
          setShowModal(false);
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to create company');
        }
      }
    } catch (err) {
      console.error('Failed to save company:', err);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-SG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'failed':
        return 'text-red-400 bg-red-500/10';
      case 'running':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-zinc-400 bg-zinc-500/10';
    }
  };

  // Login screen
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
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Scraper Admin</h1>
              <p className="text-[var(--muted)] mt-1">Manage companies, run scraper, and view logs</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
            {[
              { id: 'scraper' as TabType, label: 'Run Scraper', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
              { id: 'companies' as TabType, label: 'Companies', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { id: 'logs' as TabType, label: 'Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'scraper' && (
            <div className="space-y-8">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Run Scraper</h2>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <button
                    onClick={runScraper}
                    disabled={isRunning}
                    className={`px-8 py-4 font-semibold rounded-xl transition-all flex items-center gap-3 ${
                      isRunning ? 'bg-zinc-700 text-[var(--muted)] cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
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
                    Scrapes job listings from enabled company career pages and updates the database.
                    <br />
                    Auto-runs daily at 6:00 AM SGT via Vercel Cron.
                  </p>
                </div>

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

                {result && (
                  <div className="mt-6 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">Scraper Completed</span>
                      {result.duration && <span className="text-emerald-500/70">({result.duration})</span>}
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
                    {result.message && <p className="mt-4 text-[var(--muted)] text-sm">{result.message}</p>}
                  </div>
                )}
              </div>

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
          )}

          {activeTab === 'companies' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Company
                </button>
              </div>

              {/* Companies Table */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Industry</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Careers URL</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Last Scraped</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Jobs</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Enabled</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {companiesLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                            Loading companies...
                          </td>
                        </tr>
                      ) : companies.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                            No companies found
                          </td>
                        </tr>
                      ) : (
                        companies.map((company) => (
                          <tr key={company.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {company.logo_url ? (
                                  <img src={company.logo_url} alt="" className="w-8 h-8 rounded object-contain bg-white" />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center text-xs font-medium">
                                    {company.name.charAt(0)}
                                  </div>
                                )}
                                <span className="font-medium text-[var(--foreground)]">{company.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--muted)]">{company.industry || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[var(--muted)]">
                              <a
                                href={company.careers_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-purple-400 truncate block max-w-[200px]"
                                title={company.careers_url}
                              >
                                {company.careers_url.replace(/^https?:\/\//, '').slice(0, 30)}...
                              </a>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatDate(company.last_scraped_at)}</td>
                            <td className="px-4 py-3 text-sm text-[var(--foreground)]">{company.last_jobs_found}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleCompany(company)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  company.is_enabled ? 'bg-purple-600' : 'bg-zinc-700'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    company.is_enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(company)}
                                  className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteCompany(company)}
                                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-sm text-[var(--muted)]">
                Showing {companies.length} companies. Toggle the switch to enable/disable scraping for each company.
              </p>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* Logs Table */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Date/Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Companies</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Jobs Found</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Added</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Skipped</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {logsLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                            Loading logs...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                            No scraper logs yet. Run the scraper to see logs here.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3 text-sm text-[var(--foreground)]">{formatDate(log.started_at)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                                {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--foreground)]">{log.companies_processed}</td>
                            <td className="px-4 py-3 text-sm text-[var(--foreground)]">{log.jobs_found}</td>
                            <td className="px-4 py-3 text-sm text-emerald-400">{log.jobs_added}</td>
                            <td className="px-4 py-3 text-sm text-[var(--muted)]">{log.jobs_skipped}</td>
                            <td className="px-4 py-3">
                              {log.errors && log.errors.length > 0 ? (
                                <span className="text-red-400 text-sm cursor-help" title={log.errors.map((e) => `${e.company}: ${e.error}`).join('\n')}>
                                  {log.errors.length} error{log.errors.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-[var(--muted)] text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {logsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                    <button
                      onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                      disabled={logsPage === 1}
                      className="px-3 py-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-[var(--muted)]">
                      Page {logsPage} of {logsTotalPages}
                    </span>
                    <button
                      onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                      disabled={logsPage === logsTotalPages}
                      className="px-3 py-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Company Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
              {editingCompany ? 'Edit Company' : 'Add Company'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Careers URL *</label>
                <input
                  type="url"
                  required
                  value={formData.careers_url}
                  onChange={(e) => setFormData({ ...formData, careers_url: e.target.value })}
                  placeholder="https://example.com/careers"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-1">Size</label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select...</option>
                    {SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-zinc-700 text-[var(--foreground)] rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingCompany ? 'Save Changes' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
