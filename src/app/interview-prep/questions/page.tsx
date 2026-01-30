"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  company: string | null;
  tips: string | null;
  tags: string[];
  is_featured: boolean;
  is_user_submitted: boolean;
  is_bookmarked: boolean;
}

const CATEGORIES = [
  { id: "all", name: "All Categories" },
  { id: "behavioral", name: "Behavioral" },
  { id: "technical", name: "Technical" },
  { id: "case_study", name: "Case Study" },
  { id: "situational", name: "Situational" },
];

const DIFFICULTIES = [
  { id: "all", name: "All Levels" },
  { id: "easy", name: "Easy" },
  { id: "medium", name: "Medium" },
  { id: "hard", name: "Hard" },
];

function QuestionsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showSaved, setShowSaved] = useState(searchParams.get("saved") === "true");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    category: "behavioral",
    difficulty: "medium",
    company: "",
    tips: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let url = `/api/interview-prep/questions?page=${page}&limit=20`;
        if (category !== "all") url += `&category=${category}`;
        if (difficulty !== "all") url += `&difficulty=${difficulty}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (session?.user?.email) url += `&email=${encodeURIComponent(session.user.email)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category, difficulty, search, page, session?.user?.email]);

  const handleBookmark = async (questionId: string, isBookmarked: boolean) => {
    if (!session?.user?.email) {
      router.push("/auth/signin");
      return;
    }

    try {
      const res = await fetch("/api/interview-prep/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          questionId,
          action: isBookmarked ? "unbookmark" : "bookmark",
        }),
      });

      if (res.ok) {
        setQuestions(questions.map(q =>
          q.id === questionId ? { ...q, is_bookmarked: !isBookmarked } : q
        ));
      }
    } catch (error) {
      console.error("Bookmark error:", error);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!session?.user?.email || !newQuestion.question.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/interview-prep/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          question: newQuestion.question,
          category: newQuestion.category,
          difficulty: newQuestion.difficulty,
          company: newQuestion.company || null,
          tips: newQuestion.tips || null,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewQuestion({
          question: "",
          category: "behavioral",
          difficulty: "medium",
          company: "",
          tips: "",
        });
        alert("Question submitted for review!");
      }
    } catch (error) {
      console.error("Submit question error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredQuestions = showSaved
    ? questions.filter(q => q.is_bookmarked)
    : questions;

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/interview-prep" className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${isDarkTheme ? "text-white" : "text-slate-900"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Back</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDarkTheme ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
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

            {session && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Add Question
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Question Bank
          </h1>
          <p className={`text-sm mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Browse and practice interview questions across different categories
          </p>
        </div>

        {/* Filters */}
        <div className={`rounded-xl border p-4 mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search questions..."
                className={`w-full px-4 py-2 rounded-lg border text-sm ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                    : "bg-white border-slate-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg border text-sm ${
                isDarkTheme
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg border text-sm ${
                isDarkTheme
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            >
              {DIFFICULTIES.map(diff => (
                <option key={diff.id} value={diff.id}>{diff.name}</option>
              ))}
            </select>

            {/* Saved Toggle */}
            {session && (
              <button
                onClick={() => setShowSaved(!showSaved)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  showSaved
                    ? "bg-amber-500 text-white"
                    : isDarkTheme
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {showSaved ? "Show All" : "Saved Only"}
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <svg className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? "text-slate-700" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-lg font-medium ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              No questions found
            </p>
            <p className={`text-sm mt-1 ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isDarkTheme
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className={`font-medium mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      {q.question}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                        isDarkTheme ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                      }`}>
                        {q.category.replace("_", " ")}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                      {q.company && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isDarkTheme ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"
                        }`}>
                          {q.company}
                        </span>
                      )}
                      {q.is_featured && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isDarkTheme ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"
                        }`}>
                          Featured
                        </span>
                      )}
                      {q.is_user_submitted && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isDarkTheme ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                        }`}>
                          Community
                        </span>
                      )}
                    </div>

                    {q.tips && (
                      <p className={`text-xs mt-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                        Tip: {q.tips}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBookmark(q.id, q.is_bookmarked)}
                      className={`p-2 rounded-lg ${
                        q.is_bookmarked
                          ? "text-amber-500"
                          : isDarkTheme
                          ? "text-slate-400 hover:text-white hover:bg-slate-800"
                          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={q.is_bookmarked ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>

                    <Link
                      href={`/interview-prep/practice?question=${q.id}`}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        isDarkTheme
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                      }`}
                    >
                      Practice
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                page === 1
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${isDarkTheme ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              Previous
            </button>
            <span className={`px-4 py-2 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                page === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${isDarkTheme ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-lg rounded-xl p-6 ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Submit a Question
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Question *
                </label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Enter your interview question..."
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border text-sm ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    Category *
                  </label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border text-sm ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                  >
                    <option value="behavioral">Behavioral</option>
                    <option value="technical">Technical</option>
                    <option value="case_study">Case Study</option>
                    <option value="situational">Situational</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    Difficulty *
                  </label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border text-sm ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Company (optional)
                </label>
                <input
                  type="text"
                  value={newQuestion.company}
                  onChange={(e) => setNewQuestion({ ...newQuestion, company: e.target.value })}
                  placeholder="e.g., Google, Amazon"
                  className={`w-full px-4 py-2 rounded-lg border text-sm ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Tips (optional)
                </label>
                <textarea
                  value={newQuestion.tips}
                  onChange={(e) => setNewQuestion({ ...newQuestion, tips: e.target.value })}
                  placeholder="Any tips for answering this question..."
                  rows={2}
                  className={`w-full px-4 py-2 rounded-lg border text-sm ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  isDarkTheme
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuestion}
                disabled={!newQuestion.question.trim() || submitting}
                className="flex-1 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Question"}
              </button>
            </div>

            <p className={`text-xs text-center mt-4 ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
              Your question will be reviewed before being added to the public question bank.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewPrepQuestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <QuestionsContent />
    </Suspense>
  );
}
