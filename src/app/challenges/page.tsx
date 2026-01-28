"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import WeeklyLeaderboard from "@/components/WeeklyLeaderboard";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  difficulty: "easy" | "medium" | "hard";
  reward: {
    xp: number;
    badge?: string;
    streakFreeze?: boolean;
  };
  icon: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  xpReward: number;
  pointsReward: number;
}

interface UserStats {
  completedCount: number;
  totalChallenges: number;
  totalXPEarned: number;
  totalPointsEarned: number;
  rank: number | null;
  percentile: number | null;
}

interface PastWeekResult {
  week_number: number;
  year: number;
  challenges_completed: number;
  total_challenges: number;
  total_xp_earned: number;
  rank: number | null;
}

interface Badge {
  name: string;
  icon: string;
  description: string;
}

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy",
    color: "text-green-600",
    bgColor: "bg-green-100",
    darkBgColor: "bg-green-900/30",
    borderColor: "border-green-300",
  },
  medium: {
    label: "Medium",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    darkBgColor: "bg-amber-900/30",
    borderColor: "border-amber-300",
  },
  hard: {
    label: "Hard",
    color: "text-red-600",
    bgColor: "bg-red-100",
    darkBgColor: "bg-red-900/30",
    borderColor: "border-red-300",
  },
};

export default function ChallengesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [pastResults, setPastResults] = useState<PastWeekResult[]>([]);
  const [badges, setBadges] = useState<Record<string, Badge>>({});
  const [weekNumber, setWeekNumber] = useState(0);
  const [year, setYear] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch challenges data
  useEffect(() => {
    const fetchChallenges = async () => {
      if (!session?.user?.email) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({ email: session.user.email });
        const res = await fetch(`/api/challenges?${params}`);

        if (res.ok) {
          const data = await res.json();
          setChallenges(data.challenges || []);
          setUserStats(data.userStats);
          setWeekNumber(data.weekNumber);
          setYear(data.year);
          setDaysRemaining(data.daysRemaining);
          setBadges(data.badges || {});
        }
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchChallenges();
    }
  }, [session, status]);

  // Fetch past week results
  useEffect(() => {
    const fetchPastResults = async () => {
      if (!session?.user?.email) return;

      try {
        const params = new URLSearchParams({
          email: session.user.email,
          past_results: "true",
        });
        const res = await fetch(`/api/challenges?${params}`);

        if (res.ok) {
          const data = await res.json();
          setPastResults(data.pastResults || []);
        }
      } catch (err) {
        console.error("Failed to fetch past results:", err);
      }
    };

    if (status === "authenticated") {
      fetchPastResults();
    }
  }, [session, status]);

  // Sync challenges
  const handleSync = async () => {
    if (!session?.user?.email || syncing) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          action: "sync",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error("Failed to sync challenges:", err);
    } finally {
      setSyncing(false);
    }
  };

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

  const completedCount = challenges.filter(c => c.completed).length;
  const progressPercent = (completedCount / challenges.length) * 100;

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
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
            <Link
              href="/dashboard"
              className={`px-4 py-2 font-medium transition-colors ${isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className={`px-4 py-2 font-medium transition-colors ${isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"}`}
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Weekly Challenges
          </h1>
          <p className={`text-lg ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Complete challenges to earn XP, badges, and climb the leaderboard
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              Week {weekNumber}, {year}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${isDarkTheme ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-600"}`}>
              {daysRemaining} days remaining
            </span>
          </div>
        </div>

        {/* User Stats Overview */}
        {userStats && (
          <div className={`rounded-2xl p-6 mb-8 border ${isDarkTheme ? "bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-800/50" : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"}`}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  {userStats.completedCount}/{userStats.totalChallenges}
                </p>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Challenges</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                  +{userStats.totalXPEarned}
                </p>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>XP Earned</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${isDarkTheme ? "text-amber-400" : "text-amber-600"}`}>
                  {userStats.totalPointsEarned}
                </p>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Points</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${isDarkTheme ? "text-purple-400" : "text-purple-600"}`}>
                  #{userStats.rank || "-"}
                </p>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Rank</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${isDarkTheme ? "text-blue-400" : "text-blue-600"}`}>
                  {userStats.percentile ? `Top ${userStats.percentile}%` : "-"}
                </p>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Percentile</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className={isDarkTheme ? "text-slate-400" : "text-slate-600"}>Weekly Progress</span>
                <span className={isDarkTheme ? "text-slate-300" : "text-slate-700"}>{completedCount}/{challenges.length} complete</span>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${isDarkTheme ? "bg-slate-800" : "bg-slate-200"}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completedCount === challenges.length ? "bg-green-500" : "bg-purple-500"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Challenges */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-2xl border overflow-hidden ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className={`p-6 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      This Week's Challenges
                    </h2>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      Complete all 3 to earn bonus rewards
                    </p>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDarkTheme
                        ? "bg-slate-800 hover:bg-slate-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    } ${syncing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {syncing ? "Syncing..." : "Refresh Progress"}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {challenges.map((challenge) => {
                  const diffConfig = DIFFICULTY_CONFIG[challenge.difficulty];
                  const progressPercent = Math.min((challenge.progress / challenge.target) * 100, 100);

                  return (
                    <div
                      key={challenge.id}
                      className={`rounded-xl p-5 border transition-all ${
                        challenge.completed
                          ? isDarkTheme
                            ? "bg-green-900/20 border-green-700"
                            : "bg-green-50 border-green-300"
                          : isDarkTheme
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{challenge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                              {challenge.title}
                              {challenge.completed && <span className="ml-2 text-green-500">&#10003;</span>}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDarkTheme ? diffConfig.darkBgColor : diffConfig.bgColor} ${diffConfig.color}`}>
                              {diffConfig.label}
                            </span>
                          </div>
                          <p className={`text-sm mb-3 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                            {challenge.description}
                          </p>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>Progress</span>
                              <span className={isDarkTheme ? "text-slate-300" : "text-slate-700"}>
                                {challenge.progress}/{challenge.target}
                              </span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`}>
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  challenge.completed ? "bg-green-500" : "bg-purple-500"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Rewards */}
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkTheme ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                              +{challenge.xpReward} XP
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkTheme ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                              +{challenge.pointsReward} pts
                            </span>
                            {challenge.reward.badge && badges[challenge.reward.badge] && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkTheme ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                                {badges[challenge.reward.badge].icon} {badges[challenge.reward.badge].name}
                              </span>
                            )}
                            {challenge.reward.streakFreeze && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkTheme ? "bg-cyan-900/50 text-cyan-300" : "bg-cyan-100 text-cyan-700"}`}>
                                &#10052; Streak Freeze
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Challenges Complete Bonus */}
              {completedCount === challenges.length && (
                <div className={`p-6 border-t ${isDarkTheme ? "border-slate-800 bg-gradient-to-r from-green-900/30 to-emerald-900/30" : "border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50"}`}>
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">&#127881;</span>
                    <h3 className={`text-lg font-bold mb-1 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      All Challenges Complete!
                    </h3>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      You've earned the Completionist badge for this week
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Past Week Results */}
            {pastResults.length > 0 && (
              <div className={`rounded-2xl border overflow-hidden ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className={`p-6 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
                  <h2 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    Past Weeks
                  </h2>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Your challenge history
                  </p>
                </div>

                <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-100"}`}>
                  {pastResults.map((result) => (
                    <div
                      key={`${result.year}-${result.week_number}`}
                      className={`p-4 flex items-center justify-between ${isDarkTheme ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          result.challenges_completed === result.total_challenges
                            ? isDarkTheme ? "bg-green-900/50" : "bg-green-100"
                            : isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                        }`}>
                          <span className={`text-xl ${
                            result.challenges_completed === result.total_challenges
                              ? "text-green-500"
                              : isDarkTheme ? "text-slate-400" : "text-slate-600"
                          }`}>
                            {result.challenges_completed === result.total_challenges ? "&#10003;" : `${result.challenges_completed}/${result.total_challenges}`}
                          </span>
                        </div>
                        <div>
                          <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                            Week {result.week_number}, {result.year}
                          </p>
                          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                            {result.challenges_completed}/{result.total_challenges} challenges completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className={`font-bold ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                              +{result.total_xp_earned} XP
                            </p>
                          </div>
                          {result.rank && (
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              result.rank <= 3
                                ? isDarkTheme ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"
                                : isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                            }`}>
                              #{result.rank}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Leaderboard */}
            <WeeklyLeaderboard
              userEmail={session?.user?.email || undefined}
              weekNumber={weekNumber}
              year={year}
            />

            {/* Rewards Info */}
            <div className={`rounded-2xl border p-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className={`font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Challenge Rewards
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkTheme ? "bg-green-900/50" : "bg-green-100"}`}>
                    <span className="text-green-500">&#9733;</span>
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Easy Challenge</p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>+25 XP, +10 pts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkTheme ? "bg-amber-900/50" : "bg-amber-100"}`}>
                    <span className="text-amber-500">&#9733;</span>
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Medium Challenge</p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>+50 XP, +25 pts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkTheme ? "bg-red-900/50" : "bg-red-100"}`}>
                    <span className="text-red-500">&#9733;</span>
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Hard Challenge</p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>+100 XP, +50 pts, +Streak Freeze</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Badges */}
            <div className={`rounded-2xl border p-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className={`font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Special Badges
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">&#129351;</span>
                  <div>
                    <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Weekly Winner</p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Rank #1 in weekly challenges</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">&#127941;</span>
                  <div>
                    <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Top 3</p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Finish in top 3</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">&#10024;</span>
                  <div>
                    <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Completionist</p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Complete all 3 challenges</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Link
                href="/?start=interview"
                className="block w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-center hover:bg-red-700 transition-colors"
              >
                Start Interview
              </Link>
              <Link
                href="/questions"
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-colors ${isDarkTheme ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}
              >
                Practice Questions
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/questions" className="hover:text-red-600 transition-colors">Questions</Link>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
        </div>
      </footer>
    </div>
  );
}
