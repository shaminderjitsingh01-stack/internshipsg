"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import PostCard from "@/components/social/PostCard";

interface Author {
  email: string;
  username: string | null;
  name: string;
  image: string | null;
  school: string | null;
  tier: string | null;
  level: number | null;
}

interface Post {
  id: string;
  author_email: string;
  content: string;
  post_type: string;
  image_url: string | null;
  achievement_type: string | null;
  achievement_data: any;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  author: Author;
  userReaction: string | null;
  isBookmarked: boolean;
  bookmarkedAt: string;
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.email) {
      router.push("/auth/signin");
      return;
    }

    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/social/bookmarks?email=${encodeURIComponent(session.user!.email!)}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [session?.user?.email, status, router]);

  const handleRemoveBookmark = async (postId: string) => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch(
        `/api/social/bookmarks?postId=${postId}&email=${encodeURIComponent(session.user.email)}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
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
              href="/home"
              className={`hidden sm:block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                isDarkTheme ? "text-slate-300 hover:text-red-400" : "text-slate-600 hover:text-red-600"
              }`}
            >
              Feed
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
            ) : (
              <Link href="/settings">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                    isDarkTheme ? "bg-red-900/50" : "bg-red-100"
                  }`}
                >
                  <span className="text-red-600 font-semibold text-sm">
                    {session?.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-red-900/30" : "bg-red-100"}`}>
              <svg
                className={`w-6 h-6 ${isDarkTheme ? "text-red-400" : "text-red-600"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Saved Posts
              </h1>
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                {total} saved post{total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div
            className={`text-center py-16 rounded-2xl border ${
              isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <svg
                className={`w-10 h-10 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              No saved posts yet
            </h3>
            <p className={`mb-6 max-w-sm mx-auto ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              When you save posts, they will appear here for easy access later.
            </p>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Explore Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="relative">
                <PostCard
                  post={post}
                  currentUserEmail={session?.user?.email || ""}
                  isBookmarked={true}
                  onBookmarkToggle={() => handleRemoveBookmark(post.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${
          isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`max-w-3xl mx-auto px-4 text-center text-xs sm:text-sm ${
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link href="/home" className="hover:text-red-600 transition-colors">
              Feed
            </Link>
            <Link href="/network" className="hover:text-red-600 transition-colors">
              Network
            </Link>
            <Link href="/jobs" className="hover:text-red-600 transition-colors">
              Jobs
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
            </Link>
          </div>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
