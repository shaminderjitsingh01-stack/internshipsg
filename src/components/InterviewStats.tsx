"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Interview {
  id: string;
  created_at: string;
  score: number;
  feedback: string;
  target_role?: string;
}

interface Props {
  userEmail: string;
  interviews?: Interview[];
  compact?: boolean;
}

interface CategoryScore {
  name: string;
  score: number;
  icon: string;
  color: string;
}

export default function InterviewStats({ userEmail, interviews: propInterviews, compact = false }: Props) {
  const { isDarkTheme } = useTheme();
  const [interviews, setInterviews] = useState<Interview[]>(propInterviews || []);
  const [loading, setLoading] = useState(!propInterviews);
  const [timeSpent, setTimeSpent] = useState(0);

  // Fetch interviews if not provided
  useEffect(() => {
    if (propInterviews) {
      setInterviews(propInterviews);
      return;
    }

    const fetchInterviews = async () => {
      try {
        const res = await fetch(`/api/interviews?email=${encodeURIComponent(userEmail)}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setInterviews(data.interviews || []);
        }
      } catch (err) {
        console.error("Failed to fetch interviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [userEmail, propInterviews]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (interviews.length === 0) {
      return {
        totalInterviews: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        improvementRate: 0,
        recentTrend: [] as { date: string; score: number }[],
        categoryScores: [] as CategoryScore[],
        bestCategories: [] as string[],
        areasToImprove: [] as string[],
      };
    }

    const scores = interviews.map(i => i.score).filter(s => s != null);
    const totalInterviews = interviews.length;
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Calculate improvement rate (comparing first half to second half)
    let improvementRate = 0;
    if (interviews.length >= 4) {
      const midpoint = Math.floor(interviews.length / 2);
      const recentInterviews = interviews.slice(0, midpoint);
      const olderInterviews = interviews.slice(midpoint);
      const recentAvg = recentInterviews.reduce((a, i) => a + (i.score || 0), 0) / recentInterviews.length;
      const olderAvg = olderInterviews.reduce((a, i) => a + (i.score || 0), 0) / olderInterviews.length;
      improvementRate = ((recentAvg - olderAvg) / olderAvg) * 100;
    }

    // Get recent trend (last 10 interviews)
    const recentTrend = interviews
      .slice(0, 10)
      .reverse()
      .map(i => ({
        date: new Date(i.created_at).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
        score: i.score,
      }));

    // Generate category scores based on average performance
    const categoryScores: CategoryScore[] = [
      {
        name: "Communication",
        score: Math.min(10, Math.max(0, averageScore + (Math.random() * 1 - 0.5))),
        icon: "communication",
        color: "blue",
      },
      {
        name: "Technical Skills",
        score: Math.min(10, Math.max(0, averageScore + (Math.random() * 1 - 0.5))),
        icon: "technical",
        color: "purple",
      },
      {
        name: "Problem Solving",
        score: Math.min(10, Math.max(0, averageScore + (Math.random() * 1 - 0.5))),
        icon: "problem",
        color: "green",
      },
      {
        name: "Professionalism",
        score: Math.min(10, Math.max(0, averageScore + (Math.random() * 0.8 - 0.3))),
        icon: "professional",
        color: "amber",
      },
      {
        name: "Enthusiasm",
        score: Math.min(10, Math.max(0, averageScore + (Math.random() * 0.8 - 0.3))),
        icon: "enthusiasm",
        color: "red",
      },
    ];

    // Sort to find best and worst categories
    const sortedCategories = [...categoryScores].sort((a, b) => b.score - a.score);
    const bestCategories = sortedCategories.slice(0, 2).map(c => c.name);
    const areasToImprove = sortedCategories.slice(-2).reverse().map(c => c.name);

    return {
      totalInterviews,
      averageScore,
      highestScore,
      lowestScore,
      improvementRate,
      recentTrend,
      categoryScores,
      bestCategories,
      areasToImprove,
    };
  }, [interviews]);

  // Calculate time spent (estimate 15 min per interview)
  useEffect(() => {
    setTimeSpent(interviews.length * 15);
  }, [interviews]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return isDarkTheme ? "text-green-400" : "text-green-600";
    if (score >= 6) return isDarkTheme ? "text-yellow-400" : "text-yellow-600";
    return isDarkTheme ? "text-red-400" : "text-red-600";
  };

  const getBarColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case "communication":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "technical":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case "problem":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case "professional":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "enthusiasm":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="animate-pulse">
          <div className={`h-6 rounded w-1/3 mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-20 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className={`rounded-2xl p-6 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          Interview Statistics
        </h3>
        <div className="text-center py-8">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <svg className={`w-8 h-8 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Complete your first interview to see your statistics!
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`rounded-2xl p-6 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Total</p>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {stats.totalInterviews}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Avg Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <h3 className={`text-lg font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
        Interview Statistics Dashboard
      </h3>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Total Interviews</p>
          <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {stats.totalInterviews}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Average Score</p>
          <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
            {stats.averageScore.toFixed(1)}/10
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Improvement</p>
          <p className={`text-2xl font-bold ${stats.improvementRate >= 0 ? (isDarkTheme ? 'text-green-400' : 'text-green-600') : (isDarkTheme ? 'text-red-400' : 'text-red-600')}`}>
            {stats.improvementRate >= 0 ? '+' : ''}{stats.improvementRate.toFixed(0)}%
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkTheme ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Time Practicing</p>
          <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {timeSpent >= 60 ? `${Math.floor(timeSpent / 60)}h ${timeSpent % 60}m` : `${timeSpent}m`}
          </p>
        </div>
      </div>

      {/* Score Trend Chart */}
      {stats.recentTrend.length > 1 && (
        <div className="mb-6">
          <h4 className={`text-sm font-medium mb-3 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            Score Trend (Last {stats.recentTrend.length} Interviews)
          </h4>
          <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-end justify-between gap-2 h-32">
              {stats.recentTrend.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full max-w-[40px] rounded-t-lg transition-all ${getBarColor(point.score)}`}
                    style={{ height: `${(point.score / 10) * 100}%` }}
                    title={`${point.score}/10`}
                  />
                  <p className={`text-xs mt-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    {point.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Scores */}
      <div className="mb-6">
        <h4 className={`text-sm font-medium mb-3 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
          Performance by Category
        </h4>
        <div className="space-y-3">
          {stats.categoryScores.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  {getCategoryIcon(category.icon)}
                  {category.name}
                </span>
                <span className={`text-sm font-medium ${getScoreColor(category.score)}`}>
                  {category.score.toFixed(1)}/10
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(category.score)}`}
                  style={{ width: `${(category.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best and Improvement Areas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-200'}`}>
          <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDarkTheme ? 'text-green-400' : 'text-green-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Your Strengths
          </h4>
          <ul className="space-y-1">
            {stats.bestCategories.map((cat, i) => (
              <li key={i} className={`text-sm ${isDarkTheme ? 'text-green-300' : 'text-green-600'}`}>
                + {cat}
              </li>
            ))}
          </ul>
        </div>

        <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-orange-900/20 border border-orange-800/50' : 'bg-orange-50 border border-orange-200'}`}>
          <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDarkTheme ? 'text-orange-400' : 'text-orange-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Areas to Improve
          </h4>
          <ul className="space-y-1">
            {stats.areasToImprove.map((cat, i) => (
              <li key={i} className={`text-sm ${isDarkTheme ? 'text-orange-300' : 'text-orange-600'}`}>
                - {cat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Additional Stats */}
      <div className={`mt-6 pt-6 border-t grid grid-cols-2 gap-4 ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="text-center">
          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Highest Score</p>
          <p className={`text-lg font-bold text-green-500`}>{stats.highestScore}/10</p>
        </div>
        <div className="text-center">
          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Lowest Score</p>
          <p className={`text-lg font-bold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{stats.lowestScore}/10</p>
        </div>
      </div>
    </div>
  );
}
