"use client";

import { useState } from "react";

interface DimensionalScore {
  score: number;
  videoInsights: string;
  cvGap: string;
  examples: string[];
}

interface RequirementMatch {
  requirement: string;
  status: "matched" | "partially_matched" | "inferred" | "not_matched" | "not_addressed";
  upgradeDowngrade: "upgraded" | "downgraded" | "none";
  analysis: string;
  evidence: string;
}

interface Analysis {
  overallScore: number;
  overallFeedback: string;
  dimensionalAnalysis: {
    communicationSkills: DimensionalScore;
    problemSolving: DimensionalScore;
    adaptabilityLearning: DimensionalScore;
    passionMotivation: DimensionalScore;
    handlingFailures: DimensionalScore;
    culturalFit: DimensionalScore;
  };
  requirementMatchAnalysis: {
    summary: {
      matched: number;
      partiallyMatched: number;
      inferred: number;
      notMatched: number;
      notAddressed: number;
    };
    nonNegotiable: RequirementMatch[];
    goodToHave: RequirementMatch[];
  };
  strengths: string[];
  improvements: string[];
  hiringRecommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  recommendationReason: string;
}

interface Props {
  analysis: Analysis;
  jobTitle: string;
  company: string;
}

export default function JobInterviewAnalysis({ analysis, jobTitle, company }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "dimensions" | "requirements">("overview");
  const [expandedRequirement, setExpandedRequirement] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusBadge = (status: string, upgradeDowngrade: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      matched: { bg: "bg-green-100", text: "text-green-700", label: "Matched" },
      partially_matched: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Partially Matched" },
      inferred: { bg: "bg-blue-100", text: "text-blue-700", label: "Inferred" },
      not_matched: { bg: "bg-red-100", text: "text-red-700", label: "Not Matched" },
      not_addressed: { bg: "bg-slate-100", text: "text-slate-700", label: "Not Addressed" },
    };
    const badge = badges[status] || badges.not_addressed;

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
        {upgradeDowngrade !== "none" && (
          <span className={`text-xs ${upgradeDowngrade === "upgraded" ? "text-green-600" : "text-red-600"}`}>
            {upgradeDowngrade === "upgraded" ? "↑ Upgraded" : "↓ Downgraded"} based on interview
          </span>
        )}
      </div>
    );
  };

  const getRecommendationBadge = (rec: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      strong_yes: { bg: "bg-green-500", text: "text-white", icon: "✓✓" },
      yes: { bg: "bg-green-400", text: "text-white", icon: "✓" },
      maybe: { bg: "bg-yellow-400", text: "text-yellow-900", icon: "?" },
      no: { bg: "bg-red-400", text: "text-white", icon: "✗" },
      strong_no: { bg: "bg-red-600", text: "text-white", icon: "✗✗" },
    };
    return badges[rec] || badges.maybe;
  };

  const dimensionLabels: Record<string, { label: string; icon: string }> = {
    communicationSkills: { label: "Communication Skills", icon: "🗣️" },
    problemSolving: { label: "Problem-Solving", icon: "🧩" },
    adaptabilityLearning: { label: "Adaptability & Learning", icon: "🌱" },
    passionMotivation: { label: "Passion & Motivation", icon: "🔥" },
    handlingFailures: { label: "Handling Failures", icon: "💪" },
    culturalFit: { label: "Cultural Fit", icon: "🤝" },
  };

  const recBadge = getRecommendationBadge(analysis.hiringRecommendation);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Interview Analysis</h2>
            <p className="text-slate-300 text-sm mt-1">{jobTitle} at {company}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl sm:text-4xl font-bold ${analysis.overallScore >= 70 ? "text-green-400" : analysis.overallScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                {analysis.overallScore}/100
              </div>
              <p className="text-xs text-slate-400">Overall Score</p>
            </div>
            <div className={`px-4 py-2 rounded-lg ${recBadge.bg} ${recBadge.text} text-center`}>
              <span className="text-lg font-bold">{recBadge.icon}</span>
              <p className="text-xs mt-1 capitalize">{analysis.hiringRecommendation.replace("_", " ")}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-300">{analysis.overallFeedback}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: "overview", label: "Overview" },
          { id: "dimensions", label: "Dimensional Analysis" },
          { id: "requirements", label: "Requirement Match" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Requirement Match Summary */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Requirement Match Summary</h3>
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {[
                  { label: "Matched", value: analysis.requirementMatchAnalysis.summary.matched, color: "bg-green-500" },
                  { label: "Partial", value: analysis.requirementMatchAnalysis.summary.partiallyMatched, color: "bg-yellow-500" },
                  { label: "Inferred", value: analysis.requirementMatchAnalysis.summary.inferred, color: "bg-blue-500" },
                  { label: "Not Met", value: analysis.requirementMatchAnalysis.summary.notMatched, color: "bg-red-500" },
                  { label: "N/A", value: analysis.requirementMatchAnalysis.summary.notAddressed, color: "bg-slate-400" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className={`${item.color} text-white text-xl sm:text-2xl font-bold rounded-lg py-2`}>
                      {item.value}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <span>✓</span> Strengths
                </h4>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                  <span>!</span> Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {analysis.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hiring Recommendation */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-medium text-slate-900 mb-2">Hiring Recommendation</h4>
              <p className="text-sm text-slate-600">{analysis.recommendationReason}</p>
            </div>
          </div>
        )}

        {/* Dimensional Analysis Tab */}
        {activeTab === "dimensions" && (
          <div className="space-y-4">
            {Object.entries(analysis.dimensionalAnalysis).map(([key, data]) => {
              const dim = dimensionLabels[key] || { label: key, icon: "📊" };
              return (
                <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{dim.icon}</span>
                      <h4 className="font-medium text-slate-900">{dim.label}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(data.score)}`}>
                      {data.score}/100
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Insights from Interview</p>
                      <p className="text-sm text-slate-700">{data.videoInsights}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Not Evident from CV</p>
                      <p className="text-sm text-slate-600 italic">{data.cvGap}</p>
                    </div>
                    {data.examples && data.examples.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Examples</p>
                        <ul className="space-y-1">
                          {data.examples.map((ex, i) => (
                            <li key={i} className="text-sm text-slate-600 bg-slate-50 p-2 rounded italic">
                              "{ex}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === "requirements" && (
          <div className="space-y-6">
            {/* Non-Negotiable Requirements */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Non-Negotiable Requirements
              </h3>
              <div className="space-y-3">
                {analysis.requirementMatchAnalysis.nonNegotiable.map((req, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedRequirement(expandedRequirement === `non-${i}` ? null : `non-${i}`)}
                      className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{req.requirement}</p>
                        <div className="mt-2">{getStatusBadge(req.status, req.upgradeDowngrade)}</div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${expandedRequirement === `non-${i}` ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedRequirement === `non-${i}` && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Analysis</p>
                          <p className="text-sm text-slate-700">{req.analysis}</p>
                        </div>
                        {req.evidence && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Evidence from Interview</p>
                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded italic">"{req.evidence}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Good to Have Requirements */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Good to Have Requirements
              </h3>
              <div className="space-y-3">
                {analysis.requirementMatchAnalysis.goodToHave.map((req, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedRequirement(expandedRequirement === `good-${i}` ? null : `good-${i}`)}
                      className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{req.requirement}</p>
                        <div className="mt-2">{getStatusBadge(req.status, req.upgradeDowngrade)}</div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${expandedRequirement === `good-${i}` ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedRequirement === `good-${i}` && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Analysis</p>
                          <p className="text-sm text-slate-700">{req.analysis}</p>
                        </div>
                        {req.evidence && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Evidence from Interview</p>
                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded italic">"{req.evidence}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
