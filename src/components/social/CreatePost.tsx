"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  userEmail: string;
  userName: string;
  userImage?: string;
  onPostCreated: (post: any) => void;
}

type PollDuration = 1 | 3 | 7;

export default function CreatePost({ userEmail, userName, userImage, onPostCreated }: Props) {
  const { isDarkTheme } = useTheme();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Poll state
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState<PollDuration>(1);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    // Validate poll if in poll mode
    if (isPollMode) {
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert("Please add at least 2 poll options");
        return;
      }
    }

    setIsPosting(true);
    try {
      if (isPollMode) {
        // Create poll post
        const validOptions = pollOptions.filter(opt => opt.trim());
        const res = await fetch("/api/social/polls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author_email: userEmail,
            content: content.trim(),
            options: validOptions,
            duration: pollDuration,
          }),
        });

        if (res.ok) {
          const data = await res.json();
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
          resetForm();
        }
      } else {
        // Create regular post
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
          resetForm();
        }
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setImageUrl("");
    setShowImageInput(false);
    setIsExpanded(false);
    setIsPollMode(false);
    setPollOptions(["", ""]);
    setPollDuration(1);
  };

  const togglePollMode = () => {
    setIsPollMode(!isPollMode);
    setShowImageInput(false);
    setImageUrl("");
    if (!isPollMode) {
      setPollOptions(["", ""]);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
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
            placeholder={isPollMode ? "Ask a question..." : "What's on your mind? Share your internship journey..."}
            rows={isExpanded ? 3 : 1}
            className={`w-full resize-none border-0 focus:ring-0 bg-transparent ${
              isDarkTheme ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
            }`}
          />

          {/* Image URL Input */}
          {showImageInput && !isPollMode && (
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

          {/* Poll Options */}
          {isPollMode && isExpanded && (
            <div className="mt-3 space-y-2">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    maxLength={80}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      isDarkTheme
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 4 && (
                <button
                  onClick={addPollOption}
                  className={`w-full py-2 rounded-lg border-2 border-dashed text-sm font-medium transition-colors ${
                    isDarkTheme
                      ? 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                      : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
                  }`}
                >
                  + Add Option
                </button>
              )}

              {/* Poll Duration */}
              <div className="flex items-center gap-2 pt-2">
                <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Poll duration:
                </span>
                <div className="flex gap-1">
                  {([1, 3, 7] as PollDuration[]).map((days) => (
                    <button
                      key={days}
                      onClick={() => setPollDuration(days)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        pollDuration === days
                          ? 'bg-red-600 text-white'
                          : isDarkTheme
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {days} day{days > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowImageInput(!showImageInput);
                    setIsPollMode(false);
                  }}
                  disabled={isPollMode}
                  className={`p-2 rounded-lg transition-colors ${
                    showImageInput
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                      : isPollMode
                        ? 'opacity-50 cursor-not-allowed text-slate-400'
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
                  onClick={togglePollMode}
                  className={`p-2 rounded-lg transition-colors ${
                    isPollMode
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                      : isDarkTheme
                        ? 'hover:bg-slate-800 text-slate-400'
                        : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  title="Create poll"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                  disabled={!content.trim() || content.length > 500 || isPosting || (isPollMode && pollOptions.filter(o => o.trim()).length < 2)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Posting...
                    </>
                  ) : isPollMode ? (
                    "Create Poll"
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
