"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface ReferralStats {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  rewarded_referrals: number;
  total_xp_earned: number;
}

interface ReferredFriend {
  email: string;
  name: string;
  status: "pending" | "completed" | "rewarded";
  created_at: string;
  avatar_url?: string;
}

interface Props {
  userEmail: string;
}

export default function ReferralWidget({ userEmail }: Props) {
  const { isDarkTheme } = useTheme();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referredFriends, setReferredFriends] = useState<ReferredFriend[]>([]);
  const [xpPerReferral, setXpPerReferral] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAllFriends, setShowAllFriends] = useState(false);

  const fetchReferralData = useCallback(async () => {
    try {
      const res = await fetch(`/api/referrals?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode);
        setReferralLink(data.referralLink);
        setStats(data.stats);
        setReferredFriends(data.referredFriends || []);
        setXpPerReferral(data.xpPerReferral || 100);
      }
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) {
      fetchReferralData();
    }
  }, [userEmail, fetchReferralData]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareOnWhatsApp = () => {
    const text = `Join me on Internship.sg and ace your interviews! Use my referral link to get started: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnTelegram = () => {
    const text = `Join me on Internship.sg and ace your interviews! Use my referral link to get started:`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const shareOnTwitter = () => {
    const text = `Preparing for internship interviews? Check out Internship.sg - it's been super helpful for my interview prep! Join using my link:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      "_blank"
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      "_blank"
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Signed Up
          </span>
        );
      case "rewarded":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Rewarded
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-SG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className={`rounded-2xl p-6 ${
          isDarkTheme ? "bg-slate-900 border border-white/10" : "bg-white shadow-lg"
        }`}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-6 ${
        isDarkTheme ? "bg-slate-900 border border-white/10" : "bg-white shadow-lg"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Invite Friends
          </h2>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Earn {xpPerReferral} XP for each friend who joins
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label
          className={`block text-sm font-medium mb-2 ${
            isDarkTheme ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Your Referral Link
        </label>
        <div className="flex gap-2">
          <div
            className={`flex-1 px-4 py-3 rounded-xl text-sm truncate ${
              isDarkTheme
                ? "bg-slate-800 text-slate-300 border border-slate-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {referralLink}
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              copied
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            }`}
          >
            {copied ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
        <p className={`text-xs mt-2 ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
          Code: <span className="font-mono font-semibold">{referralCode}</span>
        </p>
      </div>

      {/* Share Buttons */}
      <div className="mb-6">
        <label
          className={`block text-sm font-medium mb-3 ${
            isDarkTheme ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Share via
        </label>
        <div className="flex gap-3">
          {/* WhatsApp */}
          <button
            onClick={shareOnWhatsApp}
            className="flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            onClick={shareOnTelegram}
            className="flex-1 py-3 rounded-xl bg-[#0088cc] hover:bg-[#007ab8] text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span className="hidden sm:inline">Telegram</span>
          </button>

          {/* Twitter/X */}
          <button
            onClick={shareOnTwitter}
            className="flex-1 py-3 rounded-xl bg-black hover:bg-slate-800 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="hidden sm:inline">Twitter</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={shareOnLinkedIn}
            className="flex-1 py-3 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span className="hidden sm:inline">LinkedIn</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div
          className={`grid grid-cols-3 gap-4 p-4 rounded-xl mb-6 ${
            isDarkTheme ? "bg-slate-800" : "bg-slate-50"
          }`}
        >
          <div className="text-center">
            <p
              className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              {stats.total_referrals}
            </p>
            <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Total Invites
            </p>
          </div>
          <div className="text-center">
            <p
              className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              {stats.pending_referrals + stats.completed_referrals}
            </p>
            <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Pending
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{stats.rewarded_referrals}</p>
            <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Rewarded
            </p>
          </div>
        </div>
      )}

      {/* XP Earned */}
      {stats && stats.total_xp_earned > 0 && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl mb-6 ${
            isDarkTheme ? "bg-gradient-to-r from-purple-900/50 to-pink-900/50" : "bg-gradient-to-r from-purple-50 to-pink-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {stats.total_xp_earned} XP Earned
              </p>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                From {stats.rewarded_referrals} successful referral{stats.rewarded_referrals !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Referred Friends List */}
      {referredFriends.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-sm font-medium ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
            >
              Referred Friends
            </h3>
            {referredFriends.length > 3 && (
              <button
                onClick={() => setShowAllFriends(!showAllFriends)}
                className={`text-xs ${isDarkTheme ? "text-purple-400" : "text-purple-600"} hover:underline`}
              >
                {showAllFriends ? "Show less" : `View all (${referredFriends.length})`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(showAllFriends ? referredFriends : referredFriends.slice(0, 3)).map(
              (friend, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    isDarkTheme ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isDarkTheme
                          ? "bg-slate-700 text-slate-300"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        friend.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          isDarkTheme ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {friend.name}
                      </p>
                      <p
                        className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}
                      >
                        Joined {formatDate(friend.created_at)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(friend.status)}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {referredFriends.length === 0 && (
        <div
          className={`text-center py-6 rounded-xl ${
            isDarkTheme ? "bg-slate-800" : "bg-slate-50"
          }`}
        >
          <div className="text-4xl mb-2">👥</div>
          <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            No referrals yet
          </p>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Share your link to invite friends and earn XP!
          </p>
        </div>
      )}

      {/* How It Works */}
      <div
        className={`mt-6 p-4 rounded-xl ${
          isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"
        }`}
      >
        <h4 className={`text-sm font-medium mb-3 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
          How Referrals Work
        </h4>
        <ol className={`text-xs space-y-2 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
              1
            </span>
            Share your unique referral link with friends
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
              2
            </span>
            They sign up using your link
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
              3
            </span>
            Once they complete their first practice session, you earn {xpPerReferral} XP!
          </li>
        </ol>
      </div>
    </div>
  );
}
