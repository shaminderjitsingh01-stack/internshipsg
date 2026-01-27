"use client";

import { useState, useEffect } from "react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string | null;
  achieved: boolean;
  type: "interview" | "streak" | "badge" | "resume" | "improvement";
}

interface Props {
  userEmail: string;
  totalInterviews: number;
  currentStreak: number;
  longestStreak: number;
  badges: { badge_id: string; unlocked_at: string }[];
  averageScore: number;
}

export default function ProgressTimeline({
  userEmail,
  totalInterviews,
  currentStreak,
  longestStreak,
  badges,
  averageScore,
}: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    const newMilestones: Milestone[] = [];

    // First Interview
    newMilestones.push({
      id: "first-interview",
      title: "First Mock Interview",
      description: "Completed your first AI mock interview",
      icon: "🎙️",
      date: totalInterviews >= 1 ? "Achieved" : null,
      achieved: totalInterviews >= 1,
      type: "interview",
    });

    // 5 Interviews
    newMilestones.push({
      id: "5-interviews",
      title: "5 Interviews Milestone",
      description: "Completed 5 mock interviews",
      icon: "🎯",
      date: totalInterviews >= 5 ? "Achieved" : null,
      achieved: totalInterviews >= 5,
      type: "interview",
    });

    // First Streak Badge (3-day)
    const hasBadge3 = badges.some(b => b.badge_id === "committed");
    newMilestones.push({
      id: "3-day-streak",
      title: "3-Day Streak",
      description: "Achieved your first 3-day streak",
      icon: "🔥",
      date: hasBadge3 ? badges.find(b => b.badge_id === "committed")?.unlocked_at?.split("T")[0] || "Achieved" : null,
      achieved: hasBadge3 || longestStreak >= 3,
      type: "streak",
    });

    // 7-day streak
    const hasBadge7 = badges.some(b => b.badge_id === "consistent");
    newMilestones.push({
      id: "7-day-streak",
      title: "7-Day Streak",
      description: "One week of consistency!",
      icon: "✨",
      date: hasBadge7 ? badges.find(b => b.badge_id === "consistent")?.unlocked_at?.split("T")[0] || "Achieved" : null,
      achieved: hasBadge7 || longestStreak >= 7,
      type: "streak",
    });

    // 10 Interviews
    newMilestones.push({
      id: "10-interviews",
      title: "10 Interviews Achieved",
      description: "You're getting serious about preparation!",
      icon: "💪",
      date: totalInterviews >= 10 ? "Achieved" : null,
      achieved: totalInterviews >= 10,
      type: "interview",
    });

    // 14-day streak
    const hasBadge14 = badges.some(b => b.badge_id === "dedicated");
    newMilestones.push({
      id: "14-day-streak",
      title: "14-Day Streak",
      description: "Two weeks of dedication!",
      icon: "⭐",
      date: hasBadge14 ? badges.find(b => b.badge_id === "dedicated")?.unlocked_at?.split("T")[0] || "Achieved" : null,
      achieved: hasBadge14 || longestStreak >= 14,
      type: "streak",
    });

    // High score milestone
    newMilestones.push({
      id: "high-score",
      title: "Average Score 7+",
      description: "Maintained average interview score above 7",
      icon: "🏆",
      date: averageScore >= 7 ? "Achieved" : null,
      achieved: averageScore >= 7,
      type: "improvement",
    });

    // 30-day streak
    const hasBadge30 = badges.some(b => b.badge_id === "unstoppable");
    newMilestones.push({
      id: "30-day-streak",
      title: "30-Day Streak",
      description: "One month of unstoppable progress!",
      icon: "💎",
      date: hasBadge30 ? badges.find(b => b.badge_id === "unstoppable")?.unlocked_at?.split("T")[0] || "Achieved" : null,
      achieved: hasBadge30 || longestStreak >= 30,
      type: "streak",
    });

    // Interview Ready
    const hasBadge60 = badges.some(b => b.badge_id === "interview_ready");
    newMilestones.push({
      id: "interview-ready",
      title: "Interview Ready",
      description: "60-day streak - You're fully prepared!",
      icon: "🎓",
      date: hasBadge60 ? badges.find(b => b.badge_id === "interview_ready")?.unlocked_at?.split("T")[0] || "Achieved" : null,
      achieved: hasBadge60 || longestStreak >= 60,
      type: "badge",
    });

    setMilestones(newMilestones);
  }, [totalInterviews, currentStreak, longestStreak, badges, averageScore]);

  const achievedCount = milestones.filter(m => m.achieved).length;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">📈</span> Your Progress Timeline
        </h3>
        <span className="text-xs text-slate-500">{achievedCount}/{milestones.length} milestones</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative flex items-start gap-4 pl-2">
              {/* Timeline dot */}
              <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                milestone.achieved
                  ? "bg-green-500"
                  : "bg-slate-200"
              }`}>
                {milestone.achieved ? (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 ${!milestone.achieved ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{milestone.icon}</span>
                  <h4 className={`font-medium text-sm ${milestone.achieved ? "text-slate-900" : "text-slate-500"}`}>
                    {milestone.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                {milestone.date && (
                  <span className="text-xs text-green-600 mt-1 inline-block">
                    ✓ {milestone.date}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {achievedCount === milestones.length && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl text-center">
          <p className="text-orange-800 font-semibold text-sm">🏆 All Milestones Achieved!</p>
          <p className="text-orange-600 text-xs mt-1">You're a true interview preparation legend!</p>
        </div>
      )}
    </div>
  );
}
