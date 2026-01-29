"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  currentUserEmail: string;
}

interface SuggestedUser {
  email: string;
  username: string | null;
  name: string;
  image: string | null;
  school: string | null;
  tier: string | null;
  mutualCount?: number;
}

export default function SuggestedUsers({ currentUserEmail }: Props) {
  const { isDarkTheme } = useTheme();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // For now, fetch top users from leaderboard as suggestions
        // In production, you'd want a dedicated suggestions API
        const res = await fetch(`/api/leaderboard?limit=10`);
        if (res.ok) {
          const data = await res.json();
          // Filter out current user
          const suggestions = data.users
            ?.filter((u: any) => u.email !== currentUserEmail)
            .slice(0, 5)
            .map((u: any) => ({
              email: u.email,
              username: u.username,
              name: u.name,
              image: u.image_url,
              school: u.school,
              tier: u.tier,
            })) || [];
          setUsers(suggestions);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUserEmail]);

  const handleFollow = async (targetEmail: string) => {
    try {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_email: currentUserEmail,
          following_email: targetEmail,
        }),
      });

      if (res.ok) {
        setFollowingSet(prev => new Set([...prev, targetEmail]));
      }
    } catch (error) {
      console.error("Failed to follow:", error);
    }
  };

  const handleUnfollow = async (targetEmail: string) => {
    try {
      const res = await fetch(
        `/api/social/follow?follower=${encodeURIComponent(currentUserEmail)}&following=${encodeURIComponent(targetEmail)}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setFollowingSet(prev => {
          const next = new Set(prev);
          next.delete(targetEmail);
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to unfollow:", error);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          People to Follow
        </h4>
        <Link
          href="/network"
          className={`text-sm ${isDarkTheme ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
        >
          See All
        </Link>
      </div>

      <div className="space-y-3">
        {users.map(user => (
          <div key={user.email} className="flex items-center gap-3">
            <Link href={`/u/${user.username || user.email.split("@")[0]}`}>
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <span className={`font-medium ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    {user.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/u/${user.username || user.email.split("@")[0]}`}
                className={`font-medium text-sm hover:underline block truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}
              >
                {user.name}
              </Link>
              {user.school && (
                <p className={`text-xs truncate ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  {user.school}
                </p>
              )}
            </div>

            <button
              onClick={() => followingSet.has(user.email) ? handleUnfollow(user.email) : handleFollow(user.email)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                followingSet.has(user.email)
                  ? isDarkTheme
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {followingSet.has(user.email) ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>

      {/* Trending Hashtags */}
      <div className={`mt-6 pt-4 border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
        <h4 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          Trending
        </h4>
        <div className="flex flex-wrap gap-2">
          {["#InternshipSG", "#TechInternship", "#InterviewTips", "#NUS", "#NTU"].map(tag => (
            <Link
              key={tag}
              href={`/search?tag=${tag.slice(1)}`}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                isDarkTheme
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={`mt-6 pt-4 border-t text-xs ${isDarkTheme ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/roadmap" className="hover:underline">Roadmap</Link>
          <Link href="/resources" className="hover:underline">Resources</Link>
        </div>
        <p className="mt-2">© 2026 Internship.sg</p>
      </div>
    </div>
  );
}
