"use client";

import { useState } from "react";
import Link from "next/link";
import { InterviewQuestion } from "@/data/interviewQuestions";

interface QuestionCardProps {
  question: InterviewQuestion;
  isDarkTheme: boolean;
  onBookmark?: (questionId: number) => void;
  isBookmarked?: boolean;
}

export default function QuestionCard({
  question,
  isDarkTheme,
  onBookmark,
  isBookmarked = false
}: QuestionCardProps) {
  const [showTips, setShowTips] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return isDarkTheme
          ? "bg-green-900/50 text-green-400 border-green-800"
          : "bg-green-100 text-green-700 border-green-200";
      case "Medium":
        return isDarkTheme
          ? "bg-yellow-900/50 text-yellow-400 border-yellow-800"
          : "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Hard":
        return isDarkTheme
          ? "bg-red-900/50 text-red-400 border-red-800"
          : "bg-red-100 text-red-700 border-red-200";
      default:
        return isDarkTheme
          ? "bg-slate-800 text-slate-400 border-slate-700"
          : "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Behavioral":
        return isDarkTheme
          ? "bg-blue-900/50 text-blue-400"
          : "bg-blue-100 text-blue-700";
      case "Technical":
        return isDarkTheme
          ? "bg-purple-900/50 text-purple-400"
          : "bg-purple-100 text-purple-700";
      case "Case Study":
        return isDarkTheme
          ? "bg-orange-900/50 text-orange-400"
          : "bg-orange-100 text-orange-700";
      case "Situational":
        return isDarkTheme
          ? "bg-teal-900/50 text-teal-400"
          : "bg-teal-100 text-teal-700";
      default:
        return isDarkTheme
          ? "bg-slate-800 text-slate-400"
          : "bg-slate-100 text-slate-600";
    }
  };

  const getIndustryColor = (industry: string) => {
    if (industry === "General") {
      return isDarkTheme
        ? "bg-slate-800 text-slate-400"
        : "bg-slate-100 text-slate-600";
    }
    return isDarkTheme
      ? "bg-indigo-900/50 text-indigo-400"
      : "bg-indigo-100 text-indigo-700";
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    if (onBookmark) {
      onBookmark(question.id);
    }
    // Save to localStorage
    const savedBookmarks = JSON.parse(localStorage.getItem("bookmarkedQuestions") || "[]");
    if (bookmarked) {
      const newBookmarks = savedBookmarks.filter((id: number) => id !== question.id);
      localStorage.setItem("bookmarkedQuestions", JSON.stringify(newBookmarks));
    } else {
      savedBookmarks.push(question.id);
      localStorage.setItem("bookmarkedQuestions", JSON.stringify(savedBookmarks));
    }
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all hover:shadow-lg ${
        isDarkTheme
          ? "bg-slate-900 border-slate-800 hover:border-slate-700"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Header with badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
          {question.category}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty}
        </span>
        {question.industry !== "General" && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getIndustryColor(question.industry)}`}>
            {question.industry}
          </span>
        )}
        {question.company && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            isDarkTheme ? "bg-pink-900/50 text-pink-400" : "bg-pink-100 text-pink-700"
          }`}>
            {question.company}
          </span>
        )}
      </div>

      {/* Question text */}
      <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
        {question.question}
      </h3>

      {/* Tips section */}
      <div className="mb-4">
        <button
          onClick={() => setShowTips(!showTips)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            isDarkTheme
              ? "text-slate-400 hover:text-slate-300"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${showTips ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showTips ? "Hide Tips" : `Show ${question.tips.length} Tips`}
        </button>

        {showTips && (
          <div className={`mt-3 p-4 rounded-lg ${
            isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"
          }`}>
            <ul className="space-y-2">
              {question.tips.map((tip, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-2 text-sm ${
                    isDarkTheme ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <span className="text-yellow-500 mt-0.5">*</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-dashed ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}">
        <Link
          href={`/?start=interview&question=${encodeURIComponent(question.question)}`}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            isDarkTheme
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Practice This
        </Link>

        <button
          onClick={handleBookmark}
          className={`p-2.5 rounded-lg transition-all ${
            bookmarked
              ? "bg-yellow-500 text-white"
              : isDarkTheme
                ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-yellow-500"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-yellow-500"
          }`}
          title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
        >
          <svg className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
