"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { BADGES } from "@/lib/streaks";
import ShareButton from "@/components/ShareButton";
import ShareableCard from "@/components/ShareableCard";
import ProjectsSection from "@/components/ProjectsSection";

interface Badge {
  id: string;
  badge_id: string;
  unlocked_at: string;
}

interface Education {
  id: string;
  school: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  grade: string | null;
  activities: string | null;
}

interface Experience {
  id: string;
  company: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  technologies: string[] | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
}

interface ProfileData {
  username: string;
  name: string;
  image: string | null;
  school: string | null;
  year_of_study: string | null;
  target_role: string | null;
  bio: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  skills: string[];
  preferred_industries: string[];
  is_looking: boolean;
  xp: number;
  level: number;
  tier: string;
  profile_views: number;
  created_at: string;
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  average_score: number | null;
  total_interviews: number;
  badges: Badge[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
}

interface Props {
  profile: ProfileData;
}

// Tier badge configuration
const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  bronze: {
    label: "Bronze",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: "🥉",
  },
  silver: {
    label: "Silver",
    color: "text-slate-600",
    bgColor: "bg-slate-200",
    icon: "🥈",
  },
  gold: {
    label: "Gold",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: "🥇",
  },
  verified: {
    label: "Verified",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: "✓",
  },
  elite: {
    label: "Elite",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: "💎",
  },
};

export default function PublicProfileClient({ profile }: Props) {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [showStreakCard, setShowStreakCard] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);

  // Record profile view on mount
  useEffect(() => {
    if (!viewRecorded) {
      fetch(`/api/profile/${profile.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewer_type: "anonymous" }),
      }).catch(() => {});
      setViewRecorded(true);
    }
  }, [profile.username, viewRecorded]);

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Generate share URL for this profile
  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${profile.username}`
    : `https://internship.sg/u/${profile.username}`;

  const tierConfig = TIER_CONFIG[profile.tier] || TIER_CONFIG.bronze;

  // Get initials for avatar fallback
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // Enrich badges with full info
  const enrichedBadges = profile.badges.map((badge) => ({
    ...badge,
    ...BADGES[badge.badge_id as keyof typeof BADGES],
  }));

  return (
    <div
      className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Internship.sg"
              className={`h-7 sm:h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`}
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
              href="/auth/signin"
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Profile Header Card */}
        <div
          className={`rounded-2xl p-6 sm:p-8 shadow-sm border mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 ${isDarkTheme ? "border-slate-700" : "border-slate-200"}`}
                />
              ) : (
                <div
                  className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-red-900/50" : "bg-red-100"}`}
                >
                  <span className="text-red-600 font-bold text-3xl sm:text-4xl">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 mb-2">
                <h1
                  className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  {profile.name}
                </h1>
                {/* Tier Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${tierConfig.bgColor} ${tierConfig.color}`}
                >
                  <span>{tierConfig.icon}</span>
                  {tierConfig.label}
                </span>
              </div>

              <p
                className={`text-sm mb-3 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
              >
                @{profile.username}
              </p>

              {/* School & Year */}
              {(profile.school || profile.year_of_study) && (
                <div
                  className={`flex flex-wrap justify-center sm:justify-start gap-2 mb-3 text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
                >
                  {profile.school && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                      {profile.school}
                    </span>
                  )}
                  {profile.year_of_study && (
                    <span
                      className={`${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
                    >
                      | Year {profile.year_of_study}
                    </span>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p
                  className={`mb-4 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
                >
                  {profile.bio}
                </p>
              )}

              {/* Badges Row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                {/* Looking for Internship Badge */}
                {profile.is_looking && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Looking for Internship
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDarkTheme ? "bg-blue-900/50 text-blue-300 hover:bg-blue-900" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDarkTheme ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Portfolio
                  </a>
                )}
                <ShareButton
                  url={profileUrl}
                  title={`${profile.name}'s Profile on internship.sg`}
                  text={`Check out ${profile.name}'s profile on internship.sg! Level ${profile.level} ${profile.tier} tier with ${profile.xp.toLocaleString()} XP.`}
                  variant="compact"
                  isDark={isDarkTheme}
                />
                <button
                  onClick={() => setShowProfileCard(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkTheme
                      ? "bg-red-900/50 text-red-300 hover:bg-red-900"
                      : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Share Card
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Clickable to share */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {/* Interview Score */}
          <button
            onClick={profile.average_score !== null ? () => setShowScoreCard(true) : undefined}
            disabled={profile.average_score === null}
            className={`rounded-xl p-4 text-center shadow-sm border transition-all ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            } ${
              profile.average_score !== null
                ? "cursor-pointer hover:shadow-md hover:border-red-300 hover:scale-[1.02]"
                : "cursor-default"
            }`}
          >
            <p
              className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              {profile.average_score !== null
                ? `${profile.average_score}/10`
                : "-"}
            </p>
            <p
              className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
            >
              Avg Interview Score
            </p>
            {profile.average_score !== null && (
              <p className={`text-xs mt-1 ${isDarkTheme ? "text-red-400" : "text-red-500"}`}>
                Click to share
              </p>
            )}
          </button>

          {/* Current Streak */}
          <button
            onClick={profile.current_streak > 0 ? () => setShowStreakCard(true) : undefined}
            disabled={profile.current_streak === 0}
            className={`rounded-xl p-4 text-center shadow-sm border transition-all ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            } ${
              profile.current_streak > 0
                ? "cursor-pointer hover:shadow-md hover:border-orange-300 hover:scale-[1.02]"
                : "cursor-default"
            }`}
          >
            <p
              className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              {profile.current_streak}
            </p>
            <p
              className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
            >
              Current Streak
            </p>
            {profile.current_streak > 0 && (
              <p className={`text-xs mt-1 ${isDarkTheme ? "text-orange-400" : "text-orange-500"}`}>
                Click to share
              </p>
            )}
          </button>

          {/* Longest Streak */}
          <div
            className={`rounded-xl p-4 text-center shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <p
              className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              {profile.longest_streak}
            </p>
            <p
              className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
            >
              Longest Streak
            </p>
          </div>

          {/* Level */}
          <div
            className={`rounded-xl p-4 text-center shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <p
              className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              {profile.level}
            </p>
            <p
              className={`text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
            >
              Level
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Badges Earned */}
            {enrichedBadges.length > 0 && (
              <div
                className={`rounded-xl p-5 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <h2
                  className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  Badges Earned
                </h2>
                <div className="flex flex-wrap gap-2">
                  {enrichedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}
                      title={badge.description}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <div>
                        <p
                          className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                        >
                          {badge.name}
                        </p>
                        <p
                          className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div
                className={`rounded-xl p-5 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <h2
                  className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Target Role & Industries */}
            {(profile.target_role ||
              (profile.preferred_industries &&
                profile.preferred_industries.length > 0)) && (
              <div
                className={`rounded-xl p-5 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <h2
                  className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  Career Interests
                </h2>

                {profile.target_role && (
                  <div className="mb-4">
                    <p
                      className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Target Role
                    </p>
                    <p
                      className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                    >
                      {profile.target_role}
                    </p>
                  </div>
                )}

                {profile.preferred_industries &&
                  profile.preferred_industries.length > 0 && (
                    <div>
                      <p
                        className={`text-sm mb-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Preferred Industries
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferred_industries.map((industry, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm ${isDarkTheme ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Activity Stats */}
            <div
              className={`rounded-xl p-5 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                Activity
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span
                    className={`${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Total Interviews
                  </span>
                  <span
                    className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {profile.total_interviews}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={`${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Total XP
                  </span>
                  <span
                    className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {profile.xp.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={`${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Profile Views
                  </span>
                  <span
                    className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {profile.profile_views.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={`${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Member Since
                  </span>
                  <span
                    className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {new Date(profile.created_at).toLocaleDateString("en-SG", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experience Section */}
        {profile.experience && profile.experience.length > 0 && (
          <div className={`mt-6 rounded-2xl p-6 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Experience
            </h2>
            <div className="space-y-4">
              {profile.experience.map((exp) => (
                <div key={exp.id} className={`relative pl-6 pb-4 border-l-2 ${isDarkTheme ? "border-slate-700" : "border-slate-200"} last:pb-0`}>
                  <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${isDarkTheme ? "bg-slate-800 border-2 border-red-500" : "bg-white border-2 border-red-500"}`}></div>
                  <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{exp.title}</h3>
                  <p className={`${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                    {exp.company}
                    {exp.employment_type && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDarkTheme ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                        {exp.employment_type}
                      </span>
                    )}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    {exp.start_date ? new Date(exp.start_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" }) : ""}
                    {" - "}
                    {exp.is_current ? "Present" : exp.end_date ? new Date(exp.end_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" }) : ""}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className={`mt-2 text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {profile.education && profile.education.length > 0 && (
          <div className={`mt-6 rounded-2xl p-6 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Education
            </h2>
            <div className="space-y-4">
              {profile.education.map((edu) => (
                <div key={edu.id} className={`relative pl-6 pb-4 border-l-2 ${isDarkTheme ? "border-slate-700" : "border-slate-200"} last:pb-0`}>
                  <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${isDarkTheme ? "bg-slate-800 border-2 border-blue-500" : "bg-white border-2 border-blue-500"}`}></div>
                  <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{edu.school}</h3>
                  <p className={`${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                    {edu.degree && edu.degree}
                    {edu.field_of_study && ` in ${edu.field_of_study}`}
                  </p>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    {edu.start_date ? new Date(edu.start_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" }) : ""}
                    {" - "}
                    {edu.is_current ? "Present" : edu.end_date ? new Date(edu.end_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" }) : ""}
                    {edu.grade && ` · ${edu.grade}`}
                  </p>
                  {edu.activities && (
                    <p className={`mt-2 text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>{edu.activities}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {profile.projects && profile.projects.length > 0 && (
          <div className="mt-6">
            <ProjectsSection projects={profile.projects} isOwnProfile={false} />
          </div>
        )}

        {/* CTA Card */}
        <div className="mt-8 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Want to build your own profile?
          </h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Join internship.sg and start practicing for your dream internship
            with AI-powered mock interviews.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <div
          className={`max-w-4xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link
              href="/"
              className="hover:text-red-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/roadmap"
              className="hover:text-red-600 transition-colors"
            >
              Roadmap
            </Link>
            <Link
              href="/about"
              className="hover:text-red-600 transition-colors"
            >
              About
            </Link>
          </div>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>

      {/* Share Card Modals */}
      {showStreakCard && (
        <ShareableCard
          type="streak"
          userName={profile.name}
          userImage={profile.image}
          streak={profile.current_streak}
          longestStreak={profile.longest_streak}
          onClose={() => setShowStreakCard(false)}
        />
      )}

      {showScoreCard && profile.average_score !== null && (
        <ShareableCard
          type="score"
          userName={profile.name}
          userImage={profile.image}
          score={profile.average_score}
          totalInterviews={profile.total_interviews}
          onClose={() => setShowScoreCard(false)}
        />
      )}

      {showProfileCard && (
        <ShareableCard
          type="profile"
          userName={profile.name}
          userImage={profile.image}
          school={profile.school || undefined}
          tier={profile.tier}
          level={profile.level}
          xp={profile.xp}
          onClose={() => setShowProfileCard(false)}
        />
      )}
    </div>
  );
}
