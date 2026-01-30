"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface BlockedUser {
  email: string;
  name: string;
  image_url: string | null;
  username: string;
  blocked_at: string;
}

export default function BlockedUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unblockingSet, setUnblockingSet] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch blocked users
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(
          `/api/social/block?blocker=${encodeURIComponent(session.user.email)}`
        );

        if (res.ok) {
          const data = await res.json();
          setBlockedUsers(data.blockedUsers || []);
        } else {
          setError("Failed to load blocked users");
        }
      } catch (err) {
        console.error("Failed to fetch blocked users:", err);
        setError("Failed to load blocked users");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchBlockedUsers();
    }
  }, [session?.user?.email, status]);

  // Handle unblock
  const handleUnblock = useCallback(
    async (blockedEmail: string) => {
      if (!session?.user?.email) return;

      setUnblockingSet((prev) => new Set([...prev, blockedEmail]));

      try {
        const res = await fetch(
          `/api/social/block?blocker=${encodeURIComponent(session.user.email)}&blocked=${encodeURIComponent(blockedEmail)}`,
          { method: "DELETE" }
        );

        if (res.ok) {
          setBlockedUsers((prev) =>
            prev.filter((user) => user.email !== blockedEmail)
          );
        } else {
          setError("Failed to unblock user");
        }
      } catch (err) {
        console.error("Failed to unblock:", err);
        setError("Failed to unblock user");
      } finally {
        setUnblockingSet((prev) => {
          const next = new Set(prev);
          next.delete(blockedEmail);
          return next;
        });
      }
    },
    [session?.user?.email]
  );

  // Filter blocked users based on search
  const filteredUsers = blockedUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  if (status === "loading" || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkTheme ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkTheme ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme
            ? "bg-slate-950/80 border-white/10"
            : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className={`p-2 rounded-lg transition-colors ${
                isDarkTheme
                  ? "hover:bg-white/10 text-slate-400"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1
              className={`text-lg sm:text-xl font-semibold ${
                isDarkTheme ? "text-white" : "text-slate-900"
              }`}
            >
              Blocked Users
            </h1>
          </div>
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
            {session.user?.image ? (
              <Link href="/settings">
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${
                    isDarkTheme ? "border-slate-700" : "border-slate-200"
                  }`}
                />
              </Link>
            ) : (
              <Link href="/settings">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                    isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                  }`}
                >
                  <span className="text-red-600 font-semibold text-sm">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Info Box */}
        <div
          className={`rounded-xl p-4 mb-6 ${
            isDarkTheme
              ? "bg-slate-900 border border-slate-800"
              : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${
                  isDarkTheme ? "text-slate-400" : "text-slate-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Blocked users cannot view your profile, send you messages, or
                interact with your content. They will not be notified that you
                have blocked them.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 text-red-900 font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Input */}
        {blockedUsers.length > 0 && (
          <div className="relative mb-6">
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
              placeholder="Search blocked users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm sm:text-base ${
                isDarkTheme
                  ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-red-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500"
              } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
            />
          </div>
        )}

        {/* Blocked Users List */}
        {blockedUsers.length === 0 ? (
          /* Empty State */
          <div
            className={`rounded-2xl border p-8 sm:p-12 text-center ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  isDarkTheme ? "text-slate-600" : "text-slate-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h3
              className={`text-lg font-semibold mb-2 ${
                isDarkTheme ? "text-white" : "text-slate-900"
              }`}
            >
              No blocked users
            </h3>
            <p
              className={`text-sm mb-6 ${
                isDarkTheme ? "text-slate-400" : "text-slate-500"
              }`}
            >
              You haven't blocked anyone yet. When you block someone, they'll
              appear here.
            </p>
            <Link
              href="/settings"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkTheme
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Settings
            </Link>
          </div>
        ) : filteredUsers.length === 0 ? (
          /* No Search Results */
          <div
            className={`rounded-2xl border p-8 text-center ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  isDarkTheme ? "text-slate-600" : "text-slate-400"
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
            </div>
            <h3
              className={`font-semibold mb-2 ${
                isDarkTheme ? "text-white" : "text-slate-900"
              }`}
            >
              No results found
            </h3>
            <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
              No blocked users match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkTheme
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Users List */
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`px-4 py-3 border-b ${
                isDarkTheme ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  isDarkTheme ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1 ? "user" : "users"} blocked
              </p>
            </div>
            <div className={`divide-y ${isDarkTheme ? "divide-slate-800" : "divide-slate-200"}`}>
              {filteredUsers.map((user) => (
                <div
                  key={user.email}
                  className={`flex items-center justify-between p-4 transition-colors ${
                    isDarkTheme
                      ? "hover:bg-slate-800/50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <Link
                      href={`/u/${user.username}`}
                      className="flex-shrink-0"
                    >
                      {user.image_url ? (
                        <img
                          src={user.image_url}
                          alt={user.name}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${
                            isDarkTheme
                              ? "border-slate-700"
                              : "border-slate-200"
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                            isDarkTheme ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          <span
                            className={`font-semibold ${
                              isDarkTheme ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {user.name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* User Info */}
                    <div className="min-w-0">
                      <Link
                        href={`/u/${user.username}`}
                        className={`font-medium hover:underline truncate block ${
                          isDarkTheme ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {user.name}
                      </Link>
                      <p
                        className={`text-sm truncate ${
                          isDarkTheme ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        @{user.username}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          isDarkTheme ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Blocked{" "}
                        {new Date(user.blocked_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Unblock Button */}
                  <button
                    onClick={() => handleUnblock(user.email)}
                    disabled={unblockingSet.has(user.email)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      unblockingSet.has(user.email)
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkTheme
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {unblockingSet.has(user.email) ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                        <span className="hidden sm:inline">Unblocking...</span>
                      </span>
                    ) : (
                      "Unblock"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${
          isDarkTheme
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`max-w-4xl mx-auto px-4 text-center text-xs sm:text-sm ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link
              href="/settings"
              className="hover:text-red-600 transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-red-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/about"
              className="hover:text-red-600 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
