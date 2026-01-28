"use client";

import { useState, useEffect } from "react";

interface Props {
  userEmail: string;
  freezeCount?: number;
  maxFreezes?: number;
  daysUntilNextFreeze?: number;
  compact?: boolean;
}

export default function StreakFreezeWidget({
  userEmail,
  freezeCount: initialFreezeCount,
  maxFreezes = 2,
  daysUntilNextFreeze: initialDays,
  compact = false,
}: Props) {
  const [freezeCount, setFreezeCount] = useState(initialFreezeCount ?? 0);
  const [daysUntilNextFreeze, setDaysUntilNextFreeze] = useState(initialDays ?? 7);
  const [loading, setLoading] = useState(initialFreezeCount === undefined);

  useEffect(() => {
    if (initialFreezeCount !== undefined) {
      setFreezeCount(initialFreezeCount);
      setLoading(false);
      return;
    }

    // Fetch streak data if not provided
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/streaks?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setFreezeCount(data.streak?.streak_freezes || 0);
          // Calculate days until next freeze
          const currentStreak = data.streak?.current_streak || 0;
          const nextMilestone = Math.ceil((currentStreak + 1) / 7) * 7;
          setDaysUntilNextFreeze(nextMilestone - currentStreak);
        }
      } catch (err) {
        console.error("Failed to fetch streak data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchData();
    }
  }, [userEmail, initialFreezeCount]);

  if (loading) {
    return (
      <div className={`${compact ? "inline-flex items-center gap-2" : "bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200"}`}>
        <div className="animate-pulse">
          <div className={`${compact ? "w-16 h-6" : "w-24 h-8"} bg-sky-200 rounded`}></div>
        </div>
      </div>
    );
  }

  // Render snowflake icons
  const renderFreezeIcons = () => {
    const icons = [];
    for (let i = 0; i < maxFreezes; i++) {
      icons.push(
        <span
          key={i}
          className={`text-lg sm:text-xl transition-all ${
            i < freezeCount
              ? "opacity-100"
              : "opacity-30 grayscale"
          }`}
          title={i < freezeCount ? "Streak Freeze Available" : "Streak Freeze Slot"}
        >
          ❄️
        </span>
      );
    }
    return icons;
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200">
        <span className="text-sm">❄️</span>
        <span className="text-xs font-medium text-sky-700">
          {freezeCount}/{maxFreezes}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-sky-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
            <span className="text-lg">❄️</span>
          </div>
          <div>
            <h3 className="font-semibold text-sky-900 text-sm sm:text-base">
              Streak Freezes
            </h3>
          </div>
        </div>
      </div>

      {/* Freeze icons */}
      <div className="flex items-center gap-2 mb-3">
        {renderFreezeIcons()}
        <span className="text-sm text-sky-700 ml-2">
          {freezeCount} of {maxFreezes} available
        </span>
      </div>

      {/* Info text */}
      <div className="bg-white/60 rounded-lg p-3 text-sm">
        {freezeCount > 0 ? (
          <p className="text-sky-800">
            <span className="font-medium">Protected!</span> If you miss a day, a freeze will automatically save your streak.
          </p>
        ) : (
          <p className="text-sky-700">
            No freezes available. Maintain a <span className="font-medium">7-day streak</span> to earn one!
          </p>
        )}
      </div>

      {/* Progress to next freeze */}
      {freezeCount < maxFreezes && (
        <div className="mt-3 pt-3 border-t border-sky-200">
          <div className="flex items-center justify-between text-xs text-sky-600 mb-1">
            <span>Next freeze in</span>
            <span className="font-medium">{daysUntilNextFreeze} day{daysUntilNextFreeze !== 1 ? "s" : ""}</span>
          </div>
          <div className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all"
              style={{ width: `${((7 - daysUntilNextFreeze) / 7) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Max freezes reached */}
      {freezeCount >= maxFreezes && (
        <div className="mt-3 pt-3 border-t border-sky-200">
          <p className="text-xs text-sky-600 flex items-center gap-1">
            <span>✓</span> Maximum freezes stored. You're fully protected!
          </p>
        </div>
      )}
    </div>
  );
}
