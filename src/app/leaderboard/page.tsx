"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  name: string;
  image_url: string | null;
  school: string | null;
  tier: string;
  score: number;
  longest_streak: number;
  xp_points: number;
  is_current_user?: boolean;
}

interface SchoolRanking {
  rank: number;
  school: string;
  school_full_name: string;
  total_students: number;
  average_score: number;
  total_xp: number;
  top_student: {
    name: string;
    username: string;
    xp_points: number;
  } | null;
}

interface UserRank {
  rank: number;
  percentile: number;
  user: LeaderboardUser;
}

const SCHOOLS = [
  { value: "all", label: "All Schools" },
  { value: "NUS", label: "NUS" },
  { value: "NTU", label: "NTU" },
  { value: "SMU", label: "SMU" },
  { value: "SUTD", label: "SUTD" },
  { value: "SIT", label: "SIT" },
  { value: "SUSS", label: "SUSS" },
  { value: "SP", label: "Singapore Poly" },
  { value: "NP", label: "Ngee Ann Poly" },
  { value: "TP", label: "Temasek Poly" },
  { value: "RP", label: "Republic Poly" },
  { value: "NYP", label: "Nanyang Poly" },
];

const TIME_PERIODS = [
  { value: "all", label: "All Time" },
  { value: "month", label: "This Month" },
  { value: "week", label: "This Week" },
];

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  bronze: {
    label: "Bronze",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
  },
  silver: {
    label: "Silver",
    color: "text-slate-600",
    bgColor: "bg-slate-200",
    borderColor: "border-slate-400",
  },
  gold: {
    label: "Gold",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-400",
  },
  verified: {
    label: "Verified",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-400",
  },
  elite: {
    label: "Elite",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-400",
  },
};

function TierBadge({ tier, isDark }: { tier: string; isDark: boolean }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isDark
          ? `${config.bgColor.replace("100", "900/50")} ${config.color.replace("700", "400").replace("600", "400")}`
          : `${config.bgColor} ${config.color}`
      }`}
    >
      {config.label}
    </span>
  );
}

function SchoolBadge({ school, isDark }: { school: string | null; isDark: boolean }) {
  if (!school) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
      }`}
    >
      {school}
    </span>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">&#x1F947;</span>;
  if (rank === 2) return <span className="text-2xl">&#x1F948;</span>;
  if (rank === 3) return <span className="text-2xl">&#x1F949;</span>;
  return <span className="text-lg font-bold text-slate-500">#{rank}</span>;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [schools, setSchools] = useState<SchoolRanking[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  // Filters
  const [sortBy, setSortBy] = useState<"score" | "streak" | "xp">("score");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [timePeriod, setTimePeriod] = useState("all");

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          sort_by: sortBy,
          school: selectedSchool,
          time_period: timePeriod,
          limit: "50",
          offset: "0",
        });

        if (session?.user?.email) {
          params.append("email", session.user.email);
        }

        const res = await fetch(`/api/leaderboard?${params}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setUserRank(data.userRank);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [sortBy, selectedSchool, timePeriod, session?.user?.email]);

  // Fetch school rankings
  useEffect(() => {
    const fetchSchoolRankings = async () => {
      setSchoolsLoading(true);
      try {
        const params = new URLSearchParams({ time_period: timePeriod });
        const res = await fetch(`/api/leaderboard/schools?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSchools(data.schools || []);
        }
      } catch (err) {
        console.error("Failed to fetch school rankings:", err);
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchoolRankings();
  }, [timePeriod]);

  const getSortValue = (user: LeaderboardUser) => {
    if (sortBy === "streak") return user.longest_streak;
    if (sortBy === "xp") return user.xp_points.toLocaleString();
    return user.score;
  };

  const getSortLabel = () => {
    if (sortBy === "streak") return "Streak";
    if (sortBy === "xp") return "XP";
    return "Score";
  };

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
              href="/questions"
              className={`hidden sm:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Questions
            </Link>
            <Link
              href="/dashboard"
              className={`hidden sm:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Dashboard
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
        <div className="text-center mb-8 sm:mb-12">
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Talent Leaderboard
          </h1>
          <p className={`text-lg sm:text-xl ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Top performing students in Singapore
          </p>

          {/* Tier Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {Object.entries(TIER_CONFIG).map(([tier, config]) => (
              <div key={tier} className="flex items-center gap-2">
                <TierBadge tier={tier} isDark={isDarkTheme} />
              </div>
            ))}
          </div>
        </div>

        {/* Your Rank Card (if logged in) */}
        {userRank && (
          <div
            className={`mb-6 sm:mb-8 rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${
              isDarkTheme
                ? "bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-800/50"
                : "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
            }`}
          >
            <div className="flex flex-col gap-4">
              {/* User info row */}
              <div className="flex items-center gap-3 sm:gap-4">
                {userRank.user.image_url ? (
                  <img
                    src={userRank.user.image_url}
                    alt={userRank.user.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 border-red-500"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center border-2 sm:border-4 border-red-500">
                    <span className="text-white font-bold text-base sm:text-xl">
                      {userRank.user.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Your Rank</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    #{userRank.rank}
                  </p>
                  <p className={`text-xs sm:text-sm ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                    Top {userRank.percentile}% of users
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 py-2 border-t border-b ${isDarkTheme ? 'border-red-800/30' : 'border-red-200/50'}">
                <div className="text-center flex-1 sm:flex-none">
                  <p className={`text-lg sm:text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {userRank.user.score}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Score</p>
                </div>
                <div className="text-center flex-1 sm:flex-none">
                  <p className={`text-lg sm:text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {userRank.user.longest_streak}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Streak</p>
                </div>
                <div className="text-center flex-1 sm:flex-none">
                  <p className={`text-lg sm:text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {userRank.user.xp_points.toLocaleString()}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>XP</p>
                </div>
              </div>

              {/* Action button */}
              <Link
                href={`/u/${userRank.user.username}`}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-center min-h-[44px] flex items-center justify-center"
              >
                View Profile
              </Link>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div
          className={`mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 border ${
            isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Sort Tabs - Scrollable on mobile */}
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <div
                className={`flex gap-1 p-1 rounded-lg w-fit min-w-full sm:min-w-0 ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}
              >
                {[
                  { value: "score", label: "Score", fullLabel: "Overall Score" },
                  { value: "streak", label: "Streak", fullLabel: "Longest Streak" },
                  { value: "xp", label: "XP", fullLabel: "XP Points" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSortBy(tab.value as "score" | "streak" | "xp")}
                    className={`px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex-1 sm:flex-none min-h-[44px] sm:min-h-0 ${
                      sortBy === tab.value
                        ? isDarkTheme
                          ? "bg-slate-700 text-white"
                          : "bg-white text-slate-900 shadow-sm"
                        : isDarkTheme
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="sm:hidden">{tab.label}</span>
                    <span className="hidden sm:inline">{tab.fullLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters - Stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg border text-sm font-medium min-h-[44px] sm:min-h-0 ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {SCHOOLS.map((school) => (
                  <option key={school.value} value={school.value}>
                    {school.label}
                  </option>
                ))}
              </select>

              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg border text-sm font-medium min-h-[44px] sm:min-h-0 ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {TIME_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Leaderboard Table */}
          <div className="lg:col-span-2">
            <div
              className={`rounded-2xl border overflow-hidden ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className={`p-4 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
                <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Top Performers
                </h2>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  Ranked by {getSortLabel()}
                </p>
              </div>

              {loading ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    <svg
                      className={`w-8 h-8 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    No users yet
                  </h3>
                  <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                    Be the first to join the leaderboard!
                  </p>
                </div>
              ) : (
                <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-100"}`}>
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 sm:p-4 transition-colors ${
                        user.is_current_user
                          ? isDarkTheme
                            ? "bg-red-900/20"
                            : "bg-red-50"
                          : isDarkTheme
                          ? "hover:bg-slate-800/50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-4">
                        {/* Rank */}
                        <div className="w-8 sm:w-12 text-center flex-shrink-0">
                          <RankMedal rank={user.rank} />
                        </div>

                        {/* Avatar */}
                        {user.image_url ? (
                          <img
                            src={user.image_url}
                            alt={user.name}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex-shrink-0 ${
                              isDarkTheme ? "border-slate-700" : "border-slate-200"
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                            }`}
                          >
                            <span
                              className={`font-semibold text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
                            >
                              {user.name?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}

                        {/* Name & Badges */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/u/${user.username}`}
                            className={`text-sm sm:text-base font-semibold hover:underline truncate block ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {user.name}
                            {user.is_current_user && (
                              <span className="ml-1 sm:ml-2 text-red-500 text-xs sm:text-sm">(You)</span>
                            )}
                          </Link>
                          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                            <SchoolBadge school={user.school} isDark={isDarkTheme} />
                            <TierBadge tier={user.tier} isDark={isDarkTheme} />
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-base sm:text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                            {getSortValue(user)}
                          </p>
                          <p className={`text-[10px] sm:text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                            {getSortLabel()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* School vs School Rankings */}
          <div className="lg:col-span-1">
            <div
              className={`rounded-2xl border overflow-hidden ${
                isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className={`p-4 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
                <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  School vs School
                </h2>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  Rankings by total XP
                </p>
              </div>

              {schoolsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : schools.length === 0 ? (
                <div className="p-8 text-center">
                  <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                    No school data available
                  </p>
                </div>
              ) : (
                <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-100"}`}>
                  {schools.slice(0, 10).map((school) => (
                    <div key={school.school} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              school.rank === 1
                                ? "bg-yellow-100 text-yellow-700"
                                : school.rank === 2
                                ? "bg-slate-200 text-slate-700"
                                : school.rank === 3
                                ? "bg-amber-100 text-amber-700"
                                : isDarkTheme
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {school.rank}
                          </span>
                          <div>
                            <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                              {school.school}
                            </p>
                            <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                              {school.total_students} students
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                            {school.total_xp.toLocaleString()}
                          </p>
                          <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                            Total XP
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                        Avg Score: {school.average_score}/10
                        {school.top_student && (
                          <span className="ml-2">
                            | Top: {school.top_student.name} ({school.top_student.xp_points.toLocaleString()} XP)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Card */}
            {!session && (
              <div className="mt-6 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Join the Leaderboard</h3>
                <p className="text-white/80 mb-4 text-sm">
                  Sign up to track your progress and compete with other students.
                </p>
                <Link
                  href="/auth/signin"
                  className="block w-full py-3 bg-white text-red-600 rounded-xl font-semibold text-center hover:bg-red-50 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
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
            <Link href="/questions" className="hover:text-red-600 transition-colors">
              Questions
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
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
