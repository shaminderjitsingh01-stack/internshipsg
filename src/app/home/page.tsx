"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";
import SidebarStats from "@/components/social/SidebarStats";
import SuggestedUsers from "@/components/social/SuggestedUsers";
import StoriesBar from "@/components/social/StoriesBar";
import StoryViewer from "@/components/social/StoryViewer";
import CreateStoryModal from "@/components/social/CreateStoryModal";

interface StoryGroup {
  authorEmail: string;
  author: {
    email: string;
    username: string | null;
    name: string | null;
    image_url: string | null;
  } | null;
  stories: any[];
  hasUnviewed: boolean;
  isCurrentUser: boolean;
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

export default function HomeFeed() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Stories state
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<StoryGroup | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storiesKey, setStoriesKey] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch feed
  const fetchFeed = useCallback(async (isLoadMore = false) => {
    if (!session?.user?.email) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentOffset = isLoadMore ? offset : 0;
      const res = await fetch(
        `/api/social/posts?email=${encodeURIComponent(session.user?.email)}&type=feed&limit=20&offset=${currentOffset}`
      );

      if (res.ok) {
        const data = await res.json();
        if (isLoadMore) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.posts.length === 20);
        setOffset(currentOffset + data.posts.length);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [session?.user?.email, offset]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchFeed();
    }
  }, [status]);

  // Handle new post created
  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  // Handle post deleted
  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Handle story click - open viewer
  const handleStoryClick = (group: StoryGroup, index: number) => {
    setSelectedStoryGroup(group);
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  // Handle add story - open create modal
  const handleAddStory = () => {
    setShowCreateStory(true);
  };

  // Handle story created - refresh stories bar
  const handleStoryCreated = () => {
    setStoriesKey(prev => prev + 1);
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/home"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'bg-slate-800 text-white' : 'bg-red-50 text-red-600'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </span>
            </Link>
            <Link
              href="/jobs"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Jobs
              </span>
            </Link>
            <Link
              href="/network"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Network
              </span>
            </Link>
            <Link
              href="/messages"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </span>
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link
              href="/notifications"
              className={`p-2 rounded-lg transition-colors relative ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification dot */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

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

            {/* Profile Dropdown */}
            <Link
              href={`/u/${session.user?.email?.split("@")[0]}`}
              className="flex items-center gap-2"
            >
              {session.user?.image ? (
                <img
                  src={session.user?.image}
                  alt={session.user?.name || "Profile"}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <span className="text-red-600 font-semibold">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Stats */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <SidebarStats userEmail={session.user?.email!} userName={session.user?.name || undefined} userImage={session.user?.image || undefined} />
            </div>
          </aside>

          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            {/* Stories Bar */}
            <div className="mb-4">
              <StoriesBar
                key={storiesKey}
                userEmail={session.user?.email!}
                onStoryClick={handleStoryClick}
                onAddStory={handleAddStory}
              />
            </div>

            {/* Create Post */}
            <CreatePost
              userEmail={session.user?.email!}
              userName={session.user?.name || ""}
              userImage={session.user?.image || undefined}
              onPostCreated={handlePostCreated}
            />

            {/* Posts Feed */}
            <div className="mt-4 space-y-4">
              {posts.length === 0 && !loading ? (
                <div className={`rounded-2xl p-8 text-center ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
                  <div className="text-4xl mb-4">🌱</div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    Your feed is empty
                  </h3>
                  <p className={`mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    Follow some people to see their posts here, or create your first post!
                  </p>
                  <Link
                    href="/network"
                    className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Find People to Follow
                  </Link>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserEmail={session.user?.email!}
                    onDelete={handlePostDeleted}
                  />
                ))
              )}

              {/* Load More */}
              {hasMore && posts.length > 0 && (
                <button
                  onClick={() => fetchFeed(true)}
                  disabled={loadingMore}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  } ${loadingMore ? 'opacity-50' : ''}`}
                >
                  {loadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Loading...
                    </span>
                  ) : (
                    "Load More"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar - Suggestions */}
          <aside className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <SuggestedUsers currentUserEmail={session.user?.email!} />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-around py-2">
          <Link href="/home" className="p-3 text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link href="/jobs" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </Link>
          <Link href="/interview" className="p-3 -mt-4">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>
          <Link href="/network" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <Link href={`/u/${session?.user?.email?.split("@")[0]}`} className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* Story Viewer Modal */}
      {showStoryViewer && selectedStoryGroup && (
        <StoryViewer
          group={selectedStoryGroup}
          initialIndex={selectedStoryIndex}
          currentUserEmail={session.user?.email!}
          onClose={() => {
            setShowStoryViewer(false);
            setSelectedStoryGroup(null);
          }}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          userEmail={session.user?.email!}
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </div>
  );
}
