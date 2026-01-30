"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface NotificationPreferences {
  // Email notifications
  email_new_follower: boolean;
  email_post_likes: boolean;
  email_comments: boolean;
  email_mentions: boolean;
  email_direct_messages: boolean;
  email_job_alerts: boolean;
  email_weekly_digest: boolean;
  // Push notifications
  push_new_follower: boolean;
  push_post_likes: boolean;
  push_comments: boolean;
  push_mentions: boolean;
  push_direct_messages: boolean;
  push_job_alerts: boolean;
  push_weekly_digest: boolean;
  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const defaultPreferences: NotificationPreferences = {
  email_new_follower: true,
  email_post_likes: true,
  email_comments: true,
  email_mentions: true,
  email_direct_messages: true,
  email_job_alerts: true,
  email_weekly_digest: true,
  push_new_follower: true,
  push_post_likes: true,
  push_comments: true,
  push_mentions: true,
  push_direct_messages: true,
  push_job_alerts: true,
  push_weekly_digest: false,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
};

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(
          `/api/settings/notifications?email=${encodeURIComponent(session.user.email)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setPreferences({
              ...defaultPreferences,
              ...data.preferences,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch notification preferences:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchPreferences();
    }
  }, [session, status]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTimeChange = (key: "quiet_hours_start" | "quiet_hours_end", value: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!session?.user?.email) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          ...preferences,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      setSuccess("Notification preferences saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const emailNotifications = [
    {
      key: "email_new_follower" as const,
      title: "New Follower",
      description: "Get notified when someone follows you",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      key: "email_post_likes" as const,
      title: "Post Likes",
      description: "Get notified when someone likes your posts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      key: "email_comments" as const,
      title: "Comments on Posts",
      description: "Get notified when someone comments on your posts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      key: "email_mentions" as const,
      title: "Mentions",
      description: "Get notified when someone mentions you",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      ),
    },
    {
      key: "email_direct_messages" as const,
      title: "Direct Messages",
      description: "Get notified when you receive a new message",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "email_job_alerts" as const,
      title: "Job Alerts",
      description: "Get notified about new job opportunities",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "email_weekly_digest" as const,
      title: "Weekly Digest",
      description: "Receive a weekly summary of your activity and updates",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  const pushNotifications = [
    {
      key: "push_new_follower" as const,
      title: "New Follower",
      description: "Push notification when someone follows you",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      key: "push_post_likes" as const,
      title: "Post Likes",
      description: "Push notification when someone likes your posts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      key: "push_comments" as const,
      title: "Comments on Posts",
      description: "Push notification when someone comments on your posts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      key: "push_mentions" as const,
      title: "Mentions",
      description: "Push notification when someone mentions you",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      ),
    },
    {
      key: "push_direct_messages" as const,
      title: "Direct Messages",
      description: "Push notification for new messages",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "push_job_alerts" as const,
      title: "Job Alerts",
      description: "Push notification for new job opportunities",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "push_weekly_digest" as const,
      title: "Weekly Digest",
      description: "Push notification for weekly summary",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  const renderToggleItem = (
    item: { key: keyof NotificationPreferences; title: string; description: string; icon: React.ReactNode },
    type: "email" | "push"
  ) => (
    <div
      key={item.key}
      className={`p-4 rounded-xl border transition-colors ${
        isDarkTheme
          ? "bg-slate-800/50 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg mt-0.5 ${
              preferences[item.key]
                ? type === "email"
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
                : isDarkTheme
                  ? "bg-slate-700 text-slate-400"
                  : "bg-slate-200 text-slate-500"
            }`}
          >
            {item.icon}
          </div>
          <div>
            <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              {item.title}
            </p>
            <p className={`text-sm mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              {item.description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(item.key)}
          className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
            preferences[item.key]
              ? type === "email"
                ? "bg-red-600"
                : "bg-blue-600"
              : isDarkTheme
                ? "bg-slate-600"
                : "bg-slate-300"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              preferences[item.key] ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings" className={`p-2 rounded-lg transition-colors ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}>
              <svg className={`w-5 h-5 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              Notification Settings
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all ${isDarkTheme ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
            aria-label="Toggle theme"
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
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {/* Email Notifications */}
        <div className={`rounded-2xl p-6 shadow-sm border mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-red-900/30" : "bg-red-100"}`}>
              <svg className={`w-5 h-5 ${isDarkTheme ? "text-red-400" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Email Notifications
              </h2>
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Choose which emails you'd like to receive
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {emailNotifications.map((item) => renderToggleItem(item, "email"))}
          </div>
        </div>

        {/* Push Notifications */}
        <div className={`rounded-2xl p-6 shadow-sm border mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <svg className={`w-5 h-5 ${isDarkTheme ? "text-blue-400" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Push Notifications
              </h2>
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Get notified in real-time on your device
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pushNotifications.map((item) => renderToggleItem(item, "push"))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className={`rounded-2xl p-6 shadow-sm border mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDarkTheme ? "bg-purple-900/30" : "bg-purple-100"}`}>
              <svg className={`w-5 h-5 ${isDarkTheme ? "text-purple-400" : "text-purple-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Quiet Hours
              </h2>
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Pause notifications during specific times
              </p>
            </div>
          </div>

          {/* Enable Quiet Hours Toggle */}
          <div className={`p-4 rounded-xl border mb-4 ${isDarkTheme ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    preferences.quiet_hours_enabled
                      ? "bg-purple-100 text-purple-600"
                      : isDarkTheme
                        ? "bg-slate-700 text-slate-400"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    Enable Quiet Hours
                  </p>
                  <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Mute all notifications during set times
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("quiet_hours_enabled")}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                  preferences.quiet_hours_enabled
                    ? "bg-purple-600"
                    : isDarkTheme
                      ? "bg-slate-600"
                      : "bg-slate-300"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.quiet_hours_enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Time Pickers */}
          {preferences.quiet_hours_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => handleTimeChange("quiet_hours_start", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => handleTimeChange("quiet_hours_end", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Notification Preferences
            </>
          )}
        </button>

        <p className={`mt-4 text-xs text-center ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
          You can also unsubscribe from emails by clicking the link at the bottom of any email.
        </p>
      </div>
    </div>
  );
}
