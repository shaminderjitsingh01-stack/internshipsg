"use client";

import { useState, useEffect, ReactNode } from "react";
import { TIERS, formatXPReason } from "@/lib/xp";

interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

interface TierInfo {
  min: number;
  max: number;
  color: string;
  label: string;
}

interface XPData {
  totalXP: number;
  level: number;
  tier: string;
  tierInfo: TierInfo;
  percentile: number;
  levelProgress: number;
  xpToNextLevel: number;
  recentTransactions: XPTransaction[];
}

interface Props {
  compact?: boolean;
  showTransactions?: boolean;
  className?: string;
}

export default function XPDisplay({
  compact = false,
  showTransactions = true,
  className = "",
}: Props) {
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchXPData();
  }, []);

  const fetchXPData = async () => {
    try {
      const response = await fetch("/api/xp");
      const data = await response.json();

      if (data.success) {
        setXpData(data.data);
      } else {
        setError(data.error || "Failed to load XP data");
      }
    } catch (err) {
      setError("Failed to fetch XP data");
      console.error("Error fetching XP:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-slate-200 dark:bg-slate-700 rounded-xl h-32" />
      </div>
    );
  }

  if (error || !xpData) {
    return null;
  }

  const { totalXP, level, tier, tierInfo, percentile, levelProgress, xpToNextLevel, recentTransactions } = xpData;

  // Compact version for header/sidebar
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Tier Badge */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: tierInfo.color }}
          title={`${tierInfo.label} Tier`}
        >
          {level}
        </div>
        {/* XP Info */}
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {totalXP.toLocaleString()} XP
          </span>
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${levelProgress}%`,
                backgroundColor: tierInfo.color,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header with Tier Badge */}
      <div
        className="px-6 py-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${tierInfo.color}, ${adjustColor(tierInfo.color, -20)})`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TierBadge tier={tier} tierInfo={tierInfo} />
              <span className="text-white/90 text-sm font-medium">
                {tierInfo.label} Tier
              </span>
            </div>
            <div className="text-2xl font-bold">{totalXP.toLocaleString()} XP</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">Lv. {level}</div>
            <div className="text-white/80 text-sm">
              Top {100 - percentile}% of users
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-slate-400">Level {level}</span>
          {level < 50 ? (
            <span className="text-slate-600 dark:text-slate-400">
              {xpToNextLevel.toLocaleString()} XP to Level {level + 1}
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Max Level!
            </span>
          )}
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${levelProgress}%`,
              backgroundColor: tierInfo.color,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>{levelProgress}% complete</span>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Tier Progress
        </h4>
        <div className="flex gap-1">
          {Object.entries(TIERS).map(([tierKey, tierData]) => {
            const isActive = tierKey === tier;
            const isPast = totalXP >= tierData.min;

            return (
              <div
                key={tierKey}
                className="flex-1 relative group"
              >
                <div
                  className={`h-2 rounded-full transition-all ${
                    isPast ? "" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                  style={{
                    backgroundColor: isPast ? tierData.color : undefined,
                    opacity: isActive ? 1 : isPast ? 0.6 : undefined,
                  }}
                />
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity">
                  {tierData.label}: {tierData.min.toLocaleString()}+ XP
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
          {Object.values(TIERS).map((tierData) => (
            <span key={tierData.label} className="text-center flex-1">
              {tierData.label}
            </span>
          ))}
        </div>
      </div>

      {/* Recent XP Gains */}
      {showTransactions && recentTransactions.length > 0 && (
        <div className="px-6 py-4">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Recent XP
          </h4>
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {formatXPReason(transaction.reason)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatRelativeTime(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  +{transaction.amount} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tier Badge Component
function TierBadge({ tier, tierInfo }: { tier: string; tierInfo: TierInfo }) {
  const icons: Record<string, ReactNode> = {
    bronze: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    silver: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    gold: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
      </svg>
    ),
    verified: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" />
      </svg>
    ),
    elite: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20ZM16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  };

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20"
      title={`${tierInfo.label} Tier`}
    >
      {icons[tier] || icons.bronze}
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString();
}

// Export a small badge component for use elsewhere
export function XPBadge({
  tier,
  level,
  className = "",
}: {
  tier: string;
  level: number;
  className?: string;
}) {
  const tierInfo = TIERS[tier as keyof typeof TIERS] || TIERS.bronze;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-white text-xs font-medium ${className}`}
      style={{ backgroundColor: tierInfo.color }}
    >
      <span>Lv. {level}</span>
      <span className="opacity-80">|</span>
      <span>{tierInfo.label}</span>
    </div>
  );
}
