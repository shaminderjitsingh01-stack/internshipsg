"use client";

import { useState, useEffect, useCallback, use } from "react";
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
  rules: string | null;
  creator_email: string;
  member_count: number;
  post_count: number;
  is_verified: boolean;
  created_at: string;
  creator?: {
    email: string;
    username?: string;
    name?: string;
    image?: string;
  };
}

interface Member {
  id: string;
  group_id: string;
  user_email: string;
  role: string;
  status: string;
  joined_at: string;
  user: {
    email: string;
    username?: string;
    name: string;
    image?: string;
    school?: string;
    tier?: string;
    level?: number;
  };
}

interface Post {
  id: string;
  group_id: string;
  author_email: string;
  content: string;
  post_type: string;
  image_url: string | null;
  link_url: string | null;
  reaction_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  author: {
    email: string;
    username?: string;
    name: string;
    image?: string;
    school?: string;
    tier?: string;
    level?: number;
  };
  user_reaction: string | null;
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

const roleColors: Record<string, { bg: string; text: string }> = {
  creator: { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-700 dark:text-amber-300" },
  admin: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-700 dark:text-red-300" },
  moderator: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-700 dark:text-blue-300" },
  member: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  const [isMember, setIsMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [canView, setCanView] = useState(true);

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPostingContent, setIsPostingContent] = useState(false);

  const isAdmin = userRole && ["creator", "admin", "moderator"].includes(userRole);

  // Fetch group details
  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userEmail) params.set("user_email", userEmail);

      const res = await fetch(`/api/groups/${resolvedParams.groupId}?${params.toString()}`);
      const data = await res.json();

      if (data.error) {
        console.error(data.error);
        return;
      }

      setGroup(data.group);
      setIsMember(data.is_member);
      setMembershipStatus(data.membership_status);
      setUserRole(data.user_role);
      setCanView(data.can_view);
    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.groupId, userEmail]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!group?.id) return;

    try {
      const res = await fetch(`/api/groups/${group.id}/members?limit=10`);
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, [group?.id]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!group?.id || !canView) return;

    setPostsLoading(true);
    try {
      const params = new URLSearchParams();
      if (userEmail) params.set("user_email", userEmail);

      const res = await fetch(`/api/groups/${group.id}/posts?${params.toString()}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setPostsLoading(false);
    }
  }, [group?.id, canView, userEmail]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    if (group && canView) {
      fetchMembers();
      fetchPosts();
    }
  }, [group, canView, fetchMembers, fetchPosts]);

  // Join group handler
  const handleJoinGroup = async () => {
    if (!userEmail || !group) return;

    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          action: group.privacy === "invite-only" ? "request" : "join",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsMember(data.status === "active");
        setMembershipStatus(data.status);
        if (data.status === "active") {
          setUserRole("member");
          setGroup((prev) => (prev ? { ...prev, member_count: prev.member_count + 1 } : null));
        }
        alert(data.message);
      } else {
        alert(data.error || "Failed to join group");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group");
    }
  };

  // Leave group handler
  const handleLeaveGroup = async () => {
    if (!userEmail || !group) return;
    if (!confirm("Are you sure you want to leave this group?")) return;

    try {
      const res = await fetch(
        `/api/groups/${group.id}/members?user_email=${userEmail}&action=leave`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (data.success) {
        setIsMember(false);
        setMembershipStatus(null);
        setUserRole(null);
        setGroup((prev) => (prev ? { ...prev, member_count: prev.member_count - 1 } : null));
      } else {
        alert(data.error || "Failed to leave group");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group");
    }
  };

  // Create post handler
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !group || !newPostContent.trim()) return;

    setIsPostingContent(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_email: userEmail,
          content: newPostContent.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewPostContent("");
        setPosts((prev) => [data.post, ...prev]);
        setGroup((prev) => (prev ? { ...prev, post_count: prev.post_count + 1 } : null));
      } else {
        alert(data.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setIsPostingContent(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Group Not Found</h1>
          <p className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>
            This group may have been deleted or you don&apos;t have access.
          </p>
          <Link href="/groups" className="btn-premium mt-4 inline-block px-6 py-2">
            Browse Groups
          </Link>
        </div>
      </div>
    );
  }

  const colors = categoryColors[group.category] || categoryColors.interest;

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
              <Link
                href="/groups"
                className={`font-medium ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
              >
                Groups
              </Link>
              <span className={isDarkTheme ? "text-gray-600" : "text-gray-300"}>/</span>
              <span className={`font-medium truncate max-w-[200px] ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                {group.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Cover Image & Header */}
      <section className="relative">
        {/* Cover Image */}
        <div
          className={`h-48 md:h-64 ${
            isDarkTheme ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-red-100 to-red-200"
          }`}
        >
          {group.cover_image && (
            <img src={group.cover_image} alt={group.name} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Group Info Overlay */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/95 border-gray-700" : "bg-white/95"}`}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      isDarkTheme ? colors.darkBg : colors.bg
                    } ${isDarkTheme ? colors.darkText : colors.text}`}
                  >
                    {categoryLabels[group.category] || group.category}
                  </span>
                  <span className={`text-xs ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                    {group.privacy === "invite-only" ? "Invite Only" : group.privacy}
                  </span>
                </div>

                <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  {group.name}
                  {group.is_verified && (
                    <svg className="w-6 h-6 inline-block ml-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </h1>

                {group.description && (
                  <p className={`mb-4 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>{group.description}</p>
                )}

                <div className="flex items-center gap-6 text-sm">
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className={`flex items-center gap-1 hover:underline ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {group.member_count} members
                  </button>
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
                  {group.rules && (
                    <button
                      onClick={() => setShowRulesModal(true)}
                      className={`flex items-center gap-1 hover:underline ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Rules
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!canView && !isMember ? (
                  <button onClick={handleJoinGroup} className="btn-premium px-6 py-2.5">
                    {group.privacy === "invite-only" ? "Request to Join" : "Join Group"}
                  </button>
                ) : isMember ? (
                  <>
                    {userRole === "creator" ? (
                      <span
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm ${
                          isDarkTheme ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        Creator
                      </span>
                    ) : (
                      <button
                        onClick={handleLeaveGroup}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm ${
                          isDarkTheme
                            ? "bg-gray-700 text-gray-300 hover:bg-red-900/50 hover:text-red-300"
                            : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
                        } transition-colors`}
                      >
                        Leave
                      </button>
                    )}
                  </>
                ) : membershipStatus === "pending" ? (
                  <span
                    className={`px-4 py-2.5 rounded-xl font-medium text-sm ${
                      isDarkTheme ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    Request Pending
                  </span>
                ) : (
                  <button onClick={handleJoinGroup} className="btn-premium px-6 py-2.5">
                    {group.privacy === "invite-only" ? "Request to Join" : "Join Group"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {canView ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Posts Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              {isMember && (
                <div className={`card-premium p-4 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                  <form onSubmit={handleCreatePost}>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share something with the group..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border resize-none ${
                        isDarkTheme
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={isPostingContent || !newPostContent.trim()}
                        className="btn-premium px-4 py-2 text-sm disabled:opacity-50"
                      >
                        {isPostingContent ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Posts */}
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className={`card-premium p-5 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                  >
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-4">
                      {post.author.image ? (
                        <img
                          src={post.author.image}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDarkTheme ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        >
                          <span className={`font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                            {post.author.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/u/${post.author.username || post.author.email}`}
                            className={`font-semibold hover:underline ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                          >
                            {post.author.name}
                          </Link>
                          {post.is_pinned && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isDarkTheme ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              Pinned
                            </span>
                          )}
                          {post.is_announcement && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isDarkTheme ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700"
                              }`}
                            >
                              Announcement
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${isDarkTheme ? "text-gray-500" : "text-gray-500"}`}>
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className={`mb-4 whitespace-pre-wrap ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                      {post.content}
                    </p>

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="mb-4 rounded-xl overflow-hidden">
                        <img src={post.image_url} alt="Post image" className="w-full" />
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className={`flex items-center gap-4 pt-4 border-t ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
                      <span className={`text-sm ${isDarkTheme ? "text-gray-500" : "text-gray-500"}`}>
                        {post.reaction_count} reactions
                      </span>
                      <span className={`text-sm ${isDarkTheme ? "text-gray-500" : "text-gray-500"}`}>
                        {post.comment_count} comments
                      </span>
                    </div>
                  </div>
                ))
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
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-1">No posts yet</p>
                  <p className="text-sm">Be the first to share something with the group</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Members Preview */}
              <div className={`card-premium p-5 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Members</h3>
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className={`text-sm font-medium ${
                      isDarkTheme ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"
                    }`}
                  >
                    See all
                  </button>
                </div>

                <div className="space-y-3">
                  {members.slice(0, 5).map((member) => (
                    <Link
                      key={member.id}
                      href={`/u/${member.user.username || member.user.email}`}
                      className="flex items-center gap-3 group"
                    >
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDarkTheme ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        >
                          <span className={`font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate group-hover:underline ${
                            isDarkTheme ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {member.user.name}
                        </p>
                        {member.role !== "member" && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${roleColors[member.role]?.bg} ${roleColors[member.role]?.text}`}
                          >
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* About */}
              <div className={`card-premium p-5 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>About</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>
                      Created {formatDate(group.created_at)}
                    </span>
                  </div>
                  {group.creator && (
                    <div className="flex items-center gap-2">
                      <svg className={`w-4 h-4 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>
                        Created by{" "}
                        <Link
                          href={`/u/${group.creator.username || group.creator.email}`}
                          className={isDarkTheme ? "text-red-400 hover:underline" : "text-red-600 hover:underline"}
                        >
                          {group.creator.name || "Unknown"}
                        </Link>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? "text-gray-600" : "text-gray-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className={`text-xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              This is a {group.privacy} group
            </h2>
            <p className={`mb-4 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              {group.privacy === "invite-only"
                ? "You need an invitation to view this group's content"
                : "Request to join to see posts and members"}
            </p>
            {userEmail && membershipStatus !== "pending" && (
              <button onClick={handleJoinGroup} className="btn-premium px-6 py-2.5">
                {group.privacy === "invite-only" ? "Request to Join" : "Request Access"}
              </button>
            )}
            {membershipStatus === "pending" && (
              <span className={`inline-block px-4 py-2 rounded-xl ${isDarkTheme ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                Your request is pending approval
              </span>
            )}
          </div>
        )}
      </section>

      {/* Rules Modal */}
      {showRulesModal && group.rules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRulesModal(false)}></div>
          <div
            className={`relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6 ${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            } shadow-xl`}
          >
            <button
              onClick={() => setShowRulesModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg ${
                isDarkTheme ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className={`text-xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Group Rules</h2>
            <div className={`whitespace-pre-wrap ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>{group.rules}</div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <MembersModal
          isDarkTheme={isDarkTheme}
          groupId={group.id}
          userEmail={userEmail}
          userRole={userRole}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </div>
  );
}

// Members Modal Component
function MembersModal({
  isDarkTheme,
  groupId,
  userEmail,
  userRole,
  onClose,
}: {
  isDarkTheme: boolean;
  groupId: string;
  userEmail?: string | null;
  userRole: string | null;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");

  const isAdmin = userRole && ["creator", "admin"].includes(userRole);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/${groupId}/members?status=${statusFilter}&limit=100`);
        const data = await res.json();
        if (data.members) {
          setMembers(data.members);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId, statusFilter]);

  const handleApproveMember = async (targetEmail: string) => {
    if (!userEmail) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          target_email: targetEmail,
          action: "approve",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.user_email !== targetEmail));
      } else {
        alert(data.error || "Failed to approve");
      }
    } catch (error) {
      console.error("Error approving member:", error);
    }
  };

  const handleRejectMember = async (targetEmail: string) => {
    if (!userEmail) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          target_email: targetEmail,
          action: "reject",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.user_email !== targetEmail));
      } else {
        alert(data.error || "Failed to reject");
      }
    } catch (error) {
      console.error("Error rejecting member:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div
        className={`relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6 ${
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

        <h2 className={`text-xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Members</h2>

        {/* Status Filter */}
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === "active"
                  ? isDarkTheme
                    ? "bg-red-600 text-white"
                    : "bg-red-500 text-white"
                  : isDarkTheme
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === "pending"
                  ? isDarkTheme
                    ? "bg-red-600 text-white"
                    : "bg-red-500 text-white"
                  : isDarkTheme
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Pending
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                {member.user.image ? (
                  <img src={member.user.image} alt={member.user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDarkTheme ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    <span className={`font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/u/${member.user.username || member.user.email}`}
                    className={`font-medium truncate block hover:underline ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                  >
                    {member.user.name}
                  </Link>
                  {member.role !== "member" && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${roleColors[member.role]?.bg} ${roleColors[member.role]?.text}`}
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  )}
                </div>

                {/* Pending actions */}
                {statusFilter === "pending" && isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveMember(member.user_email)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        isDarkTheme
                          ? "bg-green-900/50 text-green-300 hover:bg-green-800"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectMember(member.user_email)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        isDarkTheme
                          ? "bg-red-900/50 text-red-300 hover:bg-red-800"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-center py-8 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
            {statusFilter === "pending" ? "No pending requests" : "No members found"}
          </p>
        )}
      </div>
    </div>
  );
}
