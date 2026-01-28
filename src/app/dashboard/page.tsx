"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import StreakWidget from "@/components/StreakWidget";
import StreakCard from "@/components/StreakCard";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import CoverLetterAssistant from "@/components/CoverLetterAssistant";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import PrepChecklist from "@/components/PrepChecklist";
import WeeklyChallenges from "@/components/WeeklyChallenges";
import ProgressTimeline from "@/components/ProgressTimeline";
import AIStrengthsInsights from "@/components/AIStrengthsInsights";
import CareerPathQuiz from "@/components/CareerPathQuiz";
import InterviewMistakes from "@/components/InterviewMistakes";
import AICareerCoach from "@/components/AICareerCoach";
import PerformanceBenchmark from "@/components/PerformanceBenchmark";
import PeerComparison from "@/components/PeerComparison";
import ProfileSettings from "@/components/ProfileSettings";
import InterviewStats from "@/components/InterviewStats";

interface Interview {
  id: string;
  created_at: string;
  duration: number;
  score: number;
  feedback: string;
  video_url: string | null;
}

interface UserProfile {
  username?: string;
  full_name?: string;
  school?: string;
  graduation_year?: number;
  field_of_study?: string;
  linkedin_url?: string;
  bio?: string;
  is_public?: boolean;
}

interface LeaderboardData {
  rank: number;
  total_users: number;
  percentile: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "resume" | "cover-letter" | "billing" | "profile">("overview");
  const [showShareCard, setShowShareCard] = useState(false);
  const [streakForShare, setStreakForShare] = useState(0);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, badges: [] as { badge_id: string; unlocked_at: string }[] });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch user's interviews
  useEffect(() => {
    const fetchInterviews = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/interviews?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setInterviews(data.interviews || []);
          }
        } catch (err) {
          console.error("Failed to fetch interviews:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchInterviews();
    }
  }, [session, status]);

  // Fetch streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/streak?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setStreakData({
              currentStreak: data.currentStreak || 0,
              longestStreak: data.longestStreak || 0,
              badges: data.badges || [],
            });
          }
        } catch (err) {
          console.error("Failed to fetch streak data:", err);
        }
      }
    };

    if (status === "authenticated") {
      fetchStreakData();
    }
  }, [session, status]);

  // Fetch user profile and leaderboard data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (session?.user?.email) {
        setProfileLoading(true);
        try {
          // Fetch profile
          const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(session.user.email)}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUserProfile(profileData.profile || null);
            setIsProfilePublic(profileData.profile?.is_public || false);
          }

          // Fetch leaderboard rank
          const leaderboardRes = await fetch(`/api/leaderboard/rank?email=${encodeURIComponent(session.user.email)}`);
          if (leaderboardRes.ok) {
            const leaderboardData = await leaderboardRes.json();
            setLeaderboardData(leaderboardData);
          }
        } catch (err) {
          console.error("Failed to fetch profile data:", err);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (status === "authenticated") {
      fetchProfileData();
    }
  }, [session, status]);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!userProfile) return { percentage: 0, missing: ["Username", "School", "Graduation Year", "Field of Study", "Bio"] };

    const fields = [
      { key: "username", label: "Username" },
      { key: "school", label: "School" },
      { key: "graduation_year", label: "Graduation Year" },
      { key: "field_of_study", label: "Field of Study" },
      { key: "bio", label: "Bio" },
    ];

    const missing: string[] = [];
    let completed = 0;

    fields.forEach(field => {
      if (userProfile[field.key as keyof UserProfile]) {
        completed++;
      } else {
        missing.push(field.label);
      }
    });

    return {
      percentage: Math.round((completed / fields.length) * 100),
      missing,
    };
  };

  const profileCompletion = calculateProfileCompletion();

  // Toggle profile visibility
  const toggleProfileVisibility = async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch("/api/profile/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          is_public: !isProfilePublic,
        }),
      });

      if (res.ok) {
        setIsProfilePublic(!isProfilePublic);
      }
    } catch (err) {
      console.error("Failed to update profile visibility:", err);
    }
  };

  // Copy profile link
  const copyProfileLink = () => {
    if (userProfile?.username) {
      const url = `${window.location.origin}/u/${userProfile.username}`;
      navigator.clipboard.writeText(url);
      alert("Profile link copied to clipboard!");
    }
  };

  // Share profile
  const shareProfile = () => {
    if (userProfile?.username) {
      const url = `${window.location.origin}/u/${userProfile.username}`;
      if (navigator.share) {
        navigator.share({
          title: "Check out my Internship.sg profile!",
          text: "I'm preparing for interviews on Internship.sg",
          url,
        });
      } else {
        copyProfileLink();
      }
    }
  };

  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/challenges"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
              >
                Challenges
              </Link>
              <Link
                href="/questions"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
              >
                Questions
              </Link>
              <Link
                href="/leaderboard"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
              >
                Leaderboard
              </Link>
              <Link
                href="/employers"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
              >
                For Employers
              </Link>
              <Link
                href="/roadmap"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
              >
                Roadmap
              </Link>
              <Link
                href="/about"
                className={`px-3 py-2 font-medium transition-colors text-sm ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
              >
                About
              </Link>
            </nav>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link
              href="/"
              className={`hidden sm:block px-4 py-2 font-medium transition-colors ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
            >
              New Interview
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 sm:gap-3 focus:outline-none"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}
                  />
                ) : (
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                    <span className="text-red-600 font-semibold text-sm">
                      {session.user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <svg className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''} ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-50 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`px-4 py-3 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-100'}`}>
                      <p className={`font-medium text-sm ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{session.user?.name}</p>
                      <p className={`text-xs truncate ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      {userProfile?.username && (
                        <Link
                          href={`/u/${userProfile.username}`}
                          onClick={() => setShowProfileDropdown(false)}
                          className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Profile
                        </Link>
                      )}
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileDropdown(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <Link
                        href="/leaderboard"
                        onClick={() => setShowProfileDropdown(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Leaderboard
                      </Link>
                    </div>
                    <div className={`border-t py-1 ${isDarkTheme ? 'border-slate-700' : 'border-slate-100'}`}>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                        className={`flex items-center gap-3 px-4 py-2 text-sm w-full transition-colors ${isDarkTheme ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-slate-50'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Welcome back, {session.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Manage your account and review your interview practice sessions.</p>
        </div>

        {/* Employers Watching Banner */}
        <div className={`mb-6 sm:mb-8 rounded-xl p-4 sm:p-6 border ${isDarkTheme ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700/50' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-2xl sm:text-3xl">
                <span role="img" aria-label="eyes">&#128064;</span>
              </div>
              <div>
                <h3 className={`font-semibold mb-1 text-base sm:text-lg ${isDarkTheme ? 'text-amber-300' : 'text-amber-900'}`}>
                  Employers are watching
                </h3>
                <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-amber-400/80' : 'text-amber-700'}`}>
                  Companies browse our talent pool to find dedicated interns.
                  Complete your profile and keep practicing to get noticed!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Your profile:</span>
                <button
                  onClick={toggleProfileVisibility}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    isProfilePublic
                      ? isDarkTheme ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-green-100 text-green-700 border border-green-300'
                      : isDarkTheme ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {isProfilePublic ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Public
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                      Private
                    </>
                  )}
                </button>
              </div>
              <Link
                href="/settings"
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${isDarkTheme ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              >
                Complete Profile
                <span className="hidden sm:inline"> &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-8 p-1 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-hide ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "overview"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("interviews")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "interviews"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("resume")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "resume"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => setActiveTab("cover-letter")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "cover-letter"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "billing"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === "profile"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Profile
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Profile Completion & Rank Row */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Profile Completion Card */}
              <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Profile Completion</h3>
                  <span className={`text-2xl font-bold ${profileCompletion.percentage === 100 ? 'text-green-500' : 'text-amber-500'}`}>
                    {profileCompletion.percentage}%
                  </span>
                </div>
                {/* Progress Bar */}
                <div className={`w-full h-3 rounded-full mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className={`h-3 rounded-full transition-all ${profileCompletion.percentage === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${profileCompletion.percentage}%` }}
                  />
                </div>
                {profileCompletion.missing.length > 0 ? (
                  <div className="mb-4">
                    <p className={`text-xs mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Missing:</p>
                    <div className="flex flex-wrap gap-1">
                      {profileCompletion.missing.slice(0, 3).map((field) => (
                        <span
                          key={field}
                          className={`px-2 py-0.5 text-xs rounded ${isDarkTheme ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {field}
                        </span>
                      ))}
                      {profileCompletion.missing.length > 3 && (
                        <span className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                          +{profileCompletion.missing.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm mb-4 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                    Your profile is complete!
                  </p>
                )}
                <Link
                  href="/settings"
                  className={`block w-full py-2 text-center rounded-lg text-sm font-medium transition-all ${isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                >
                  {profileCompletion.percentage === 100 ? "Edit Profile" : "Complete Profile"}
                </Link>
              </div>

              {/* Your Rank Widget */}
              <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-800/50' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <svg className={`w-5 h-5 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Your Rank</h3>
                </div>
                {leaderboardData ? (
                  <>
                    <div className="text-center mb-4">
                      <p className={`text-4xl font-bold ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`}>
                        #{leaderboardData.rank}
                      </p>
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        out of {leaderboardData.total_users} students
                      </p>
                    </div>
                    <div className={`text-center py-2 rounded-lg ${isDarkTheme ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                      <p className={`text-sm font-medium ${isDarkTheme ? 'text-purple-300' : 'text-purple-700'}`}>
                        Top {leaderboardData.percentile}%
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Complete activities to get ranked!
                    </p>
                  </div>
                )}
                <Link
                  href="/leaderboard"
                  className={`block w-full mt-4 py-2 text-center rounded-lg text-sm font-medium transition-all ${isDarkTheme ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                >
                  View Leaderboard
                </Link>
              </div>

              {/* Quick Links */}
              <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Quick Links</h3>
                <div className="space-y-2">
                  {userProfile?.username && (
                    <Link
                      href={`/u/${userProfile.username}`}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>View My Profile</span>
                    </Link>
                  )}
                  <Link
                    href="/leaderboard"
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>View Leaderboard</span>
                  </Link>
                  <button
                    onClick={shareProfile}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all w-full ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-green-900/50' : 'bg-green-100'}`}>
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Share Profile</span>
                  </button>
                  <Link
                    href="/referral"
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Invite Friends</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Streak Widget - Full Width */}
            {session?.user?.email && (
              <StreakWidget
                userEmail={session.user.email}
                onShare={(streakCount) => {
                  setStreakForShare(streakCount);
                  setShowShareCard(true);
                }}
              />
            )}
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {/* Profile Card */}
              <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Your Profile</h2>
                <div className="flex items-center gap-4 mb-6">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className={`w-16 h-16 rounded-full border-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                      <span className="text-red-600 font-bold text-xl">
                        {session.user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{session.user?.name}</p>
                    <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{session.user?.email}</p>
                  </div>
                </div>
                <div className={`pt-4 border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Member since</p>
                  <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>January 2026</p>
                </div>
              </div>

              {/* Confidence Meter */}
              {session?.user?.email && (
                <ConfidenceMeter
                  userEmail={session.user.email}
                  totalInterviews={interviews.length}
                  averageScore={interviews.length > 0 ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length : 0}
                  currentStreak={streakData.currentStreak}
                  totalActivities={interviews.length + streakData.currentStreak}
                />
              )}

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-4 sm:p-6 text-white">
                <h2 className="text-lg font-semibold mb-4">Ready to Practice?</h2>
                <p className="text-white/80 mb-6">
                  Start a new mock interview session and improve your skills.
                </p>
                <Link
                  href="/?start=interview"
                  className="block w-full py-3 bg-white text-red-600 rounded-xl font-semibold text-center hover:bg-red-50 transition-colors"
                >
                  Start New Interview
                </Link>
              </div>
            </div>

            {/* Weekly Challenges - Full Width */}
            {session?.user?.email && (
              <WeeklyChallenges
                userEmail={session.user.email}
                totalInterviews={interviews.length}
                currentStreak={streakData.currentStreak}
              />
            )}

            {/* Two Column Layout for Career & Learning */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Career Path Quiz */}
              {session?.user?.email && (
                <CareerPathQuiz userEmail={session.user.email} />
              )}

              {/* AI Career Coach */}
              {session?.user?.email && (
                <AICareerCoach userEmail={session.user.email} />
              )}
            </div>

            {/* Progress & Insights Row */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Progress Timeline */}
              {session?.user?.email && (
                <ProgressTimeline
                  userEmail={session.user.email}
                  totalInterviews={interviews.length}
                  currentStreak={streakData.currentStreak}
                  longestStreak={streakData.longestStreak}
                  badges={streakData.badges}
                  averageScore={interviews.length > 0 ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length : 0}
                />
              )}

              {/* AI Strengths Insights */}
              {session?.user?.email && (
                <AIStrengthsInsights
                  userEmail={session.user.email}
                  interviews={interviews.map(i => ({ score: i.score, feedback: i.feedback, created_at: i.created_at }))}
                />
              )}
            </div>

            {/* Learning & Benchmark Row */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Interview Mistakes Learning */}
              <InterviewMistakes />

              {/* Performance Benchmark */}
              {session?.user?.email && (
                <PerformanceBenchmark
                  userEmail={session.user.email}
                  totalInterviews={interviews.length}
                  averageScore={interviews.length > 0 ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length : 0}
                  currentStreak={streakData.currentStreak}
                  totalActivities={interviews.length + streakData.currentStreak}
                />
              )}
            </div>

            {/* How You Compare - Full Width */}
            {session?.user?.email && (
              <PeerComparison
                userEmail={session.user.email}
                userSchool={userProfile?.school}
                currentStreak={streakData.currentStreak}
                averageScore={interviews.length > 0 ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length : 0}
                totalXP={0}
              />
            )}

            {/* Prep Checklist - Full Width */}
            {session?.user?.email && (
              <PrepChecklist userEmail={session.user.email} />
            )}
          </div>
        )}

        {/* Share Card Modal */}
        {showShareCard && session?.user && (
          <StreakCard
            streak={streakForShare || 1}
            title="Interview Streak"
            userName={session.user.name || undefined}
            onClose={() => setShowShareCard(false)}
          />
        )}

        {/* Interviews Tab */}
        {activeTab === "interviews" && (
          <div className="space-y-6">
            {/* Stats Dashboard */}
            {session?.user?.email && (
              <InterviewStats
                userEmail={session.user.email}
                interviews={interviews.map(i => ({
                  id: i.id,
                  created_at: i.created_at,
                  score: i.score,
                  feedback: i.feedback,
                }))}
              />
            )}

            {/* Recent Interviews */}
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex items-center justify-between ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Recent Interviews</h2>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Your latest practice sessions</p>
                </div>
                <Link
                  href="/history"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isDarkTheme
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  View All History
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : interviews.length === 0 ? (
                <div className="p-12 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <svg className={`w-8 h-8 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>No interviews yet</h3>
                  <p className={`mb-6 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Start your first mock interview to see your history here.</p>
                  <Link
                    href="/?start=interview"
                    className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Start Your First Interview
                  </Link>
                </div>
              ) : (
                <div className={`divide-y ${isDarkTheme ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {interviews.slice(0, 5).map((interview) => (
                    <Link
                      key={interview.id}
                      href={`/history/${interview.id}`}
                      className={`block p-6 transition-colors ${isDarkTheme ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Mock Interview Session</p>
                            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(interview.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Score</p>
                            <p className={`text-lg font-bold ${
                              interview.score >= 8 ? 'text-green-600' :
                              interview.score >= 6 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{interview.score}/10</p>
                          </div>
                          <svg className={`w-5 h-5 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      {interview.feedback && (
                        <p className={`text-sm line-clamp-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{interview.feedback}</p>
                      )}
                    </Link>
                  ))}
                  {interviews.length > 5 && (
                    <div className={`p-4 text-center ${isDarkTheme ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                      <Link
                        href="/history"
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        View all {interviews.length} interviews
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resume Tab */}
        {activeTab === "resume" && session?.user?.email && (
          <ResumeAnalyzer userEmail={session.user.email} />
        )}

        {/* Cover Letter Tab */}
        {activeTab === "cover-letter" && session?.user?.email && (
          <CoverLetterAssistant userEmail={session.user.email} />
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Plan */}
            <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Current Plan</h2>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkTheme ? 'bg-green-900/50' : 'bg-green-100'}`}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Free Plan</p>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Basic interview practice</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited 15-min interviews
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI feedback & scoring
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Resume & cover letter tips
                </div>
              </div>
            </div>

            {/* Upgrade Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded">PRO</span>
                <span className="text-white/60 text-sm">Coming Soon</span>
              </div>
              <h2 className="text-lg font-semibold mb-2">Upgrade to Pro</h2>
              <p className="text-white/70 mb-6">
                Unlock longer sessions, video recordings, and advanced analytics.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30 & 60-min interview sessions
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Video recording & playback
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Detailed performance analytics
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Industry-specific question packs
                </li>
              </ul>
              <button
                disabled
                className="w-full py-3 bg-white/20 text-white/60 rounded-xl font-semibold cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && session?.user?.email && (
          <div className="space-y-6">
            {/* ProfileSettings Component */}
            <ProfileSettings
              userEmail={session.user.email}
              userName={session.user.name || undefined}
              onSave={() => {
                // Refresh profile data after save
                const fetchProfileData = async () => {
                  try {
                    const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(session.user?.email || '')}`);
                    if (profileRes.ok) {
                      const profileData = await profileRes.json();
                      setUserProfile(profileData.profile || null);
                      setIsProfilePublic(profileData.profile?.is_public || false);
                    }
                  } catch (err) {
                    console.error("Failed to refresh profile data:", err);
                  }
                };
                fetchProfileData();
              }}
            />

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Share Profile */}
              <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Share Your Profile</h3>
                <p className={`text-sm mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Share your progress with friends and potential employers.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={copyProfileLink}
                    disabled={!userProfile?.username}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                      userProfile?.username
                        ? isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                        : isDarkTheme ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={shareProfile}
                    disabled={!userProfile?.username}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                      userProfile?.username
                        ? isDarkTheme ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        : isDarkTheme ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Share
                  </button>
                </div>
                {!userProfile?.username && (
                  <p className={`text-xs mt-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    Set a username above to share your profile
                  </p>
                )}
                {userProfile?.username && (
                  <Link
                    href={`/u/${userProfile.username}`}
                    className={`block w-full mt-3 py-2 text-center rounded-lg text-sm font-medium transition-all ${isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                  >
                    View Public Profile
                  </Link>
                )}
              </div>

              {/* Invite Friends */}
              <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${isDarkTheme ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/50' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Invite Friends</h3>
                <p className={`text-sm mb-4 ${isDarkTheme ? 'text-amber-400/80' : 'text-amber-700'}`}>
                  Earn rewards when your friends join and practice!
                </p>
                <Link
                  href="/referral"
                  className={`block w-full py-2 text-center rounded-lg font-medium transition-all ${isDarkTheme ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                >
                  Get Referral Link
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/questions" className="hover:text-red-600 transition-colors">Questions</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/resources" className="hover:text-red-600 transition-colors">Resources</Link>
            <Link href="/employers" className="hover:text-red-600 transition-colors">For Employers</Link>
            <Link href="/roadmap" className="hover:text-red-600 transition-colors">Roadmap</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
            <a href="/sitemap.xml" className="hover:text-red-600 transition-colors">Sitemap</a>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
