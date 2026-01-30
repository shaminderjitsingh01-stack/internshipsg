"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Story {
  id: string;
  content: string | null;
  media_url: string | null;
  background_color: string;
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
  userEmail: string;
  onStoryClick: (group: StoryGroup, index: number) => void;
  onAddStory: () => void;
}

export default function StoriesBar({ userEmail, onStoryClick, onAddStory }: Props) {
  const { isDarkTheme } = useTheme();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch(`/api/stories?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setStoryGroups(data.storyGroups || []);
        }
      } catch (error) {
        console.error("Failed to fetch stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [userEmail]);

  if (loading) {
    return (
      <div className={`flex gap-4 p-4 overflow-x-auto ${isDarkTheme ? "bg-slate-900" : "bg-white"} rounded-2xl`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={`w-16 h-16 rounded-full animate-pulse ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`} />
            <div className={`w-12 h-3 rounded animate-pulse ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`} />
          </div>
        ))}
      </div>
    );
  }

  const currentUserGroup = storyGroups.find(g => g.isCurrentUser);
  const otherGroups = storyGroups.filter(g => !g.isCurrentUser);

  return (
    <div className={`flex gap-4 p-4 overflow-x-auto ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} rounded-2xl border shadow-sm`}>
      {/* Add Story Button (always first) */}
      <button
        onClick={onAddStory}
        className="flex flex-col items-center gap-2 flex-shrink-0"
      >
        <div className="relative">
          {currentUserGroup?.author?.image_url ? (
            <img
              src={currentUserGroup.author.image_url}
              alt="Your story"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
              <span className="text-xl">
                {currentUserGroup?.author?.name?.charAt(0) || "Y"}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        <span className={`text-xs truncate w-16 text-center ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
          Your Story
        </span>
      </button>

      {/* Current User's Stories (if any) */}
      {currentUserGroup && currentUserGroup.stories.length > 0 && (
        <button
          onClick={() => onStoryClick(currentUserGroup, 0)}
          className="flex flex-col items-center gap-2 flex-shrink-0"
        >
          <div className={`p-0.5 rounded-full ${currentUserGroup.hasUnviewed ? "bg-gradient-to-tr from-red-500 to-orange-500" : isDarkTheme ? "bg-slate-600" : "bg-slate-300"}`}>
            <div className={`p-0.5 rounded-full ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}>
              {currentUserGroup.author?.image_url ? (
                <img
                  src={currentUserGroup.author.image_url}
                  alt={currentUserGroup.author.name || "Story"}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                  <span className="text-lg">
                    {currentUserGroup.author?.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <span className={`text-xs truncate w-16 text-center ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
            {currentUserGroup.stories.length} stories
          </span>
        </button>
      )}

      {/* Other Users' Stories */}
      {otherGroups.map((group) => (
        <button
          key={group.authorEmail}
          onClick={() => onStoryClick(group, 0)}
          className="flex flex-col items-center gap-2 flex-shrink-0"
        >
          <div className={`p-0.5 rounded-full ${group.hasUnviewed ? "bg-gradient-to-tr from-red-500 to-orange-500" : isDarkTheme ? "bg-slate-600" : "bg-slate-300"}`}>
            <div className={`p-0.5 rounded-full ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}>
              {group.author?.image_url ? (
                <img
                  src={group.author.image_url}
                  alt={group.author.name || "Story"}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                  <span className="text-lg">
                    {group.author?.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <span className={`text-xs truncate w-16 text-center ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
            {group.author?.name?.split(" ")[0] || "User"}
          </span>
        </button>
      ))}

      {/* Empty state if no stories */}
      {storyGroups.length === 0 && (
        <div className={`flex items-center justify-center py-4 px-8 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
          <p className="text-sm">No stories yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}
