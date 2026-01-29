"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import ProfileSettings from "@/components/ProfileSettings";
import NotificationPreferences from "@/components/NotificationPreferences";
import EducationExperienceSettings from "@/components/EducationExperienceSettings";
import ProjectsSection from "@/components/ProjectsSection";

interface ConnectedAccount {
  provider: string;
  email: string;
  connected_at: string;
}

interface UserData {
  email: string;
  name: string | null;
  auth_provider: string;
  created_at: string;
  is_public: boolean;
  show_on_leaderboard: boolean;
  is_looking: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  // State
  const [activeSection, setActiveSection] = useState<"profile" | "experience" | "projects" | "account" | "privacy" | "notifications" | "connected" | "data">("profile");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Privacy settings state
  const [isPublic, setIsPublic] = useState(false);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [isLooking, setIsLooking] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState("");
  const [privacyError, setPrivacyError] = useState("");

  // Account settings state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Data export state
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  // Connected accounts
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`/api/profile?email=${encodeURIComponent(session.user?.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setIsPublic(data.profile.is_public ?? false);
            setShowOnLeaderboard(data.profile.show_on_leaderboard ?? true);
            setIsLooking(data.profile.is_looking ?? true);
            setUserData({
              email: session.user?.email,
              name: session.user?.name || null,
              auth_provider: data.profile.auth_provider || "unknown",
              created_at: data.profile.created_at || new Date().toISOString(),
              is_public: data.profile.is_public ?? false,
              show_on_leaderboard: data.profile.show_on_leaderboard ?? true,
              is_looking: data.profile.is_looking ?? true,
            });

            // Check if Google account is connected
            if (data.profile.auth_provider === "google" || session.user?.image?.includes("google")) {
              setConnectedAccounts([{
                provider: "google",
                email: session.user?.email,
                connected_at: data.profile.created_at || new Date().toISOString(),
              }]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchUserData();
    }
  }, [session, status]);

  // Handle privacy toggle
  const handlePrivacyToggle = async (setting: "is_public" | "show_on_leaderboard" | "is_looking", value: boolean) => {
    if (!session?.user?.email) return;

    setPrivacySaving(true);
    setPrivacyError("");
    setPrivacySuccess("");

    // Optimistic update
    if (setting === "is_public") setIsPublic(value);
    if (setting === "show_on_leaderboard") setShowOnLeaderboard(value);
    if (setting === "is_looking") setIsLooking(value);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user?.email,
          [setting]: value,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update settings");
      }

      setPrivacySuccess("Settings updated");
      setTimeout(() => setPrivacySuccess(""), 2000);
    } catch (err) {
      // Revert on error
      if (setting === "is_public") setIsPublic(!value);
      if (setting === "show_on_leaderboard") setShowOnLeaderboard(!value);
      if (setting === "is_looking") setIsLooking(!value);
      setPrivacyError("Failed to update settings");
    } finally {
      setPrivacySaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordChanging(true);

    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordChanging(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setDeleting(true);

    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  // Handle data export
  const handleExportData = async () => {
    setExporting(true);
    setExportError("");

    try {
      const res = await fetch(`/api/settings/export-data?email=${encodeURIComponent(session?.user?.email || "")}`);

      if (!res.ok) {
        throw new Error("Failed to export data");
      }

      const data = await res.json();

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `internship-sg-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isCredentialsUser = !connectedAccounts.some(a => a.provider === "google");

  const sections = [
    { id: "profile", label: "Profile", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: "experience", label: "Experience & Education", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
    { id: "projects", label: "Projects", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )},
    { id: "account", label: "Account", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )},
    { id: "privacy", label: "Privacy", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { id: "notifications", label: "Notifications", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
    { id: "connected", label: "Connected Accounts", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )},
    { id: "data", label: "Data Export", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    )},
  ];

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
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
            <Link
              href="/dashboard"
              className={`px-4 py-2 font-medium transition-colors ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
            >
              Dashboard
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              {session.user?.image ? (
                <img
                  src={session.user?.image}
                  alt={session.user?.name || "User"}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}
                />
              ) : (
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <span className="text-red-600 font-semibold text-sm">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Settings
          </h1>
          <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className={`rounded-2xl p-2 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'} shadow-sm border ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as typeof activeSection)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeSection === section.id
                        ? isDarkTheme
                          ? 'bg-red-600/20 text-red-400'
                          : 'bg-red-50 text-red-600'
                        : isDarkTheme
                          ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {section.icon}
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Profile Settings Section */}
            {activeSection === "profile" && session?.user?.email && (
              <ProfileSettings
                userEmail={session.user?.email}
                userName={session.user?.name || undefined}
              />
            )}

            {/* Experience & Education Section */}
            {activeSection === "experience" && session?.user?.email && (
              <EducationExperienceSettings userEmail={session.user?.email} />
            )}

            {/* Projects Section */}
            {activeSection === "projects" && session?.user?.email && (
              <ProjectsSection userEmail={session.user?.email} isOwnProfile={true} />
            )}

            {/* Account Settings Section */}
            {activeSection === "account" && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h2 className={`text-xl font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    Change Password
                  </h2>

                  {isCredentialsUser ? (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            isDarkTheme
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          }`}
                          placeholder="Enter current password"
                          required
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            isDarkTheme
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          }`}
                          placeholder="Enter new password"
                          minLength={8}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            isDarkTheme
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          }`}
                          placeholder="Confirm new password"
                          required
                        />
                      </div>

                      {passwordError && (
                        <div className="p-4 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm">
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="p-4 bg-green-100 border border-green-200 rounded-xl text-green-700 text-sm">
                          {passwordSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={passwordChanging}
                        className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {passwordChanging ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Changing Password...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        You signed in with Google. To change your password, please manage your account through Google.
                      </p>
                    </div>
                  )}
                </div>

                {/* Delete Account */}
                <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-red-900/50' : 'bg-white border-red-200'}`}>
                  <h2 className={`text-xl font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    Delete Account
                  </h2>
                  <p className={`text-sm mb-6 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                    >
                      Delete My Account
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-red-900/20 border border-red-900/50' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`text-sm ${isDarkTheme ? 'text-red-400' : 'text-red-700'}`}>
                          This will permanently delete your account, all your interview history, profile data, and achievements. This action cannot be undone.
                        </p>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          Type DELETE to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            isDarkTheme
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
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
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
            )}

            {/* Privacy Settings Section */}
            {activeSection === "privacy" && (
              <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Privacy Settings
                </h2>

                {/* Status Messages */}
                {privacyError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                    {privacyError}
                  </div>
                )}
                {privacySuccess && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {privacySuccess}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Profile Visibility */}
                  <div className={`p-4 rounded-xl border transition-colors ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${isPublic ? 'bg-green-100 text-green-600' : isDarkTheme ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            Public Profile
                          </p>
                          <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            Allow others to view your profile and achievements
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrivacyToggle("is_public", !isPublic)}
                        disabled={privacySaving}
                        className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                          isPublic ? 'bg-red-600' : isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'
                        } ${privacySaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Leaderboard Opt-in */}
                  <div className={`p-4 rounded-xl border transition-colors ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${showOnLeaderboard ? 'bg-purple-100 text-purple-600' : isDarkTheme ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            Show on Leaderboard
                          </p>
                          <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            Appear on the public leaderboard with your ranking
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrivacyToggle("show_on_leaderboard", !showOnLeaderboard)}
                        disabled={privacySaving}
                        className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                          showOnLeaderboard ? 'bg-red-600' : isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'
                        } ${privacySaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showOnLeaderboard ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Looking for Internship */}
                  <div className={`p-4 rounded-xl border transition-colors ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${isLooking ? 'bg-amber-100 text-amber-600' : isDarkTheme ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            Looking for Internship
                          </p>
                          <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            Show employers that you're actively seeking opportunities
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrivacyToggle("is_looking", !isLooking)}
                        disabled={privacySaving}
                        className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                          isLooking ? 'bg-red-600' : isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'
                        } ${privacySaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isLooking ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings Section */}
            {activeSection === "notifications" && session?.user?.email && (
              <NotificationPreferences userEmail={session.user?.email} />
            )}

            {/* Connected Accounts Section */}
            {activeSection === "connected" && (
              <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Connected Accounts
                </h2>

                <div className="space-y-4">
                  {/* Google Account */}
                  <div className={`p-4 rounded-xl border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div>
                          <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Google</p>
                          {connectedAccounts.some(a => a.provider === "google") ? (
                            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                              Connected as {session?.user?.email}
                            </p>
                          ) : (
                            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                              Not connected
                            </p>
                          )}
                        </div>
                      </div>
                      {connectedAccounts.some(a => a.provider === "google") ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className={`text-sm ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>Connected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            // Trigger Google OAuth
                            window.location.href = "/api/auth/signin?callbackUrl=/settings";
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    Connecting accounts allows you to sign in using multiple methods.
                  </p>
                </div>
              </div>
            )}

            {/* Data Export Section */}
            {activeSection === "data" && (
              <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-xl font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Export Your Data
                </h2>

                <div className={`p-4 rounded-xl mb-6 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                    Download a copy of all your data including:
                  </p>
                  <ul className={`mt-3 space-y-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Profile information
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Interview history and feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Achievements and badges
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Activity and streak data
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Email preferences
                    </li>
                  </ul>
                </div>

                {exportError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                    {exportError}
                  </div>
                )}

                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download My Data
                    </>
                  )}
                </button>

                <p className={`mt-4 text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  Your data will be downloaded as a JSON file. This may take a few moments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
