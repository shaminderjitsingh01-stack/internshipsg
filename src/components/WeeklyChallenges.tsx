"use client";

import { useState, useEffect } from "react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  type: "interviews" | "questions" | "streak" | "resume" | "cover_letter";
  reward: string;
  icon: string;
}

// Rotating weekly challenges
const WEEKLY_CHALLENGES: Challenge[] = [
  { id: "complete-3-interviews", title: "Interview Champion", description: "Complete 3 mock interviews this week", target: 3, type: "interviews", reward: "🏅 Champion Badge", icon: "🎙️" },
  { id: "5-day-streak", title: "Consistency King", description: "Maintain a 5-day streak", target: 5, type: "streak", reward: "👑 Streak Master", icon: "🔥" },
  { id: "answer-10-questions", title: "Quick Thinker", description: "Answer 10 daily questions", target: 10, type: "questions", reward: "💡 Quick Thinker Badge", icon: "💬" },
  { id: "improve-resume", title: "Resume Revamp", description: "Analyze your resume and improve based on feedback", target: 1, type: "resume", reward: "📄 Resume Pro", icon: "📝" },
  { id: "craft-cover-letter", title: "Cover Letter Craftsman", description: "Create or analyze a cover letter", target: 1, type: "cover_letter", reward: "✉️ Letter Master", icon: "✍️" },
];

interface Props {
  userEmail: string;
  totalInterviews: number;
  currentStreak: number;
}

export default function WeeklyChallenges({ userEmail, totalInterviews, currentStreak }: Props) {
  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, number>>({});
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());

  // Get current week number
  const getWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  };

  // Get 3 challenges for this week
  const getCurrentChallenges = () => {
    const weekNum = getWeekNumber();
    const startIdx = (weekNum * 3) % WEEKLY_CHALLENGES.length;
    const challenges: Challenge[] = [];
    for (let i = 0; i < 3; i++) {
      challenges.push(WEEKLY_CHALLENGES[(startIdx + i) % WEEKLY_CHALLENGES.length]);
    }
    return challenges;
  };

  const currentChallenges = getCurrentChallenges();

  // Load saved progress
  useEffect(() => {
    const weekKey = `challenges_week_${getWeekNumber()}_${userEmail}`;
    const saved = localStorage.getItem(weekKey);
    if (saved) {
      const data = JSON.parse(saved);
      setWeeklyProgress(data.progress || {});
      setCompletedChallenges(new Set(data.completed || []));
    }
  }, [userEmail]);

  // Calculate progress for each challenge type
  useEffect(() => {
    const newProgress: Record<string, number> = {};

    currentChallenges.forEach(challenge => {
      switch (challenge.type) {
        case "interviews":
          // Check interviews done this week
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          newProgress[challenge.id] = Math.min(totalInterviews, challenge.target);
          break;
        case "streak":
          newProgress[challenge.id] = Math.min(currentStreak, challenge.target);
          break;
        case "questions":
          const qotdCount = parseInt(localStorage.getItem(`qotd_count_${userEmail}`) || "0");
          newProgress[challenge.id] = Math.min(qotdCount, challenge.target);
          break;
        default:
          newProgress[challenge.id] = weeklyProgress[challenge.id] || 0;
      }
    });

    setWeeklyProgress(newProgress);

    // Save progress
    const weekKey = `challenges_week_${getWeekNumber()}_${userEmail}`;
    localStorage.setItem(weekKey, JSON.stringify({
      progress: newProgress,
      completed: [...completedChallenges],
    }));
  }, [totalInterviews, currentStreak, userEmail]);

  // Check for newly completed challenges
  useEffect(() => {
    const newCompleted = new Set(completedChallenges);
    let hasNewCompletions = false;

    currentChallenges.forEach(challenge => {
      if (weeklyProgress[challenge.id] >= challenge.target && !completedChallenges.has(challenge.id)) {
        newCompleted.add(challenge.id);
        hasNewCompletions = true;
      }
    });

    if (hasNewCompletions) {
      setCompletedChallenges(newCompleted);
    }
  }, [weeklyProgress]);

  // Days remaining in the week
  const getDaysRemaining = () => {
    const now = new Date();
    const daysUntilSunday = 7 - now.getDay();
    return daysUntilSunday === 7 ? 0 : daysUntilSunday;
  };

  const completedCount = currentChallenges.filter(c => completedChallenges.has(c.id)).length;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-purple-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">🎯</span> Weekly Challenges
        </h3>
        <div className="text-right">
          <span className="text-xs text-purple-600">{getDaysRemaining()} days left</span>
          <p className="text-xs text-purple-500">{completedCount}/3 complete</p>
        </div>
      </div>

      <div className="space-y-3">
        {currentChallenges.map(challenge => {
          const progress = weeklyProgress[challenge.id] || 0;
          const isCompleted = completedChallenges.has(challenge.id);
          const progressPercent = Math.min((progress / challenge.target) * 100, 100);

          return (
            <div
              key={challenge.id}
              className={`bg-white rounded-xl p-3 sm:p-4 ${isCompleted ? "border-2 border-green-400" : "border border-slate-200"}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{challenge.icon}</span>
                  <div>
                    <p className={`font-medium text-sm ${isCompleted ? "text-green-700" : "text-slate-900"}`}>
                      {challenge.title}
                      {isCompleted && <span className="ml-2">✅</span>}
                    </p>
                    <p className="text-xs text-slate-500">{challenge.description}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  {challenge.reward}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{progress}/{challenge.target}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-purple-500"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completedCount === 3 && (
        <div className="mt-4 p-3 bg-green-100 rounded-xl text-center">
          <p className="text-green-800 font-semibold text-sm">🎉 All challenges complete!</p>
          <p className="text-green-600 text-xs mt-1">You're a true champion this week!</p>
        </div>
      )}
    </div>
  );
}
