"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import PostCard from "@/components/social/PostCard";

// Types
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
  achievement_data: Record<string, unknown> | null;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  author: Author;
  userReaction: string | null;
  isBookmarked: boolean;
  bookmarkedAt: string;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
}

interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  is_remote: boolean;
  application_url: string | null;
  status: string;
  created_at: string;
  company?: Company;
  saved_at?: string;
}

interface Event {
  id: string;
  organizer_email: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  start_time: string;
  end_time: string | null;
  max_attendees: number | null;
  cover_image: string | null;
  is_public: boolean;
  created_at: string;
  attendee_count: number;
  user_rsvp_status: string | null;
  saved_at?: string;
}

type TabType = "posts" | "jobs" | "events";

// Job type badge colors
const jobTypeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  internship: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  "full-time": { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
  "part-time": { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  contract: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
};

// Event type colors
const eventTypeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  meetup: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  workshop: { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  webinar: { bg: "bg-cyan-100", text: "text-cyan-700", darkBg: "bg-cyan-900/50", darkText: "text-cyan-300" },
  career_fair: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
  networking: { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
};

const eventTypeLabels: Record<string, string> = {
  meetup: "Meetup",
  workshop: "Workshop",
  webinar: "Webinar",
  career_fair: "Career Fair",
  networking: "Networking",
};

function formatSalary(min: number | null, max: number | null, currency: string = "SGD"): string {
  if (!min && !max) return "";
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min) return `From ${currency} ${min.toLocaleString()}`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  return "";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isEventPast(startTime: string): boolean {
  return new Date(startTime) < new Date();
}

function CompanyLogo({ company, size = "md" }: { company?: Company; size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
  };

  if (company?.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sizeClasses[size]} rounded-xl object-cover`}
      />
    );
  }

  const initials = company?.name
    ? company.name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white`}>
      {initials}
    </div>
  );
}

export default function SavedItemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const userEmail = session?.user?.email;

  // Fetch saved posts
  const fetchPosts = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/social/bookmarks?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookmarked posts:", error);
    }
  }, [userEmail]);

  // Fetch saved jobs
  const fetchJobs = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/jobs/saved?user_email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch saved jobs:", error);
    }
  }, [userEmail]);

  // Fetch saved events
  const fetchEvents = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/events/saved?user_email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch saved events:", error);
    }
  }, [userEmail]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.email) {
      router.push("/auth/signin");
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(), fetchJobs(), fetchEvents()]);
      setLoading(false);
    };

    fetchAll();
  }, [session?.user?.email, status, router, fetchPosts, fetchJobs, fetchEvents]);

  // Remove post from saved
  const handleRemovePost = async (postId: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `/api/social/bookmarks?postId=${postId}&email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }
  };

  // Remove job from saved
  const handleRemoveJob = async (jobId: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `/api/jobs/saved?job_id=${jobId}&user_email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch (error) {
      console.error("Failed to remove saved job:", error);
    }
  };

  // Remove event from saved
  const handleRemoveEvent = async (eventId: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `/api/events/${eventId}/rsvp?user_email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } catch (error) {
      console.error("Failed to remove saved event:", error);
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

  const tabItems: { key: TabType; label: string; count: number }[] = [
    { key: "posts", label: "Posts", count: posts.length },
    { key: "jobs", label: "Jobs", count: jobs.length },
    { key: "events", label: "Events", count: events.length },
  ];

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
        }`}
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

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
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
                Saved Items
              </h1>
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Your bookmarked posts, jobs, and events
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b mb-6 ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex gap-1 sm:gap-2">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-red-500 text-red-600"
                    : isDarkTheme
                    ? "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : isDarkTheme
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div>
            {posts.length === 0 ? (
              <EmptyState
                isDarkTheme={isDarkTheme}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                }
                title="No saved posts"
                description="When you bookmark posts, they will appear here for easy access."
                actionLabel="Explore Feed"
                actionHref="/home"
              />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      currentUserEmail={userEmail || ""}
                      isBookmarked={true}
                      onBookmarkToggle={() => handleRemovePost(post.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div>
            {jobs.length === 0 ? (
              <EmptyState
                isDarkTheme={isDarkTheme}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
                title="No saved jobs"
                description="Save jobs you're interested in to track and apply later."
                actionLabel="Browse Jobs"
                actionHref="/jobs"
              />
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const typeColors = jobTypeColors[job.job_type] || jobTypeColors.internship;
                  return (
                    <div
                      key={job.id}
                      className={`rounded-2xl border p-5 ${
                        isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex gap-4">
                        <CompanyLogo company={job.company} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/jobs?job=${job.id}`}
                                className={`font-semibold hover:text-red-600 transition-colors ${
                                  isDarkTheme ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {job.title}
                              </Link>
                              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                                {job.company?.name || "Unknown Company"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveJob(job.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkTheme
                                  ? "text-red-400 hover:bg-red-900/30"
                                  : "text-red-500 hover:bg-red-50"
                              }`}
                              title="Remove from saved"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                isDarkTheme ? typeColors.darkBg : typeColors.bg
                              } ${isDarkTheme ? typeColors.darkText : typeColors.text}`}
                            >
                              {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                            </span>

                            {job.is_remote && (
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  isDarkTheme ? "bg-teal-900/50 text-teal-300" : "bg-teal-100 text-teal-700"
                                }`}
                              >
                                Remote
                              </span>
                            )}

                            {job.location && (
                              <span
                                className={`flex items-center gap-1 text-xs ${
                                  isDarkTheme ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {job.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              {(job.salary_min || job.salary_max) && (
                                <span
                                  className={`text-sm font-medium ${
                                    isDarkTheme ? "text-green-400" : "text-green-600"
                                  }`}
                                >
                                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                                </span>
                              )}
                            </div>
                            <span className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                              Saved {formatDate(job.saved_at || job.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div>
            {events.length === 0 ? (
              <EmptyState
                isDarkTheme={isDarkTheme}
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
                title="No saved events"
                description="Mark events as 'Interested' or 'Going' to save them here."
                actionLabel="Browse Events"
                actionHref="/events"
              />
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const typeColors = eventTypeColors[event.event_type] || eventTypeColors.meetup;
                  const isPast = isEventPast(event.start_time);

                  return (
                    <div
                      key={event.id}
                      className={`rounded-2xl border overflow-hidden ${
                        isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                      } ${isPast ? "opacity-60" : ""}`}
                    >
                      <div className="flex">
                        {/* Cover Image or Placeholder */}
                        <div className="w-32 sm:w-40 flex-shrink-0">
                          {event.cover_image ? (
                            <img
                              src={event.cover_image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center ${
                                isDarkTheme
                                  ? "bg-gradient-to-br from-slate-800 to-slate-900"
                                  : "bg-gradient-to-br from-red-50 to-red-100"
                              }`}
                            >
                              <svg
                                className={`w-10 h-10 ${isDarkTheme ? "text-slate-700" : "text-red-200"}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isDarkTheme ? typeColors.darkBg : typeColors.bg
                                  } ${isDarkTheme ? typeColors.darkText : typeColors.text}`}
                                >
                                  {eventTypeLabels[event.event_type] || event.event_type}
                                </span>
                                {event.user_rsvp_status === "going" && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isDarkTheme ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                                    }`}
                                  >
                                    Going
                                  </span>
                                )}
                                {isPast && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isDarkTheme ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    Past
                                  </span>
                                )}
                              </div>
                              <Link
                                href={`/events/${event.id}`}
                                className={`font-semibold hover:text-red-600 transition-colors ${
                                  isDarkTheme ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {event.title}
                              </Link>
                            </div>
                            <button
                              onClick={() => handleRemoveEvent(event.id)}
                              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                                isDarkTheme
                                  ? "text-red-400 hover:bg-red-900/30"
                                  : "text-red-500 hover:bg-red-50"
                              }`}
                              title="Remove from saved"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
                              </svg>
                            </button>
                          </div>

                          {/* Date & Time */}
                          <div className={`flex items-center gap-2 mt-2 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>
                              {formatEventDate(event.start_time)} at {formatEventTime(event.start_time)}
                            </span>
                          </div>

                          {/* Location */}
                          <div className={`flex items-center gap-2 mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                            {event.is_virtual ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className={isDarkTheme ? "text-cyan-400" : "text-cyan-600"}>Virtual Event</span>
                              </>
                            ) : event.location ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                <span>{event.location}</span>
                              </>
                            ) : null}
                          </div>

                          {/* Attendees */}
                          <div className={`flex items-center gap-1 mt-2 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            <span>
                              {event.attendee_count} going
                              {event.max_attendees && ` / ${event.max_attendees}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
          className={`max-w-4xl mx-auto px-4 text-center text-xs sm:text-sm ${
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
            <Link href="/jobs" className="hover:text-red-600 transition-colors">
              Jobs
            </Link>
            <Link href="/events" className="hover:text-red-600 transition-colors">
              Events
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

// Empty State Component
function EmptyState({
  isDarkTheme,
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  isDarkTheme: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
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
        <div className={isDarkTheme ? "text-slate-600" : "text-slate-400"}>{icon}</div>
      </div>
      <h3 className={`text-lg font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
        {title}
      </h3>
      <p className={`mb-6 max-w-sm mx-auto ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
        {description}
      </p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {actionLabel}
      </Link>
    </div>
  );
}
