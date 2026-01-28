"use client";

import { useState, useEffect } from "react";
import ShareableCard from "./ShareableCard";

interface TopPercentileShareProps {
  email?: string;
  userName: string;
  userImage?: string | null;
  className?: string;
  isDark?: boolean;
}

interface RankData {
  rank: number;
  total_users: number;
  percentile: number;
  tier?: string;
  score?: number;
}

export default function TopPercentileShare({
  email,
  userName,
  userImage,
  className = "",
  isDark = false,
}: TopPercentileShareProps) {
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareCard, setShowShareCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRank = async () => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/leaderboard/rank?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setRankData(data);
        } else {
          setError("Could not fetch rank");
        }
      } catch (err) {
        console.error("Failed to fetch rank:", err);
        setError("Failed to load ranking");
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, [email]);

  if (loading) {
    return (
      <div
        className={`rounded-xl p-4 animate-pulse ${
          isDark ? "bg-slate-800" : "bg-slate-100"
        } ${className}`}
      >
        <div className={`h-4 rounded w-3/4 mb-2 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
        <div className={`h-8 rounded w-1/2 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
      </div>
    );
  }

  if (error || !rankData || !rankData.rank) {
    return null;
  }

  const { rank, total_users, percentile, tier = "bronze", score } = rankData;

  // Determine badge text based on percentile
  const getBadgeText = () => {
    if (percentile >= 99) return "Top 1%";
    if (percentile >= 95) return "Top 5%";
    if (percentile >= 90) return "Top 10%";
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Top 50%";
    return `Top ${100 - percentile}%`;
  };

  // Get gradient color based on percentile
  const getGradientClass = () => {
    if (percentile >= 95) return "from-amber-500 to-yellow-500";
    if (percentile >= 90) return "from-slate-400 to-slate-500";
    if (percentile >= 75) return "from-amber-600 to-amber-700";
    if (percentile >= 50) return "from-emerald-500 to-teal-500";
    return "from-blue-500 to-indigo-500";
  };

  return (
    <>
      {/* Rank Badge */}
      <div
        className={`rounded-xl overflow-hidden shadow-sm border ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        } ${className}`}
      >
        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${getGradientClass()} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Your Ranking</p>
              <p className="text-3xl font-bold">{getBadgeText()}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">#{rank}</p>
              <p className="text-sm opacity-80">of {total_users.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Details & Share Button */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              {score !== undefined && (
                <div className="text-center">
                  <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {score}
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Score</p>
                </div>
              )}
              <div className="text-center">
                <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {percentile}%
                </p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Percentile
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowShareCard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>

          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {percentile >= 90
              ? "Amazing! You're among the top performers on internship.sg!"
              : percentile >= 50
                ? "Great progress! Keep practicing to climb higher!"
                : "Keep going! Every practice session helps you improve."}
          </p>
        </div>
      </div>

      {/* Share Card Modal */}
      {showShareCard && (
        <ShareableCard
          type="rank"
          userName={userName}
          userImage={userImage}
          rank={rank}
          percentile={percentile}
          totalUsers={total_users}
          tier={tier}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </>
  );
}
