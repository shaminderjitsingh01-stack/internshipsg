"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { formatDistanceToNow } from "date-fns";

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
  achievement_data: any;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  author: Author;
  userReaction: string | null;
}

interface Props {
  post: Post;
  currentUserEmail: string;
  onDelete?: (postId: string) => void;
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

export default function PostCard({ post, currentUserEmail, onDelete }: Props) {
  const { isDarkTheme } = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(post.userReaction);
  const [reactionCount, setReactionCount] = useState(post.reaction_count);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const isOwnPost = post.author_email === currentUserEmail;

  const handleReaction = async (reactionType: string) => {
    try {
      const res = await fetch("/api/social/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          user_email: currentUserEmail,
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

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;

    try {
      const res = await fetch(`/api/social/posts?id=${post.id}&author=${currentUserEmail}`, {
        method: "DELETE",
      });

      if (res.ok && onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
    setShowMenu(false);
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/comments?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
        setShowComments(true);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          author_email: currentUserEmail,
          content: newComment.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to comment:", error);
    }
  };

  // Parse content for hashtags and mentions
  const renderContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return (
          <Link key={i} href={`/search?tag=${part.slice(1)}`} className="text-red-500 hover:underline">
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

  const currentReactionEmoji = REACTIONS.find(r => r.type === currentReaction)?.emoji;

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.author.username || post.author_email.split("@")[0]}`}>
            {post.author.image ? (
              <img
                src={post.author.image}
                alt={post.author.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                <span className="text-red-600 font-semibold">
                  {post.author.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/u/${post.author.username || post.author_email.split("@")[0]}`}
                className={`font-semibold hover:underline ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}
              >
                {post.author.name}
              </Link>
              {post.author.tier && (
                <span className={`text-xs ${TIER_COLORS[post.author.tier] || 'text-slate-400'}`}>
                  {post.author.tier === "verified" ? "✓" : post.author.tier === "elite" ? "★" : ""}
                </span>
              )}
            </div>
            <div className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              {post.author.school && `${post.author.school} · `}
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-10 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <button
                  onClick={handleDelete}
                  className={`w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl`}
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`px-4 pb-3 ${isDarkTheme ? 'text-slate-200' : 'text-slate-800'}`}>
        <p className="whitespace-pre-wrap">{renderContent(post.content)}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img
            src={post.image_url}
            alt="Post image"
            className="rounded-xl max-h-96 w-full object-cover"
          />
        </div>
      )}

      {/* Achievement Badge */}
      {post.post_type === "achievement" && post.achievement_type && (
        <div className={`mx-4 mb-3 p-3 rounded-xl ${isDarkTheme ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30' : 'bg-gradient-to-r from-yellow-50 to-orange-50'}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className={`font-medium ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-700'}`}>
              Achievement Unlocked!
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      {(reactionCount > 0 || post.comment_count > 0) && (
        <div className={`px-4 py-2 flex items-center justify-between text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex items-center gap-1">
            {reactionCount > 0 && (
              <>
                <span>🔥</span>
                <span>{reactionCount}</span>
              </>
            )}
          </div>
          {post.comment_count > 0 && (
            <button onClick={loadComments} className="hover:underline">
              {post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={`px-4 py-2 border-t flex items-center gap-2 ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
        {/* Reaction Button */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowReactions(!showReactions)}
            onMouseEnter={() => setShowReactions(true)}
            className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              currentReaction
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                : isDarkTheme
                  ? 'hover:bg-slate-800 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {currentReactionEmoji || (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            )}
            {currentReaction ? REACTIONS.find(r => r.type === currentReaction)?.label : "React"}
          </button>

          {/* Reaction Picker */}
          {showReactions && (
            <div
              className={`absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-xl shadow-lg border ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTIONS.map(reaction => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className={`p-2 text-xl hover:scale-125 transition-transform ${currentReaction === reaction.type ? 'bg-red-100 dark:bg-red-900/30 rounded-lg' : ''}`}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Button */}
        <button
          onClick={loadComments}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isDarkTheme
              ? 'hover:bg-slate-800 text-slate-400'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>

        {/* Share Button */}
        <button
          className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isDarkTheme
              ? 'hover:bg-slate-800 text-slate-400'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={`px-4 py-3 border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Comment Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="Write a comment..."
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                  }`}
                />
                <button
                  onClick={submitComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Post
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <Link href={`/u/${comment.author.username || comment.author_email.split("@")[0]}`}>
                      {comment.author.image ? (
                        <img src={comment.author.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          {comment.author.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </Link>
                    <div className={`flex-1 px-3 py-2 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <Link
                        href={`/u/${comment.author.username || comment.author_email.split("@")[0]}`}
                        className={`font-medium text-sm hover:underline ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}
                      >
                        {comment.author.name}
                      </Link>
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
