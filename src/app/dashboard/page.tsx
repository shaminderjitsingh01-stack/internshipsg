"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import StreakWidget from "@/components/StreakWidget";
import StreakCard from "@/components/StreakCard";

interface Interview {
  id: string;
  created_at: string;
  duration: number;
  score: number;
  feedback: string;
  video_url: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "billing">("overview");
  const [showShareCard, setShowShareCard] = useState(false);
  const [streakForShare, setStreakForShare] = useState(0);

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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              New Interview
            </Link>
            <div className="flex items-center gap-3">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-9 h-9 rounded-full border-2 border-slate-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {session.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-slate-600">Manage your account and review your interview practice sessions.</p>
        </div>

        {/* Employer Visibility Disclaimer */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Your profile could be seen by future employer partners</h3>
              <p className="text-sm text-blue-700">
                We're building connections with companies seeking internship-ready students.
                Staying active and completing practice sessions may increase your visibility to potential employers
                — however, employer contact is not guaranteed.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "overview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("interviews")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "interviews"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Interview History
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "billing"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billing
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Streak Widget - Full Width */}
            {session?.user?.email && (
              <StreakWidget
                userEmail={session.user.email}
                onShare={() => {
                  setShowShareCard(true);
                }}
              />
            )}

            <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Profile</h2>
              <div className="flex items-center gap-4 mb-6">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-16 h-16 rounded-full border-2 border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xl">
                      {session.user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{session.user?.name}</p>
                  <p className="text-sm text-slate-500">{session.user?.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">Member since</p>
                <p className="font-medium text-slate-900">January 2025</p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Interviews</span>
                  <span className="text-2xl font-bold text-slate-900">{interviews.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Average Score</span>
                  <span className="text-2xl font-bold text-red-600">
                    {interviews.length > 0
                      ? (interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length).toFixed(1)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Practice Time</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {interviews.reduce((acc, i) => acc + (i.duration || 0), 0)} min
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Interview History</h2>
              <p className="text-sm text-slate-500">Review your past practice sessions and feedback</p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : interviews.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">No interviews yet</h3>
                <p className="text-slate-500 mb-6">Start your first mock interview to see your history here.</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Start Your First Interview
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {interviews.map((interview) => (
                  <div key={interview.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Mock Interview Session</p>
                          <p className="text-sm text-slate-500">{formatDate(interview.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Score</p>
                          <p className="text-lg font-bold text-red-600">{interview.score}/10</p>
                        </div>
                        {interview.video_url && (
                          <a
                            href={interview.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                          >
                            Watch Video
                          </a>
                        )}
                      </div>
                    </div>
                    {interview.feedback && (
                      <p className="text-sm text-slate-600 line-clamp-2">{interview.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Plan</h2>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Free Plan</p>
                  <p className="text-sm text-slate-500">Basic interview practice</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited 15-min interviews
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI feedback & scoring
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Resume & cover letter tips
                </div>
              </div>
            </div>

            {/* Upgrade Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
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
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <div className="flex justify-center gap-6 mb-4">
            <a href="/roadmap" className="hover:text-red-600 transition-colors">Roadmap</a>
            <a href="/about" className="hover:text-red-600 transition-colors">About</a>
            <a href="/sitemap.xml" className="hover:text-red-600 transition-colors">Sitemap</a>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
