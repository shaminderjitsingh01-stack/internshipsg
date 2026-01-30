"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
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

interface LeaderboardUser {
  rank: number;
  email: string;
  name: string;
  avatar_url?: string;
  total_referrals: number;
  successful_referrals: number;
  xp_earned: number;
  is_current_user?: boolean;
}

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referredFriends, setReferredFriends] = useState<ReferredFriend[]>([]);
  const [xpPerReferral, setXpPerReferral] = useState(100);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "friends" | "leaderboard">("overview");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/referrals");
    }
  }, [status, router]);

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!session?.user?.email) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/referrals?email=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.referralCode || "");
          setReferralLink(data.referralLink || "");
          setStats(data.stats || null);
          setReferredFriends(data.referredFriends || []);
          setXpPerReferral(data.xpPerReferral || 100);
        }
      } catch (err) {
        console.error("Failed to fetch referral data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchReferralData();
    }
  }, [session, status]);

  // Fetch referral leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (session?.user?.email) {
          params.append("email", session.user.email);
        }
        const res = await fetch(`/api/referrals/leaderboard?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [session?.user?.email]);

  // Copy referral link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Share functions
  const shareViaWhatsApp = () => {
    const text = `Join me on Internship.sg - the best AI-powered interview prep platform for Singapore students! Use my referral link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaTelegram = () => {
    const text = `Join me on Internship.sg - the best AI-powered interview prep platform for Singapore students!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaTwitter = () => {
    const text = `Level up your interview skills with Internship.sg! Join using my referral link and we both earn rewards:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = "Join Internship.sg - AI-Powered Interview Prep";
    const body = `Hey!

I've been using Internship.sg to practice for internship interviews, and I think you'd find it really helpful too!

It has AI mock interviews, a question bank, company guides, and a great community of students preparing together.

Use my referral link to sign up and we'll both earn bonus XP:
${referralLink}

See you there!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "rewarded":
        return {
          bg: isDarkTheme ? "bg-green-900/50" : "bg-green-100",
          text: isDarkTheme ? "text-green-400" : "text-green-700",
          label: "Rewarded",
        };
      case "completed":
        return {
          bg: isDarkTheme ? "bg-blue-900/50" : "bg-blue-100",
          text: isDarkTheme ? "text-blue-400" : "text-blue-700",
          label: "Completed",
        };
      default:
        return {
          bg: isDarkTheme ? "bg-amber-900/50" : "bg-amber-100",
          text: isDarkTheme ? "text-amber-400" : "text-amber-700",
          label: "Pending",
        };
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Internship.sg"
              className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`}
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                isDarkTheme
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <Link
              href="/dashboard"
              className={`hidden sm:block px-4 py-2 font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Dashboard
            </Link>
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${
                  isDarkTheme ? "border-slate-700" : "border-slate-200"
                }`}
              />
            ) : (
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                  isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                }`}
              >
                <span className="text-red-600 font-semibold text-sm">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Invite Friends, Earn Rewards
          </h1>
          <p className={`text-base sm:text-lg ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Share your referral link and earn {xpPerReferral} XP for each friend who joins
          </p>
        </div>

        {/* Referral Code Card */}
        <div
          className={`mb-6 sm:mb-8 rounded-2xl p-4 sm:p-6 border ${
            isDarkTheme
              ? "bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-800/50"
              : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
            {/* Code Display */}
            <div className="flex-1">
              <p className={`text-sm font-medium mb-2 ${isDarkTheme ? "text-purple-300" : "text-purple-700"}`}>
                Your Referral Code
              </p>
              <div className="flex items-center gap-3">
                <code
                  className={`text-2xl sm:text-3xl font-mono font-bold tracking-wider ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  {referralCode || "Loading..."}
                </code>
              </div>
            </div>

            {/* Link & Copy */}
            <div className="flex-1 lg:max-w-md">
              <p className={`text-sm font-medium mb-2 ${isDarkTheme ? "text-purple-300" : "text-purple-700"}`}>
                Your Referral Link
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm truncate ${
                    isDarkTheme
                      ? "bg-slate-800/50 border-slate-700 text-slate-300"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mt-6 pt-6 border-t border-purple-500/20">
            <p className={`text-sm font-medium mb-3 ${isDarkTheme ? "text-purple-300" : "text-purple-700"}`}>
              Share via
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
              <button
                onClick={shareViaTelegram}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram
              </button>
              <button
                onClick={shareViaTwitter}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </button>
              <button
                onClick={shareViaEmail}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  isDarkTheme
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div
            className={`rounded-xl p-4 sm:p-5 border ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">&#128101;</span>
              <span className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Total Referrals
              </span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              {stats?.total_referrals || 0}
            </p>
          </div>

          <div
            className={`rounded-xl p-4 sm:p-5 border ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">&#9989;</span>
              <span className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Successful
              </span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              {stats?.rewarded_referrals || 0}
            </p>
          </div>

          <div
            className={`rounded-xl p-4 sm:p-5 border ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">&#11088;</span>
              <span className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                XP Earned
              </span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold text-green-500`}>
              +{stats?.total_xp_earned || 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div
            className={`flex gap-1 p-1 rounded-xl ${isDarkTheme ? "bg-slate-900" : "bg-slate-100"}`}
          >
            {[
              { id: "overview", label: "How It Works" },
              { id: "friends", label: `Friends (${referredFriends.length})` },
              { id: "leaderboard", label: "Leaderboard" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? isDarkTheme
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-900 shadow-sm"
                    : isDarkTheme
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div
            className={`rounded-2xl border p-6 ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <h2 className={`text-xl font-semibold mb-6 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              How Referrals Work
            </h2>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    isDarkTheme ? "bg-purple-900/50" : "bg-purple-100"
                  }`}
                >
                  <span className="text-3xl">&#128279;</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  1. Share Your Link
                </h3>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  Copy your unique referral link and share it with friends via WhatsApp, Telegram, or email.
                </p>
              </div>

              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    isDarkTheme ? "bg-blue-900/50" : "bg-blue-100"
                  }`}
                >
                  <span className="text-3xl">&#128100;</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  2. Friend Signs Up
                </h3>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  When your friend uses your link to create an account, they're connected to your referral.
                </p>
              </div>

              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    isDarkTheme ? "bg-green-900/50" : "bg-green-100"
                  }`}
                >
                  <span className="text-3xl">&#127873;</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  3. Both Earn XP
                </h3>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  Once they complete their first activity, you earn {xpPerReferral} XP! Climb the leaderboard faster.
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className={`mt-8 pt-6 border-t ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
              <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Benefits of Referring Friends
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-green-900/50" : "bg-green-100"}`}>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      Earn {xpPerReferral} XP per referral
                    </p>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      Boost your XP and climb the leaderboard
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-green-900/50" : "bg-green-100"}`}>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      Unlock achievements
                    </p>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      Earn special badges for referring friends
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-green-900/50" : "bg-green-100"}`}>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      Study together
                    </p>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      Practice with friends and improve together
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-green-900/50" : "bg-green-100"}`}>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      No limit on referrals
                    </p>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      Refer as many friends as you want
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "friends" && (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className={`p-4 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
              <h2 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Referred Friends
              </h2>
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Track the status of your referrals
              </p>
            </div>

            {referredFriends.length === 0 ? (
              <div className="p-12 text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  <span className="text-3xl">&#128101;</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  No referrals yet
                </h3>
                <p className={`mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  Share your referral link to start earning XP!
                </p>
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
                >
                  Copy Referral Link
                </button>
              </div>
            ) : (
              <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-100"}`}>
                {referredFriends.map((friend, idx) => {
                  const statusBadge = getStatusBadge(friend.status);
                  return (
                    <div key={idx} className="p-4 flex items-center gap-4">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.name}
                          className={`w-10 h-10 rounded-full border-2 ${
                            isDarkTheme ? "border-slate-700" : "border-slate-200"
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          <span className={`font-semibold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                            {friend.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                          {friend.name}
                        </p>
                        <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                          Joined {new Date(friend.created_at).toLocaleDateString("en-SG", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className={`p-4 border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
              <h2 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Top Referrers
              </h2>
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Users with the most successful referrals
              </p>
            </div>

            {leaderboardLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  <span className="text-3xl">&#127942;</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  No referrers yet
                </h3>
                <p className={isDarkTheme ? "text-slate-400" : "text-slate-600"}>
                  Be the first to refer friends and top the leaderboard!
                </p>
              </div>
            ) : (
              <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-100"}`}>
                {leaderboard.map((user) => (
                  <div
                    key={user.email}
                    className={`p-4 flex items-center gap-4 ${
                      user.is_current_user
                        ? isDarkTheme
                          ? "bg-purple-900/20"
                          : "bg-purple-50"
                        : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {user.rank === 1 ? (
                        <span className="text-2xl">&#x1F947;</span>
                      ) : user.rank === 2 ? (
                        <span className="text-2xl">&#x1F948;</span>
                      ) : user.rank === 3 ? (
                        <span className="text-2xl">&#x1F949;</span>
                      ) : (
                        <span className={`text-lg font-bold ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                          #{user.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className={`w-10 h-10 rounded-full border-2 ${
                          isDarkTheme ? "border-slate-700" : "border-slate-200"
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                        }`}
                      >
                        <span className={`font-semibold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                        {user.name}
                        {user.is_current_user && (
                          <span className="ml-2 text-purple-500 text-sm">(You)</span>
                        )}
                      </p>
                      <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                        {user.successful_referrals} successful referral{user.successful_referrals !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className={`font-bold text-green-500`}>+{user.xp_earned}</p>
                      <p className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${
          isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">
              Leaderboard
            </Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">
              About
            </Link>
          </div>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
