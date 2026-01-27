"use client";

import { useState, useEffect } from "react";

interface Strength {
  area: string;
  score: number;
  feedback: string;
  icon: string;
}

interface Improvement {
  area: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
  icon: string;
}

interface Props {
  userEmail: string;
  interviews: {
    score: number;
    feedback: string;
    created_at: string;
  }[];
}

export default function AIStrengthsInsights({ userEmail, interviews }: Props) {
  const [strengths, setStrengths] = useState<Strength[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  useEffect(() => {
    // Load cached insights
    const cached = localStorage.getItem(`insights_${userEmail}`);
    if (cached) {
      const data = JSON.parse(cached);
      setStrengths(data.strengths || []);
      setImprovements(data.improvements || []);
      setLastAnalyzed(data.lastAnalyzed);
    }
  }, [userEmail]);

  // Generate insights based on interview data
  useEffect(() => {
    if (interviews.length === 0) return;

    const avgScore = interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length;

    // Generate strengths based on performance
    const newStrengths: Strength[] = [];
    const newImprovements: Improvement[] = [];

    if (avgScore >= 7) {
      newStrengths.push({
        area: "Communication",
        score: Math.min(avgScore * 10, 100),
        feedback: "You articulate your thoughts clearly and confidently.",
        icon: "🗣️",
      });
    } else {
      newImprovements.push({
        area: "Communication",
        suggestion: "Practice speaking more slowly and structuring your answers better.",
        priority: "high",
        icon: "🗣️",
      });
    }

    if (interviews.length >= 3) {
      newStrengths.push({
        area: "Consistency",
        score: Math.min((interviews.length / 10) * 100, 100),
        feedback: "You're building a strong practice habit!",
        icon: "📅",
      });
    } else {
      newImprovements.push({
        area: "Practice Frequency",
        suggestion: "Try to complete more mock interviews to build confidence.",
        priority: "medium",
        icon: "📅",
      });
    }

    // Check for improvement over time
    if (interviews.length >= 2) {
      const recentScores = interviews.slice(0, Math.min(3, interviews.length));
      const olderScores = interviews.slice(-Math.min(3, interviews.length));
      const recentAvg = recentScores.reduce((s, i) => s + (i.score || 0), 0) / recentScores.length;
      const olderAvg = olderScores.reduce((s, i) => s + (i.score || 0), 0) / olderScores.length;

      if (recentAvg >= olderAvg) {
        newStrengths.push({
          area: "Growth Mindset",
          score: 85,
          feedback: "Your scores are improving over time. Keep it up!",
          icon: "📈",
        });
      }
    }

    // Add default strengths for engagement
    if (newStrengths.length < 2) {
      newStrengths.push({
        area: "Initiative",
        score: 80,
        feedback: "Taking the time to practice shows great initiative!",
        icon: "🚀",
      });
    }

    // Add improvement suggestions
    if (avgScore < 8) {
      newImprovements.push({
        area: "STAR Method",
        suggestion: "Structure answers with Situation, Task, Action, Result for better clarity.",
        priority: "high",
        icon: "⭐",
      });
    }

    newImprovements.push({
      area: "Body Language",
      suggestion: "Maintain eye contact with the camera and sit up straight.",
      priority: "medium",
      icon: "👀",
    });

    newImprovements.push({
      area: "Research",
      suggestion: "Research the company thoroughly before each interview.",
      priority: "low",
      icon: "🔍",
    });

    setStrengths(newStrengths);
    setImprovements(newImprovements.slice(0, 3));
    setLastAnalyzed(new Date().toISOString());

    // Cache insights
    localStorage.setItem(`insights_${userEmail}`, JSON.stringify({
      strengths: newStrengths,
      improvements: newImprovements.slice(0, 3),
      lastAnalyzed: new Date().toISOString(),
    }));
  }, [interviews, userEmail]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (interviews.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2 mb-4">
          <span className="text-xl">🧠</span> AI Insights
        </h3>
        <div className="text-center py-6">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-slate-600 text-sm">Complete your first mock interview to unlock personalized insights!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">🧠</span> AI Strengths & Insights
        </h3>
        {lastAnalyzed && (
          <span className="text-xs text-slate-400">
            Updated {new Date(lastAnalyzed).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Strengths */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-1">
          <span>✓</span> Your Strengths
        </h4>
        <div className="space-y-3">
          {strengths.map((strength, idx) => (
            <div key={idx} className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-green-800 flex items-center gap-2">
                  <span>{strength.icon}</span>
                  {strength.area}
                </span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                  {strength.score}%
                </span>
              </div>
              <p className="text-xs text-green-700">{strength.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Improvements */}
      <div>
        <h4 className="text-sm font-medium text-orange-700 mb-3 flex items-center gap-1">
          <span>💡</span> Areas to Improve
        </h4>
        <div className="space-y-3">
          {improvements.map((improvement, idx) => (
            <div key={idx} className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-orange-800 flex items-center gap-2">
                  <span>{improvement.icon}</span>
                  {improvement.area}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(improvement.priority)}`}>
                  {improvement.priority}
                </span>
              </div>
              <p className="text-xs text-orange-700">{improvement.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
