"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  userEmail: string;
  userName: string;
  userImage?: string;
  onPostCreated: (post: any) => void;
}

export default function CreatePost({ userEmail, userName, userImage, onPostCreated }: Props) {
  const { isDarkTheme } = useTheme();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_email: userEmail,
          content: content.trim(),
          image_url: imageUrl || null,
          post_type: imageUrl ? "image" : "text",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Enrich post with author info for immediate display
        const enrichedPost = {
          ...data.post,
          author: {
            email: userEmail,
            name: userName,
            image: userImage,
          },
          userReaction: null,
        };
        onPostCreated(enrichedPost);
        setContent("");
        setImageUrl("");
        setShowImageInput(false);
        setIsExpanded(false);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        {userImage ? (
          <img
            src={userImage}
            alt={userName}
            className="w-10 h-10 rounded-full flex-shrink-0"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
            <span className="text-red-600 font-semibold">
              {userName?.charAt(0) || "U"}
            </span>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's on your mind? Share your internship journey..."
            rows={isExpanded ? 3 : 1}
            className={`w-full resize-none border-0 focus:ring-0 bg-transparent ${
              isDarkTheme ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
            }`}
          />

          {/* Image URL Input */}
          {showImageInput && (
            <div className="mt-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkTheme
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              {imageUrl && (
                <div className="mt-2 relative">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-40 rounded-lg"
                    onError={() => setImageUrl("")}
                  />
                  <button
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImageInput(!showImageInput)}
                  className={`p-2 rounded-lg transition-colors ${
                    showImageInput
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                      : isDarkTheme
                        ? 'hover:bg-slate-800 text-slate-400'
                        : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  title="Add image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  title="Add hashtag"
                  onClick={() => {
                    setContent(prev => prev + " #");
                    textareaRef.current?.focus();
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  title="Mention someone"
                  onClick={() => {
                    setContent(prev => prev + " @");
                    textareaRef.current?.focus();
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs ${content.length > 500 ? 'text-red-500' : isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  {content.length}/500
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || content.length > 500 || isPosting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
