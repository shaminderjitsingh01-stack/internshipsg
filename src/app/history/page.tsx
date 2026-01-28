"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Interview {
  id: string;
  created_at: string;
  target_role: string;
  score: number;
  feedback: string;
  video_url: string | null;
  transcript: string;
  company_name?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function HistoryContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch interviews with filters
  const fetchInterviews = useCallback(async (page = 1) => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        email: session.user.email,
        page: page.toString(),
        limit: "10",
        sort: sortBy,
      });

      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (scoreMin) params.append("scoreMin", scoreMin);
      if (scoreMax) params.append("scoreMax", scoreMax);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/interviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
        setPagination(data.pagination || {
          total: data.interviews?.length || 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        });
      }
    } catch (err) {
      console.error("Failed to fetch interviews:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, sortBy, dateFrom, dateTo, scoreMin, scoreMax, searchQuery]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchInterviews(1);
    }
  }, [status, session?.user?.email, fetchInterviews]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInterviews(1);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setScoreMin("");
    setScoreMax("");
    setSearchQuery("");
    setSortBy("newest");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return isDarkTheme ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-700";
    if (score >= 6) return isDarkTheme ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-100 text-yellow-700";
    return isDarkTheme ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700";
  };

  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              aria-label="Toggle theme"
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
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Interview History
              </h1>
              <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Review all your past practice sessions with detailed feedback
              </p>
            </div>
            <Link
              href="/?start=interview"
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-center"
            >
              Start New Interview
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className={`rounded-2xl shadow-sm border mb-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {/* Search and Sort */}
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search in feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  isDarkTheme
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Score</option>
                <option value="lowest">Lowest Score</option>
              </select>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border font-medium transition-colors flex items-center gap-2 ${
                  showFilters
                    ? 'bg-red-600 border-red-600 text-white'
                    : isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Advanced Filters */}
            {showFilters && (
              <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Date From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        isDarkTheme
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Date To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        isDarkTheme
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Min Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      value={scoreMin}
                      onChange={(e) => setScoreMin(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        isDarkTheme
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Max Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="10"
                      value={scoreMax}
                      onChange={(e) => setScoreMax(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        isDarkTheme
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className={`mb-4 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          {pagination.total} interview{pagination.total !== 1 ? 's' : ''} found
        </div>

        {/* Interview List */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            </div>
          ) : interviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <svg className={`w-8 h-8 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>No interviews found</h3>
              <p className={`mb-6 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                {searchQuery || dateFrom || dateTo || scoreMin || scoreMax
                  ? "Try adjusting your filters to find more results."
                  : "Start your first mock interview to see your history here."}
              </p>
              <Link
                href="/?start=interview"
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Start Your First Interview
              </Link>
            </div>
          ) : (
            <div className={`divide-y ${isDarkTheme ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {interviews.map((interview) => (
                <Link
                  key={interview.id}
                  href={`/history/${interview.id}`}
                  className={`block p-4 sm:p-6 transition-colors ${isDarkTheme ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {interview.target_role || "Mock Interview Session"}
                          </p>
                          {interview.company_name && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkTheme ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                              {interview.company_name}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(interview.created_at)}
                        </p>
                        {interview.feedback && (
                          <p className={`text-sm mt-2 line-clamp-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                            {interview.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getScoreBadgeColor(interview.score)}`}>
                        {interview.score}/10
                      </div>
                      <svg className={`w-5 h-5 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchInterviews(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkTheme
                  ? 'bg-slate-800 text-white hover:bg-slate-700 disabled:hover:bg-slate-800'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:hover:bg-white'
              }`}
            >
              Previous
            </button>
            <div className={`px-4 py-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => fetchInterviews(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkTheme
                  ? 'bg-slate-800 text-white hover:bg-slate-700 disabled:hover:bg-slate-800'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:hover:bg-white'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
        </div>
      </footer>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
