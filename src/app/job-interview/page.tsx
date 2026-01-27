"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import JobInterviewAnalysis from "@/components/JobInterviewAnalysis";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface JobDescription {
  title: string;
  company: string;
  description: string;
  requirements: {
    nonNegotiable: string[];
    goodToHave: string[];
  };
  source: "url" | "upload" | "paste";
  sourceUrl?: string;
}

interface InterviewQuestion {
  question: string;
  category: string;
  assessing: string;
  followUp?: string;
}

interface TranscriptEntry {
  role: "interviewer" | "candidate";
  content: string;
  question?: string;
}

type Step = "job-input" | "resume" | "setup" | "interview" | "analyzing" | "results";

export default function JobInterviewPage() {
  const { data: session, status } = useSession();

  // Flow state
  const [currentStep, setCurrentStep] = useState<Step>("job-input");
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  // Interview state
  const [interviewPhase, setInterviewPhase] = useState<"countdown" | "question" | "answering" | "processing">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [answerTimer, setAnswerTimer] = useState(120);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Handle job description ready
  const handleJobDescriptionReady = (jd: JobDescription) => {
    setJobDescription(jd);
    setCurrentStep("resume");
  };

  // Generate questions from job description
  const generateQuestions = async () => {
    if (!jobDescription) return;

    try {
      const res = await fetch("/api/job-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resume: resumeText || undefined,
          action: "generate-questions",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate questions");

      const data = await res.json();
      setQuestions(data.questions || []);

      // Add opening message to transcript
      if (data.openingMessage) {
        setTranscript([{ role: "interviewer", content: data.openingMessage }]);
      }

      setCurrentStep("setup");
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate interview questions. Please try again.");
    }
  };

  // Start the interview
  const startInterview = () => {
    setCurrentStep("interview");
    setInterviewPhase("countdown");
    setCountdown(3);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          askQuestion(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Ask a question
  const askQuestion = (index: number) => {
    if (index >= questions.length) {
      finishInterview();
      return;
    }

    const q = questions[index];
    setCurrentQuestionIndex(index);
    setInterviewPhase("question");
    setCurrentAnswer("");

    // Add question to transcript
    setTranscript((prev) => [...prev, { role: "interviewer", content: q.question, question: q.question }]);

    // Speak the question
    speakText(q.question, () => {
      setInterviewPhase("answering");
      setAnswerTimer(120);
      startListening();
      startAnswerTimer();
    });
  };

  // Speak text using TTS
  const speakText = (text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start listening for speech
  const startListening = () => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setCurrentAnswer((prev) => prev + finalTranscript);
      }

      // Reset silence timer on any speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // 5 seconds of silence - move to next question
        if (currentAnswer.length > 20) {
          submitAnswer();
        }
      }, 5000);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Start answer timer
  const startAnswerTimer = () => {
    timerRef.current = setInterval(() => {
      setAnswerTimer((prev) => {
        if (prev <= 1) {
          submitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Submit answer and move to next question
  const submitAnswer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopListening();

    // Add answer to transcript
    const answer = currentAnswer.trim() || "(No response)";
    setTranscript((prev) => [...prev, { role: "candidate", content: answer }]);

    // Move to next question after a brief pause
    setInterviewPhase("processing");
    setTimeout(() => {
      askQuestion(currentQuestionIndex + 1);
    }, 1500);
  };

  // Finish interview and analyze
  const finishInterview = async () => {
    setCurrentStep("analyzing");
    stopListening();

    try {
      // Build transcript text
      const transcriptText = transcript
        .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.content}`)
        .join("\n\n");

      const res = await fetch("/api/job-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resume: resumeText || undefined,
          action: "analyze",
          transcript: transcriptText,
        }),
      });

      if (!res.ok) throw new Error("Failed to analyze interview");

      const data = await res.json();
      setAnalysis(data.analysis);
      setCurrentStep("results");

      // Save interview to database if user is logged in
      if (session?.user?.email) {
        try {
          await fetch("/api/interviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              duration: Math.ceil((questions.length * 2.5)),
              score: data.analysis.overallScore,
              feedback: data.analysis.overallFeedback,
              jobTitle: jobDescription?.title,
              company: jobDescription?.company,
            }),
          });
        } catch (saveError) {
          console.error("Failed to save interview:", saveError);
        }
      }
    } catch (error) {
      console.error("Error analyzing interview:", error);
      alert("Failed to analyze interview. Please try again.");
      setCurrentStep("interview");
    }
  };

  // Skip to next question
  const skipQuestion = () => {
    setCurrentAnswer("(Skipped)");
    submitAnswer();
  };

  // Render based on current step
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className="h-8 sm:h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="px-4 py-2 text-slate-600 hover:text-blue-600 font-medium text-sm">
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Step 1: Job Description Input */}
        {currentStep === "job-input" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Job-Specific Interview Prep
              </h1>
              <p className="text-slate-600">
                Practice for a specific role with tailored questions based on the job description
              </p>
            </div>
            <JobDescriptionInput onJobDescriptionReady={handleJobDescriptionReady} />
          </div>
        )}

        {/* Step 2: Resume (Optional) */}
        {currentStep === "resume" && jobDescription && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                Step 2 of 3
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Add Your Resume (Optional)
              </h2>
              <p className="text-slate-600 text-sm">
                Adding your resume helps generate more personalized questions
              </p>
            </div>

            {/* Job Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{jobDescription.title}</h3>
                  <p className="text-sm text-blue-700">{jobDescription.company}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {jobDescription.requirements.nonNegotiable.length} required · {jobDescription.requirements.goodToHave.length} preferred qualifications
                  </p>
                </div>
              </div>
            </div>

            {/* Resume Input */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Paste Your Resume
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here (optional)..."
                className="w-full min-h-[200px] px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("job-input")}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={generateQuestions}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {resumeText ? "Generate Personalized Questions" : "Skip Resume & Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Setup */}
        {currentStep === "setup" && jobDescription && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-3">
                Ready to Start
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Your Interview is Ready
              </h2>
              <p className="text-slate-600 text-sm">
                {questions.length} questions tailored to {jobDescription.title} at {jobDescription.company}
              </p>
            </div>

            {/* Interview Preview */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Interview Overview</h3>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{questions.length}</p>
                  <p className="text-xs text-slate-500">Questions</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">~{Math.ceil(questions.length * 2.5)}</p>
                  <p className="text-xs text-slate-500">Minutes</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">2:00</p>
                  <p className="text-xs text-slate-500">Per Answer</p>
                </div>
              </div>

              {/* Question Categories */}
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-2">Question Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(questions.map((q) => q.category))).map((cat) => (
                    <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                      {cat.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Tips for Success:</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Use the STAR method for behavioral questions</li>
                  <li>• Be specific with examples from your experience</li>
                  <li>• Speak clearly and take your time</li>
                  <li>• Reference the job requirements in your answers</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("resume")}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={startInterview}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Start Interview
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Interview */}
        {currentStep === "interview" && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm text-slate-500">
                  {Math.floor(answerTimer / 60)}:{(answerTimer % 60).toString().padStart(2, "0")} remaining
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Interview Area */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 min-h-[400px] flex flex-col items-center justify-center">
              {interviewPhase === "countdown" && (
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-4xl font-bold text-blue-600">{countdown}</span>
                  </div>
                  <p className="text-slate-600">Get ready...</p>
                </div>
              )}

              {interviewPhase === "question" && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-slate-900 max-w-lg mx-auto">
                    {questions[currentQuestionIndex]?.question}
                  </p>
                  <p className="text-sm text-blue-600 mt-2">Listening to question...</p>
                </div>
              )}

              {interviewPhase === "answering" && (
                <div className="w-full">
                  <div className="text-center mb-6">
                    <p className="text-lg font-medium text-slate-900 mb-2">
                      {questions[currentQuestionIndex]?.question}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      Assessing: {questions[currentQuestionIndex]?.assessing}
                    </p>
                  </div>

                  {/* Recording Indicator */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-slate-400"}`} />
                    <span className="text-sm text-slate-600">
                      {isListening ? "Recording your answer..." : "Not recording"}
                    </span>
                  </div>

                  {/* Transcript */}
                  <div className="bg-slate-50 rounded-xl p-4 min-h-[100px] mb-4">
                    <p className="text-sm text-slate-700">
                      {currentAnswer || "Start speaking your answer..."}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={skipQuestion}
                      className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                    >
                      Skip Question
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={currentAnswer.length < 10}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Submit Answer & Continue
                    </button>
                  </div>
                </div>
              )}

              {interviewPhase === "processing" && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Processing...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Analyzing */}
        {currentStep === "analyzing" && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing Your Interview</h2>
            <p className="text-slate-600">
              Comparing your responses against job requirements...
            </p>
          </div>
        )}

        {/* Step 6: Results */}
        {currentStep === "results" && analysis && jobDescription && (
          <div className="space-y-6">
            <JobInterviewAnalysis
              analysis={analysis}
              jobTitle={jobDescription.title}
              company={jobDescription.company}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium text-center hover:bg-slate-50"
              >
                Back to Home
              </Link>
              <button
                onClick={() => {
                  setCurrentStep("job-input");
                  setJobDescription(null);
                  setResumeText("");
                  setQuestions([]);
                  setTranscript([]);
                  setAnalysis(null);
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                Practice Another Job
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>Made by <a href="https://shaminder.sg" className="text-blue-600 hover:underline">shaminder.sg</a></p>
        </div>
      </footer>
    </div>
  );
}
