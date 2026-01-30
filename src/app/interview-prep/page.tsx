"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface UserData {
  total_sessions: number;
  total_questions_practiced: number;
  current_streak: number;
  longest_streak: number;
  xp_earned: number;
  level: number;
}

interface Session {
  id: string;
  session_type: string;
  category: string | null;
  questions_answered: number;
  total_questions: number;
  score: number | null;
  status: string;
  created_at: string;
}

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  tips: string | null;
  is_featured: boolean;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "sample-1",
    question: "Tell me about yourself",
    category: "behavioral",
    difficulty: "easy",
    tips: "Focus on your professional journey, key achievements, and what makes you a good fit for this role.",
    is_featured: true,
  },
  {
    id: "sample-2",
    question: "Why do you want this job?",
    category: "behavioral",
    difficulty: "easy",
    tips: "Research the company beforehand. Connect your skills and goals with the role requirements.",
    is_featured: true,
  },
  {
    id: "sample-3",
    question: "What are your strengths and weaknesses?",
    category: "behavioral",
    difficulty: "medium",
    tips: "Choose genuine strengths relevant to the role. For weaknesses, show how you are improving.",
    is_featured: true,
  },
  {
    id: "sample-4",
    question: "Describe a challenging situation you faced at work",
    category: "behavioral",
    difficulty: "medium",
    tips: "Use the STAR method: Situation, Task, Action, Result.",
    is_featured: true,
  },
  {
    id: "sample-5",
    question: "Where do you see yourself in 5 years?",
    category: "behavioral",
    difficulty: "easy",
    tips: "Show ambition while being realistic. Align your goals with potential growth at the company.",
    is_featured: true,
  },
];

const CATEGORIES = [
  { id: "behavioral", name: "Behavioral", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "blue" },
  { id: "technical", name: "Technical", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", color: "green" },
  { id: "case_study", name: "Case Study", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "purple" },
  { id: "situational", name: "Situational", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "orange" },
];

export default function InterviewPrepPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [featuredQuestions, setFeaturedQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [savedQuestionsCount, setSavedQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        const email = encodeURIComponent(session.user.email);

        // Fetch user prep data
        const prepRes = await fetch(`/api/interview-prep?email=${email}`);
        if (prepRes.ok) {
          const data = await prepRes.json();
          setUserData(data.userData);
          setRecentSessions(data.recentSessions || []);
          setSavedQuestionsCount(data.savedQuestionsCount || 0);
        }

        // Fetch featured questions
        const questionsRes = await fetch(`/api/interview-prep/questions?featured=true&limit=5`);
        if (questionsRes.ok) {
          const data = await questionsRes.json();
          if (data.questions?.length > 0) {
            setFeaturedQuestions(data.questions);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchData();
    }
  }, [session, status]);

  const startPractice = async (category?: string) => {
    if (!session?.user?.email) {
      router.push("/auth/signin");
      return;
    }

    // Create new session and navigate to practice page
    router.push(`/interview-prep/practice${category ? `?category=${category}` : ""}`);
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
      green: { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
      purple: { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
      orange: { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" },
    };
    return colors[color] || colors.blue;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`} />
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link href="/dashboard" className={`text-sm font-medium ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>Dashboard</Link>
            <Link href="/interview-prep/questions" className={`text-sm font-medium ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>Question Bank</Link>
            <Link href="/resources" className={`text-sm font-medium ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>Resources</Link>
          </nav>

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

            {session ? (
              <Link href="/dashboard" className={`p-2 rounded-lg ${isDarkTheme ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            ) : (
              <Link href="/auth/signin" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Title and CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              Interview Prep
            </h1>
            <p className={`text-sm mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Practice common interview questions and boost your confidence
            </p>
          </div>
          <button
            onClick={() => startPractice()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25"
          >
            Start Practice
          </button>
        </div>

        {/* Stats Grid */}
        {session && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl">🎯</span>
                <span className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Sessions</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {userData?.total_sessions || 0}
              </p>
              <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
                Completed
              </p>
            </div>

            <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl">🔥</span>
                <span className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Streak</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {userData?.current_streak || 0}
              </p>
              <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
                Best: {userData?.longest_streak || 0} days
              </p>
            </div>

            <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl">📝</span>
                <span className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Questions</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {userData?.total_questions_practiced || 0}
              </p>
              <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
                Practiced
              </p>
            </div>

            <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl">⭐</span>
                <span className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>XP</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {userData?.xp_earned || 0}
              </p>
              <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
                Level {userData?.level || 1}
              </p>
            </div>
          </div>
        )}

        {/* Question Categories */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Question Categories
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.map((category) => {
              const colors = getCategoryColor(category.color);
              return (
                <button
                  key={category.id}
                  onClick={() => startPractice(category.id)}
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                    isDarkTheme
                      ? "bg-slate-900 border-slate-800 hover:border-blue-500/50"
                      : `bg-white border-slate-200 hover:${colors.border}`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${isDarkTheme ? "bg-white/10" : colors.bg} flex items-center justify-center mb-3`}>
                    <svg className={`w-5 h-5 ${isDarkTheme ? "text-white" : colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                    </svg>
                  </div>
                  <h3 className={`font-semibold text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {category.name}
                  </h3>
                  <p className={`text-xs mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                    Practice questions
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured Questions */}
          <div className="lg:col-span-2">
            <div className={`rounded-xl border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className={`p-4 border-b flex items-center justify-between ${isDarkTheme ? "border-slate-800" : "border-slate-100"}`}>
                <h2 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Featured Questions</h2>
                <Link href="/interview-prep/questions" className="text-sm text-blue-500 hover:underline">
                  View all
                </Link>
              </div>
              <div className="divide-y ${isDarkTheme ? 'divide-slate-800' : 'divide-slate-100'}">
                {featuredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`p-4 transition-colors ${isDarkTheme ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className={`font-medium mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                            isDarkTheme ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                          }`}>
                            {q.category.replace("_", " ")}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        </div>
                        {q.tips && (
                          <p className={`text-xs mt-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                            Tip: {q.tips}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => startPractice()}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          isDarkTheme
                            ? "bg-white/10 hover:bg-white/20 text-white"
                            : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                        }`}
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sessions & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Sessions */}
            {session && (
              <div className={`rounded-xl border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className={`p-4 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-100"}`}>
                  <h2 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Recent Sessions</h2>
                </div>
                <div className="p-4">
                  {recentSessions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className={`mb-3 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                        No sessions yet
                      </p>
                      <button
                        onClick={() => startPractice()}
                        className="text-blue-500 font-medium hover:underline"
                      >
                        Start your first session
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentSessions.slice(0, 3).map((s) => (
                        <Link
                          key={s.id}
                          href={`/interview-prep/practice?session=${s.id}`}
                          className={`block p-3 rounded-lg transition-colors ${
                            isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                                {s.category ? s.category.replace("_", " ") : "General"} Practice
                              </p>
                              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                                {new Date(s.created_at).toLocaleDateString("en-SG", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              s.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {s.questions_answered}/{s.total_questions}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className={`rounded-xl border p-4 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/interview-prep/questions"
                  className={`flex items-center gap-3 p-3 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                >
                  <span className="text-lg">📚</span>
                  <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Browse Question Bank</span>
                </Link>
                <Link
                  href="/job-interview"
                  className={`flex items-center gap-3 p-3 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                >
                  <span className="text-lg">🎯</span>
                  <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Job-Specific Interview</span>
                </Link>
                <Link
                  href="/resources"
                  className={`flex items-center gap-3 p-3 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                >
                  <span className="text-lg">📖</span>
                  <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Interview Tips</span>
                </Link>
              </div>
            </div>

            {/* Saved Questions */}
            {session && savedQuestionsCount > 0 && (
              <Link
                href="/interview-prep/questions?saved=true"
                className={`block rounded-xl p-4 border ${
                  isDarkTheme
                    ? "bg-amber-900/20 border-amber-700/50"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔖</span>
                  <div>
                    <p className={`font-medium ${isDarkTheme ? "text-amber-300" : "text-amber-900"}`}>
                      {savedQuestionsCount} Saved Questions
                    </p>
                    <p className={`text-xs ${isDarkTheme ? "text-amber-400/70" : "text-amber-700"}`}>
                      Review your bookmarked questions
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 mt-12 ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
        <div className={`max-w-6xl mx-auto px-4 text-center text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
