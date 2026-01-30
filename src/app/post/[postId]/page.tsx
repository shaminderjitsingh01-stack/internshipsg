"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";

interface Author {
  email: string;
  username: string | null;
  name: string;
  image: string | null;
  school: string | null;
  bio?: string | null;
  tier: string | null;
  level: number | null;
}

interface Comment {
  id: string;
  post_id: string;
  author_email: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  author: {
    email: string;
    username: string | null;
    name: string;
    image: string | null;
    tier: string | null;
  };
  replies?: Comment[];
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
  poll_ends_at?: string | null;
  author: Author;
  userReaction: string | null;
  isBookmarked: boolean;
}

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
  percentage: number;
}

const REACTIONS = [
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "muscle", emoji: "💪", label: "Strong" },
  { type: "clap", emoji: "👏", label: "Applause" },
  { type: "target", emoji: "🎯", label: "On Target" },
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "idea", emoji: "💡", label: "Insightful" },
];

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-500",
  verified: "text-blue-500",
  elite: "text-purple-500",
};

export default function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Poll state
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [pollHasEnded, setPollHasEnded] = useState(false);
  const [votingOption, setVotingOption] = useState<string | null>(null);

  const userEmail = session?.user?.email;

  // Fetch post data
  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (userEmail) params.set("email", userEmail);

      const res = await fetch(`/api/social/posts/${postId}?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load post");
        return;
      }

      setPost(data.post);
      setComments(data.comments || []);
      setRelatedPosts(data.relatedPosts || []);
      setCurrentReaction(data.post.userReaction);
      setReactionCount(data.post.reaction_count);
      setBookmarked(data.post.isBookmarked);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [postId, userEmail]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Load poll data if it's a poll
  useEffect(() => {
    if (post?.post_type === "poll" && userEmail) {
      loadPollData();
    }
  }, [post?.id, post?.post_type, userEmail]);

  const loadPollData = async () => {
    if (!post) return;
    try {
      const res = await fetch(`/api/social/polls?postId=${post.id}&userEmail=${userEmail}`);
      if (res.ok) {
        const data = await res.json();
        setPollOptions(data.options || []);
        setTotalVotes(data.totalVotes || 0);
        setUserVote(data.userVote || null);
        setPollHasEnded(data.hasEnded || false);
      }
    } catch (error) {
      console.error("Failed to load poll:", error);
    }
  };

  const handleVote = async (optionId: string) => {
    if (pollHasEnded || votingOption || !userEmail) return;

    setVotingOption(optionId);
    try {
      const res = await fetch("/api/social/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poll_option_id: optionId,
          user_email: userEmail,
        }),
      });

      if (res.ok) {
        await loadPollData();
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setVotingOption(null);
    }
  };

  // Handle reaction
  const handleReaction = async (reactionType: string) => {
    if (!userEmail) return;

    try {
      const res = await fetch("/api/social/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          user_email: userEmail,
          reaction_type: reactionType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.action === "removed") {
          setCurrentReaction(null);
          setReactionCount(prev => prev - 1);
        } else if (data.action === "added") {
          setCurrentReaction(reactionType);
          setReactionCount(prev => prev + 1);
        } else if (data.action === "updated") {
          setCurrentReaction(reactionType);
        }
      }
    } catch (error) {
      console.error("Failed to react:", error);
    }
    setShowReactions(false);
  };

  // Handle bookmark
  const handleBookmark = async () => {
    if (!userEmail) return;

    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        const res = await fetch(
          `/api/social/bookmarks?postId=${postId}&email=${encodeURIComponent(userEmail)}`,
          { method: "DELETE" }
        );
        if (res.ok) setBookmarked(false);
      } else {
        const res = await fetch("/api/social/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId, user_email: userEmail }),
        });
        if (res.ok) setBookmarked(true);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Submit comment
  const submitComment = async (parentId?: string) => {
    if (!userEmail) return;
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          author_email: userEmail,
          content: content.trim(),
          parent_comment_id: parentId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (parentId) {
          // Add reply to parent comment
          setComments(prev =>
            prev.map(comment =>
              comment.id === parentId
                ? { ...comment, replies: [...(comment.replies || []), data.comment] }
                : comment
            )
          );
          setReplyContent("");
          setReplyingTo(null);
        } else {
          // Add new top-level comment
          setComments(prev => [...prev, { ...data.comment, replies: [] }]);
          setNewComment("");
        }
      }
    } catch (error) {
      console.error("Failed to comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Copy link to clipboard
  const copyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share via native share or modal
  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({
        title: post?.author.name ? `Post by ${post.author.name}` : "Post",
        text: post?.content.slice(0, 100) || "",
        url,
      });
    } else {
      setShowShareModal(true);
    }
  };

  // Render content with hashtags and mentions
  const renderContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return (
          <Link key={i} href={`/search?q=${encodeURIComponent(part)}&tab=posts`} className="text-red-500 hover:underline">
            {part}
          </Link>
        );
      }
      if (part.startsWith("@")) {
        return (
          <Link key={i} href={`/u/${part.slice(1)}`} className="text-blue-500 hover:underline">
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  // Calculate time remaining for poll
  const getPollTimeRemaining = () => {
    if (!post?.poll_ends_at) return null;
    const endsAt = new Date(post.poll_ends_at);
    const now = new Date();
    if (endsAt <= now) return "Poll ended";
    return `Ends ${formatDistanceToNow(endsAt, { addSuffix: true })}`;
  };

  const currentReactionEmoji = REACTIONS.find(r => r.type === currentReaction)?.emoji;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <svg className={`w-16 h-16 mb-4 ${isDarkTheme ? "text-slate-700" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className={`text-xl font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Post Not Found</h2>
        <p className={`mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>{error || "This post may have been deleted."}</p>
        <Link href="/home" className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className={`flex items-center gap-2 ${isDarkTheme ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className={`p-2 rounded-lg ${isDarkTheme ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
              title="Share post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDarkTheme ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Card */}
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              {/* Author Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Link href={`/u/${post.author.username || post.author_email.split("@")[0]}`}>
                    {post.author.image ? (
                      <img
                        src={post.author.image}
                        alt={post.author.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
                      />
                    ) : (
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-red-900/50" : "bg-red-100"}`}>
                        <span className="text-red-600 font-semibold text-lg">
                          {post.author.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/u/${post.author.username || post.author_email.split("@")[0]}`}
                        className={`font-semibold text-lg hover:underline ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                      >
                        {post.author.name}
                      </Link>
                      {post.author.tier && (
                        <span className={`text-sm ${TIER_COLORS[post.author.tier] || "text-slate-400"}`}>
                          {post.author.tier === "verified" ? "Verified" : post.author.tier === "elite" ? "Elite" : ""}
                        </span>
                      )}
                      {post.post_type === "poll" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkTheme ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                          Poll
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      {post.author.school && <span>{post.author.school}</span>}
                      {post.author.school && " · "}
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`mt-4 text-lg ${isDarkTheme ? "text-slate-200" : "text-slate-800"}`}>
                  <p className="whitespace-pre-wrap">{renderContent(post.content)}</p>
                </div>

                {/* Poll Section */}
                {post.post_type === "poll" && (
                  <div className="mt-4">
                    <div className="space-y-2">
                      {pollOptions.map(option => {
                        const isSelected = userVote === option.id;
                        const showResults = userVote !== null || pollHasEnded;

                        return (
                          <button
                            key={option.id}
                            onClick={() => !showResults && handleVote(option.id)}
                            disabled={pollHasEnded || votingOption !== null || !userEmail}
                            className={`w-full relative overflow-hidden rounded-xl border transition-all ${
                              pollHasEnded || votingOption !== null || !userEmail
                                ? "cursor-not-allowed"
                                : showResults
                                  ? "cursor-default"
                                  : "cursor-pointer hover:border-red-400"
                            } ${
                              isSelected
                                ? isDarkTheme
                                  ? "border-red-500 bg-red-900/20"
                                  : "border-red-500 bg-red-50"
                                : isDarkTheme
                                  ? "border-slate-700 bg-slate-800"
                                  : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            {showResults && (
                              <div
                                className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                                  isSelected
                                    ? isDarkTheme ? "bg-red-900/40" : "bg-red-100"
                                    : isDarkTheme ? "bg-slate-700/50" : "bg-slate-200"
                                }`}
                                style={{ width: `${option.percentage}%` }}
                              />
                            )}
                            <div className="relative px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {votingOption === option.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : isSelected ? (
                                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                ) : !showResults && (
                                  <div className={`w-5 h-5 rounded-full border-2 ${isDarkTheme ? "border-slate-600" : "border-slate-300"}`} />
                                )}
                                <span className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                                  {option.option_text}
                                </span>
                              </div>
                              {showResults && (
                                <span className={`font-semibold ${isSelected ? "text-red-500" : isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                                  {option.percentage}%
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      <div className={`flex items-center justify-between pt-2 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                        <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                        <span>{getPollTimeRemaining()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image */}
                {post.image_url && (
                  <div className="mt-4">
                    <img
                      src={post.image_url}
                      alt="Post image"
                      className="rounded-xl max-h-[500px] w-full object-cover"
                    />
                  </div>
                )}

                {/* Achievement Badge */}
                {post.post_type === "achievement" && post.achievement_type && (
                  <div className={`mt-4 p-4 rounded-xl ${isDarkTheme ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/30" : "bg-gradient-to-r from-yellow-50 to-orange-50"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">🏆</span>
                      <span className={`font-semibold ${isDarkTheme ? "text-yellow-400" : "text-yellow-700"}`}>
                        Achievement Unlocked!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              {(reactionCount > 0 || post.comment_count > 0) && (
                <div className={`px-4 sm:px-6 py-3 flex items-center justify-between text-sm border-t ${isDarkTheme ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}>
                  <div className="flex items-center gap-1">
                    {reactionCount > 0 && (
                      <>
                        <span>🔥</span>
                        <span>{reactionCount} reaction{reactionCount !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
                  {comments.length > 0 && (
                    <span>{comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)} comment{comments.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className={`px-4 sm:px-6 py-3 border-t flex items-center gap-2 ${isDarkTheme ? "border-slate-800" : "border-slate-100"}`}>
                {/* Reaction Button */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    onMouseEnter={() => setShowReactions(true)}
                    className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      currentReaction
                        ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                        : isDarkTheme
                          ? "hover:bg-slate-800 text-slate-400"
                          : "hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {currentReactionEmoji || (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    )}
                    {currentReaction ? REACTIONS.find(r => r.type === currentReaction)?.label : "React"}
                  </button>

                  {showReactions && (
                    <div
                      className={`absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-xl shadow-lg border z-10 ${isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                      onMouseLeave={() => setShowReactions(false)}
                    >
                      {REACTIONS.map(reaction => (
                        <button
                          key={reaction.type}
                          onClick={() => handleReaction(reaction.type)}
                          className={`p-2 text-xl hover:scale-125 transition-transform ${currentReaction === reaction.type ? "bg-red-100 dark:bg-red-900/30 rounded-lg" : ""}`}
                          title={reaction.label}
                        >
                          {reaction.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isDarkTheme
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>

                {/* Bookmark Button */}
                <button
                  onClick={handleBookmark}
                  disabled={bookmarkLoading || !userEmail}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    bookmarkLoading
                      ? "opacity-50 cursor-not-allowed"
                      : bookmarked
                        ? isDarkTheme
                          ? "bg-red-900/20 text-red-400 hover:bg-red-900/30"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                        : isDarkTheme
                          ? "hover:bg-slate-800 text-slate-400"
                          : "hover:bg-slate-100 text-slate-600"
                  }`}
                  title={bookmarked ? "Remove bookmark" : "Save post"}
                >
                  {bookmarkLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  ) : bookmarked ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="p-4 sm:p-6">
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Comments ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
                </h2>

                {/* Add Comment */}
                {userEmail && (
                  <div className="flex gap-3 mb-6">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                        {session?.user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={2}
                        className={`w-full px-4 py-3 rounded-xl border resize-none ${
                          isDarkTheme
                            ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                            : "bg-slate-50 border-slate-200 placeholder-slate-400"
                        } focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => submitComment()}
                          disabled={!newComment.trim() || submittingComment}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingComment ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className={`text-center py-8 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="space-y-3">
                        {/* Main Comment */}
                        <div className="flex gap-3">
                          <Link href={`/u/${comment.author.username || comment.author_email.split("@")[0]}`}>
                            {comment.author.image ? (
                              <img src={comment.author.image} alt="" className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                                {comment.author.name?.charAt(0) || "U"}
                              </div>
                            )}
                          </Link>
                          <div className="flex-1">
                            <div className={`px-4 py-3 rounded-xl ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Link
                                  href={`/u/${comment.author.username || comment.author_email.split("@")[0]}`}
                                  className={`font-semibold text-sm hover:underline ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                                >
                                  {comment.author.name}
                                </Link>
                                {comment.author.tier && (
                                  <span className={`text-xs ${TIER_COLORS[comment.author.tier]}`}>
                                    {comment.author.tier === "verified" ? "✓" : ""}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                                {comment.content}
                              </p>
                            </div>
                            <div className={`flex items-center gap-4 mt-1 px-2 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                              <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                              {userEmail && (
                                <button
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="font-medium hover:underline"
                                >
                                  Reply
                                </button>
                              )}
                            </div>

                            {/* Reply Input */}
                            {replyingTo === comment.id && userEmail && (
                              <div className="mt-3 flex gap-2">
                                <input
                                  type="text"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && submitComment(comment.id)}
                                  placeholder={`Reply to ${comment.author.name}...`}
                                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                    isDarkTheme
                                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                                      : "bg-white border-slate-200 placeholder-slate-400"
                                  } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                                />
                                <button
                                  onClick={() => submitComment(comment.id)}
                                  disabled={!replyContent.trim() || submittingComment}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                  Reply
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-12 space-y-3">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex gap-3">
                                <Link href={`/u/${reply.author.username || reply.author_email.split("@")[0]}`}>
                                  {reply.author.image ? (
                                    <img src={reply.author.image} alt="" className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                                      {reply.author.name?.charAt(0) || "U"}
                                    </div>
                                  )}
                                </Link>
                                <div className="flex-1">
                                  <div className={`px-4 py-2 rounded-xl ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Link
                                        href={`/u/${reply.author.username || reply.author_email.split("@")[0]}`}
                                        className={`font-semibold text-sm hover:underline ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                                      >
                                        {reply.author.name}
                                      </Link>
                                    </div>
                                    <p className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                                      {reply.content}
                                    </p>
                                  </div>
                                  <div className={`mt-1 px-2 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Related Posts */}
          <div className="space-y-6">
            {/* Author Card */}
            <div className={`rounded-2xl shadow-sm border p-4 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>About the Author</h3>
              <Link href={`/u/${post.author.username || post.author_email.split("@")[0]}`} className="flex items-center gap-3">
                {post.author.image ? (
                  <img src={post.author.image} alt={post.author.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-red-900/50" : "bg-red-100"}`}>
                    <span className="text-red-600 font-semibold">{post.author.name?.charAt(0) || "U"}</span>
                  </div>
                )}
                <div>
                  <p className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{post.author.name}</p>
                  {post.author.school && (
                    <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{post.author.school}</p>
                  )}
                </div>
              </Link>
              {post.author.bio && (
                <p className={`mt-3 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>{post.author.bio}</p>
              )}
              <Link
                href={`/u/${post.author.username || post.author_email.split("@")[0]}`}
                className={`mt-3 block w-full text-center py-2 rounded-lg font-medium border transition-colors ${
                  isDarkTheme
                    ? "border-slate-700 text-white hover:bg-slate-800"
                    : "border-slate-200 text-slate-900 hover:bg-slate-50"
                }`}
              >
                View Profile
              </Link>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className={`rounded-2xl shadow-sm border p-4 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Related Posts</h3>
                <div className="space-y-3">
                  {relatedPosts.map(relatedPost => (
                    <Link
                      key={relatedPost.id}
                      href={`/post/${relatedPost.id}`}
                      className={`block p-3 rounded-xl transition-colors ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {relatedPost.author.image ? (
                          <img src={relatedPost.author.image} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                            {relatedPost.author.name?.charAt(0)}
                          </div>
                        )}
                        <span className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                          {relatedPost.author.name}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                        {relatedPost.content}
                      </p>
                      <div className={`flex items-center gap-3 mt-2 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                        <span>🔥 {relatedPost.reaction_count}</span>
                        <span>💬 {relatedPost.comment_count}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowShareModal(false)}></div>
          <div className={`relative w-full max-w-md rounded-2xl p-6 ${isDarkTheme ? "bg-slate-900" : "bg-white"} shadow-xl`}>
            <button
              onClick={() => setShowShareModal(false)}
              className={`absolute top-4 right-4 p-1 rounded-full ${isDarkTheme ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              Share Post
            </h3>
            <div className={`p-3 rounded-xl mb-4 ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
              <p className={`text-sm break-all ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
            </div>
            <button
              onClick={copyLink}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
