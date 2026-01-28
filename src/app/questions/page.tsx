"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import QuestionCard from "@/components/QuestionCard";
import { InterviewQuestion } from "@/data/interviewQuestions";

const CATEGORIES = ["All", "Behavioral", "Technical", "Case Study", "Situational"] as const;
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"] as const;
const INDUSTRIES = ["All", "General", "Technology", "Finance", "Consulting", "Marketing", "Healthcare", "Engineering", "Startup"] as const;

type CategoryFilter = typeof CATEGORIES[number];
type DifficultyFilter = typeof DIFFICULTIES[number];
type IndustryFilter = typeof INDUSTRIES[number];

export default function QuestionsPage() {
  const { data: session } = useSession();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [industryFilter, setIndustryFilter] = useState<IndustryFilter>("All");
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem("bookmarkedQuestions") || "[]");
    setBookmarkedIds(savedBookmarks);
  }, []);

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== "All") params.append("category", categoryFilter);
        if (difficultyFilter !== "All") params.append("difficulty", difficultyFilter);
        if (industryFilter !== "All") params.append("industry", industryFilter);
        if (searchQuery) params.append("search", searchQuery);
        params.append("limit", "100");

        const res = await fetch(`/api/questions?${params}`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(timeoutId);
  }, [categoryFilter, difficultyFilter, industryFilter, searchQuery]);

  // Filter by bookmarks
  const displayedQuestions = useMemo(() => {
    if (showBookmarkedOnly) {
      return questions.filter(q => bookmarkedIds.includes(q.id));
    }
    return questions;
  }, [questions, showBookmarkedOnly, bookmarkedIds]);

  // Handle bookmark toggle
  const handleBookmark = (questionId: number) => {
    setBookmarkedIds(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      }
      return [...prev, questionId];
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setDifficultyFilter("All");
    setIndustryFilter("All");
    setShowBookmarkedOnly(false);
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "All" || difficultyFilter !== "All" || industryFilter !== "All" || showBookmarkedOnly;

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Internship.sg"
              className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`}
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                isDarkTheme
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
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
              className={`hidden sm:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className={`hidden sm:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Leaderboard
            </Link>
            <Link
              href="/resources"
              className={`hidden md:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Resources
            </Link>
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${
                  isDarkTheme ? "border-slate-700" : "border-slate-200"
                }`}
              />
            ) : session?.user ? (
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                  isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                }`}
              >
                <span className="text-red-600 font-semibold text-sm">
                  {session.user.name?.charAt(0) || "U"}
                </span>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-red-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Interview Question Bank
          </h1>
          <p className={`text-lg sm:text-xl max-w-2xl mx-auto ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Browse 65+ common interview questions with expert tips. Practice any question instantly.
          </p>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {(["Behavioral", "Technical", "Case Study", "Situational"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? "All" : cat)}
              className={`p-3 sm:p-4 rounded-xl border transition-all min-h-[72px] sm:min-h-0 ${
                categoryFilter === cat
                  ? isDarkTheme
                    ? "bg-red-900/30 border-red-700 ring-2 ring-red-600"
                    : "bg-red-50 border-red-300 ring-2 ring-red-500"
                  : isDarkTheme
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 ${
                categoryFilter === cat
                  ? "text-red-500"
                  : isDarkTheme ? "text-white" : "text-slate-900"
              }`}>
                {cat === "Behavioral" ? "20" : cat === "Technical" ? "10" : cat === "Case Study" ? "10" : "15"}
              </div>
              <div className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                {cat === "Case Study" ? "Case" : cat}
              </div>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className={`rounded-xl border p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 ${
          isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          {/* Search */}
          <div className="relative mb-3 sm:mb-4">
            <svg
              className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 ${
                isDarkTheme ? "text-slate-500" : "text-slate-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg border text-sm sm:text-base min-h-[44px] ${
                isDarkTheme
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500"
              } focus:ring-2 focus:ring-red-500/20 outline-none transition-all`}
            />
          </div>

          {/* Filter Row - Scrollable on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Filter dropdowns row */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium min-h-[44px] min-w-[100px] sm:min-w-0 flex-shrink-0 ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                } focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat === "All" ? "Category" : cat}</option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium min-h-[44px] min-w-[90px] sm:min-w-0 flex-shrink-0 ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                } focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>{diff === "All" ? "Difficulty" : diff}</option>
                ))}
              </select>

              {/* Industry Filter */}
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value as IndustryFilter)}
                className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium min-h-[44px] min-w-[90px] sm:min-w-0 flex-shrink-0 ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                } focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind === "All" ? "Industry" : ind}</option>
                ))}
              </select>

              {/* Bookmarked Toggle */}
              <button
                onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all min-h-[44px] flex-shrink-0 whitespace-nowrap ${
                  showBookmarkedOnly
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-yellow-500"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-yellow-500"
                }`}
              >
                <svg className="w-4 h-4" fill={showBookmarkedOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="hidden sm:inline">Saved</span> ({bookmarkedIds.length})
              </button>
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:ml-auto">
              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[44px] ${
                    isDarkTheme
                      ? "text-slate-400 hover:text-red-400"
                      : "text-slate-500 hover:text-red-600"
                  }`}
                >
                  Clear
                </button>
              )}

              {/* Results Count */}
              <div className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                {displayedQuestions.length} result{displayedQuestions.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Questions Grid */}
        {loading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 sm:h-10 w-8 sm:w-10 border-b-2 border-red-600"></div>
          </div>
        ) : displayedQuestions.length === 0 ? (
          <div className={`text-center py-10 sm:py-16 rounded-xl border ${
            isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className={`w-12 sm:w-16 h-12 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 ${
              isDarkTheme ? "bg-slate-800" : "bg-slate-100"
            }`}>
              <svg className={`w-6 sm:w-8 h-6 sm:h-8 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-base sm:text-lg font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              No questions found
            </h3>
            <p className={`text-sm sm:text-base mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              Try adjusting your filters or search query.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 sm:px-6 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-red-700 transition-colors min-h-[44px]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {displayedQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                isDarkTheme={isDarkTheme}
                onBookmark={handleBookmark}
                isBookmarked={bookmarkedIds.includes(question.id)}
              />
            ))}
          </div>
        )}

        {/* CTA Section */}
        {!session && (
          <div className="mt-8 sm:mt-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-center text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Ready to Practice?</h2>
            <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-6 max-w-xl mx-auto">
              Sign in to track your progress, save your favorite questions, and get personalized AI feedback.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-6 sm:px-8 py-3 bg-white text-red-600 rounded-xl text-sm sm:text-base font-semibold hover:bg-red-50 transition-colors min-h-[48px]"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${
          isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/questions" className="hover:text-red-600 transition-colors font-medium text-red-600">
              Questions
            </Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">
              Leaderboard
            </Link>
            <Link href="/resources" className="hover:text-red-600 transition-colors">
              Resources
            </Link>
            <Link href="/roadmap" className="hover:text-red-600 transition-colors">
              Roadmap
            </Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">
              About
            </Link>
          </div>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
