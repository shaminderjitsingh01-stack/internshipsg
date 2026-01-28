"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

interface BenchmarkData {
  overall: {
    averageScore: number;
    averageStreak: number;
    averageXP: number;
    totalUsers: number;
  };
  bySchool: {
    school: string;
    schoolFullName: string;
    averageScore: number;
    averageStreak: number;
    averageXP: number;
    totalStudents: number;
  }[];
  userPercentiles: {
    scorePercentile: number;
    streakPercentile: number;
    xpPercentile: number;
    overallPercentile: number;
    schoolRank: number;
    schoolTotal: number;
  } | null;
  skillBreakdown: {
    communication: number;
    technical: number;
    consistency: number;
    activity: number;
  } | null;
}

interface Props {
  userEmail: string;
  userSchool?: string;
  currentStreak?: number;
  averageScore?: number;
  totalXP?: number;
}

export default function PeerComparison({
  userEmail,
  userSchool,
  currentStreak = 0,
  averageScore = 0,
  totalXP = 0,
}: Props) {
  const { isDarkTheme } = useTheme();
  const [benchmarks, setBenchmarks] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        setError("Unable to load comparison data");
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarks();
  }, [userEmail]);

  // Draw radar chart
  useEffect(() => {
    if (!benchmarks?.skillBreakdown || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { communication, technical, consistency, activity } = benchmarks.skillBreakdown;
    const skills = [
      { label: "Communication", value: communication },
      { label: "Technical", value: technical },
      { label: "Consistency", value: consistency },
      { label: "Activity", value: activity },
    ];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background circles
    const levels = 5;
    for (let i = levels; i >= 1; i--) {
      const radius = (maxRadius / levels) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isDarkTheme ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
      ctx.stroke();
    }

    // Draw axes
    const angleStep = (Math.PI * 2) / skills.length;
    skills.forEach((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = isDarkTheme ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)";
      ctx.stroke();

      // Draw labels
      const labelX = centerX + Math.cos(angle) * (maxRadius + 25);
      const labelY = centerY + Math.sin(angle) * (maxRadius + 25);
      ctx.fillStyle = isDarkTheme ? "#94a3b8" : "#64748b";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(skill.label, labelX, labelY);
    });

    // Draw data polygon
    ctx.beginPath();
    skills.forEach((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = (skill.value / 100) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    skills.forEach((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = (skill.value / 100) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = isDarkTheme ? "#1e293b" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [benchmarks, isDarkTheme]);

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
          {error || "No benchmark data available"}
        </p>
      </div>
    );
  }

  const { userPercentiles, skillBreakdown, overall, bySchool } = benchmarks;

  // Find user's school data
  const userSchoolData = userSchool
    ? bySchool.find(s => s.school === userSchool)
    : null;

  // Calculate comparisons
  const scoreDiff = averageScore - overall.averageScore;
  const streakComparison = userPercentiles?.streakPercentile || 0;

  return (
    <div className={`rounded-2xl p-4 sm:p-6 border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className={`w-5 h-5 ${isDarkTheme ? "text-purple-400" : "text-purple-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className={`font-semibold text-base sm:text-lg ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            How You Compare
          </h3>
        </div>
        <Link
          href="/comparison"
          className={`text-xs sm:text-sm font-medium transition-colors ${isDarkTheme ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-700"}`}
        >
          See Full Comparison
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Percentile Card */}
        {userPercentiles && (
          <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-800/50" : "bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200"}`}>
            <p className={`text-xs mb-1 ${isDarkTheme ? "text-purple-300" : "text-purple-700"}`}>
              {userSchoolData ? `Top at ${userSchool}` : "Overall Ranking"}
            </p>
            <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-purple-400" : "text-purple-600"}`}>
              Top {100 - userPercentiles.overallPercentile}%
            </p>
            <p className={`text-xs mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              of {userSchoolData ? userSchoolData.totalStudents : overall.totalUsers} students
            </p>
          </div>
        )}

        {/* Score Comparison */}
        <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-slate-800/50 border border-slate-700" : "bg-slate-50 border border-slate-200"}`}>
          <p className={`text-xs mb-1 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
            Your Score vs Average
          </p>
          <p className={`text-2xl sm:text-3xl font-bold ${scoreDiff >= 0 ? (isDarkTheme ? "text-green-400" : "text-green-600") : (isDarkTheme ? "text-amber-400" : "text-amber-600")}`}>
            {scoreDiff >= 0 ? "+" : ""}{scoreDiff.toFixed(1)}
          </p>
          <p className={`text-xs mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
            {scoreDiff >= 0 ? "points above" : "points below"} average
          </p>
        </div>

        {/* Streak Comparison */}
        <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-slate-800/50 border border-slate-700" : "bg-slate-50 border border-slate-200"}`}>
          <p className={`text-xs mb-1 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
            Streak Ranking
          </p>
          <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? "text-orange-400" : "text-orange-600"}`}>
            {streakComparison}%
          </p>
          <p className={`text-xs mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
            longer than {streakComparison}% of users
          </p>
        </div>
      </div>

      {/* Radar Chart */}
      {skillBreakdown && (
        <div className="mb-6">
          <h4 className={`text-sm font-medium mb-4 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
            Skill Breakdown
          </h4>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="max-w-full"
            />
          </div>
          {/* Skill Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { label: "Communication", value: skillBreakdown.communication, color: "text-blue-500" },
              { label: "Technical", value: skillBreakdown.technical, color: "text-green-500" },
              { label: "Consistency", value: skillBreakdown.consistency, color: "text-orange-500" },
              { label: "Activity", value: skillBreakdown.activity, color: "text-purple-500" },
            ].map((skill) => (
              <div key={skill.label} className={`text-center p-2 rounded-lg ${isDarkTheme ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{skill.label}</p>
                <p className={`text-lg font-bold ${skill.color}`}>{skill.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* School Comparison Preview */}
      {userSchoolData && (
        <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-slate-800/50 border border-slate-700" : "bg-slate-50 border border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {userSchoolData.schoolFullName}
              </p>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Ranks #{bySchool.findIndex(s => s.school === userSchool) + 1} overall
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                You: #{userPercentiles?.schoolRank || "-"} / {userSchoolData.totalStudents}
              </p>
              <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                within your school
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Encouragement Message */}
      {userPercentiles && userPercentiles.overallPercentile < 50 && (
        <div className={`mt-4 p-3 rounded-lg ${isDarkTheme ? "bg-blue-900/30 border border-blue-800/50" : "bg-blue-50 border border-blue-200"}`}>
          <p className={`text-xs ${isDarkTheme ? "text-blue-300" : "text-blue-700"}`}>
            <span className="font-medium">Keep going!</span> Complete more interviews and maintain your streak to climb the rankings.
          </p>
        </div>
      )}
    </div>
  );
}
