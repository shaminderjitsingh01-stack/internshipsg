"use client";

import { useState, useEffect } from "react";

interface Props {
  userEmail: string;
  totalInterviews: number;
  averageScore: number;
  currentStreak: number;
  totalActivities: number;
}

export default function ConfidenceMeter({
  userEmail,
  totalInterviews,
  averageScore,
  currentStreak,
  totalActivities,
}: Props) {
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [level, setLevel] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Calculate confidence score based on multiple factors
    let score = 0;

    // Interview count (max 30 points)
    score += Math.min(totalInterviews * 5, 30);

    // Average score (max 30 points)
    score += Math.min((averageScore / 10) * 30, 30);

    // Streak bonus (max 20 points)
    score += Math.min(currentStreak * 2, 20);

    // Total activities (max 20 points)
    score += Math.min(totalActivities * 2, 20);

    setConfidenceScore(Math.round(score));

    // Set level and message based on score
    if (score >= 80) {
      setLevel("Interview Ready");
      setMessage("You're fully prepared! Go crush that interview! 🎯");
    } else if (score >= 60) {
      setLevel("Confident");
      setMessage("You're on track! A few more practice sessions and you'll be unstoppable.");
    } else if (score >= 40) {
      setLevel("Building Up");
      setMessage("Good progress! Keep practicing to boost your confidence.");
    } else if (score >= 20) {
      setLevel("Getting Started");
      setMessage("You've begun your journey. Consistency is key!");
    } else {
      setLevel("Just Starting");
      setMessage("Start practicing to build your interview confidence!");
    }
  }, [totalInterviews, averageScore, currentStreak, totalActivities]);

  const getColor = () => {
    if (confidenceScore >= 80) return { bg: "bg-green-500", text: "text-green-600", light: "bg-green-100" };
    if (confidenceScore >= 60) return { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-100" };
    if (confidenceScore >= 40) return { bg: "bg-yellow-500", text: "text-yellow-600", light: "bg-yellow-100" };
    if (confidenceScore >= 20) return { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-100" };
    return { bg: "bg-slate-400", text: "text-slate-600", light: "bg-slate-100" };
  };

  const colors = getColor();

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">📊</span> Interview Confidence
        </h3>
        <span className={`px-2 sm:px-3 py-1 ${colors.light} ${colors.text} rounded-full text-xs sm:text-sm font-medium`}>
          {level}
        </span>
      </div>

      {/* Circular Progress */}
      <div className="flex justify-center mb-4">
        <div className="relative w-28 h-28 sm:w-36 sm:h-36">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={colors.text}
              strokeDasharray={`${confidenceScore * 2.83} 283`}
              style={{ transition: "stroke-dasharray 1s ease-in-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl sm:text-4xl font-bold ${colors.text}`}>{confidenceScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-slate-600 mb-4">{message}</p>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-slate-50 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-lg sm:text-xl font-bold text-slate-900">{totalInterviews}</p>
          <p className="text-xs text-slate-500">Interviews</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-lg sm:text-xl font-bold text-slate-900">{averageScore.toFixed(1)}</p>
          <p className="text-xs text-slate-500">Avg Score</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-lg sm:text-xl font-bold text-slate-900">{currentStreak}</p>
          <p className="text-xs text-slate-500">Day Streak</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-lg sm:text-xl font-bold text-slate-900">{totalActivities}</p>
          <p className="text-xs text-slate-500">Activities</p>
        </div>
      </div>
    </div>
  );
}
