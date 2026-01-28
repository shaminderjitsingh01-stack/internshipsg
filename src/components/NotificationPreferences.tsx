"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  userEmail: string;
}

interface EmailPreferences {
  weekly_digest: boolean;
  streak_reminders: boolean;
  achievement_notifications: boolean;
}

export default function NotificationPreferences({ userEmail }: Props) {
  const { isDarkTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [preferences, setPreferences] = useState<EmailPreferences>({
    weekly_digest: true,
    streak_reminders: true,
    achievement_notifications: true,
  });

  // Fetch existing preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch(
          `/api/email-preferences?email=${encodeURIComponent(userEmail)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setPreferences({
              weekly_digest: data.preferences.weekly_digest ?? true,
              streak_reminders: data.preferences.streak_reminders ?? true,
              achievement_notifications:
                data.preferences.achievement_notifications ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch email preferences:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userEmail]);

  const handleToggle = async (key: keyof EmailPreferences) => {
    const newValue = !preferences[key];
    const newPreferences = { ...preferences, [key]: newValue };
    setPreferences(newPreferences);
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          ...newPreferences,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      setSuccess("Preferences saved");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      // Revert on error
      setPreferences(preferences);
      setError("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`rounded-2xl p-6 ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  const toggleItems = [
    {
      key: "weekly_digest" as const,
      title: "Weekly Digest Emails",
      description:
        "Receive a summary of your progress every Sunday, including activities, streaks, and badges earned.",
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      key: "streak_reminders" as const,
      title: "Streak Reminders",
      description:
        "Get notified at 6pm if you haven't practiced today and are about to lose your streak.",
      icon: (
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
            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
          />
        </svg>
      ),
    },
    {
      key: "achievement_notifications" as const,
      title: "Achievement Notifications",
      description:
        "Get notified when you unlock new badges and reach milestones.",
      icon: (
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
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`p-2 rounded-lg ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}
        >
          <svg
            className={`w-5 h-5 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h2
            className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
          >
            Email Notifications
          </h2>
          <p
            className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
          >
            Choose what emails you'd like to receive
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      <div className="space-y-4">
        {toggleItems.map((item) => (
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
                      ? "bg-red-100 text-red-600"
                      : isDarkTheme
                        ? "bg-slate-700 text-slate-400"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {item.icon}
                </div>
                <div>
                  <p
                    className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`text-sm mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(item.key)}
                disabled={saving}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                  preferences[item.key]
                    ? "bg-red-600"
                    : isDarkTheme
                      ? "bg-slate-600"
                      : "bg-slate-300"
                } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences[item.key] ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p
        className={`mt-6 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
      >
        You can unsubscribe from any email by clicking the link at the bottom of
        the email.
      </p>
    </div>
  );
}
