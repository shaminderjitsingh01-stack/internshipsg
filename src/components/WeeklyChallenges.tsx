"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

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
  xpReward: number;
  pointsReward: number;
}

interface UserStats {
  completedCount: number;
  totalChallenges: number;
  totalXPEarned: number;
  rank: number | null;
}

interface Props {
  userEmail: string;
  totalInterviews?: number;
  currentStreak?: number;
}

const DIFFICULTY_COLORS = {
  easy: {
    bg: "bg-green-100",
    darkBg: "bg-green-900/30",
    text: "text-green-700",
    darkText: "text-green-400",
  },
  medium: {
    bg: "bg-amber-100",
    darkBg: "bg-amber-900/30",
    text: "text-amber-700",
    darkText: "text-amber-400",
  },
  hard: {
    bg: "bg-red-100",
    darkBg: "bg-red-900/30",
    text: "text-red-700",
    darkText: "text-red-400",
  },
};

export default function WeeklyChallenges({ userEmail, totalInterviews = 0, currentStreak = 0 }: Props) {
  const { isDarkTheme } = useTheme();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState<{ xp: number; badge?: string } | null>(null);

  // Fetch challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      if (!userEmail) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({ email: userEmail });
        const res = await fetch(`/api/challenges?${params}`);

        if (res.ok) {
          const data = await res.json();
          setChallenges(data.challenges || []);
          setUserStats(data.userStats);
          setDaysRemaining(data.daysRemaining);
        }
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [userEmail]);

  // Sync challenges when props change
  useEffect(() => {
    const syncChallenges = async () => {
      if (!userEmail || loading) return;

      setSyncing(true);
      try {
        const res = await fetch("/api/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail,
            action: "sync",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const oldChallenges = challenges;
          const newChallenges = data.challenges || [];
          setChallenges(newChallenges);

          // Check for newly completed challenges
          for (const newChallenge of newChallenges) {
            const oldChallenge = oldChallenges.find(c => c.id === newChallenge.id);
            if (newChallenge.completed && oldChallenge && !oldChallenge.completed) {
              // Show reward popup
              setShowRewardPopup({
                xp: newChallenge.xpReward,
                badge: newChallenge.reward?.badge,
              });
              setTimeout(() => setShowRewardPopup(null), 3000);
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync challenges:", err);
      } finally {
        setSyncing(false);
      }
    };

    syncChallenges();
  }, [totalInterviews, currentStreak]);

  const completedCount = challenges.filter(c => c.completed).length;
  const isDarkMode = isDarkTheme ?? false;

  if (loading) {
    return (
      <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border relative ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"}`}>
      {/* Reward Popup */}
      {showRewardPopup && (
        <div className="absolute top-4 right-4 z-50 animate-bounce">
          <div className={`px-4 py-2 rounded-lg shadow-lg ${isDarkMode ? "bg-green-900 text-green-100" : "bg-green-500 text-white"}`}>
            <p className="font-bold">Challenge Complete!</p>
            <p className="text-sm">+{showRewardPopup.xp} XP earned</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#127919;</span>
          <h3 className={`font-semibold text-sm sm:text-base ${isDarkMode ? "text-white" : "text-purple-900"}`}>
            Weekly Challenges
          </h3>
          {syncing && (
            <span className="animate-pulse text-xs text-purple-500">syncing...</span>
          )}
        </div>
        <div className="text-right">
          <span className={`text-xs ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
            {daysRemaining} days left
          </span>
          <p className={`text-xs ${isDarkMode ? "text-purple-500" : "text-purple-500"}`}>
            {completedCount}/{challenges.length} complete
          </p>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {challenges.map(challenge => {
          const progressPercent = Math.min((challenge.progress / challenge.target) * 100, 100);
          const diffColors = DIFFICULTY_COLORS[challenge.difficulty];

          return (
            <div
              key={challenge.id}
              className={`rounded-xl p-3 sm:p-4 transition-all ${
                challenge.completed
                  ? isDarkMode
                    ? "bg-green-900/30 border border-green-700"
                    : "bg-green-50 border-2 border-green-400"
                  : isDarkMode
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-white border border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{challenge.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${challenge.completed ? (isDarkMode ? "text-green-400" : "text-green-700") : (isDarkMode ? "text-white" : "text-slate-900")}`}>
                        {challenge.title}
                        {challenge.completed && <span className="ml-2">&#10003;</span>}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isDarkMode ? diffColors.darkBg : diffColors.bg} ${isDarkMode ? diffColors.darkText : diffColors.text}`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {challenge.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                    +{challenge.xpReward} XP
                  </span>
                  {challenge.reward.streakFreeze && (
                    <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? "bg-cyan-900/50 text-cyan-300" : "bg-cyan-100 text-cyan-700"}`}>
                      &#10052;
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Progress</span>
                  <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                    {challenge.progress}/{challenge.target}
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      challenge.completed ? "bg-green-500" : "bg-purple-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* All Complete Banner */}
      {completedCount === challenges.length && challenges.length > 0 && (
        <div className={`mt-4 p-3 rounded-xl text-center ${isDarkMode ? "bg-green-900/30" : "bg-green-100"}`}>
          <p className={`font-semibold text-sm ${isDarkMode ? "text-green-300" : "text-green-800"}`}>
            &#127881; All challenges complete!
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
            You're a true champion this week!
          </p>
        </div>
      )}

      {/* View All Link */}
      <Link
        href="/challenges"
        className={`block mt-4 text-center py-2 rounded-lg text-sm font-medium transition-all ${
          isDarkMode
            ? "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
        }`}
      >
        View Full Challenges Page &rarr;
      </Link>
    </div>
  );
}
