"use client";

import { useEffect, useRef } from "react";
import { Badge, getRarityColor, getRarityColorDark, RARITY_INFO, CATEGORY_INFO } from "@/data/badges";
import { useTheme } from "@/context/ThemeContext";

interface BadgeDetailModalProps {
  badge: Badge;
  isEarned: boolean;
  earnedAt?: string;
  currentProgress?: number;
  onClose: () => void;
  onShare?: () => void;
}

export default function BadgeDetailModal({
  badge,
  isEarned,
  earnedAt,
  currentProgress = 0,
  onClose,
  onShare,
}: BadgeDetailModalProps) {
  const { isDarkTheme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const progressPercent = Math.min((currentProgress / badge.requirement) * 100, 100);
  const rarityInfo = RARITY_INFO[badge.rarity];
  const categoryInfo = CATEGORY_INFO[badge.category];

  const handleShare = async () => {
    const shareText = `I earned the "${badge.name}" badge on Internship.sg! ${badge.icon}\n\n${badge.description}\n\nJoin me and ace your next interview!`;
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${badge.name} Badge - Internship.sg`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert("Badge details copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }

    if (onShare) onShare();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all ${
          isDarkTheme ? "bg-slate-900" : "bg-white"
        }`}
      >
        {/* Header with gradient based on rarity */}
        <div
          className={`relative p-6 text-center ${
            isEarned
              ? badge.rarity === "legendary"
                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                : badge.rarity === "epic"
                ? "bg-gradient-to-br from-purple-500 to-pink-600"
                : badge.rarity === "rare"
                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : badge.rarity === "uncommon"
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : "bg-gradient-to-br from-slate-500 to-slate-600"
              : isDarkTheme
              ? "bg-slate-800"
              : "bg-slate-100"
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${
              isEarned
                ? "text-white/80 hover:text-white hover:bg-white/20"
                : isDarkTheme
                ? "text-slate-400 hover:text-white hover:bg-slate-700"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Badge Icon */}
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl ${
              isEarned
                ? "bg-white/20 shadow-lg"
                : isDarkTheme
                ? "bg-slate-700 grayscale"
                : "bg-white grayscale"
            }`}
          >
            {badge.icon}
          </div>

          {/* Badge Name */}
          <h2
            className={`mt-4 text-2xl font-bold ${
              isEarned ? "text-white" : isDarkTheme ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {badge.name}
          </h2>

          {/* Rarity Badge */}
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              isEarned
                ? "bg-white/20 text-white"
                : isDarkTheme
                ? getRarityColorDark(badge.rarity)
                : getRarityColor(badge.rarity)
            }`}
          >
            {rarityInfo.name}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <p
            className={`text-center text-lg mb-6 ${
              isDarkTheme ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {badge.description}
          </p>

          {/* Category */}
          <div
            className={`flex items-center justify-center gap-2 mb-4 text-sm ${
              isDarkTheme ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <span>{categoryInfo.icon}</span>
            <span>{categoryInfo.name}</span>
          </div>

          {/* Progress or Earned Date */}
          {isEarned ? (
            <div
              className={`text-center p-4 rounded-xl mb-4 ${
                isDarkTheme ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-200"
              }`}
            >
              <div className={`flex items-center justify-center gap-2 ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Earned!</span>
              </div>
              {earnedAt && (
                <p className={`text-sm mt-1 ${isDarkTheme ? "text-green-400/70" : "text-green-600/70"}`}>
                  Unlocked on {formatDate(earnedAt)}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <div
                className={`p-4 rounded-xl ${
                  isDarkTheme ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    Progress
                  </span>
                  <span className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    {currentProgress} / {badge.requirement}
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`}>
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className={`text-xs mt-2 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                  {badge.requirement - currentProgress} more to unlock this badge
                </p>
              </div>
            </div>
          )}

          {/* XP Reward */}
          <div
            className={`flex items-center justify-center gap-2 p-3 rounded-lg mb-6 ${
              isDarkTheme ? "bg-amber-900/30" : "bg-amber-50"
            }`}
          >
            <span className="text-lg">⭐</span>
            <span className={`font-semibold ${isDarkTheme ? "text-amber-400" : "text-amber-600"}`}>
              +{badge.xpReward} XP
            </span>
            <span className={`text-sm ${isDarkTheme ? "text-amber-400/70" : "text-amber-600/70"}`}>
              {isEarned ? "earned" : "on unlock"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                isDarkTheme
                  ? "bg-slate-800 text-white hover:bg-slate-700"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
            >
              Close
            </button>
            {isEarned && (
              <button
                onClick={handleShare}
                className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
