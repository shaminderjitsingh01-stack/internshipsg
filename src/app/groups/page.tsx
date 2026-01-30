"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  cover_image: string | null;
  privacy: string;
  member_count: number;
  post_count: number;
  is_verified: boolean;
  created_at: string;
  is_member?: boolean;
  membership_status?: string;
  user_role?: string;
}

// Category colors
const categoryColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  career: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  industry: { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  school: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
  interest: { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
};

const categoryLabels: Record<string, string> = {
  career: "Career",
  industry: "Industry",
  school: "School",
  interest: "Interest",
};

const privacyIcons: Record<string, string> = {
  public: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-3a6 6 0 100-12 6 6 0 000 12z",
  private: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  "invite-only": "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
};

export default function GroupsPage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<string>(""); // '', 'joined', 'created'
  const [activeTab, setActiveTab] = useState<"discover" | "my-groups">("discover");

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (userEmail) params.set("user_email", userEmail);

      if (activeTab === "my-groups" && userEmail) {
        params.set("membership", membershipFilter || "joined");
      }

      const res = await fetch(`/api/groups?${params.toString()}`);
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, membershipFilter, activeTab, userEmail]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Join group handler
  const handleJoinGroup = async (groupId: string, privacy: string) => {
    if (!userEmail) {
      alert("Please sign in to join groups");
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          action: privacy === "invite-only" ? "request" : "join",
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  is_member: data.status === "active",
                  membership_status: data.status,
                  member_count: data.status === "active" ? g.member_count + 1 : g.member_count,
                }
              : g
          )
        );
        alert(data.message);
      } else {
        alert(data.error || "Failed to join group");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group");
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${
          isDarkTheme ? "border-red-800/30" : "border-gray-200/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">i</span>
                </div>
                <span className={`font-bold text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  internship.sg
                </span>
              </Link>
              <span className={isDarkTheme ? "text-gray-600" : "text-gray-300"}>/</span>
              <span className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Groups</span>
            </div>
            <div className="flex items-center gap-3">
              {userEmail && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-premium px-4 py-2 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Group
                </button>
              )}
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-xl font-medium text-sm ${
                  isDarkTheme ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className={`py-8 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Groups & Communities
              </h1>
              <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                Connect with like-minded professionals and students
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab("discover")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                activeTab === "discover"
                  ? isDarkTheme
                    ? "bg-red-600 text-white"
                    : "bg-red-500 text-white"
                  : isDarkTheme
                  ? "text-gray-400 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Discover
            </button>
            {userEmail && (
              <button
                onClick={() => setActiveTab("my-groups")}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                  activeTab === "my-groups"
                    ? isDarkTheme
                      ? "bg-red-600 text-white"
                      : "bg-red-500 text-white"
                    : isDarkTheme
                    ? "text-gray-400 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                My Groups
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className={`py-4 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`card-premium p-4 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <div className="relative">
                  <svg
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDarkTheme ? "text-gray-500" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="">All Categories</option>
                <option value="career">Career</option>
                <option value="industry">Industry</option>
                <option value="school">School</option>
                <option value="interest">Interest</option>
              </select>

              {/* Membership Filter (only for My Groups tab) */}
              {activeTab === "my-groups" && userEmail && (
                <select
                  value={membershipFilter}
                  onChange={(e) => setMembershipFilter(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  <option value="joined">Joined</option>
                  <option value="created">Created by Me</option>
                </select>
              )}
            </div>

            {/* Clear filters */}
            {(search || categoryFilter) && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
                  }}
                  className={`text-sm font-medium ${
                    isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Groups Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              {loading ? "Loading..." : `${groups.length} groups found`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const colors = categoryColors[group.category] || categoryColors.interest;

                return (
                  <div
                    key={group.id}
                    className={`card-premium overflow-hidden group ${
                      isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""
                    }`}
                  >
                    {/* Cover Image */}
                    <Link href={`/groups/${group.slug}`}>
                      {group.cover_image ? (
                        <div className="aspect-[3/1] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <img
                            src={group.cover_image}
                            alt={group.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div
                          className={`aspect-[3/1] ${
                            isDarkTheme
                              ? "bg-gradient-to-br from-gray-700 to-gray-800"
                              : "bg-gradient-to-br from-red-50 to-red-100"
                          } flex items-center justify-center`}
                        >
                          <svg
                            className={`w-12 h-12 ${isDarkTheme ? "text-gray-600" : "text-red-200"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                      )}
                    </Link>

                    <div className="p-5">
                      {/* Category & Privacy */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isDarkTheme ? colors.darkBg : colors.bg
                          } ${isDarkTheme ? colors.darkText : colors.text}`}
                        >
                          {categoryLabels[group.category] || group.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <svg
                            className={`w-4 h-4 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={privacyIcons[group.privacy] || privacyIcons.public}
                            />
                          </svg>
                          <span className={`text-xs ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                            {group.privacy === "invite-only" ? "Invite Only" : group.privacy}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <Link href={`/groups/${group.slug}`}>
                        <h3
                          className={`text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors line-clamp-1 ${
                            isDarkTheme ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {group.name}
                          {group.is_verified && (
                            <svg
                              className="w-4 h-4 inline-block ml-1 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </h3>
                      </Link>

                      {/* Description */}
                      {group.description && (
                        <p className={`text-sm mb-4 line-clamp-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                          {group.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <span className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          {group.member_count} members
                        </span>
                        <span className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                          {group.post_count} posts
                        </span>
                      </div>

                      {/* Action Button */}
                      <div className="flex gap-2">
                        <Link
                          href={`/groups/${group.slug}`}
                          className={`flex-1 py-2.5 rounded-xl text-center text-sm font-medium transition-colors ${
                            isDarkTheme
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          View
                        </Link>
                        {!group.is_member && userEmail && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleJoinGroup(group.id, group.privacy);
                            }}
                            disabled={group.membership_status === "pending"}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              group.membership_status === "pending"
                                ? isDarkTheme
                                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "btn-premium"
                            }`}
                          >
                            {group.membership_status === "pending"
                              ? "Pending"
                              : group.privacy === "invite-only"
                              ? "Request"
                              : "Join"}
                          </button>
                        )}
                        {group.is_member && (
                          <span
                            className={`flex-1 py-2.5 rounded-xl text-center text-sm font-medium ${
                              isDarkTheme ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                            }`}
                          >
                            Joined
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-12 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No groups found</p>
              <p className="text-sm">
                {activeTab === "my-groups"
                  ? "You haven't joined any groups yet"
                  : "Try adjusting your filters or create a new group"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Create Group Modal */}
      {showCreateModal && userEmail && (
        <CreateGroupModal
          isDarkTheme={isDarkTheme}
          userEmail={userEmail}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}

// Create Group Modal Component
function CreateGroupModal({
  isDarkTheme,
  userEmail,
  onClose,
  onSuccess,
}: {
  isDarkTheme: boolean;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "interest",
    privacy: "public",
    rules: "",
    cover_image: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          creator_email: userEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
          isDarkTheme ? "bg-gray-800" : "bg-white"
        } shadow-xl`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDarkTheme ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Create New Group</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Group Name *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="e.g., Tech Careers Singapore"
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl border resize-none ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="What is this group about?"
            />
          </div>

          {/* Category & Privacy Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="career">Career</option>
                <option value="industry">Industry</option>
                <option value="school">School</option>
                <option value="interest">Interest</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                Privacy
              </label>
              <select
                value={formData.privacy}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Approval required</option>
                <option value="invite-only">Invite Only</option>
              </select>
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Group Rules (optional)
            </label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl border resize-none ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="Set guidelines for group members..."
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Cover Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              placeholder="https://..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-medium ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-premium py-3 disabled:opacity-50">
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
