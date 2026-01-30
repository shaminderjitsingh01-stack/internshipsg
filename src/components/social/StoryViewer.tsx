"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Story {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: string;
  background_color: string;
  text_color: string;
  view_count: number;
  created_at: string;
  isViewed: boolean;
}

interface StoryGroup {
  authorEmail: string;
  author: {
    email: string;
    username: string | null;
    name: string | null;
    image_url: string | null;
  } | null;
  stories: Story[];
  hasUnviewed: boolean;
  isCurrentUser: boolean;
}

interface Props {
  group: StoryGroup;
  initialIndex: number;
  currentUserEmail: string;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export default function StoryViewer({ group, initialIndex, currentUserEmail, onClose, onStoryViewed }: Props) {
  const { isDarkTheme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = group.stories[currentIndex];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && currentUserEmail !== group.authorEmail) {
      fetch(`/api/stories/${currentStory.id}?viewer=${encodeURIComponent(currentUserEmail)}`)
        .then(() => {
          onStoryViewed?.(currentStory.id);
        })
        .catch(console.error);
    }
  }, [currentStory?.id, currentUserEmail, group.authorEmail, onStoryViewed]);

  // Progress timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < group.stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // 5 seconds total (100 / 2 = 50 ticks * 100ms = 5000ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, group.stories.length, onClose]);

  // Reset progress when changing stories
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, group.stories.length, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, onClose, isPaused]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours === 1) return "1h ago";
    return `${diffHours}h ago`;
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Story container */}
      <div className="relative w-full max-w-md h-full max-h-[90vh] mx-4">
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-40 flex gap-1">
          {group.stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-40 flex items-center gap-3">
          {group.author?.image_url ? (
            <img
              src={group.author.image_url}
              alt={group.author.name || "User"}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-semibold">
                {group.author?.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">
              {group.author?.name || "Unknown"}
            </p>
            <p className="text-white/70 text-xs">
              {formatTime(currentStory.created_at)}
            </p>
          </div>
          {isPaused && (
            <span className="text-white/70 text-xs">Paused</span>
          )}
        </div>

        {/* Story content */}
        <div
          className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: currentStory.background_color || "#dc2626" }}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.media_url ? (
            currentStory.media_type === "video" ? (
              <video
                src={currentStory.media_url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="p-8 flex items-center justify-center">
              <p
                className="text-2xl font-bold text-center"
                style={{ color: currentStory.text_color || "#ffffff" }}
              >
                {currentStory.content}
              </p>
            </div>
          )}
        </div>

        {/* Navigation areas */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-30"
          aria-label="Previous story"
        />
        <button
          onClick={goToNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-30"
          aria-label="Next story"
        />

        {/* View count (for own stories) */}
        {group.isCurrentUser && (
          <div className="absolute bottom-4 left-4 z-40 flex items-center gap-1 text-white/70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm">{currentStory.view_count || 0}</span>
          </div>
        )}
      </div>
    </div>
  );
}
