"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Mentor {
  id: string;
  user_email: string;
  title: string | null;
  company: string | null;
  position: string | null;
  name?: string;
  image_url?: string;
  rating: number;
}

interface MentorshipRequest {
  id: string;
  mentor_id: string;
  mentee_email: string;
  mentor_email?: string;
  status: string;
  message: string | null;
  goals: string | null;
  created_at: string;
  responded_at: string | null;
  mentor?: Mentor;
  mentee?: {
    name: string;
    image_url: string | null;
    email: string;
  };
}

interface MentorshipSession {
  id: string;
  mentorship_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  topic: string | null;
  notes: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-SG", { month: "short", day: "numeric", year: "numeric" });
}

function formatFutureDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-SG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function MyMentorshipsPage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [activeTab, setActiveTab] = useState<"received" | "sent" | "sessions">("received");
  const [receivedRequests, setReceivedRequests] = useState<MentorshipRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<MentorshipRequest[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<MentorshipSession[]>([]);
  const [isMentor, setIsMentor] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);

    try {
      // Fetch received requests (if user is a mentor)
      const receivedRes = await fetch(`/api/mentorship/requests?mentor_email=${encodeURIComponent(userEmail)}`);
      if (receivedRes.ok) {
        const data = await receivedRes.json();
        setReceivedRequests(data.requests || []);
        setIsMentor(data.requests?.length > 0 || false);
      }

      // Fetch sent requests
      const sentRes = await fetch(`/api/mentorship/requests?mentee_email=${encodeURIComponent(userEmail)}`);
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data.requests || []);
      }

      // Fetch upcoming sessions
      const sessionsRes = await fetch(`/api/mentorship/sessions?user_email=${encodeURIComponent(userEmail)}`);
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setUpcomingSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestAction = async (requestId: string, action: "accept" | "decline") => {
    if (!userEmail) return;

    try {
      const res = await fetch("/api/mentorship/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          action,
          user_email: userEmail,
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    }
  };

  if (!session) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="text-center">
          <p className={`mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Please sign in to view your mentorships
          </p>
          <Link href="/auth/signin" className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Internship.sg" className={`h-7 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`} />
            </Link>
            <span className={isDarkTheme ? "text-slate-600" : "text-slate-300"}>/</span>
            <Link href="/mentorship" className={`text-sm ${isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
              Mentorship
            </Link>
            <span className={isDarkTheme ? "text-slate-600" : "text-slate-300"}>/</span>
            <span className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>My Mentorships</span>
          </div>
          <Link href="/dashboard" className={`px-4 py-2 text-sm ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className={`text-2xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
          My Mentorships
        </h1>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 ${isDarkTheme ? "bg-slate-900" : "bg-slate-100"}`}>
          {isMentor && (
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "received"
                  ? "bg-red-600 text-white"
                  : isDarkTheme
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Received Requests
              {receivedRequests.filter(r => r.status === "pending").length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                  {receivedRequests.filter(r => r.status === "pending").length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "sent"
                ? "bg-red-600 text-white"
                : isDarkTheme
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "sessions"
                ? "bg-red-600 text-white"
                : isDarkTheme
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sessions
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Received Requests Tab */}
            {activeTab === "received" && isMentor && (
              <div className="space-y-4">
                {receivedRequests.length === 0 ? (
                  <div className={`text-center py-12 rounded-xl border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>No mentorship requests yet</p>
                  </div>
                ) : (
                  receivedRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`rounded-xl border p-5 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                    >
                      <div className="flex items-start gap-4">
                        {request.mentee?.image_url ? (
                          <img src={request.mentee.image_url} alt="" className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                            <span className={`font-semibold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                              {(request.mentee?.name || "?").charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                              {request.mentee?.name || "Anonymous"}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : request.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          {request.message && (
                            <p className={`text-sm mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                              {request.message}
                            </p>
                          )}
                          {request.goals && (
                            <p className={`text-sm mb-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                              <span className="font-medium">Goals:</span> {request.goals}
                            </p>
                          )}
                          <p className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                            {formatDate(request.created_at)}
                          </p>
                          {request.status === "pending" && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleRequestAction(request.id, "accept")}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRequestAction(request.id, "decline")}
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                  isDarkTheme
                                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sent Requests Tab */}
            {activeTab === "sent" && (
              <div className="space-y-4">
                {sentRequests.length === 0 ? (
                  <div className={`text-center py-12 rounded-xl border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <p className={`mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      You haven't requested any mentorships yet
                    </p>
                    <Link href="/mentorship" className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
                      Find a Mentor
                    </Link>
                  </div>
                ) : (
                  sentRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`rounded-xl border p-5 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                    >
                      <div className="flex items-start gap-4">
                        {request.mentor?.image_url ? (
                          <img src={request.mentor.image_url} alt="" className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                            <span className={`font-semibold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                              {(request.mentor?.name || "M").charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                                {request.mentor?.name || "Mentor"}
                              </h3>
                              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                                {request.mentor?.title || request.mentor?.position}
                                {request.mentor?.company && ` at ${request.mentor.company}`}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : request.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          {request.message && (
                            <p className={`text-sm mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                              "{request.message}"
                            </p>
                          )}
                          <p className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                            Sent {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <div className="space-y-4">
                {upcomingSessions.length === 0 ? (
                  <div className={`text-center py-12 rounded-xl border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>No upcoming sessions</p>
                  </div>
                ) : (
                  upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`rounded-xl border p-5 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                          {session.topic || "Mentorship Session"}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          session.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : session.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                        {formatFutureDate(session.scheduled_at)} · {session.duration_minutes} min
                      </p>
                      {session.notes && (
                        <p className={`text-sm mt-2 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                          {session.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 mt-auto ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
        <div className={`max-w-5xl mx-auto px-4 text-center text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
