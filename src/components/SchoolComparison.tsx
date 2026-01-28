"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface SchoolData {
  school: string;
  schoolFullName: string;
  averageScore: number;
  averageStreak: number;
  averageXP: number;
  totalStudents: number;
}

interface BenchmarkData {
  overall: {
    averageScore: number;
    averageStreak: number;
    averageXP: number;
    totalUsers: number;
  };
  bySchool: SchoolData[];
  userPercentiles: {
    scorePercentile: number;
    streakPercentile: number;
    xpPercentile: number;
    overallPercentile: number;
    schoolRank: number;
    schoolTotal: number;
  } | null;
}

interface Props {
  userEmail: string;
  userSchool?: string;
}

export default function SchoolComparison({ userEmail, userSchool }: Props) {
  const { isDarkTheme } = useTheme();
  const [benchmarks, setBenchmarks] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"xp" | "score" | "streak">("xp");

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/benchmarks?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error("Failed to fetch benchmarks");
        const data = await res.json();
        setBenchmarks(data);
      } catch (err) {
        console.error("Error fetching benchmarks:", err);
        setError("Unable to load school comparison data");
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarks();
  }, [userEmail]);

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (error || !benchmarks) {
    return (
      <div className={`rounded-2xl p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <p className={`text-center ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
          {error || "No school data available"}
        </p>
      </div>
    );
  }

  const { bySchool, userPercentiles } = benchmarks;

  // Sort schools based on selected metric
  const sortedSchools = [...bySchool].sort((a, b) => {
    if (selectedMetric === "score") return b.averageScore - a.averageScore;
    if (selectedMetric === "streak") return b.averageStreak - a.averageStreak;
    return b.averageXP - a.averageXP;
  });

  const userSchoolData = userSchool
    ? sortedSchools.find(s => s.school === userSchool)
    : null;

  const userSchoolRank = userSchool
    ? sortedSchools.findIndex(s => s.school === userSchool) + 1
    : null;

  // Get max value for bar scaling
  const maxValue = Math.max(...sortedSchools.map(s => {
    if (selectedMetric === "score") return s.averageScore;
    if (selectedMetric === "streak") return s.averageStreak;
    return s.averageXP;
  }));

  const getMetricValue = (school: SchoolData) => {
    if (selectedMetric === "score") return school.averageScore;
    if (selectedMetric === "streak") return school.averageStreak;
    return school.averageXP;
  };

  const formatMetricValue = (value: number) => {
    if (selectedMetric === "score") return value.toFixed(1);
    if (selectedMetric === "streak") return value.toFixed(1) + " days";
    return Math.round(value).toLocaleString() + " XP";
  };

  // Get top 3 school colors
  const getRankColor = (index: number, isUserSchool: boolean) => {
    if (isUserSchool) return isDarkTheme ? "bg-purple-600" : "bg-purple-500";
    if (index === 0) return isDarkTheme ? "bg-yellow-500" : "bg-yellow-400";
    if (index === 1) return isDarkTheme ? "bg-slate-400" : "bg-slate-300";
    if (index === 2) return isDarkTheme ? "bg-amber-600" : "bg-amber-500";
    return isDarkTheme ? "bg-slate-600" : "bg-slate-400";
  };

  return (
    <div className={`rounded-2xl p-4 sm:p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <svg className={`w-5 h-5 ${isDarkTheme ? "text-blue-400" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className={`font-semibold text-base sm:text-lg ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            School Comparison
          </h3>
        </div>

        {/* Metric Selector */}
        <div className={`flex gap-1 p-1 rounded-lg ${isDarkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
          {[
            { key: "xp" as const, label: "XP" },
            { key: "score" as const, label: "Score" },
            { key: "streak" as const, label: "Streak" },
          ].map((metric) => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedMetric === metric.key
                  ? isDarkTheme
                    ? "bg-slate-700 text-white"
                    : "bg-white text-slate-900 shadow-sm"
                  : isDarkTheme
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* User's School Highlight */}
      {userSchoolData && userSchoolRank && (
        <div className={`rounded-xl p-4 mb-6 ${isDarkTheme ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-800/50" : "bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkTheme ? "text-purple-300" : "text-purple-700"}`}>
                Your School
              </p>
              <p className={`text-lg font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {userSchoolData.schoolFullName}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${isDarkTheme ? "text-purple-400" : "text-purple-600"}`}>
                #{userSchoolRank}
              </p>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                of {sortedSchools.length} schools
              </p>
            </div>
          </div>

          {/* User's rank within school */}
          {userPercentiles && (
            <div className={`mt-3 pt-3 border-t ${isDarkTheme ? "border-purple-800/50" : "border-purple-200"}`}>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Your rank within {userSchool}: <span className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>#{userPercentiles.schoolRank}</span> of {userPercentiles.schoolTotal} students
              </p>
            </div>
          )}
        </div>
      )}

      {/* School Rankings Chart */}
      <div className="space-y-3">
        {sortedSchools.slice(0, 8).map((school, index) => {
          const isUserSchool = school.school === userSchool;
          const value = getMetricValue(school);
          const barWidth = (value / maxValue) * 100;

          return (
            <div
              key={school.school}
              className={`relative rounded-lg p-3 transition-all ${
                isUserSchool
                  ? isDarkTheme
                    ? "bg-purple-900/30 border border-purple-800/50"
                    : "bg-purple-50 border border-purple-200"
                  : isDarkTheme
                    ? "bg-slate-800/50 hover:bg-slate-800"
                    : "bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${getRankColor(index, isUserSchool)}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      {school.school}
                      {isUserSchool && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${isDarkTheme ? "bg-purple-800 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                          You
                        </span>
                      )}
                    </p>
                    <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                      {school.totalStudents} students
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${isUserSchool ? (isDarkTheme ? "text-purple-400" : "text-purple-600") : (isDarkTheme ? "text-white" : "text-slate-900")}`}>
                  {formatMetricValue(value)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className={`h-2 rounded-full overflow-hidden ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getRankColor(index, isUserSchool)}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* View More Link */}
      {sortedSchools.length > 8 && (
        <div className="mt-4 text-center">
          <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
            +{sortedSchools.length - 8} more schools
          </p>
        </div>
      )}

      {/* School Stats Summary */}
      <div className={`mt-6 pt-4 border-t ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Schools</p>
            <p className={`text-lg font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              {sortedSchools.length}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Total Students</p>
            <p className={`text-lg font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              {sortedSchools.reduce((acc, s) => acc + s.totalStudents, 0)}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>Top School</p>
            <p className={`text-lg font-bold ${isDarkTheme ? "text-yellow-400" : "text-yellow-600"}`}>
              {sortedSchools[0]?.school || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
