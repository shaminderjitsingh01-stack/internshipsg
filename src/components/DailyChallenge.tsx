"use client";

import { useState, useEffect } from "react";

interface Challenge {
  id: string;
  question: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tips: string[];
}

interface Props {
  userEmail: string;
  onComplete?: (xpEarned: number) => void;
}

export default function DailyChallenge({ userEmail, onComplete }: Props) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [userEmail]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/daily-challenge?email=${encodeURIComponent(userEmail)}`
      );
      if (res.ok) {
        const data = await res.json();
        setChallenge(data.challenge);
        setCompleted(data.completed);
        setXpEarned(data.xpEarned || 0);
        if (data.feedback) {
          setFeedback(data.feedback);
        }
      }
    } catch (err) {
      console.error("Failed to fetch daily challenge:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim() || userAnswer.length < 100) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/daily-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          answer: userAnswer,
          challengeId: challenge?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback);
        setCompleted(true);
        setXpEarned(data.xpAwarded || 20);
        if (onComplete) {
          onComplete(data.xpAwarded || 20);
        }
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDifficultyXP = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return 15;
      case "Medium":
        return 20;
      case "Hard":
        return 30;
      default:
        return 20;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200">
        <div className="animate-pulse">
          <div className="h-6 bg-purple-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-purple-200 rounded mb-4"></div>
          <div className="h-10 bg-purple-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">
              Daily Challenge Complete!
            </h3>
            <p className="text-sm text-green-700">
              You earned {xpEarned} XP. Come back tomorrow for a new challenge!
            </p>
          </div>
        </div>

        {challenge && (
          <div className="bg-white/50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-green-800 mb-2">
              Today's Question:
            </p>
            <p className="text-green-900">{challenge.question}</p>
          </div>
        )}

        {feedback && (
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
              <span>🤖</span> AI Feedback
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {feedback}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
        <p className="text-slate-600">No challenge available today.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Daily Challenge</h3>
            <p className="text-sm text-purple-700">
              Complete for +{getDifficultyXP(challenge.difficulty)} XP bonus!
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
              challenge.difficulty
            )}`}
          >
            {challenge.difficulty}
          </span>
          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            {challenge.category}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <p className="text-lg font-medium text-slate-900">{challenge.question}</p>
      </div>

      {/* Tips toggle */}
      {challenge.tips && challenge.tips.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>💡</span> {showTips ? "Hide tips" : "Show tips"}
          </button>
          {showTips && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <ul className="space-y-1">
                {challenge.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-yellow-800 flex gap-2">
                    <span className="text-yellow-600">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Answer input */}
      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Type your detailed answer here... (minimum 100 characters for AI feedback)"
        className="w-full min-h-[150px] p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y text-sm sm:text-base"
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-slate-500">
          {userAnswer.length}/100 characters minimum
        </span>
        <button
          onClick={handleSubmit}
          disabled={userAnswer.length < 100 || isSubmitting}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Getting Feedback...
            </>
          ) : (
            <>Submit & Get AI Feedback</>
          )}
        </button>
      </div>
    </div>
  );
}
