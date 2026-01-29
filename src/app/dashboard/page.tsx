"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Interview {
  id: string;
  created_at: string;
  score: number;
}

interface UserProfile {
  username?: string;
  full_name?: string;
  school?: string;
  xp?: number;
  level?: number;
  tier?: string;
}

interface LeaderboardData {
  rank: number;
  total_users: number;
  percentile: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, longestStreak: 0 });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.email) return;

      setLoading(true);
      const email = encodeURIComponent(session.user.email);

      try {
        const [interviewsRes, profileRes, leaderboardRes, streakRes] = await Promise.all([
          fetch(`/api/interviews?email=${email}`),
          fetch(`/api/profile?email=${email}`),
          fetch(`/api/leaderboard/rank?email=${email}`),
          fetch(`/api/streak?email=${email}`),
        ]);

        if (interviewsRes.ok) {
          const data = await interviewsRes.json();
          setInterviews(data.interviews?.slice(0, 3) || []);
        }
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUserProfile(data.profile || null);
        }
        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          setLeaderboardData(data);
        }
        if (streakRes.ok) {
          const data = await streakRes.json();
          setStreakData({ currentStreak: data.currentStreak || 0, longestStreak: data.longestStreak || 0 });
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const avgScore = interviews.length > 0
    ? Math.round(interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length)
    : 0;

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'elite': return 'from-purple-500 to-pink-500';
      case 'diamond': return 'from-cyan-400 to-blue-500';
      case 'platinum': return 'from-slate-300 to-slate-500';
      case 'gold': return 'from-yellow-400 to-amber-500';
      case 'silver': return 'from-gray-300 to-gray-400';
      default: return 'from-amber-600 to-amber-700';
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link href="/questions" className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Questions</Link>
            <Link href="/companies" className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Companies</Link>
            <Link href="/leaderboard" className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Leaderboard</Link>
            <Link href="/resources" className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Resources</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`md:hidden p-2 rounded-lg ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              {isDarkTheme ? '☀️' : '🌙'}
            </button>

            <div className="relative hidden md:block">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2"
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                    <span className="text-red-600 font-semibold text-sm">{session.user?.name?.charAt(0) || "U"}</span>
                  </div>
                )}
              </button>
            </div>

            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                <div className={`fixed md:absolute right-4 md:right-0 top-16 md:top-auto md:mt-2 w-[calc(100%-2rem)] md:w-48 rounded-xl shadow-lg border z-50 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="py-2">
                    {/* Mobile nav links */}
                    <div className="md:hidden border-b pb-2 mb-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-100'}">
                      <Link href="/questions" className={`block px-4 py-3 text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                        Questions
                      </Link>
                      <Link href="/companies" className={`block px-4 py-3 text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                        Companies
                      </Link>
                      <Link href="/leaderboard" className={`block px-4 py-3 text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                        Leaderboard
                      </Link>
                      <Link href="/resources" className={`block px-4 py-3 text-sm font-medium ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                        Resources
                      </Link>
                    </div>
                    {userProfile?.username && (
                      <Link href={`/u/${userProfile.username}`} className={`block px-4 py-3 text-sm ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                        View Profile
                      </Link>
                    )}
                    <Link href="/settings" className={`block px-4 py-3 text-sm ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                      Settings
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className={`block w-full text-left px-4 py-3 text-sm text-red-500 ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, {session.user?.name?.split(" ")[0]}!
            </h1>
            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              Keep practicing to climb the leaderboard
            </p>
          </div>
          <Link
            href="/?start=interview"
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-500/25"
          >
            Start Interview →
          </Link>
        </div>

        {/* Employers Watching Banner */}
        <div className={`mb-6 sm:mb-8 rounded-xl p-3 sm:p-4 border ${isDarkTheme ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <span className="text-xl sm:text-2xl">👀</span>
              <div className="flex-1">
                <p className={`text-sm sm:text-base font-medium ${isDarkTheme ? 'text-amber-300' : 'text-amber-900'}`}>
                  Employers are watching the leaderboard
                </p>
                <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-amber-400/70' : 'text-amber-700'}`}>
                  Top performers get noticed by partner companies
                </p>
              </div>
            </div>
            <Link href="/employers" className={`text-xs sm:text-sm font-medium whitespace-nowrap ${isDarkTheme ? 'text-amber-400' : 'text-amber-700'}`}>
              Learn more →
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Streak */}
          <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-lg sm:text-2xl">🔥</span>
              <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Streak</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {streakData.currentStreak}
            </p>
            <p className={`text-[10px] sm:text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
              Best: {streakData.longestStreak} days
            </p>
          </div>

          {/* XP */}
          <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-lg sm:text-2xl">⭐</span>
              <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>XP</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {userProfile?.xp || 0}
            </p>
            <p className={`text-[10px] sm:text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
              Level {userProfile?.level || 1}
            </p>
          </div>

          {/* Rank */}
          <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-lg sm:text-2xl">🏆</span>
              <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Rank</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              #{leaderboardData?.rank || '-'}
            </p>
            <p className={`text-[10px] sm:text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
              Top {leaderboardData?.percentile || 0}%
            </p>
          </div>

          {/* Tier */}
          <div className={`rounded-xl p-3 sm:p-4 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-lg sm:text-2xl">🎖️</span>
              <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Tier</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${getTierColor(userProfile?.tier)} bg-clip-text text-transparent capitalize`}>
              {userProfile?.tier || 'Bronze'}
            </p>
            <p className={`text-[10px] sm:text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
              {avgScore > 0 ? `Avg: ${avgScore}/100` : 'Start practicing'}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Recent & Quick Links */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Recent Interviews */}
            <div className={`rounded-xl border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="p-4 border-b flex items-center justify-between ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}">
                <h2 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Recent Interviews</h2>
                <Link href="/history" className="text-sm text-red-500 hover:underline">View all →</Link>
              </div>
              <div className="p-4">
                {interviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>No interviews yet</p>
                    <Link href="/?start=interview" className="text-red-500 font-medium hover:underline">
                      Start your first interview →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interviews.map((interview) => (
                      <Link
                        key={interview.id}
                        href={`/history/${interview.id}`}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <div>
                          <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            Mock Interview
                          </p>
                          <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(interview.created_at).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          interview.score >= 80 ? 'bg-green-100 text-green-700' :
                          interview.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {interview.score}/100
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Link href="/questions" className={`p-3 sm:p-4 rounded-xl border flex items-center gap-2 sm:gap-4 transition-all hover:scale-[1.02] ${isDarkTheme ? 'bg-slate-900 border-slate-800 hover:border-red-500/50' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                <div className="text-2xl sm:text-3xl">📚</div>
                <div className="min-w-0">
                  <p className={`text-sm sm:text-base font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Questions</p>
                  <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>65+ questions</p>
                </div>
              </Link>

              <Link href="/companies" className={`p-3 sm:p-4 rounded-xl border flex items-center gap-2 sm:gap-4 transition-all hover:scale-[1.02] ${isDarkTheme ? 'bg-slate-900 border-slate-800 hover:border-red-500/50' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                <div className="text-2xl sm:text-3xl">🏢</div>
                <div className="min-w-0">
                  <p className={`text-sm sm:text-base font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Companies</p>
                  <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Company guides</p>
                </div>
              </Link>

              <Link href="/tracks" className={`p-3 sm:p-4 rounded-xl border flex items-center gap-2 sm:gap-4 transition-all hover:scale-[1.02] ${isDarkTheme ? 'bg-slate-900 border-slate-800 hover:border-red-500/50' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                <div className="text-2xl sm:text-3xl">🎯</div>
                <div className="min-w-0">
                  <p className={`text-sm sm:text-base font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Tracks</p>
                  <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>7 paths</p>
                </div>
              </Link>

              <Link href="/achievements" className={`p-3 sm:p-4 rounded-xl border flex items-center gap-2 sm:gap-4 transition-all hover:scale-[1.02] ${isDarkTheme ? 'bg-slate-900 border-slate-800 hover:border-red-500/50' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                <div className="text-2xl sm:text-3xl">🏅</div>
                <div className="min-w-0">
                  <p className={`text-sm sm:text-base font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Badges</p>
                  <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>25 to earn</p>
                </div>
              </Link>
            </div>

            {/* How to Earn XP & Climb */}
            <div className={`rounded-xl border p-4 sm:p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                How to Earn XP & Climb the Leaderboard
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎤</span>
                    <span className={`text-xl font-bold text-green-500`}>+50 XP</span>
                  </div>
                  <h3 className={`font-medium mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Complete Interview</h3>
                  <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Finish an AI mock interview session</p>
                </div>

                <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <span className={`text-xl font-bold text-orange-500`}>+10 XP</span>
                  </div>
                  <h3 className={`font-medium mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Daily Streak</h3>
                  <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Log in and practice daily</p>
                </div>

                <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className={`text-xl font-bold text-blue-500`}>+25 XP</span>
                  </div>
                  <h3 className={`font-medium mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Weekly Challenge</h3>
                  <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Complete weekly challenge tasks</p>
                </div>

                <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">👥</span>
                    <span className={`text-xl font-bold text-purple-500`}>+100 XP</span>
                  </div>
                  <h3 className={`font-medium mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Refer a Friend</h3>
                  <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>When your referral signs up</p>
                </div>
              </div>

              {/* Tier Progress */}
              <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Talent Tiers</h3>
                <div className="flex items-center justify-between gap-1 sm:gap-2 text-xs">
                  <div className="text-center min-w-[50px]">
                    <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold mb-1 mx-auto">B</div>
                    <span className={`block ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Bronze</span>
                    <span className={`block text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>0 XP</span>
                  </div>
                  <div className={`flex-1 h-1 ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className="text-center min-w-[50px]">
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold mb-1 mx-auto">S</div>
                    <span className={`block ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Silver</span>
                    <span className={`block text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>50 XP</span>
                  </div>
                  <div className={`flex-1 h-1 ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className="text-center min-w-[50px]">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold mb-1 mx-auto">G</div>
                    <span className={`block ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Gold</span>
                    <span className={`block text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>200 XP</span>
                  </div>
                  <div className={`flex-1 h-1 ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className="text-center min-w-[50px]">
                    <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold mb-1 mx-auto">D</div>
                    <span className={`block ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Diamond</span>
                    <span className={`block text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>500 XP</span>
                  </div>
                  <div className={`flex-1 h-1 ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className="text-center min-w-[50px]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mb-1 mx-auto">E</div>
                    <span className={`block ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Elite</span>
                    <span className={`block text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Top 5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile & Links */}
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <div className={`rounded-xl border p-3 sm:p-4 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="w-10 sm:w-12 h-10 sm:h-12 rounded-full" />
                ) : (
                  <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                    <span className="text-red-600 font-bold text-base sm:text-lg">{session.user?.name?.charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm sm:text-base font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{session.user?.name}</p>
                  <p className={`text-xs sm:text-sm truncate ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    @{userProfile?.username || 'set username'}
                  </p>
                </div>
              </div>

              {userProfile?.username ? (
                <div className="space-y-2">
                  <Link href={`/u/${userProfile.username}`} className={`block w-full py-2.5 sm:py-2 text-center rounded-lg text-sm font-medium ${isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    View Public Profile
                  </Link>
                  <Link href="/settings" className={`block w-full py-2.5 sm:py-2 text-center rounded-lg text-sm font-medium border ${isDarkTheme ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50'}`}>
                    Edit Profile
                  </Link>
                </div>
              ) : (
                <Link href="/settings" className="block w-full py-2.5 sm:py-2 text-center rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600">
                  Complete Your Profile
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <div className={`rounded-xl border p-4 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Explore</h3>
              <div className="space-y-2">
                <Link href="/leaderboard" className={`flex items-center gap-3 p-2 rounded-lg ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <span>🏆</span>
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Leaderboard</span>
                </Link>
                <Link href="/challenges" className={`flex items-center gap-3 p-2 rounded-lg ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <span>🎯</span>
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Weekly Challenges</span>
                </Link>
                <Link href="/resources" className={`flex items-center gap-3 p-2 rounded-lg ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <span>📖</span>
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Resources & Tips</span>
                </Link>
                <Link href="/comparison" className={`flex items-center gap-3 p-2 rounded-lg ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <span>📊</span>
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Peer Comparison</span>
                </Link>
              </div>
            </div>

            {/* Referral CTA */}
            <div className="rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 p-3 sm:p-4 text-white">
              <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Invite Friends</h3>
              <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">Earn XP for each friend who joins</p>
              <Link href="/settings#referrals" className="block w-full py-2.5 sm:py-2 text-center rounded-lg text-sm font-medium bg-white text-purple-600 hover:bg-purple-50">
                Get Referral Link
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 mt-12 ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`max-w-6xl mx-auto px-4 text-center text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
