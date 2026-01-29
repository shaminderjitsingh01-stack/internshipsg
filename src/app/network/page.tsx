"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface DiscoveredUser {
  id: string;
  email?: string;
  username: string;
  name: string;
  image_url: string | null;
  school: string | null;
  tier: string;
  score: number;
  longest_streak: number;
  xp_points: number;
  bio?: string;
  mutualCount?: number;
}

interface FollowingInfo {
  email: string;
  isFollowing: boolean;
}

const SCHOOLS = [
  { value: "all", label: "All Schools" },
  { value: "NUS", label: "NUS" },
  { value: "NTU", label: "NTU" },
  { value: "SMU", label: "SMU" },
  { value: "SUTD", label: "SUTD" },
  { value: "SIT", label: "SIT" },
  { value: "SUSS", label: "SUSS" },
  { value: "SP", label: "Singapore Poly" },
  { value: "NP", label: "Ngee Ann Poly" },
  { value: "TP", label: "Temasek Poly" },
  { value: "RP", label: "Republic Poly" },
  { value: "NYP", label: "Nanyang Poly" },
];

const TIERS = [
  { value: "all", label: "All Tiers" },
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "verified", label: "Verified" },
  { value: "elite", label: "Elite" },
];

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  bronze: {
    label: "Bronze",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
  },
  silver: {
    label: "Silver",
    color: "text-slate-600",
    bgColor: "bg-slate-200",
    borderColor: "border-slate-400",
  },
  gold: {
    label: "Gold",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-400",
  },
  verified: {
    label: "Verified",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-400",
  },
  elite: {
    label: "Elite",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-400",
  },
};

function TierBadge({ tier, isDark }: { tier: string; isDark: boolean }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isDark
          ? `${config.bgColor.replace("100", "900/50")} ${config.color.replace("700", "400").replace("600", "400")}`
          : `${config.bgColor} ${config.color}`
      }`}
    >
      {config.label}
    </span>
  );
}

function SchoolBadge({ school, isDark }: { school: string | null; isDark: boolean }) {
  if (!school) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
      }`}
    >
      {school}
    </span>
  );
}

function UserCard({
  user,
  isDark,
  isFollowing,
  onFollow,
  onUnfollow,
  isLoading,
  currentUserEmail,
}: {
  user: DiscoveredUser;
  isDark: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  isLoading: boolean;
  currentUserEmail: string | null;
}) {
  const isOwnProfile = currentUserEmail && user.email === currentUserEmail;

  return (
    <div
      className={`rounded-xl border p-4 transition-all hover:shadow-lg ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:border-slate-700"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/u/${user.username}`} className="flex-shrink-0">
          {user.image_url ? (
            <img
              src={user.image_url}
              alt={user.name}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 ${
                isDark ? "border-slate-700" : "border-slate-200"
              }`}
            />
          ) : (
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <span className={`font-semibold text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {user.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/u/${user.username}`}
              className={`font-semibold hover:underline truncate ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {user.name}
            </Link>
            <TierBadge tier={user.tier} isDark={isDark} />
          </div>
          <p className={`text-sm truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            @{user.username}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <SchoolBadge school={user.school} isDark={isDark} />
            {user.mutualCount && user.mutualCount > 0 && (
              <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {user.mutualCount} mutual connection{user.mutualCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Follow Button */}
        {!isOwnProfile && (
          <button
            onClick={isFollowing ? onUnfollow : onFollow}
            disabled={isLoading}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px] flex-shrink-0 ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : isFollowing
                ? isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isLoading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
            ) : isFollowing ? (
              "Following"
            ) : (
              "Follow"
            )}
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className={`flex items-center gap-4 mt-4 pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <div className="text-center">
          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {user.xp_points.toLocaleString()}
          </p>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>XP</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {user.longest_streak}
          </p>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Streak</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{user.score}</p>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Score</p>
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [allUsers, setAllUsers] = useState<DiscoveredUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<DiscoveredUser[]>([]);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState<DiscoveredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loadingFollows, setLoadingFollows] = useState<Set<string>>(new Set());
  const [userSchool, setUserSchool] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");

  // Fetch users and following status
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all discoverable users from leaderboard
        const params = new URLSearchParams({
          limit: "100",
          offset: "0",
        });

        if (session?.user?.email) {
          params.append("email", session.user.email);
        }

        const leaderboardRes = await fetch(`/api/leaderboard?${params}`);

        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          setAllUsers(data.users || []);
        }

        // If logged in, get following list and user profile
        if (session?.user?.email) {
          const [followingRes, profileRes] = await Promise.all([
            fetch(`/api/social/follow?email=${encodeURIComponent(session.user.email)}&type=following`),
            fetch(`/api/profile?email=${encodeURIComponent(session.user.email)}`),
          ]);

          if (followingRes.ok) {
            const data = await followingRes.json();
            const followingEmails = new Set(data.following?.map((f: any) => f.email) || []);
            setFollowingSet(followingEmails as Set<string>);
          }

          if (profileRes.ok) {
            const data = await profileRes.json();
            setUserSchool(data.profile?.school || null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.email]);

  // Generate suggested users and people you may know
  useEffect(() => {
    if (allUsers.length === 0 || !session?.user?.email) {
      setSuggestedUsers(allUsers.slice(0, 6));
      setPeopleYouMayKnow([]);
      return;
    }

    // Filter out current user
    const otherUsers = allUsers.filter(
      (u) => u.email !== session.user?.email && u.username !== session.user?.email?.split("@")[0]
    );

    // People from same school (people you may know)
    if (userSchool) {
      const sameSchool = otherUsers
        .filter((u) => u.school === userSchool && !followingSet.has(u.email || ""))
        .slice(0, 6);
      setPeopleYouMayKnow(sameSchool);
    } else {
      setPeopleYouMayKnow([]);
    }

    // Suggested: top performers not already following
    const suggested = otherUsers
      .filter((u) => !followingSet.has(u.email || ""))
      .slice(0, 6);
    setSuggestedUsers(suggested);
  }, [allUsers, session?.user?.email, userSchool, followingSet]);

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter((user) => {
    // Exclude current user
    if (session?.user?.email && (user.email === session.user.email || user.username === session.user.email?.split("@")[0])) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.school?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // School filter
    if (selectedSchool !== "all" && user.school !== selectedSchool) {
      return false;
    }

    // Tier filter
    if (selectedTier !== "all" && user.tier !== selectedTier) {
      return false;
    }

    return true;
  });

  const handleFollow = useCallback(
    async (targetEmail: string) => {
      if (!session?.user?.email) {
        router.push("/auth/signin");
        return;
      }

      setLoadingFollows((prev) => new Set([...prev, targetEmail]));

      try {
        const res = await fetch("/api/social/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            follower_email: session.user.email,
            following_email: targetEmail,
          }),
        });

        if (res.ok) {
          setFollowingSet((prev) => new Set([...prev, targetEmail]));
        }
      } catch (error) {
        console.error("Failed to follow:", error);
      } finally {
        setLoadingFollows((prev) => {
          const next = new Set(prev);
          next.delete(targetEmail);
          return next;
        });
      }
    },
    [session?.user?.email, router]
  );

  const handleUnfollow = useCallback(
    async (targetEmail: string) => {
      if (!session?.user?.email) return;

      setLoadingFollows((prev) => new Set([...prev, targetEmail]));

      try {
        const res = await fetch(
          `/api/social/follow?follower=${encodeURIComponent(session.user.email)}&following=${encodeURIComponent(targetEmail)}`,
          { method: "DELETE" }
        );

        if (res.ok) {
          setFollowingSet((prev) => {
            const next = new Set(prev);
            next.delete(targetEmail);
            return next;
          });
        }
      } catch (error) {
        console.error("Failed to unfollow:", error);
      } finally {
        setLoadingFollows((prev) => {
          const next = new Set(prev);
          next.delete(targetEmail);
          return next;
        });
      }
    },
    [session?.user?.email]
  );

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
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
              href="/leaderboard"
              className={`hidden sm:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Leaderboard
            </Link>
            <Link
              href="/dashboard"
              className={`hidden sm:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Dashboard
            </Link>
            {session?.user?.image ? (
              <Link href="/settings">
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${
                    isDarkTheme ? "border-slate-700" : "border-slate-200"
                  }`}
                />
              </Link>
            ) : session?.user ? (
              <Link href="/settings">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                    isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                  }`}
                >
                  <span className="text-red-600 font-semibold text-sm">
                    {session.user.name?.charAt(0) || "U"}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-red-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Discover People
          </h1>
          <p className={`text-base sm:text-lg ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Find and connect with other students in Singapore
          </p>
        </div>

        {/* Search & Filters */}
        <div
          className={`rounded-xl p-4 mb-6 border ${
            isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDarkTheme ? "text-slate-500" : "text-slate-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, username, or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm sm:text-base ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500"
                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium min-h-[44px] ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {SCHOOLS.map((school) => (
                  <option key={school.value} value={school.value}>
                    {school.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium min-h-[44px] ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {TIERS.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>

              {(searchQuery || selectedSchool !== "all" || selectedTier !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSchool("all");
                    setSelectedTier("all");
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkTheme
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            {/* People You May Know Section */}
            {peopleYouMayKnow.length > 0 && !searchQuery && selectedSchool === "all" && selectedTier === "all" && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className={`text-xl font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      People You May Know
                    </h2>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      From {userSchool}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {peopleYouMayKnow.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      isDark={isDarkTheme}
                      isFollowing={followingSet.has(user.email || "")}
                      onFollow={() => handleFollow(user.email || "")}
                      onUnfollow={() => handleUnfollow(user.email || "")}
                      isLoading={loadingFollows.has(user.email || "")}
                      currentUserEmail={session?.user?.email || null}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Suggested Connections Section */}
            {suggestedUsers.length > 0 && !searchQuery && selectedSchool === "all" && selectedTier === "all" && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className={`text-xl font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      Suggested Connections
                    </h2>
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      Top performers to follow
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      isDark={isDarkTheme}
                      isFollowing={followingSet.has(user.email || "")}
                      onFollow={() => handleFollow(user.email || "")}
                      onUnfollow={() => handleUnfollow(user.email || "")}
                      isLoading={loadingFollows.has(user.email || "")}
                      currentUserEmail={session?.user?.email || null}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Users / Search Results */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-xl font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {searchQuery || selectedSchool !== "all" || selectedTier !== "all"
                      ? "Search Results"
                      : "All Users"}
                  </h2>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div
                  className={`text-center py-12 rounded-xl border ${
                    isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    <svg
                      className={`w-8 h-8 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    No users found
                  </h3>
                  <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      isDark={isDarkTheme}
                      isFollowing={followingSet.has(user.email || "")}
                      onFollow={() => handleFollow(user.email || "")}
                      onUnfollow={() => handleUnfollow(user.email || "")}
                      isLoading={loadingFollows.has(user.email || "")}
                      currentUserEmail={session?.user?.email || null}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* CTA for non-logged in users */}
            {!session && (
              <div
                className={`mt-8 rounded-2xl p-6 sm:p-8 text-center ${
                  isDarkTheme
                    ? "bg-gradient-to-br from-red-900/50 to-orange-900/50 border border-red-800/50"
                    : "bg-gradient-to-br from-red-50 to-orange-50 border border-red-200"
                }`}
              >
                <h3 className={`text-xl font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Join the Community
                </h3>
                <p className={`mb-4 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                  Sign up to follow users, see personalized suggestions, and grow your network.
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer
        className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${
          isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link href="/questions" className="hover:text-red-600 transition-colors">
              Questions
            </Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/resources" className="hover:text-red-600 transition-colors">
              Resources
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
