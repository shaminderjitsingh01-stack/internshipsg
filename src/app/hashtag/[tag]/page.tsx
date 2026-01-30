"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import PostCard from "@/components/social/PostCard";

interface Post {
  id: string;
  author_email: string;
  content: string;
  post_type: string;
  image_url: string | null;
  achievement_type: string | null;
  achievement_data: Record<string, unknown>;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  author: {
    email: string;
    username: string | null;
    name: string;
    image: string | null;
    school: string | null;
    tier: string | null;
    level: number | null;
  };
  userReaction: string | null;
}

interface Hashtag {
  id: string | null;
  tag: string;
  post_count: number;
  follower_count?: number;
}

interface RelatedHashtag {
  id: string;
  tag: string;
  post_count: number;
}

type SortOption = "recent" | "popular";

export default function HashtagPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  const tag = decodeURIComponent(params.tag as string).replace("#", "");

  const [hashtag, setHashtag] = useState<Hashtag | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [relatedHashtags, setRelatedHashtags] = useState<RelatedHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch hashtag data
  const fetchHashtagData = useCallback(async (isLoadMore = false, newSort?: SortOption) => {
    if (!tag) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentSort = newSort || sortBy;
      const currentOffset = isLoadMore ? offset : 0;
      const params = new URLSearchParams({
        tag,
        sort: currentSort,
        limit: "20",
        offset: currentOffset.toString(),
      });

      if (session?.user?.email) {
        params.set("email", session.user?.email);
      }

      const res = await fetch(`/api/social/hashtags?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();

        if (!isLoadMore) {
          setHashtag(data.hashtag);
          setPosts(data.posts);
          setRelatedHashtags(data.relatedHashtags);
          setTotalPosts(data.totalPosts);
          setIsFollowing(data.isFollowing);
          setOffset(data.posts.length);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
          setOffset(currentOffset + data.posts.length);
        }

        setHasMore(data.posts.length === 20);
      }
    } catch (error) {
      console.error("Failed to fetch hashtag data:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tag, session?.user?.email, sortBy, offset]);

  useEffect(() => {
    fetchHashtagData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag]);

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    if (newSort !== sortBy) {
      setSortBy(newSort);
      setOffset(0);
      fetchHashtagData(false, newSort);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!session?.user?.email) {
      router.push("/auth/signin");
      return;
    }

    setFollowLoading(true);
    try {
      const res = await fetch("/api/social/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag,
          user_email: session.user?.email,
          action: isFollowing ? "unfollow" : "follow",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.action === "followed");
        if (hashtag) {
          setHashtag({
            ...hashtag,
            follower_count: (hashtag.follower_count || 0) + (data.action === "followed" ? 1 : -1),
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle post deleted
  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setTotalPosts(prev => prev - 1);
  };

  // Load more with infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 500 &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        fetchHashtagData(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, loading, fetchHashtagData]);

  if (loading && !hashtag) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <Link href="/home" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Internship.sg" className={`h-7 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
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

            {session?.user?.image ? (
              <Link href={`/u/${session.user?.email?.split("@")[0]}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.user?.image}
                  alt={session.user?.name || "Profile"}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700"
                />
              </Link>
            ) : session ? (
              <Link
                href={`/u/${session.user?.email?.split("@")[0]}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}
              >
                <span className="text-red-600 font-semibold">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Column */}
          <div className="flex-1 max-w-2xl">
            {/* Hashtag Header */}
            <div className={`rounded-2xl p-6 mb-6 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDarkTheme ? 'bg-red-900/30' : 'bg-red-100'}`}>
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      #{hashtag?.tag || tag}
                    </h1>
                    <div className={`flex items-center gap-4 mt-1 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span className="font-medium">{totalPosts.toLocaleString()} posts</span>
                      {hashtag?.follower_count !== undefined && hashtag.follower_count > 0 && (
                        <span>{hashtag.follower_count.toLocaleString()} followers</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-5 py-2 rounded-xl font-medium transition-colors ${
                    isFollowing
                      ? isDarkTheme
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mx-4"></div>
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div className={`rounded-2xl p-4 mb-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sort by:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSortChange("recent")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === "recent"
                        ? 'bg-red-600 text-white'
                        : isDarkTheme
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent
                    </span>
                  </button>
                  <button
                    onClick={() => handleSortChange("popular")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === "popular"
                        ? 'bg-red-600 text-white'
                        : isDarkTheme
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Popular
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {loading && posts.length === 0 ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className={`rounded-2xl p-8 text-center ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <svg className={`w-8 h-8 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    No posts yet
                  </h3>
                  <p className={`mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    Be the first to post with #{tag}!
                  </p>
                  <Link
                    href="/home"
                    className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Create a Post
                  </Link>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserEmail={session?.user?.email || ""}
                    onDelete={handlePostDeleted}
                  />
                ))
              )}

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              )}

              {/* Load More Button (fallback) */}
              {!loadingMore && hasMore && posts.length > 0 && (
                <button
                  onClick={() => fetchHashtagData(true)}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Load More
                </button>
              )}

              {/* End of posts */}
              {!hasMore && posts.length > 0 && (
                <div className={`text-center py-6 text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  You&apos;ve reached the end
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Trending Related Hashtags */}
              <div className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Related Hashtags
                </h2>
                {relatedHashtags.length > 0 ? (
                  <div className="space-y-2">
                    {relatedHashtags.map(hashtag => (
                      <Link
                        key={hashtag.id}
                        href={`/hashtag/${hashtag.tag}`}
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                          isDarkTheme
                            ? 'hover:bg-slate-800'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <svg className={`w-5 h-5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                          </div>
                          <div>
                            <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                              #{hashtag.tag}
                            </p>
                            <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                              {hashtag.post_count.toLocaleString()} posts
                            </p>
                          </div>
                        </div>
                        <svg className={`w-5 h-5 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                    No related hashtags found
                  </p>
                )}

                <Link
                  href="/search?tab=hashtags"
                  className={`block w-full text-center mt-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Explore All Hashtags
                </Link>
              </div>

              {/* Quick Links */}
              <div className={`rounded-2xl p-4 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Quick Links
                </h2>
                <div className="space-y-2">
                  <Link
                    href="/home"
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home Feed
                  </Link>
                  <Link
                    href="/jobs"
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Browse Jobs
                  </Link>
                  <Link
                    href="/network"
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isDarkTheme ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    My Network
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-around py-2">
          <Link href="/home" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link href="/search" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link href="/jobs" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </Link>
          <Link href="/network" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <Link
            href={session ? `/u/${session.user?.email?.split("@")[0]}` : "/auth/signin"}
            className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </nav>
    </div>
  );
}
