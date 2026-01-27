"use client";

import { useState, useEffect } from "react";

interface BenchmarkData {
  category: string;
  userScore: number;
  averageScore: number;
  topPercentile: number;
  icon: string;
}

interface Props {
  userEmail: string;
  totalInterviews: number;
  averageScore: number;
  currentStreak: number;
  totalActivities: number;
}

export default function PerformanceBenchmark({
  userEmail,
  totalInterviews,
  averageScore,
  currentStreak,
  totalActivities,
}: Props) {
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [overallPercentile, setOverallPercentile] = useState(0);

  useEffect(() => {
    // Simulated benchmark data (in production, this would come from aggregate user data)
    const generateBenchmarks = (): BenchmarkData[] => {
      return [
        {
          category: "Interview Score",
          userScore: averageScore,
          averageScore: 6.2,
          topPercentile: 8.5,
          icon: "🎯",
        },
        {
          category: "Practice Sessions",
          userScore: totalInterviews,
          averageScore: 4,
          topPercentile: 12,
          icon: "🎙️",
        },
        {
          category: "Consistency (Streak)",
          userScore: currentStreak,
          averageScore: 2,
          topPercentile: 7,
          icon: "🔥",
        },
        {
          category: "Total Activities",
          userScore: totalActivities,
          averageScore: 8,
          topPercentile: 25,
          icon: "📊",
        },
      ];
    };

    const data = generateBenchmarks();
    setBenchmarks(data);

    // Calculate overall percentile
    let totalPercentile = 0;
    data.forEach(b => {
      if (b.userScore >= b.topPercentile) {
        totalPercentile += 95;
      } else if (b.userScore >= b.averageScore) {
        totalPercentile += 50 + ((b.userScore - b.averageScore) / (b.topPercentile - b.averageScore)) * 45;
      } else if (b.averageScore > 0) {
        totalPercentile += (b.userScore / b.averageScore) * 50;
      }
    });
    setOverallPercentile(Math.round(totalPercentile / data.length));
  }, [totalInterviews, averageScore, currentStreak, totalActivities]);

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return "text-green-600";
    if (percentile >= 50) return "text-blue-600";
    if (percentile >= 25) return "text-yellow-600";
    return "text-slate-600";
  };

  const getProgressWidth = (userScore: number, topPercentile: number) => {
    return Math.min((userScore / topPercentile) * 100, 100);
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return "Top 10%";
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Above Average";
    if (percentile >= 25) return "Average";
    return "Getting Started";
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">📈</span> Your Performance Benchmark
        </h3>
        <span className="text-xs text-slate-400">Private to you</span>
      </div>

      {/* Overall Percentile */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 mb-4 text-center">
        <p className="text-sm text-slate-600 mb-1">Overall Standing</p>
        <p className={`text-3xl font-bold ${getPercentileColor(overallPercentile)}`}>
          {overallPercentile}%
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {getPercentileLabel(overallPercentile)} of users
        </p>
      </div>

      {/* Category Benchmarks */}
      <div className="space-y-4">
        {benchmarks.map((benchmark, idx) => {
          const progressWidth = getProgressWidth(benchmark.userScore, benchmark.topPercentile);
          const isAboveAverage = benchmark.userScore >= benchmark.averageScore;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span>{benchmark.icon}</span>
                  {benchmark.category}
                </span>
                <span className={`text-sm font-bold ${isAboveAverage ? "text-green-600" : "text-slate-600"}`}>
                  {benchmark.category === "Interview Score"
                    ? benchmark.userScore.toFixed(1)
                    : benchmark.userScore}
                </span>
              </div>

              {/* Progress bar with markers */}
              <div className="relative">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAboveAverage ? "bg-green-500" : "bg-slate-400"
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>

                {/* Average marker */}
                <div
                  className="absolute top-0 w-0.5 h-2 bg-yellow-500"
                  style={{
                    left: `${getProgressWidth(benchmark.averageScore, benchmark.topPercentile)}%`,
                  }}
                  title="Average"
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>0</span>
                <span className="text-yellow-600">
                  Avg: {benchmark.category === "Interview Score"
                    ? benchmark.averageScore.toFixed(1)
                    : benchmark.averageScore}
                </span>
                <span className="text-green-600">
                  Top: {benchmark.category === "Interview Score"
                    ? benchmark.topPercentile.toFixed(1)
                    : benchmark.topPercentile}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Average User
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Top Performers
          </span>
        </div>
      </div>

      {overallPercentile < 50 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-medium">💡 Tip:</span> Complete more mock interviews and maintain your streak to improve your standing!
          </p>
        </div>
      )}
    </div>
  );
}
