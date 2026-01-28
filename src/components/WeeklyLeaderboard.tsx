"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface LeaderboardEntry {
  rank: number;
  user_email: string;
  username: string;
  name: string;
  image_url: string | null;
  school: string | null;
  challenges_completed: number;
  total_points: number;
  is_current_user?: boolean;
}

interface Props {
  userEmail?: string;
  weekNumber?: number;
  year?: number;
  compact?: boolean;
  limit?: number;
}

function RankBadge({ rank, isDark }: { rank: number; isDark: boolean }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">3</span>
      </div>
    );
  }
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
      <span className={`font-semibold text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{rank}</span>
    </div>
  );
}

export default function WeeklyLeaderboard({ userEmail, weekNumber, year, compact = false, limit = 10 }: Props) {
  const { isDarkTheme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(weekNumber);
  const [currentYear, setCurrentYear] = useState(year);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ leaderboard: "true" });
        if (userEmail) params.append("email", userEmail);
        if (currentWeek) params.append("week", currentWeek.toString());
        if (currentYear) params.append("year", currentYear.toString());

        const res = await fetch(`/api/challenges?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
          if (!currentWeek) setCurrentWeek(data.weekNumber);
          if (!currentYear) setCurrentYear(data.year);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [userEmail, currentWeek, currentYear]);

  const displayedEntries = leaderboard.slice(0, limit);
  const userEntry = userEmail ? leaderboard.find(e => e.is_current_user) : null;
  const userNotInTop = userEntry && userEntry.rank > limit;

  if (compact) {
    return (
      <div className={`rounded-xl border overflow-hidden ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className={`p-4 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              Weekly Leaderboard
            </h3>
            <Link
              href="/challenges"
              className={`text-sm font-medium ${isDarkTheme ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
            >
              View All
            </Link>
          </div>
          <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
            Week {currentWeek}
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : displayedEntries.length === 0 ? (
          <div className="p-6 text-center">
            <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              No entries yet this week
            </p>
          </div>
        ) : (
          <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-100"}`}>
            {displayedEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.user_email}
                className={`p-3 flex items-center gap-3 ${
                  entry.is_current_user
                    ? isDarkTheme ? "bg-red-900/20" : "bg-red-50"
                    : ""
                }`}
              >
                <RankBadge rank={entry.rank} isDark={isDarkTheme} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {entry.name}
                    {entry.is_current_user && <span className="text-red-500 ml-1">(You)</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {entry.total_points}
                  </p>
                  <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
      <div className={`p-6 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Weekly Leaderboard
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            Week {currentWeek}, {currentYear}
          </span>
        </div>
        <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
          Top performers in weekly challenges
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        </div>
      ) : displayedEntries.length === 0 ? (
        <div className="p-12 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
            <svg className={`w-8 h-8 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            No entries yet
          </h3>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
            Complete challenges to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {displayedEntries.length >= 3 && (
            <div className="p-6 flex justify-center items-end gap-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full mb-2 overflow-hidden border-4 border-slate-400 ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                  {displayedEntries[1]?.image_url ? (
                    <img src={displayedEntries[1].image_url} alt={displayedEntries[1].name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`text-xl font-bold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                        {displayedEntries[1]?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-20 h-16 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-lg flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <p className={`text-xs mt-2 font-medium truncate max-w-20 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  {displayedEntries[1]?.name}
                </p>
                <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  {displayedEntries[1]?.total_points} pts
                </p>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-4">
                <div className="mb-2">
                  <span className="text-2xl">&#128081;</span>
                </div>
                <div className={`w-20 h-20 rounded-full mb-2 overflow-hidden border-4 border-yellow-400 ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                  {displayedEntries[0]?.image_url ? (
                    <img src={displayedEntries[0].image_url} alt={displayedEntries[0].name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`text-2xl font-bold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                        {displayedEntries[0]?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-24 h-20 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <p className={`text-sm mt-2 font-semibold truncate max-w-24 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  {displayedEntries[0]?.name}
                </p>
                <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  {displayedEntries[0]?.total_points} pts
                </p>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full mb-2 overflow-hidden border-4 border-amber-600 ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                  {displayedEntries[2]?.image_url ? (
                    <img src={displayedEntries[2].image_url} alt={displayedEntries[2].name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`text-xl font-bold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                        {displayedEntries[2]?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-20 h-12 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <p className={`text-xs mt-2 font-medium truncate max-w-20 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  {displayedEntries[2]?.name}
                </p>
                <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  {displayedEntries[2]?.total_points} pts
                </p>
              </div>
            </div>
          )}

          {/* Rest of Leaderboard */}
          <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-100"}`}>
            {displayedEntries.slice(3).map((entry) => (
              <div
                key={entry.user_email}
                className={`p-4 flex items-center gap-4 transition-colors ${
                  entry.is_current_user
                    ? isDarkTheme ? "bg-red-900/20" : "bg-red-50"
                    : isDarkTheme ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                }`}
              >
                <RankBadge rank={entry.rank} isDark={isDarkTheme} />

                {entry.image_url ? (
                  <img
                    src={entry.image_url}
                    alt={entry.name}
                    className={`w-10 h-10 rounded-full border-2 ${isDarkTheme ? "border-slate-700" : "border-slate-200"}`}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                    <span className={`font-semibold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      {entry.name?.charAt(0) || "?"}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/u/${entry.username}`}
                    className={`font-medium hover:underline ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {entry.name}
                    {entry.is_current_user && <span className="text-red-500 ml-2">(You)</span>}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {entry.school && (
                      <span className={`text-xs px-2 py-0.5 rounded ${isDarkTheme ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                        {entry.school}
                      </span>
                    )}
                    <span className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      {entry.challenges_completed}/3 challenges
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {entry.total_points}
                  </p>
                  <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>points</p>
                </div>
              </div>
            ))}

            {/* Show user if not in top limit */}
            {userNotInTop && userEntry && (
              <>
                <div className={`p-3 text-center ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"}`}>
                  <span className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>...</span>
                </div>
                <div
                  className={`p-4 flex items-center gap-4 ${isDarkTheme ? "bg-red-900/20" : "bg-red-50"}`}
                >
                  <RankBadge rank={userEntry.rank} isDark={isDarkTheme} />

                  {userEntry.image_url ? (
                    <img
                      src={userEntry.image_url}
                      alt={userEntry.name}
                      className={`w-10 h-10 rounded-full border-2 ${isDarkTheme ? "border-slate-700" : "border-slate-200"}`}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                      <span className={`font-semibold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                        {userEntry.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      {userEntry.name}
                      <span className="text-red-500 ml-2">(You)</span>
                    </p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      {userEntry.challenges_completed}/3 challenges
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      {userEntry.total_points}
                    </p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>points</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
