"use client";

import { useState, useEffect } from "react";
import { BADGES } from "@/lib/streaks";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  last_activity_date: string | null;
}

interface Badge {
  id: string;
  badge_id: string;
  name: string;
  icon: string;
  description: string;
  unlocked_at: string;
}

interface NextBadge {
  badge: {
    id: string;
    name: string;
    icon: string;
    requirement: number;
  };
  daysRemaining: number;
}

interface Props {
  userEmail: string;
  onShare?: () => void;
}

export default function StreakWidget({ userEmail, onShare }: Props) {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [nextBadge, setNextBadge] = useState<NextBadge | null>(null);
  const [title, setTitle] = useState("Start Your Journey");
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await fetch(`/api/streaks?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setStreak(data.streak);
          setBadges(data.badges || []);
          setNextBadge(data.nextBadge);
          setTitle(data.title);
        }
      } catch (err) {
        console.error("Failed to fetch streak:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchStreak();
    }
  }, [userEmail]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-white/20 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const totalActivities = streak?.total_activities || 0;

  // Calculate progress to next badge
  const progressPercent = nextBadge
    ? ((nextBadge.badge.requirement - nextBadge.daysRemaining) / nextBadge.badge.requirement) * 100
    : 100;

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">🔥</span> Interview Streak
          </h2>
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
            {title}
          </span>
        </div>

        {/* Main streak display */}
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-bold">{currentStreak}</span>
          <span className="text-xl mb-2 opacity-80">day{currentStreak !== 1 ? "s" : ""}</span>
        </div>

        {/* Progress bar to next badge */}
        {nextBadge && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="opacity-80">Next: {nextBadge.badge.icon} {nextBadge.badge.name}</span>
              <span className="opacity-80">{nextBadge.daysRemaining} more day{nextBadge.daysRemaining !== 1 ? "s" : ""} to unlock</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs opacity-70">Longest Streak</p>
            <p className="text-lg font-semibold">{longestStreak} days</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Total Sessions</p>
            <p className="text-lg font-semibold">{totalActivities}</p>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="pt-4 border-t border-white/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-70">Badges Earned</p>
              {badges.length > 3 && (
                <button
                  onClick={() => setShowAllBadges(!showAllBadges)}
                  className="text-xs underline opacity-70 hover:opacity-100"
                >
                  {showAllBadges ? "Show less" : `+${badges.length - 3} more`}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(showAllBadges ? badges : badges.slice(0, 3)).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-sm"
                  title={badge.description}
                >
                  <span>{badge.icon}</span>
                  <span className="text-xs">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share button */}
        {currentStreak >= 3 && onShare && (
          <button
            onClick={onShare}
            className="mt-4 w-full py-2 bg-white text-red-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Your Streak
          </button>
        )}
      </div>
    </div>
  );
}
