"use client";

import { useState, useRef } from "react";

interface GenerateResult {
  mode: "generate";
  coverLetter: string;
  keyPoints: string[];
  customizationNotes: string;
  wordCount: number;
  tone: string;
}

interface AnalyzeResult {
  mode: "analyze";
  overallScore: number;
  toneAnalysis: { score: number; description: string; feedback: string };
  customizationScore: { score: number; feedback: string };
  structureAnalysis: { score: number; hasStrongOpening: boolean; hasCallToAction: boolean; feedback: string };
  contentAnalysis: { specificity: number; relevanceToJob: number; achievementsMentioned: number; feedback: string };
  strengths: string[];
  improvements: string[];
  missingElements: string[];
  rewriteSuggestions: { opening: string; closing: string };
  wordCount: number;
  readabilityScore: number;
}

type Result = GenerateResult | AnalyzeResult;

interface Props {
  userEmail: string;
}

export default function CoverLetterAssistant({ userEmail }: Props) {
  const [mode, setMode] = useState<"generate" | "analyze">("generate");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "resume" | "coverLetter") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractPdfText(file);
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
          text = data.text;
        } else {
          throw new Error("Failed to parse file");
        }
      } else {
        throw new Error("Please upload a PDF, DOCX, or TXT file");
      }

      if (type === "resume") {
        setResumeText(text);
      } else {
        setCoverLetterText(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!jobDescription.trim()) {
      setError("Please provide a job description");
      return;
    }

    if (mode === "analyze" && !coverLetterText.trim()) {
      setError("Please provide a cover letter to analyze");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          jobDescription,
          companyName,
          resumeText,
          coverLetterText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Operation failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const resetForm = () => {
    setResult(null);
    setCoverLetterText("");
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

  // Show results
  if (result) {
    if (result.mode === "generate") {
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Generated Cover Letter</h2>
              <span className="text-xs sm:text-sm text-slate-500">{result.wordCount} words</span>
            </div>

            <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm sm:text-base">
              {result.coverLetter}
            </div>

            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              <button
                onClick={() => copyToClipboard(result.coverLetter)}
                className="flex-1 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Key Points Addressed</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {result.keyPoints.map((point, i) => (
                    <li key={i} className="text-xs sm:text-sm text-blue-700 flex items-start gap-2">
                      <span>✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Customization</h3>
                <p className="text-xs sm:text-sm text-green-700">{result.customizationNotes}</p>
                <p className="text-xs text-green-600 mt-2">Tone: {result.tone}</p>
              </div>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-2.5 sm:py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm sm:text-base"
          >
            Generate Another Cover Letter
          </button>
        </div>
      );
    } else {
      // Analyze result
      return (
        <div className="space-y-4 sm:space-y-6">
          {/* Score Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div className={`${getScoreBg(result.overallScore)} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
              <p className="text-xs font-medium text-slate-600 mb-1">Overall</p>
              <p className={`text-2xl sm:text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}
              </p>
            </div>
            <div className={`${getScoreBg(result.toneAnalysis.score)} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
              <p className="text-xs font-medium text-slate-600 mb-1">Tone</p>
              <p className={`text-2xl sm:text-3xl font-bold ${getScoreColor(result.toneAnalysis.score)}`}>
                {result.toneAnalysis.score}
              </p>
            </div>
            <div className={`${getScoreBg(result.customizationScore.score)} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
              <p className="text-xs font-medium text-slate-600 mb-1">Custom</p>
              <p className={`text-2xl sm:text-3xl font-bold ${getScoreColor(result.customizationScore.score)}`}>
                {result.customizationScore.score}
              </p>
            </div>
            <div className={`${getScoreBg(result.structureAnalysis.score)} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
              <p className="text-xs font-medium text-slate-600 mb-1">Structure</p>
              <p className={`text-2xl sm:text-3xl font-bold ${getScoreColor(result.structureAnalysis.score)}`}>
                {result.structureAnalysis.score}
              </p>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-green-700 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">✓</span> Strengths
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {result.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-slate-700 text-sm sm:text-base">
                    <span className="text-green-500 mt-1">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-red-700 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">!</span> Improvements
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {result.improvements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-slate-700 text-sm sm:text-base">
                    <span className="text-red-500 mt-1">{i + 1}.</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Structure Analysis */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Structure Analysis</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className={`p-2 sm:p-3 rounded-lg ${result.structureAnalysis.hasStrongOpening ? "bg-green-50" : "bg-red-50"}`}>
                <span className={`text-xs sm:text-sm font-medium ${result.structureAnalysis.hasStrongOpening ? "text-green-700" : "text-red-700"}`}>
                  {result.structureAnalysis.hasStrongOpening ? "✓" : "✗"} Strong Opening
                </span>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg ${result.structureAnalysis.hasCallToAction ? "bg-green-50" : "bg-red-50"}`}>
                <span className={`text-xs sm:text-sm font-medium ${result.structureAnalysis.hasCallToAction ? "text-green-700" : "text-red-700"}`}>
                  {result.structureAnalysis.hasCallToAction ? "✓" : "✗"} Call to Action
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm sm:text-base">{result.structureAnalysis.feedback}</p>
          </div>

          {/* Rewrite Suggestions */}
          <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">Suggested Rewrites</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 sm:mb-2">Better Opening:</p>
                <p className="text-slate-700 bg-white p-2 sm:p-3 rounded-lg italic text-xs sm:text-sm">"{result.rewriteSuggestions.opening}"</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 sm:mb-2">Better Closing:</p>
                <p className="text-slate-700 bg-white p-2 sm:p-3 rounded-lg italic text-xs sm:text-sm">"{result.rewriteSuggestions.closing}"</p>
              </div>
            </div>
          </div>

          {result.missingElements.length > 0 && (
            <div className="bg-yellow-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-3 sm:mb-4 text-sm sm:text-base">Missing Elements</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {result.missingElements.map((element, i) => (
                  <li key={i} className="flex items-start gap-2 text-yellow-800 text-sm sm:text-base">
                    <span>⚠</span>
                    {element}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={resetForm}
            className="w-full py-2.5 sm:py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm sm:text-base"
          >
            Analyze Another Cover Letter
          </button>
        </div>
      );
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Cover Letter Assistant</h2>
        <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
          Generate a tailored cover letter or get feedback on your existing one.
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMode("generate")}
            className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              mode === "generate"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Generate New
          </button>
          <button
            onClick={() => setMode("analyze")}
            className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              mode === "analyze"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Analyze Existing
          </button>
        </div>

        {/* Job Description */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full min-h-[120px] sm:min-h-[150px] px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-y text-sm sm:text-base"
          />
        </div>

        {/* Company Name */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Google Singapore, DBS Bank"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        {mode === "generate" && (
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Resume (Optional - helps personalize)
            </label>
            {/* Resume File Upload */}
            <div
              onClick={() => resumeFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 sm:p-6 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors mb-3"
            >
              <input
                type="file"
                ref={resumeFileInputRef}
                onChange={(e) => handleFileUpload(e, "resume")}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <div className="text-2xl sm:text-3xl mb-2">📄</div>
              <p className="font-medium text-slate-700 text-sm sm:text-base">Click to upload resume</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">PDF, DOCX, or TXT</p>
            </div>
            <p className="text-center text-xs sm:text-sm text-slate-500 mb-3">or paste below</p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here for a more personalized cover letter..."
              className="w-full min-h-[150px] sm:min-h-[200px] px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-y text-sm sm:text-base"
            />
          </div>
        )}

        {mode === "analyze" && (
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Cover Letter <span className="text-red-500">*</span>
            </label>
            {/* File Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 sm:p-6 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors mb-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e, "coverLetter")}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <div className="text-2xl sm:text-3xl mb-2">📄</div>
              <p className="font-medium text-slate-700 text-sm sm:text-base">Click to upload cover letter</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">PDF, DOCX, or TXT</p>
            </div>
            <p className="text-center text-xs sm:text-sm text-slate-500 mb-3">or paste below</p>
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              placeholder="Paste your cover letter here to get feedback..."
              className="w-full min-h-[180px] sm:min-h-[250px] px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-y text-sm sm:text-base"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm sm:text-base">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !jobDescription.trim() || (mode === "analyze" && !coverLetterText.trim())}
          className="w-full py-3 sm:py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {mode === "generate" ? "Generating..." : "Analyzing..."}
            </>
          ) : (
            <>
              <span>{mode === "generate" ? "✨" : "📊"}</span>
              {mode === "generate" ? "Generate Cover Letter" : "Analyze Cover Letter"}
            </>
          )}
        </button>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">
          {mode === "generate" ? "Tips for Better Results" : "What We'll Analyze"}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {mode === "generate" ? (
            <>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">📋</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Job Description</p>
                  <p className="text-xs sm:text-sm text-slate-600">Include full requirements</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">📄</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Add Your Resume</p>
                  <p className="text-xs sm:text-sm text-slate-600">For personalized content</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">🏢</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Company Name</p>
                  <p className="text-xs sm:text-sm text-slate-600">Helps tailor the letter</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">✏️</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Personalize After</p>
                  <p className="text-xs sm:text-sm text-slate-600">Add your unique voice</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">🎯</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Job Relevance</p>
                  <p className="text-xs sm:text-sm text-slate-600">Addresses requirements</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">🎨</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Tone & Style</p>
                  <p className="text-xs sm:text-sm text-slate-600">Professional balance</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">📐</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Structure</p>
                  <p className="text-xs sm:text-sm text-slate-600">Opening and closing</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl">⭐</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Specificity</p>
                  <p className="text-xs sm:text-sm text-slate-600">Personalized content</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
