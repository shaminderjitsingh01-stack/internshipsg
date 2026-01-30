"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

type ProfileVisibility = "public" | "connections" | "private";
type MessagePrivacy = "everyone" | "connections" | "no_one";
type EmailVisibility = "everyone" | "connections" | "no_one";

interface PrivacySettings {
  profile_visibility: ProfileVisibility;
  message_privacy: MessagePrivacy;
  email_visibility: EmailVisibility;
  show_activity_status: boolean;
  show_online_status: boolean;
  allow_search_engine_indexing: boolean;
}

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Privacy settings state
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: "public",
    message_privacy: "everyone",
    email_visibility: "connections",
    show_activity_status: true,
    show_online_status: true,
    allow_search_engine_indexing: true,
  });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Data export state
  const [exporting, setExporting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch privacy settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(
          `/api/settings/privacy?email=${encodeURIComponent(session.user.email)}`
        );

        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        } else {
          setErrorMessage("Failed to load privacy settings");
        }
      } catch (err) {
        console.error("Failed to fetch privacy settings:", err);
        setErrorMessage("Failed to load privacy settings");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSettings();
    }
  }, [session?.user?.email, status]);

  // Handle setting update
  const updateSetting = useCallback(
    async (key: keyof PrivacySettings, value: string | boolean) => {
      if (!session?.user?.email) return;

      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Optimistic update
      const previousSettings = { ...settings };
      setSettings((prev) => ({ ...prev, [key]: value }));

      try {
        const res = await fetch("/api/settings/privacy", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user.email,
            [key]: value,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update setting");
        }

        setSuccessMessage("Settings updated");
        setTimeout(() => setSuccessMessage(""), 2000);
      } catch (err) {
        // Revert on error
        setSettings(previousSettings);
        setErrorMessage("Failed to update settings");
        setTimeout(() => setErrorMessage(""), 3000);
      } finally {
        setSaving(false);
      }
    },
    [session?.user?.email, settings]
  );

  // Handle data export
  const handleExportData = async () => {
    if (!session?.user?.email) return;

    setExporting(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/settings/export-data?email=${encodeURIComponent(session.user.email)}`
      );

      if (!res.ok) {
        throw new Error("Failed to export data");
      }

      const data = await res.json();

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `internship-sg-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage("Data downloaded successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Failed to export data");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setExporting(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || !session?.user?.email) return;

    setDeleting(true);

    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setDeleting(false);
    }
  };

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

  const visibilityOptions: { value: ProfileVisibility; label: string; description: string }[] = [
    { value: "public", label: "Public", description: "Anyone can view your profile" },
    { value: "connections", label: "Connections only", description: "Only your connections can view your profile" },
    { value: "private", label: "Private", description: "Only you can view your profile" },
  ];

  const messageOptions: { value: MessagePrivacy; label: string; description: string }[] = [
    { value: "everyone", label: "Everyone", description: "Anyone can send you messages" },
    { value: "connections", label: "Connections only", description: "Only your connections can message you" },
    { value: "no_one", label: "No one", description: "Disable incoming messages" },
  ];

  const emailOptions: { value: EmailVisibility; label: string; description: string }[] = [
    { value: "everyone", label: "Everyone", description: "Anyone can see your email" },
    { value: "connections", label: "Connections only", description: "Only your connections can see your email" },
    { value: "no_one", label: "No one", description: "Hide your email from everyone" },
  ];

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
              Privacy Settings
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
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMessage}
            <button
              onClick={() => setErrorMessage("")}
              className="ml-2 text-red-900 font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Visibility Section */}
          <div
            className={`rounded-2xl p-6 shadow-sm border ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${
                  isDarkTheme ? "bg-blue-900/30" : "bg-blue-100"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isDarkTheme ? "text-blue-400" : "text-blue-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  Profile Visibility
                </h2>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Control who can see your profile information
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting("profile_visibility", option.value)}
                  disabled={saving}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    settings.profile_visibility === option.value
                      ? isDarkTheme
                        ? "bg-red-900/20 border-red-500/50"
                        : "bg-red-50 border-red-200"
                      : isDarkTheme
                      ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="text-left">
                    <p
                      className={`font-medium ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkTheme ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      settings.profile_visibility === option.value
                        ? "border-red-500 bg-red-500"
                        : isDarkTheme
                        ? "border-slate-600"
                        : "border-slate-300"
                    }`}
                  >
                    {settings.profile_visibility === option.value && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Messaging Privacy Section */}
          <div
            className={`rounded-2xl p-6 shadow-sm border ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${
                  isDarkTheme ? "bg-purple-900/30" : "bg-purple-100"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isDarkTheme ? "text-purple-400" : "text-purple-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  Who Can Send Messages
                </h2>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Control who can send you direct messages
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {messageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting("message_privacy", option.value)}
                  disabled={saving}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    settings.message_privacy === option.value
                      ? isDarkTheme
                        ? "bg-red-900/20 border-red-500/50"
                        : "bg-red-50 border-red-200"
                      : isDarkTheme
                      ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="text-left">
                    <p
                      className={`font-medium ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkTheme ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      settings.message_privacy === option.value
                        ? "border-red-500 bg-red-500"
                        : isDarkTheme
                        ? "border-slate-600"
                        : "border-slate-300"
                    }`}
                  >
                    {settings.message_privacy === option.value && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Visibility Section */}
          <div
            className={`rounded-2xl p-6 shadow-sm border ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${
                  isDarkTheme ? "bg-amber-900/30" : "bg-amber-100"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isDarkTheme ? "text-amber-400" : "text-amber-600"
                  }`}
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
                  className={`text-lg font-semibold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  Who Can See Email
                </h2>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Control who can see your email address
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {emailOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting("email_visibility", option.value)}
                  disabled={saving}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    settings.email_visibility === option.value
                      ? isDarkTheme
                        ? "bg-red-900/20 border-red-500/50"
                        : "bg-red-50 border-red-200"
                      : isDarkTheme
                      ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="text-left">
                    <p
                      className={`font-medium ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkTheme ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      settings.email_visibility === option.value
                        ? "border-red-500 bg-red-500"
                        : isDarkTheme
                        ? "border-slate-600"
                        : "border-slate-300"
                    }`}
                  >
                    {settings.email_visibility === option.value && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity & Status Section */}
          <div
            className={`rounded-2xl p-6 shadow-sm border ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${
                  isDarkTheme ? "bg-green-900/30" : "bg-green-100"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isDarkTheme ? "text-green-400" : "text-green-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  Activity & Status
                </h2>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Manage your activity and online status visibility
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Show Activity Status */}
              <div
                className={`p-4 rounded-xl border transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`font-medium ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Show Activity Status
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkTheme ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Let others see when you were last active
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSetting("show_activity_status", !settings.show_activity_status)
                    }
                    disabled={saving}
                    className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                      settings.show_activity_status
                        ? "bg-red-600"
                        : isDarkTheme
                        ? "bg-slate-600"
                        : "bg-slate-300"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.show_activity_status ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Show Online Status */}
              <div
                className={`p-4 rounded-xl border transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`font-medium ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Show Online Status
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkTheme ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Let others see when you are currently online
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSetting("show_online_status", !settings.show_online_status)
                    }
                    disabled={saving}
                    className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                      settings.show_online_status
                        ? "bg-red-600"
                        : isDarkTheme
                        ? "bg-slate-600"
                        : "bg-slate-300"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.show_online_status ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Search Engine Indexing */}
              <div
                className={`p-4 rounded-xl border transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`font-medium ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Allow Search Engine Indexing
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkTheme ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Allow search engines like Google to index your profile
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSetting(
                        "allow_search_engine_indexing",
                        !settings.allow_search_engine_indexing
                      )
                    }
                    disabled={saving}
                    className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                      settings.allow_search_engine_indexing
                        ? "bg-red-600"
                        : isDarkTheme
                        ? "bg-slate-600"
                        : "bg-slate-300"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.allow_search_engine_indexing
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div
            className={`rounded-2xl p-6 shadow-sm border ${
              isDarkTheme
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${
                  isDarkTheme ? "bg-cyan-900/30" : "bg-cyan-100"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isDarkTheme ? "text-cyan-400" : "text-cyan-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  Download Your Data
                </h2>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Request a copy of all your data
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl mb-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Download a JSON file containing your profile, interviews, achievements,
                activity history, and preferences.
              </p>
            </div>

            <button
              onClick={handleExportData}
              disabled={exporting}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Preparing Download...
                </>
              ) : (
                <>
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download My Data
                </>
              )}
            </button>
          </div>

          {/* Delete Account Section */}
          <div
            className={`rounded-2xl p-6 shadow-sm border ${
              isDarkTheme
                ? "bg-slate-900 border-red-900/50"
                : "bg-white border-red-200"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-100">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  Delete Account
                </h2>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl ${
                    isDarkTheme
                      ? "bg-red-900/20 border border-red-900/50"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      isDarkTheme ? "text-red-400" : "text-red-700"
                    }`}
                  >
                    This will permanently delete your account, all your interview
                    history, profile data, and achievements. This action cannot be
                    undone.
                  </p>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkTheme ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                      isDarkTheme
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || deleting}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      "Confirm Delete"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
            <Link href="/settings" className="hover:text-red-600 transition-colors">
              Settings
            </Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
