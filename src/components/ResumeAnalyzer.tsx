"use client";

import { useState, useRef } from "react";

interface ResumeAnalysis {
  overallScore: number;
  atsScore: number;
  keywordAnalysis: {
    found: string[];
    missing: string[];
    industryRelevance: number;
  };
  sectionFeedback: {
    contactInfo: { score: number; feedback: string; suggestions: string[] };
    summary: { score: number; feedback: string; suggestions: string[] };
    experience: { score: number; feedback: string; suggestions: string[] };
    education: { score: number; feedback: string; suggestions: string[] };
    skills: { score: number; feedback: string; suggestions: string[] };
  };
  formattingIssues: string[];
  topImprovements: string[];
  strengths: string[];
  actionVerbs: {
    strong: string[];
    weak: string[];
    suggestions: string[];
  };
  quantifiableAchievements: {
    found: number;
    examples: string[];
    suggestions: string[];
  };
}

interface Props {
  userEmail: string;
}

export default function ResumeAnalyzer({ userEmail }: Props) {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      if (file.type === "application/pdf") {
        const text = await extractPdfText(file);
        setResumeText(text);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                 file.type === "text/plain") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setResumeText(data.text);
        } else {
          throw new Error("Failed to parse file");
        }
      } else {
        throw new Error("Please upload a PDF, DOCX, or TXT file");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError("Please upload or paste your resume first");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data);
      setActiveSection("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setResumeText("");
    setTargetRole("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (analysis) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Score Overview */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className={`${getScoreBg(analysis.overallScore)} rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center`}>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Overall Score</p>
            <p className={`text-3xl sm:text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">/100</p>
          </div>
          <div className={`${getScoreBg(analysis.atsScore)} rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center`}>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">ATS</p>
            <p className={`text-3xl sm:text-5xl font-bold ${getScoreColor(analysis.atsScore)}`}>
              {analysis.atsScore}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">/100</p>
          </div>
          <div className={`${getScoreBg(analysis.keywordAnalysis.industryRelevance)} rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center`}>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Industry</p>
            <p className={`text-3xl sm:text-5xl font-bold ${getScoreColor(analysis.keywordAnalysis.industryRelevance)}`}>
              {analysis.keywordAnalysis.industryRelevance}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">/100</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 sm:gap-2 flex-wrap bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {["overview", "sections", "keywords", "improvements"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium capitalize transition-all text-sm sm:text-base whitespace-nowrap ${
                activeSection === section
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-green-700 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">✓</span> Strengths
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {analysis.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-slate-700 text-sm sm:text-base">
                    <span className="text-green-500 mt-1">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-red-700 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">!</span> Top Improvements
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {analysis.topImprovements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-slate-700 text-sm sm:text-base">
                    <span className="text-red-500 mt-1">{i + 1}.</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Sections Feedback */}
        {activeSection === "sections" && (
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(analysis.sectionFeedback).map(([key, section]) => (
              <div key={key} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-slate-900 capitalize text-sm sm:text-base">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getScoreBg(section.score)} ${getScoreColor(section.score)}`}>
                    {section.score}/100
                  </span>
                </div>
                <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">{section.feedback}</p>
                {section.suggestions.length > 0 && (
                  <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2">Suggestions:</p>
                    <ul className="space-y-1 sm:space-y-2">
                      {section.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-500">→</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Keywords Section */}
        {activeSection === "keywords" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-green-700 mb-3 sm:mb-4 text-sm sm:text-base">Keywords Found</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {analysis.keywordAnalysis.found.map((keyword, i) => (
                  <span key={i} className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-red-700 mb-3 sm:mb-4 text-sm sm:text-base">Missing Keywords</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {analysis.keywordAnalysis.missing.map((keyword, i) => (
                  <span key={i} className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm">
                    + {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Strong Action Verbs</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {analysis.actionVerbs.strong.map((verb, i) => (
                    <span key={i} className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                      {verb}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Weak Verbs to Replace</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {analysis.actionVerbs.weak.map((verb, i) => (
                    <span key={i} className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm">
                      {verb}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Improvements Section */}
        {activeSection === "improvements" && (
          <div className="space-y-6">
            {analysis.formattingIssues.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Formatting Issues</h3>
                <ul className="space-y-2">
                  {analysis.formattingIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700">
                      <span className="text-yellow-500">⚠</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">
                Quantifiable Achievements ({analysis.quantifiableAchievements.found} found)
              </h3>
              {analysis.quantifiableAchievements.examples.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-2">Examples found:</p>
                  <ul className="space-y-1">
                    {analysis.quantifiableAchievements.examples.map((example, i) => (
                      <li key={i} className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-700 mb-2">How to add more metrics:</p>
                <ul className="space-y-2">
                  {analysis.quantifiableAchievements.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-blue-600 flex items-start gap-2">
                      <span>💡</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={resetAnalysis}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            Analyze Another Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Smart Resume Analysis</h2>
        <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
          Get instant AI-powered feedback on your resume with actionable improvement tips.
        </p>

        {/* File Upload */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Upload Your Resume
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            <div className="text-3xl sm:text-4xl mb-2">📄</div>
            <p className="font-medium text-slate-700 text-sm sm:text-base">Click to upload or drag and drop</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">PDF, DOCX, or TXT (max 5MB)</p>
          </div>
        </div>

        {/* Or Paste Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Or Paste Resume Text
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content here..."
            className="w-full h-48 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Target Role */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Target Role (Optional)
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Software Engineering Intern, Marketing Intern"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-1">
            Specifying a role helps us provide more relevant keyword suggestions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !resumeText.trim()}
          className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Analyzing Resume...
            </>
          ) : (
            <>
              <span>📊</span>
              Analyze My Resume
            </>
          )}
        </button>
      </div>

      {/* What You'll Get */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">What You'll Get</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl">📈</span>
            <div>
              <p className="font-medium text-slate-900 text-sm sm:text-base">Overall Score</p>
              <p className="text-xs sm:text-sm text-slate-600">See how your resume ranks out of 100</p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl">🤖</span>
            <div>
              <p className="font-medium text-slate-900 text-sm sm:text-base">ATS Compatibility</p>
              <p className="text-xs sm:text-sm text-slate-600">Check if your resume passes screening</p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl">🔑</span>
            <div>
              <p className="font-medium text-slate-900 text-sm sm:text-base">Keyword Analysis</p>
              <p className="text-xs sm:text-sm text-slate-600">Identify missing keywords for your role</p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl">✨</span>
            <div>
              <p className="font-medium text-slate-900 text-sm sm:text-base">Section Feedback</p>
              <p className="text-xs sm:text-sm text-slate-600">Detailed tips for each resume section</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
