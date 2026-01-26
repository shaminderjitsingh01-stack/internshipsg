"use client";

import { useState } from "react";
import { useSharing, SHARING_CONFIG } from "@/lib/sharing-context";

const SHARE_PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", color: "bg-green-500", icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
  { id: "telegram", name: "Telegram", color: "bg-blue-500", icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
  { id: "twitter", name: "X / Twitter", color: "bg-black", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { id: "linkedin", name: "LinkedIn", color: "bg-blue-700", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { id: "copy", name: "Copy Link", color: "bg-slate-600", icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" },
];

const BADGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  first_share: { name: "First Share", icon: "🎯", color: "bg-blue-100 text-blue-700" },
  super_sharer: { name: "Super Sharer", icon: "⭐", color: "bg-amber-100 text-amber-700" },
  viral_champion: { name: "Viral Champion", icon: "🏆", color: "bg-purple-100 text-purple-700" },
};

export default function ShareDashboard() {
  const { state, recordShare, getContestMessage } = useSharing();
  const [showShareModal, setShowShareModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = (platform: string) => {
    const shareText = `🚀 I'm preparing for my internship with Internship.sg - AI-powered mock interviews, resume tips, and career guidance for Singapore students! Join me: ${state.referralLink}`;

    if (platform === "copy") {
      navigator.clipboard.writeText(state.referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(state.referralLink)}&text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(state.referralLink)}`, "_blank");
    }

    recordShare(platform);

    // Show notification
    const canUnlockMore = state.totalRoundsUnlocked < state.maxUnlockableRounds;
    if (canUnlockMore) {
      setNotification(`🎉 You unlocked ${SHARING_CONFIG.ROUNDS_PER_SHARE} extra interview rounds!`);
    } else {
      setNotification("Thanks for sharing! You've reached the max unlockable rounds.");
    }
    setTimeout(() => setNotification(null), 4000);
    setShowShareModal(false);
  };

  const unlockedPercentage = (state.totalRoundsUnlocked / state.maxUnlockableRounds) * 100;

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
          {notification}
        </div>
      )}

      {/* Rounds Status Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-indigo-200 text-sm">Interview Rounds Remaining</p>
            <p className="text-5xl font-bold">{state.remainingRounds}</p>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share to Unlock
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-indigo-200 mb-1">
            <span>Rounds Unlocked</span>
            <span>{state.totalRoundsUnlocked} / {state.maxUnlockableRounds}</span>
          </div>
          <div className="bg-indigo-800/50 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${unlockedPercentage}%` }}
            />
          </div>
        </div>

        <p className="text-indigo-200 text-sm">
          {state.totalRoundsUnlocked < state.maxUnlockableRounds
            ? `Share ${Math.ceil((state.maxUnlockableRounds - state.totalRoundsUnlocked) / SHARING_CONFIG.ROUNDS_PER_SHARE)} more times to unlock all rounds!`
            : "🎉 You've unlocked all bonus rounds!"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-slate-900">{state.sharesDone}</p>
          <p className="text-sm text-slate-500">Total Shares</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-slate-900">#{state.contestRank || "-"}</p>
          <p className="text-sm text-slate-500">Your Rank</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-slate-900">{state.daysLeftInContest}</p>
          <p className="text-sm text-slate-500">Days Left</p>
        </div>
      </div>

      {/* Contest Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">💰</span>
          <h3 className="font-bold text-lg">Monthly Share Contest - Win $100!</h3>
        </div>
        <p className="text-amber-100 text-sm mb-3">{getContestMessage()}</p>
        <button
          onClick={() => setShowShareModal(true)}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
        >
          Share Now →
        </button>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">🏆 Top Sharers Leaderboard</h3>
          <span className="text-xs text-slate-500">Resets monthly</span>
        </div>
        <div className="divide-y divide-slate-100">
          {state.leaderboard.map((sharer) => (
            <div
              key={sharer.username}
              className={`flex items-center justify-between p-4 ${sharer.isCurrentUser ? "bg-indigo-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  sharer.rank === 1 ? "bg-amber-400 text-amber-900" :
                  sharer.rank === 2 ? "bg-slate-300 text-slate-700" :
                  sharer.rank === 3 ? "bg-orange-300 text-orange-800" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {sharer.rank === 1 ? "🥇" : sharer.rank === 2 ? "🥈" : sharer.rank === 3 ? "🥉" : sharer.rank}
                </div>
                <div>
                  <p className={`font-medium ${sharer.isCurrentUser ? "text-indigo-600" : "text-slate-900"}`}>
                    {sharer.username} {sharer.isCurrentUser && "(You)"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{sharer.shares}</p>
                <p className="text-xs text-slate-500">shares</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-900 mb-3">🎖️ Your Badges</h3>
        <div className="flex flex-wrap gap-2">
          {state.badges.length > 0 ? (
            state.badges.map((badge) => (
              <span
                key={badge}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${BADGE_INFO[badge]?.color || "bg-slate-100 text-slate-600"}`}
              >
                {BADGE_INFO[badge]?.icon} {BADGE_INFO[badge]?.name}
              </span>
            ))
          ) : (
            <p className="text-slate-500 text-sm">Share to earn your first badge!</p>
          )}
        </div>
        {state.badges.length < 3 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Next badges to unlock:</p>
            <div className="flex flex-wrap gap-2">
              {!state.badges.includes("first_share") && (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">🎯 First Share (1 share)</span>
              )}
              {!state.badges.includes("super_sharer") && (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">⭐ Super Sharer (5 shares)</span>
              )}
              {!state.badges.includes("viral_champion") && (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">🏆 Viral Champion (10 shares)</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Referral Link */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-sm text-slate-600 mb-2">Your Referral Link</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={state.referralLink}
            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-600"
          />
          <button
            onClick={() => handleShare("copy")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              copiedLink ? "bg-green-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {copiedLink ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Share & Unlock Rounds</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-slate-600 mb-4">
              Share Internship.sg with friends and unlock <strong>{SHARING_CONFIG.ROUNDS_PER_SHARE} extra interview rounds</strong> per share!
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {SHARE_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 ${platform.color} text-white rounded-xl font-medium hover:opacity-90 transition`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={platform.icon} />
                  </svg>
                  {platform.name}
                </button>
              ))}
            </div>

            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-sm text-indigo-700">
                <strong>🎁 Bonus:</strong> When your friend signs up, you both get 2 extra rounds!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
