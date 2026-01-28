"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import BadgeDetailModal from "@/components/BadgeDetailModal";
import {
  Badge,
  BadgeCategory,
  UserBadgeProgress,
  CATEGORY_INFO,
  getRarityColor,
  getRarityColorDark,
  RARITY_INFO,
} from "@/data/badges";

interface BadgeWithProgress {
  badge: Badge;
  progress: UserBadgeProgress;
}

interface AchievementsData {
  totalBadges: number;
  earnedBadges: number;
  totalXP: number;
  currentTier: string;
  badges: BadgeWithProgress[];
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalInterviews: number;
    averageScore: number;
    perfectScores: number;
    highScores: number;
    referrals: number;
    profileComplete: boolean;
    consecutiveImprovements: number;
  };
}

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  bronze: {
    label: "Bronze",
    color: "text-amber-700",
    bgColor: "bg-gradient-to-r from-amber-100 to-amber-200",
    icon: "🥉",
  },
  silver: {
    label: "Silver",
    color: "text-slate-600",
    bgColor: "bg-gradient-to-r from-slate-200 to-slate-300",
    icon: "🥈",
  },
  gold: {
    label: "Gold",
    color: "text-yellow-600",
    bgColor: "bg-gradient-to-r from-yellow-100 to-yellow-200",
    icon: "🥇",
  },
  verified: {
    label: "Verified",
    color: "text-blue-600",
    bgColor: "bg-gradient-to-r from-blue-100 to-blue-200",
    icon: "✓",
  },
  elite: {
    label: "Elite",
    color: "text-purple-600",
    bgColor: "bg-gradient-to-r from-purple-100 to-purple-200",
    icon: "👑",
  },
};

const CATEGORIES: BadgeCategory[] = ["streak", "interview", "score", "profile", "special"];

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | "all">("all");
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/achievements");
    }
  }, [status, router]);

  // Fetch achievements data
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`/api/achievements?email=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const achievementsData = await res.json();
          setData(achievementsData);
        }
      } catch (err) {
        console.error("Failed to fetch achievements:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchAchievements();
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

  const tierConfig = data ? TIER_CONFIG[data.currentTier] : TIER_CONFIG.bronze;
  const filteredBadges = data?.badges.filter(item => {
    if (selectedCategory !== "all" && item.badge.category !== selectedCategory) return false;
    if (showEarnedOnly && !item.progress.isEarned) return false;
    return true;
  }) || [];

  const earnedCount = data?.earnedBadges || 0;
  const totalCount = data?.totalBadges || 0;
  const completionPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <Link
              href="/leaderboard"
              className={`hidden sm:block px-4 py-2 font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Leaderboard
            </Link>
            <Link
              href="/dashboard"
              className={`px-4 py-2 font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Dashboard
            </Link>
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${
                  isDarkTheme ? "border-slate-700" : "border-slate-200"
                }`}
              />
            ) : (
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                  isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                }`}
              >
                <span className="text-red-600 font-semibold text-sm">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Your Achievements
          </h1>
          <p className={`text-lg ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Track your progress and collect badges as you improve your interview skills
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Badges */}
          <div className={`rounded-2xl p-4 sm:p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDarkTheme ? "bg-purple-900/50" : "bg-purple-100"}`}>
                🏅
              </div>
              <div>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Total Badges</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  {earnedCount}/{totalCount}
                </p>
              </div>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className={`text-xs mt-2 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
              {completionPercent}% complete
            </p>
          </div>

          {/* XP Earned */}
          <div className={`rounded-2xl p-4 sm:p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDarkTheme ? "bg-amber-900/50" : "bg-amber-100"}`}>
                ⭐
              </div>
              <div>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>XP Earned</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  {(data?.totalXP || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Current Tier */}
          <div className={`rounded-2xl p-4 sm:p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDarkTheme ? "bg-blue-900/50" : "bg-blue-100"}`}>
                {tierConfig.icon}
              </div>
              <div>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Current Tier</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  {tierConfig.label}
                </p>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className={`rounded-2xl p-4 sm:p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDarkTheme ? "bg-orange-900/50" : "bg-orange-100"}`}>
                🔥
              </div>
              <div>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Current Streak</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  {data?.stats.currentStreak || 0} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={`mb-6 rounded-xl p-4 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === "all"
                    ? isDarkTheme
                      ? "bg-red-600 text-white"
                      : "bg-red-600 text-white"
                    : isDarkTheme
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === category
                      ? isDarkTheme
                        ? "bg-red-600 text-white"
                        : "bg-red-600 text-white"
                      : isDarkTheme
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{CATEGORY_INFO[category].icon}</span>
                  <span className="hidden sm:inline">{CATEGORY_INFO[category].name.replace(" Badges", "")}</span>
                </button>
              ))}
            </div>

            {/* Earned Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEarnedOnly}
                onChange={(e) => setShowEarnedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                Show earned only
              </span>
            </label>
          </div>
        </div>

        {/* Category Header (when filtered) */}
        {selectedCategory !== "all" && (
          <div className="mb-6">
            <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              <span>{CATEGORY_INFO[selectedCategory].icon}</span>
              {CATEGORY_INFO[selectedCategory].name}
            </h2>
            <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              {CATEGORY_INFO[selectedCategory].description}
            </p>
          </div>
        )}

        {/* Badge Grid */}
        {filteredBadges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBadges.map((item) => {
              const { badge, progress } = item;
              const isEarned = progress.isEarned;

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(item)}
                  className={`group relative rounded-xl p-4 border transition-all hover:scale-105 ${
                    isEarned
                      ? isDarkTheme
                        ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                      : isDarkTheme
                      ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Badge Icon */}
                  <div
                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${
                      isEarned
                        ? isDarkTheme
                          ? "bg-slate-700"
                          : "bg-slate-100"
                        : isDarkTheme
                        ? "bg-slate-800 grayscale opacity-50"
                        : "bg-slate-100 grayscale opacity-50"
                    }`}
                  >
                    {badge.icon}
                  </div>

                  {/* Badge Name */}
                  <h3
                    className={`font-semibold text-sm text-center mb-1 ${
                      isEarned
                        ? isDarkTheme
                          ? "text-white"
                          : "text-slate-900"
                        : isDarkTheme
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {badge.name}
                  </h3>

                  {/* Rarity Badge */}
                  <div className="flex justify-center mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isDarkTheme ? getRarityColorDark(badge.rarity) : getRarityColor(badge.rarity)
                      }`}
                    >
                      {RARITY_INFO[badge.rarity].name}
                    </span>
                  </div>

                  {/* Progress Bar or Earned Indicator */}
                  {isEarned ? (
                    <div className={`text-center ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`}>
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                          style={{ width: `${progress.progressPercent}%` }}
                        />
                      </div>
                      <p className={`text-xs text-center mt-1 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                        {progress.currentProgress}/{badge.requirement}
                      </p>
                    </div>
                  )}

                  {/* Lock Icon for locked badges */}
                  {!isEarned && (
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                        isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                      }`}
                    >
                      <svg
                        className={`w-3 h-3 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-12 rounded-xl ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
              <svg className={`w-8 h-8 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              No badges found
            </h3>
            <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
              {showEarnedOnly ? "You haven't earned any badges in this category yet." : "No badges match your filter."}
            </p>
            {showEarnedOnly && (
              <button
                onClick={() => setShowEarnedOnly(false)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Show All Badges
              </button>
            )}
          </div>
        )}

        {/* Rarity Legend */}
        <div className={`mt-8 p-4 rounded-xl border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <h3 className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Rarity Legend</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(RARITY_INFO).map(([rarity, info]) => (
              <div
                key={rarity}
                className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${
                  isDarkTheme ? getRarityColorDark(rarity as Badge['rarity']) : getRarityColor(rarity as Badge['rarity'])
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                {info.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge.badge}
          isEarned={selectedBadge.progress.isEarned}
          earnedAt={selectedBadge.progress.earnedAt}
          currentProgress={selectedBadge.progress.currentProgress}
          onClose={() => setSelectedBadge(null)}
        />
      )}

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
            <Link href="/questions" className="hover:text-red-600 transition-colors">
              Questions
            </Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
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
