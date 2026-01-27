"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import StreakWidget from "@/components/StreakWidget";
import StreakCard from "@/components/StreakCard";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import CoverLetterAssistant from "@/components/CoverLetterAssistant";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import PrepChecklist from "@/components/PrepChecklist";
import WeeklyChallenges from "@/components/WeeklyChallenges";
import ProgressTimeline from "@/components/ProgressTimeline";
import AIStrengthsInsights from "@/components/AIStrengthsInsights";
import CareerPathQuiz from "@/components/CareerPathQuiz";
import InterviewMistakes from "@/components/InterviewMistakes";
import AICareerCoach from "@/components/AICareerCoach";
import PerformanceBenchmark from "@/components/PerformanceBenchmark";

interface Interview {
  id: string;
  created_at: string;
  duration: number;
  score: number;
  feedback: string;
  video_url: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "resume" | "cover-letter" | "billing">("overview");
  const [showShareCard, setShowShareCard] = useState(false);
  const [streakForShare, setStreakForShare] = useState(0);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, badges: [] as { badge_id: string; unlocked_at: string }[] });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch user's interviews
  useEffect(() => {
    const fetchInterviews = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/interviews?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setInterviews(data.interviews || []);
          }
        } catch (err) {
          console.error("Failed to fetch interviews:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchInterviews();
    }
  }, [session, status]);

  // Fetch streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/streak?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setStreakData({
              currentStreak: data.currentStreak || 0,
              longestStreak: data.longestStreak || 0,
              badges: data.badges || [],
            });
          }
        } catch (err) {
          console.error("Failed to fetch streak data:", err);
        }
      }
    };

    if (status === "authenticated") {
      fetchStreakData();
    }
  }, [session, status]);

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

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
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

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
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
              href="/"
              className={`hidden sm:block px-4 py-2 font-medium transition-colors ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
            >
              New Interview
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}
                />
              ) : (
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <span className="text-red-600 font-semibold text-sm">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Welcome back, {session.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Manage your account and review your interview practice sessions.</p>
        </div>

        {/* Employer Visibility Disclaimer */}
        <div className={`mb-6 sm:mb-8 rounded-xl p-4 sm:p-5 border ${isDarkTheme ? 'bg-blue-900/20 border-blue-800/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkTheme ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold mb-1 text-sm sm:text-base ${isDarkTheme ? 'text-blue-300' : 'text-blue-900'}`}>Your profile could be seen by future employer partners</h3>
              <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-blue-400' : 'text-blue-700'}`}>
                We're building connections with companies seeking internship-ready students.
                Staying active and completing practice sessions may increase your visibility to potential employers
                — however, employer contact is not guaranteed.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-8 p-1 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-hide ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "overview"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("interviews")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "interviews"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("resume")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "resume"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => setActiveTab("cover-letter")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "cover-letter"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "billing"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billing
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Streak Widget - Full Width */}
            {session?.user?.email && (
              <StreakWidget
                userEmail={session.user.email}
                onShare={(streakCount) => {
                  setStreakForShare(streakCount);
                  setShowShareCard(true);
                }}
              />
            )}
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {/* Profile Card */}
              <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Your Profile</h2>
                <div className="flex items-center gap-4 mb-6">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className={`w-16 h-16 rounded-full border-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                      <span className="text-red-600 font-bold text-xl">
                        {session.user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{session.user?.name}</p>
                    <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{session.user?.email}</p>
                  </div>
                </div>
                <div className={`pt-4 border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Member since</p>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>January 2026</p>
                </div>
              </div>

              {/* Confidence Meter */}
              {session?.user?.email && (
                <ConfidenceMeter
                  userEmail={session.user.email}
                  totalInterviews={interviews.length}
                  averageScore={interviews.length > 0 ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length : 0}
                  currentStreak={streakData.currentStreak}
                  totalActivities={interviews.length + streakData.currentStreak}
                />
              )}

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-4 sm:p-6 text-white">
                <h2 className="text-lg font-semibold mb-4">Ready to Practice?</h2>
                <p className="text-white/80 mb-6">
                  Start a new mock interview session and improve your skills.
                </p>
                <Link
                  href="/?start=interview"
                  className="block w-full py-3 bg-white text-red-600 rounded-xl font-semibold text-center hover:bg-red-50 transition-colors"
                >
                  Start New Interview
                </Link>
              </div>
            </div>

            {/* Weekly Challenges - Full Width */}
            {session?.user?.email && (
              <WeeklyChallenges
                userEmail={session.user.email}
                totalInterviews={interviews.length}
                currentStreak={streakData.currentStreak}
              />
            )}

            {/* Two Column Layout for Career & Learning */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Career Path Quiz */}
              {session?.user?.email && (
                <CareerPathQuiz userEmail={session.user.email} />
              )}

              {/* AI Career Coach */}
              {session?.user?.email && (
                <AICareerCoach userEmail={session.user.email} />
              )}
            </div>

            {/* Progress & Insights Row */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Progress Timeline */}
              {session?.user?.email && (
                <ProgressTimeline
                  userEmail={session.user.email}
                  totalInterviews={interviews.length}
                  currentStreak={streakData.currentStreak}
                  longestStreak={streakData.longestStreak}
                  badges={streakData.badges}
                  averageScore={interviews.length > 0 ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length : 0}
                />
              )}

              {/* AI Strengths Insights */}
              {session?.user?.email && (
                <AIStrengthsInsights
                  userEmail={session.user.email}
                  interviews={interviews.map(i => ({ score: i.score, feedback: i.feedback, created_at: i.created_at }))}
                />
              )}
            </div>

            {/* Learning & Benchmark Row */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Interview Mistakes Learning */}
              <InterviewMistakes />

              {/* Performance Benchmark */}
              {session?.user?.email && (
                <PerformanceBenchmark
                  userEmail={session.user.email}
                  totalInterviews={interviews.length}
                  averageScore={interviews.length > 0 ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length : 0}
                  currentStreak={streakData.currentStreak}
                  totalActivities={interviews.length + streakData.currentStreak}
                />
              )}
            </div>

            {/* Prep Checklist - Full Width */}
            {session?.user?.email && (
              <PrepChecklist userEmail={session.user.email} />
            )}
          </div>
        )}

        {/* Share Card Modal */}
        {showShareCard && session?.user && (
          <StreakCard
            streak={streakForShare || 1}
            title="Interview Streak"
            userName={session.user.name || undefined}
            onClose={() => setShowShareCard(false)}
          />
        )}

        {/* Interviews Tab */}
        {activeTab === "interviews" && (
          <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Interview History</h2>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Review your past practice sessions and feedback</p>
            </div>

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
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>No interviews yet</h3>
                <p className={`mb-6 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Start your first mock interview to see your history here.</p>
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
                  <div key={interview.id} className={`p-6 transition-colors ${isDarkTheme ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Mock Interview Session</p>
                          <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(interview.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Score</p>
                          <p className="text-lg font-bold text-red-600">{interview.score}/10</p>
                        </div>
                        {interview.video_url && (
                          <a
                            href={interview.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkTheme ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            Watch Video
                          </a>
                        )}
                      </div>
                    </div>
                    {interview.feedback && (
                      <p className={`text-sm line-clamp-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{interview.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resume Tab */}
        {activeTab === "resume" && session?.user?.email && (
          <ResumeAnalyzer userEmail={session.user.email} />
        )}

        {/* Cover Letter Tab */}
        {activeTab === "cover-letter" && session?.user?.email && (
          <CoverLetterAssistant userEmail={session.user.email} />
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Plan */}
            <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Current Plan</h2>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkTheme ? 'bg-green-900/50' : 'bg-green-100'}`}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Free Plan</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Basic interview practice</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited 15-min interviews
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI feedback & scoring
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Resume & cover letter tips
                </div>
              </div>
            </div>

            {/* Upgrade Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded">PRO</span>
                <span className="text-white/60 text-sm">Coming Soon</span>
              </div>
              <h2 className="text-lg font-semibold mb-2">Upgrade to Pro</h2>
              <p className="text-white/70 mb-6">
                Unlock longer sessions, video recordings, and advanced analytics.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30 & 60-min interview sessions
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Video recording & playback
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Detailed performance analytics
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Industry-specific question packs
                </li>
              </ul>
              <button
                disabled
                className="w-full py-3 bg-white/20 text-white/60 rounded-xl font-semibold cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <a href="/roadmap" className="hover:text-red-600 transition-colors">Roadmap</a>
            <a href="/about" className="hover:text-red-600 transition-colors">About</a>
            <a href="/sitemap.xml" className="hover:text-red-600 transition-colors">Sitemap</a>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
