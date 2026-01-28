"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import PeerComparison from "@/components/PeerComparison";
import SchoolComparison from "@/components/SchoolComparison";

interface UserProfile {
  username?: string;
  full_name?: string;
  school?: string;
  graduation_year?: number;
  field_of_study?: string;
  xp_points?: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

interface Interview {
  score: number;
}

export default function ComparisonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, longestStreak: 0 });
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.email) return;

      setLoading(true);
      try {
        // Fetch all data in parallel
        const [profileRes, streakRes, interviewsRes] = await Promise.all([
          fetch(`/api/profile?email=${encodeURIComponent(session.user.email)}`),
          fetch(`/api/streak?email=${encodeURIComponent(session.user.email)}`),
          fetch(`/api/interviews?email=${encodeURIComponent(session.user.email)}`),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserProfile(profileData.profile || null);
        }

        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreakData({
            currentStreak: streakData.currentStreak || 0,
            longestStreak: streakData.longestStreak || 0,
          });
        }

        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          setInterviews(interviewsData.interviews || []);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    }
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const averageScore = interviews.length > 0
    ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length
    : 0;

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"}`}
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"}`}
              >
                Leaderboard
              </Link>
            </nav>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
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
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className={`text-sm transition-colors ${isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              Dashboard
            </Link>
            <span className={isDarkTheme ? "text-slate-600" : "text-slate-400"}>/</span>
            <span className={`text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Compare</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            How You Compare
          </h1>
          <p className={`text-sm sm:text-base ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            See how your performance stacks up against other students
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Peer Comparison */}
          {session.user?.email && (
            <PeerComparison
              userEmail={session.user.email}
              userSchool={userProfile?.school}
              currentStreak={streakData.currentStreak}
              averageScore={averageScore}
              totalXP={userProfile?.xp_points || 0}
            />
          )}

          {/* School Comparison */}
          {session.user?.email && (
            <SchoolComparison
              userEmail={session.user.email}
              userSchool={userProfile?.school}
            />
          )}
        </div>

        {/* Additional Insights */}
        <div className={`mt-8 rounded-2xl p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Tips to Improve Your Ranking
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"}`}>
              <div className="text-2xl mb-2">1</div>
              <h3 className={`font-medium mb-1 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Practice Daily</h3>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Maintain your streak by completing at least one activity every day
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"}`}>
              <div className="text-2xl mb-2">2</div>
              <h3 className={`font-medium mb-1 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Complete Interviews</h3>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Each mock interview helps you improve and earn more XP
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"}`}>
              <div className="text-2xl mb-2">3</div>
              <h3 className={`font-medium mb-1 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Review Feedback</h3>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Learn from AI feedback to improve your scores over time
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"}`}>
              <div className="text-2xl mb-2">4</div>
              <h3 className={`font-medium mb-1 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Earn Badges</h3>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Unlock achievements to boost your XP and showcase your progress
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className={`mt-8 rounded-2xl p-6 text-center ${isDarkTheme ? "bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-800/50" : "bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"}`}>
          <h2 className={`text-lg font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Ready to Climb the Rankings?
          </h2>
          <p className={`text-sm mb-4 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
            Start a mock interview now to improve your score and earn XP
          </p>
          <Link
            href="/?start=interview"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Start Interview
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
