"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface FollowerUser {
  email: string;
  username: string | null;
  name: string;
  image: string | null;
  school: string | null;
  bio: string | null;
  tier: string | null;
  level: number | null;
  followedAt: string;
}

interface ProfileData {
  username: string;
  name: string;
  image: string | null;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  bronze: {
    label: "Bronze",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  silver: {
    label: "Silver",
    color: "text-slate-600",
    bgColor: "bg-slate-200",
  },
  gold: {
    label: "Gold",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  verified: {
    label: "Verified",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  elite: {
    label: "Elite",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
};

function TierBadge({ tier, isDark }: { tier: string | null; isDark: boolean }) {
  if (!tier) return null;
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

function UserListItem({
  user,
  isDark,
  isFollowing,
  isLoading,
  onFollow,
  onUnfollow,
  currentUserEmail,
}: {
  user: FollowerUser;
  isDark: boolean;
  isFollowing: boolean;
  isLoading: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  currentUserEmail: string | null;
}) {
  const isOwnProfile = currentUserEmail && user.email === currentUserEmail;
  const profileLink = user.username ? `/u/${user.username}` : "#";

  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-colors ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:border-slate-700"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Avatar */}
      <Link href={profileLink} className="flex-shrink-0">
        {user.image ? (
          <img
            src={user.image}
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
            href={profileLink}
            className={`font-semibold hover:underline truncate ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {user.name}
          </Link>
          <TierBadge tier={user.tier} isDark={isDark} />
        </div>
        {user.username && (
          <p className={`text-sm truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            @{user.username}
          </p>
        )}
        {user.school && (
          <p className={`text-xs truncate mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {user.school}
          </p>
        )}
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
  );
}

export default function FollowersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;
  const { isDarkTheme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loadingFollows, setLoadingFollows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch profile and followers data
  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch profile info
        const profileRes = await fetch(`/api/profile/${encodeURIComponent(username)}`);
        if (!profileRes.ok) {
          setError("Profile not found");
          setLoading(false);
          return;
        }
        const profileData = await profileRes.json();

        setProfile({
          username: profileData.profile?.username || username,
          name: profileData.profile?.name || "User",
          image: profileData.profile?.image || null,
        });

        // Fetch followers using the username parameter
        const followersRes = await fetch(
          `/api/social/follow?username=${encodeURIComponent(username)}&type=followers`
        );
        if (followersRes.ok) {
          const followersData = await followersRes.json();
          setFollowers(followersData.followers || []);
        }

        // If logged in, get current user's following list
        if (session?.user?.email) {
          const followingRes = await fetch(
            `/api/social/follow?email=${encodeURIComponent(session.user.email)}&type=following`
          );
          if (followingRes.ok) {
            const followingData = await followingRes.json();
            const followingEmails = new Set(
              followingData.following?.map((f: FollowerUser) => f.email) || []
            );
            setFollowingSet(followingEmails as Set<string>);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, session?.user?.email]);

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

  // Filter followers by search query
  const filteredFollowers = followers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.school?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors ${
                isDarkTheme ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${isDarkTheme ? "text-white" : "text-slate-700"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Followers
              </h1>
              {profile && (
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  @{profile.username}
                </p>
              )}
            </div>
          </div>
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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
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
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm sm:text-base ${
                isDarkTheme
                  ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-red-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500"
              } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              {error}
            </h3>
            <Link
              href="/"
              className={`text-sm ${isDarkTheme ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
            >
              Go back home
            </Link>
          </div>
        ) : filteredFollowers.length === 0 ? (
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
              {searchQuery ? "No followers found" : "No followers yet"}
            </h3>
            <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
              {searchQuery
                ? "Try a different search term"
                : "When people follow this user, they'll appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={`text-sm mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              {filteredFollowers.length} follower{filteredFollowers.length !== 1 ? "s" : ""}
              {searchQuery && " found"}
            </p>
            {filteredFollowers.map((user) => (
              <UserListItem
                key={user.email}
                user={user}
                isDark={isDarkTheme}
                isFollowing={followingSet.has(user.email)}
                isLoading={loadingFollows.has(user.email)}
                onFollow={() => handleFollow(user.email)}
                onUnfollow={() => handleUnfollow(user.email)}
                currentUserEmail={session?.user?.email || null}
              />
            ))}
          </div>
        )}
      </main>

      {/* Back to Profile Link */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Link
          href={`/u/${username}`}
          className={`inline-flex items-center gap-2 text-sm ${
            isDarkTheme ? "text-slate-400 hover:text-red-400" : "text-slate-500 hover:text-red-600"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {profile?.name || "profile"}
        </Link>
      </div>
    </div>
  );
}
