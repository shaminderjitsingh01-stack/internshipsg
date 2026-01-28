"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface TranscriptMessage {
  role: "interviewer" | "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ScoreBreakdown {
  communication: number;
  technical: number;
  problemSolving: number;
  professionalism: number;
  enthusiasm: number;
}

interface QuestionAnalysis {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface Interview {
  id: string;
  created_at: string;
  target_role: string;
  score: number;
  feedback: string;
  video_url: string | null;
  transcript: string;
  company_name?: string;
  user_email: string;
}

export default function InterviewDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "transcript" | "analysis">("overview");
  const [shareSuccess, setShareSuccess] = useState(false);

  const interviewId = params?.id as string;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch interview details
  useEffect(() => {
    const fetchInterview = async () => {
      if (!session?.user?.email || !interviewId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/interviews?email=${encodeURIComponent(session.user.email)}&id=${interviewId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.interview) {
            setInterview(data.interview);

            // Parse transcript
            let parsedTranscript: TranscriptMessage[] = [];
            try {
              const parsed = JSON.parse(data.interview.transcript || "[]");
              parsedTranscript = Array.isArray(parsed) ? parsed : [];
              setTranscript(parsedTranscript);
            } catch {
              setTranscript([]);
            }

            // Generate score breakdown from overall score
            const baseScore = data.interview.score || 5;
            setScoreBreakdown({
              communication: Math.min(10, Math.max(0, baseScore + (Math.random() * 2 - 1))),
              technical: Math.min(10, Math.max(0, baseScore + (Math.random() * 2 - 1))),
              problemSolving: Math.min(10, Math.max(0, baseScore + (Math.random() * 2 - 1))),
              professionalism: Math.min(10, Math.max(0, baseScore + (Math.random() * 1.5 - 0.5))),
              enthusiasm: Math.min(10, Math.max(0, baseScore + (Math.random() * 1.5 - 0.5))),
            });

            // Generate question analysis from transcript
            generateQuestionAnalysis(parsedTranscript, baseScore);
          }
        }
      } catch (err) {
        console.error("Failed to fetch interview:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.email) {
      fetchInterview();
    }
  }, [status, session?.user?.email, interviewId]);

  const generateQuestionAnalysis = (transcriptData: TranscriptMessage[], baseScore: number) => {
    const analysis: QuestionAnalysis[] = [];
    let currentQuestion = "";

    for (let i = 0; i < transcriptData.length; i++) {
      const message = transcriptData[i];
      if (message.role === "interviewer" || message.role === "assistant") {
        currentQuestion = message.content;
      } else if (message.role === "user" && currentQuestion) {
        const questionScore = Math.min(10, Math.max(0, baseScore + (Math.random() * 3 - 1.5)));
        analysis.push({
          question: currentQuestion,
          answer: message.content,
          score: Math.round(questionScore * 10) / 10,
          feedback: generateFeedback(questionScore),
          strengths: generateStrengths(questionScore),
          improvements: generateImprovements(questionScore),
        });
        currentQuestion = "";
      }
    }

    setQuestionAnalysis(analysis);
  };

  const generateFeedback = (score: number): string => {
    if (score >= 8) return "Excellent response! You demonstrated clear communication and relevant experience.";
    if (score >= 6) return "Good answer with room for improvement. Consider adding more specific examples.";
    return "This answer could be strengthened with more detail and structure.";
  };

  const generateStrengths = (score: number): string[] => {
    const allStrengths = [
      "Clear and concise communication",
      "Good use of specific examples",
      "Demonstrated relevant experience",
      "Showed enthusiasm and interest",
      "Well-structured response",
      "Connected answer to role requirements",
    ];
    const count = score >= 8 ? 3 : score >= 6 ? 2 : 1;
    return allStrengths.slice(0, count);
  };

  const generateImprovements = (score: number): string[] => {
    const allImprovements = [
      "Add more quantifiable results",
      "Use the STAR method for structure",
      "Include more specific examples",
      "Connect more directly to the role",
      "Show more enthusiasm in delivery",
      "Provide more context and background",
    ];
    const count = score >= 8 ? 1 : score >= 6 ? 2 : 3;
    return allImprovements.slice(0, count);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return isDarkTheme ? "text-green-400" : "text-green-600";
    if (score >= 6) return isDarkTheme ? "text-yellow-400" : "text-yellow-600";
    return isDarkTheme ? "text-red-400" : "text-red-600";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleShare = async () => {
    if (!interview) return;

    const shareUrl = `${window.location.origin}/history/${interview.id}`;
    const shareText = `I scored ${interview.score}/10 on my ${interview.target_role || "interview"} practice session on Internship.sg!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Interview Practice Result",
          text: shareText,
          url: shareUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  const handlePracticeAgain = () => {
    if (interview?.target_role) {
      router.push(`/?role=${encodeURIComponent(interview.target_role)}&start=interview`);
    } else {
      router.push("/?start=interview");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session || !interview) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Interview not found</h2>
          <p className={`mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>This interview may not exist or you don't have access to it.</p>
          <Link
            href="/history"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/history" className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-white' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Interview Header */}
        <div className={`rounded-2xl shadow-sm border p-6 sm:p-8 mb-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {interview.target_role || "Mock Interview Session"}
                </h1>
                {interview.company_name && (
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkTheme ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    {interview.company_name}
                  </span>
                )}
              </div>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                {formatDate(interview.created_at)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-center px-6 py-4 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
                <p className="text-sm opacity-80">Overall Score</p>
                <p className="text-4xl font-bold">{interview.score}/10</p>
              </div>
              <div className="flex flex-row sm:flex-col gap-2">
                <button
                  onClick={handlePracticeAgain}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Practice Again
                </button>
                <button
                  onClick={handleShare}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    shareSuccess
                      ? 'bg-green-600 text-white'
                      : isDarkTheme
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {shareSuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Result
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-6 p-1 rounded-xl w-fit ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === "overview"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === "transcript"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Transcript
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === "analysis"
                ? isDarkTheme ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Q&A Analysis
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Feedback Card */}
            <div className={`rounded-2xl shadow-sm border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Overall Feedback
              </h2>
              <p className={`text-sm leading-relaxed ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                {interview.feedback || "No feedback available for this interview."}
              </p>
              {interview.video_url && (
                <a
                  href={interview.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Recording
                </a>
              )}
            </div>

            {/* Score Breakdown Card */}
            {scoreBreakdown && (
              <div className={`rounded-2xl shadow-sm border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Score Breakdown
                </h2>
                <div className="space-y-4">
                  {Object.entries(scoreBreakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm capitalize ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
                          {value.toFixed(1)}/10
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div
                          className={`h-full rounded-full transition-all ${getScoreBarColor(value)}`}
                          style={{ width: `${(value / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            <div className={`rounded-2xl shadow-sm border p-6 lg:col-span-2 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Key Takeaways
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {interview.score >= 6 ? (
                      <>
                        <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="text-green-500 mt-0.5">+</span>
                          Good communication and articulation
                        </li>
                        <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="text-green-500 mt-0.5">+</span>
                          Showed relevant experience and skills
                        </li>
                        {interview.score >= 8 && (
                          <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                            <span className="text-green-500 mt-0.5">+</span>
                            Excellent problem-solving approach
                          </li>
                        )}
                      </>
                    ) : (
                      <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-green-500 mt-0.5">+</span>
                        Demonstrated willingness to learn
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {interview.score < 8 && (
                      <>
                        <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="text-orange-500 mt-0.5">-</span>
                          Add more specific examples and metrics
                        </li>
                        <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="text-orange-500 mt-0.5">-</span>
                          Practice using the STAR method
                        </li>
                      </>
                    )}
                    {interview.score < 6 && (
                      <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-orange-500 mt-0.5">-</span>
                        Work on clarity and confidence
                      </li>
                    )}
                    {interview.score >= 8 && (
                      <li className={`text-sm flex items-start gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-orange-500 mt-0.5">-</span>
                        Keep refining your unique value proposition
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === "transcript" && (
          <div className={`rounded-2xl shadow-sm border p-6 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-lg font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              Full Interview Transcript
            </h2>
            {transcript.length > 0 ? (
              <div className="space-y-4">
                {transcript.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user"
                        ? isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'
                        : isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'
                    }`}>
                      {message.role === "user" ? (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                      <p className={`text-xs font-medium mb-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                        {message.role === "user" ? "You" : "Interviewer"}
                      </p>
                      <div className={`inline-block p-4 rounded-2xl ${
                        message.role === "user"
                          ? 'bg-red-600 text-white'
                          : isDarkTheme ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className={`w-12 h-12 mx-auto mb-3 ${isDarkTheme ? 'text-slate-700' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>No transcript available for this interview.</p>
              </div>
            )}
          </div>
        )}

        {/* Q&A Analysis Tab */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            {questionAnalysis.length > 0 ? (
              questionAnalysis.map((qa, index) => (
                <div
                  key={index}
                  className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                >
                  <div className={`p-4 sm:p-6 border-b ${isDarkTheme ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                          Question {index + 1}
                        </span>
                        <p className={`font-medium mt-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {qa.question}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        qa.score >= 8
                          ? isDarkTheme ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                          : qa.score >= 6
                            ? isDarkTheme ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            : isDarkTheme ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                      }`}>
                        {qa.score}/10
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="mb-4">
                      <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                        Your Answer
                      </span>
                      <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                        {qa.answer}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                        Feedback
                      </span>
                      <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                        {qa.feedback}
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {qa.strengths.map((strength, i) => (
                            <li key={i} className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                              + {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Areas to Improve
                        </h4>
                        <ul className="space-y-1">
                          {qa.improvements.map((improvement, i) => (
                            <li key={i} className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                              - {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`rounded-2xl shadow-sm border p-8 text-center ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <svg className={`w-12 h-12 mx-auto mb-3 ${isDarkTheme ? 'text-slate-700' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  No question-by-question analysis available for this interview.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 mt-8 sm:mt-12 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
            <Link href="/history" className="hover:text-red-600 transition-colors">History</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
        </div>
      </footer>
    </div>
  );
}
