"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  userEmail: string;
  userName?: string;
  userImage?: string;
}

interface Stats {
  streak: number;
  xp: number;
  level: number;
  tier: string;
  followers: number;
  following: number;
  interviews: number;
  username?: string;
}

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  bronze: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Bronze" },
  silver: { color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", label: "Silver" },
  gold: { color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Gold" },
  verified: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Verified" },
  elite: { color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", label: "Elite" },
};

export default function SidebarStats({ userEmail, userName, userImage }: Props) {
  const { isDarkTheme } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch multiple data sources in parallel
        const [profileRes, streakRes, followRes] = await Promise.all([
          fetch(`/api/profile?email=${encodeURIComponent(userEmail)}`),
          fetch(`/api/streak?email=${encodeURIComponent(userEmail)}`),
          fetch(`/api/social/follow?email=${encodeURIComponent(userEmail)}`),
        ]);

        let profile = null;
        let streak = null;
        let followData = null;

        if (profileRes.ok) {
          const data = await profileRes.json();
          profile = data.profile;
        }

        if (streakRes.ok) {
          const data = await streakRes.json();
          streak = data;
        }

        if (followRes.ok) {
          followData = await followRes.json();
        }

        setStats({
          streak: streak?.current_streak || 0,
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          tier: profile?.tier || "bronze",
          followers: followData?.followerCount || 0,
          following: followData?.followingCount || 0,
          interviews: streak?.total_activities || 0,
          username: profile?.username,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userEmail]);

  const tierConfig = stats?.tier ? TIER_CONFIG[stats.tier] || TIER_CONFIG.bronze : TIER_CONFIG.bronze;

  if (loading) {
    return (
      <div className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-24"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16 mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className={`rounded-2xl overflow-hidden shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-red-500 to-red-600"></div>

        {/* Avatar & Info */}
        <div className="px-4 pb-4">
          <div className="-mt-8 mb-3">
            <Link href={`/u/${stats?.username || userEmail.split("@")[0]}`}>
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName || "Profile"}
                  className={`w-16 h-16 rounded-full border-4 ${isDarkTheme ? 'border-slate-900' : 'border-white'}`}
                />
              ) : (
                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${isDarkTheme ? 'border-slate-900 bg-red-900/50' : 'border-white bg-red-100'}`}>
                  <span className="text-red-600 font-bold text-xl">
                    {userName?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </Link>
          </div>

          <Link href={`/u/${stats?.username || userEmail.split("@")[0]}`}>
            <h3 className={`font-semibold hover:underline ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {userName || "User"}
            </h3>
          </Link>

          {stats?.username && (
            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              @{stats.username}
            </p>
          )}

          {/* Tier Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${tierConfig.bg} ${tierConfig.color}`}>
            {stats?.tier === "elite" && "★ "}
            {stats?.tier === "verified" && "✓ "}
            {tierConfig.label} · Level {stats?.level || 1}
          </div>

          {/* Followers/Following */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <Link href={`/u/${stats?.username || userEmail.split("@")[0]}?tab=followers`} className="hover:underline">
              <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{stats?.followers || 0}</span>
              <span className={`ml-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Followers</span>
            </Link>
            <Link href={`/u/${stats?.username || userEmail.split("@")[0]}?tab=following`} className="hover:underline">
              <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{stats?.following || 0}</span>
              <span className={`ml-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Following</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className={`rounded-2xl p-4 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h4 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          Your Stats
        </h4>

        <div className="space-y-3">
          {/* Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-600'}>Streak</span>
            </div>
            <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {stats?.streak || 0} days
            </span>
          </div>

          {/* XP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-600'}>XP</span>
            </div>
            <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {stats?.xp?.toLocaleString() || 0}
            </span>
          </div>

          {/* Interviews */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-600'}>Interviews</span>
            </div>
            <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {stats?.interviews || 0}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/?start=interview"
            className="block w-full py-2 bg-red-600 text-white text-center rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Start Interview
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className={`rounded-2xl p-4 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <nav className="space-y-1">
          <Link
            href="/achievements"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <span>🏆</span>
            <span>Achievements</span>
          </Link>
          <Link
            href="/leaderboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <span>📊</span>
            <span>Leaderboard</span>
          </Link>
          <Link
            href="/challenges"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <span>🎯</span>
            <span>Weekly Challenges</span>
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
