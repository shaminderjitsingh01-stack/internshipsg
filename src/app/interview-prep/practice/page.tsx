"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  tips: string | null;
  sample_answer: string | null;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "sample-1",
    question: "Tell me about yourself",
    category: "behavioral",
    difficulty: "easy",
    tips: "Focus on your professional journey, key achievements, and what makes you a good fit for this role. Keep it to 2-3 minutes.",
    sample_answer: "I am a [role] with [X] years of experience in [industry]. I started my career at [company] where I [key achievement]. Most recently, I have been working on [recent project/responsibility] which has helped me develop [relevant skill]. I am excited about this opportunity because [connection to role].",
  },
  {
    id: "sample-2",
    question: "Why do you want this job?",
    category: "behavioral",
    difficulty: "easy",
    tips: "Research the company beforehand. Connect your skills and goals with the role requirements and company mission.",
    sample_answer: "I am drawn to this role because it combines my passion for [area] with my expertise in [skill]. Your company's commitment to [company value/mission] aligns with my professional values. I am particularly excited about [specific aspect of role] and believe my experience in [relevant experience] would allow me to make meaningful contributions.",
  },
  {
    id: "sample-3",
    question: "What are your strengths and weaknesses?",
    category: "behavioral",
    difficulty: "medium",
    tips: "Choose genuine strengths relevant to the role. For weaknesses, pick something real but show how you are working to improve.",
    sample_answer: "My key strength is [strength] - for example, [specific example]. This has helped me [achievement]. As for areas I am developing, I used to struggle with [weakness], but I have been actively working on it by [improvement action]. Recently, this effort paid off when [positive outcome].",
  },
  {
    id: "sample-4",
    question: "Describe a challenging situation you faced at work",
    category: "behavioral",
    difficulty: "medium",
    tips: "Use the STAR method: Situation, Task, Action, Result. Focus on your problem-solving abilities.",
    sample_answer: "At my previous role, [Situation: describe the challenge]. My task was to [Task: your responsibility]. I approached this by [Action: specific steps you took]. As a result, [Result: quantifiable outcome if possible]. This experience taught me [lesson learned].",
  },
  {
    id: "sample-5",
    question: "Where do you see yourself in 5 years?",
    category: "behavioral",
    difficulty: "easy",
    tips: "Show ambition while being realistic. Align your goals with potential growth at the company.",
    sample_answer: "In five years, I see myself having grown significantly in [area]. I hope to have taken on more responsibilities, potentially [specific goal]. I am also committed to continuous learning and would love to [development goal]. Most importantly, I want to be in a position where I am making meaningful contributions to [company/industry goal].",
  },
];

function PracticeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  const category = searchParams.get("category");
  const sessionIdParam = searchParams.get("session");

  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam);
  const [notes, setNotes] = useState("");
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionNotes, setSessionNotes] = useState("");
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentIndex];

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let url = "/api/interview-prep/questions?limit=10";
        if (category) {
          url += `&category=${category}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.questions?.length > 0) {
            setQuestions(data.questions);
          }
        }
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category]);

  // Create session on start
  useEffect(() => {
    const createSession = async () => {
      if (!session?.user?.email || sessionId) return;

      try {
        const res = await fetch("/api/interview-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: session.user.email,
            sessionType: "practice",
            category: category || null,
            totalQuestions: questions.length,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setSessionId(data.session.id);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };

    if (status === "authenticated" && !loading) {
      createSession();
    }
  }, [session, status, sessionId, category, questions.length, loading]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimer(0);
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      saveAnswer();
      setCurrentIndex(currentIndex - 1);
      resetQuestionState();
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      saveAnswer();
      setCurrentIndex(currentIndex + 1);
      resetQuestionState();
    }
  };

  const resetQuestionState = () => {
    setNotes("");
    setTimer(0);
    setIsTimerRunning(false);
    setShowTips(false);
    setShowSampleAnswer(false);
    setAiFeedback(null);
  };

  const saveAnswer = async () => {
    if (!session?.user?.email || !sessionId || !notes.trim()) return;

    try {
      await fetch("/api/interview-prep/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          sessionId,
          questionId: currentQuestion?.id?.startsWith("sample-") ? null : currentQuestion?.id,
          answerText: notes,
          timeTakenSeconds: timer,
        }),
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const handleFinishSession = async () => {
    await saveAnswer();

    if (session?.user?.email && sessionId) {
      try {
        await fetch("/api/interview-prep", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userEmail: session.user.email,
            status: "completed",
            questionsAnswered: currentIndex + 1,
            notes: sessionNotes,
          }),
        });
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    router.push("/interview-prep");
  };

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
    // Recording placeholder - actual implementation would use MediaRecorder API
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading || status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/interview-prep" className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${isDarkTheme ? "text-white" : "text-slate-900"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className={`text-sm font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Back</span>
            </Link>
            <span className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Display */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDarkTheme ? "bg-white/10" : "bg-slate-100"}`}>
              <svg className={`w-4 h-4 ${isDarkTheme ? "text-white" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-mono text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {formatTime(timer)}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDarkTheme ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
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

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className={`h-2 rounded-full ${isDarkTheme ? "bg-slate-800" : "bg-slate-200"}`}>
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className={`rounded-xl border p-6 mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${isDarkTheme ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                {currentQuestion?.category?.replace("_", " ")}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getDifficultyColor(currentQuestion?.difficulty || "medium")}`}>
                {currentQuestion?.difficulty}
              </span>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              {!isTimerRunning ? (
                <button
                  onClick={handleStartTimer}
                  className={`p-2 rounded-lg ${isDarkTheme ? "bg-green-900/50 hover:bg-green-900 text-green-300" : "bg-green-100 hover:bg-green-200 text-green-700"}`}
                  title="Start Timer"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleStopTimer}
                  className={`p-2 rounded-lg ${isDarkTheme ? "bg-yellow-900/50 hover:bg-yellow-900 text-yellow-300" : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"}`}
                  title="Pause Timer"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleResetTimer}
                className={`p-2 rounded-lg ${isDarkTheme ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                title="Reset Timer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Question */}
          <h2 className={`text-xl sm:text-2xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            {currentQuestion?.question}
          </h2>

          {/* Tips Toggle */}
          <button
            onClick={() => setShowTips(!showTips)}
            className={`flex items-center gap-2 text-sm font-medium mb-4 ${isDarkTheme ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
          >
            <svg className={`w-4 h-4 transition-transform ${showTips ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showTips ? "Hide Tips" : "Show Tips"}
          </button>

          {/* Tips Content */}
          {showTips && currentQuestion?.tips && (
            <div className={`p-4 rounded-lg mb-4 ${isDarkTheme ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}>
              <p className={`text-sm ${isDarkTheme ? "text-blue-300" : "text-blue-800"}`}>
                {currentQuestion.tips}
              </p>
            </div>
          )}
        </div>

        {/* Answer Section */}
        <div className={`rounded-xl border p-6 mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Your Answer</h3>

            {/* Record Button (Placeholder) */}
            <button
              onClick={handleRecordToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                isRecording
                  ? "bg-red-500 text-white"
                  : isDarkTheme
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-white animate-pulse" : "bg-red-500"}`}></span>
              {isRecording ? "Recording..." : "Record Answer"}
            </button>
          </div>

          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type your answer or notes here..."
            className={`w-full min-h-[200px] px-4 py-3 rounded-lg border text-sm resize-y ${
              isDarkTheme
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500"
                : "bg-white border-slate-300 focus:border-blue-500"
            } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
          />

          <p className={`text-xs mt-2 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
            {notes.length} characters
          </p>
        </div>

        {/* Sample Answer Section */}
        <div className={`rounded-xl border p-6 mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <button
            onClick={() => setShowSampleAnswer(!showSampleAnswer)}
            className={`flex items-center gap-2 w-full text-left ${isDarkTheme ? "text-white" : "text-slate-900"}`}
          >
            <svg className={`w-5 h-5 transition-transform ${showSampleAnswer ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold">Sample Answer</span>
            <span className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>(Click to reveal)</span>
          </button>

          {showSampleAnswer && currentQuestion?.sample_answer && (
            <div className={`mt-4 p-4 rounded-lg ${isDarkTheme ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"}`}>
              <p className={`text-sm whitespace-pre-line ${isDarkTheme ? "text-green-300" : "text-green-800"}`}>
                {currentQuestion.sample_answer}
              </p>
            </div>
          )}
        </div>

        {/* AI Feedback Placeholder */}
        <div className={`rounded-xl border p-6 mb-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>AI Feedback</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${isDarkTheme ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
              Coming Soon
            </span>
          </div>

          <div className={`p-4 rounded-lg text-center ${isDarkTheme ? "bg-slate-800" : "bg-slate-50"}`}>
            <svg className={`w-12 h-12 mx-auto mb-3 ${isDarkTheme ? "text-slate-600" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              AI-powered feedback on your answer will be available soon.
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              currentIndex === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            } ${isDarkTheme ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  saveAnswer();
                  setCurrentIndex(i);
                  resetQuestionState();
                }}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-blue-500"
                    : i < currentIndex
                    ? isDarkTheme
                      ? "bg-green-500"
                      : "bg-green-400"
                    : isDarkTheme
                    ? "bg-slate-700"
                    : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleFinishSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white"
            >
              Finish Session
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Session Notes */}
        <div className={`mt-8 rounded-xl border p-6 ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Session Notes</h3>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Add any overall notes for this practice session..."
            className={`w-full min-h-[100px] px-4 py-3 rounded-lg border text-sm resize-y ${
              isDarkTheme
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500"
                : "bg-white border-slate-300 focus:border-blue-500"
            } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
          />
        </div>
      </main>
    </div>
  );
}

export default function InterviewPrepPracticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
