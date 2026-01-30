"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  userEmail: string;
  onClose: () => void;
  onStoryCreated: () => void;
}

const BACKGROUND_COLORS = [
  "#dc2626", // red
  "#ea580c", // orange
  "#ca8a04", // yellow
  "#16a34a", // green
  "#0891b2", // cyan
  "#2563eb", // blue
  "#7c3aed", // purple
  "#db2777", // pink
  "#1e293b", // slate
  "#000000", // black
];

export default function CreateStoryModal({ userEmail, onClose, onStoryCreated }: Props) {
  const { isDarkTheme } = useTheme();
  const [content, setContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#dc2626");
  const [textColor, setTextColor] = useState("#ffffff");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [storyType, setStoryType] = useState<"text" | "media">("text");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (storyType === "text" && !content.trim()) {
      setError("Please enter some text for your story");
      return;
    }

    if (storyType === "media" && !mediaUrl.trim()) {
      setError("Please enter a media URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_email: userEmail,
          content: storyType === "text" ? content : null,
          media_url: storyType === "media" ? mediaUrl : null,
          media_type: storyType === "media" ? mediaType : null,
          background_color: backgroundColor,
          text_color: textColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create story");
      }

      onStoryCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl shadow-xl ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkTheme ? "border-slate-700" : "border-slate-200"}`}>
          <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Create Story
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkTheme ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Story type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStoryType("text")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                storyType === "text"
                  ? "bg-red-600 text-white"
                  : isDarkTheme
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Text Story
            </button>
            <button
              type="button"
              onClick={() => setStoryType("media")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                storyType === "media"
                  ? "bg-red-600 text-white"
                  : isDarkTheme
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Media Story
            </button>
          </div>

          {/* Preview */}
          <div
            className="w-full h-64 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor }}
          >
            {storyType === "text" ? (
              <p
                className="text-xl font-bold text-center px-4"
                style={{ color: textColor }}
              >
                {content || "Your story preview"}
              </p>
            ) : mediaUrl ? (
              mediaType === "video" ? (
                <video src={mediaUrl} className="w-full h-full object-contain" />
              ) : (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-contain" />
              )
            ) : (
              <p className="text-white/50">Media preview will appear here</p>
            )}
          </div>

          {storyType === "text" ? (
            <>
              {/* Text input */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={200}
                className={`w-full p-3 rounded-xl resize-none border transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
                rows={3}
              />

              {/* Background color picker */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Background Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        backgroundColor === color ? "ring-2 ring-offset-2 ring-red-500 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Text color toggle */}
              <div className="flex items-center gap-4">
                <label className={`text-sm font-medium ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Text Color:
                </label>
                <button
                  type="button"
                  onClick={() => setTextColor("#ffffff")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    textColor === "#ffffff"
                      ? "bg-slate-900 text-white ring-2 ring-red-500"
                      : isDarkTheme
                        ? "bg-slate-800 text-white"
                        : "bg-slate-200 text-slate-900"
                  }`}
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => setTextColor("#000000")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    textColor === "#000000"
                      ? "bg-white text-black ring-2 ring-red-500"
                      : isDarkTheme
                        ? "bg-slate-800 text-white"
                        : "bg-slate-200 text-slate-900"
                  }`}
                >
                  Black
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Media URL input */}
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Enter image or video URL"
                className={`w-full p-3 rounded-xl border transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />

              {/* Media type toggle */}
              <div className="flex items-center gap-4">
                <label className={`text-sm font-medium ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Media Type:
                </label>
                <button
                  type="button"
                  onClick={() => setMediaType("image")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    mediaType === "image"
                      ? "bg-red-600 text-white"
                      : isDarkTheme
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("video")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    mediaType === "video"
                      ? "bg-red-600 text-white"
                      : isDarkTheme
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  Video
                </button>
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              isSubmitting
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </span>
            ) : (
              "Share Story"
            )}
          </button>

          <p className={`text-xs text-center ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
            Stories disappear after 24 hours
          </p>
        </form>
      </div>
    </div>
  );
}
