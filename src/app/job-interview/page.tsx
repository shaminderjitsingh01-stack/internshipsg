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

type Step = "job-input" | "resume" | "cover-letter" | "setup" | "interview" | "analyzing" | "results";

export default function JobInterviewPage() {
  const { data: session, status } = useSession();

  // Flow state
  const [currentStep, setCurrentStep] = useState<Step>("job-input");
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [coverLetterFileName, setCoverLetterFileName] = useState("");
  const [extractingCoverLetter, setExtractingCoverLetter] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [extractingResume, setExtractingResume] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Interview state
  const [interviewPhase, setInterviewPhase] = useState<"countdown" | "question" | "answering" | "processing">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [answerTimer, setAnswerTimer] = useState(120);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewDuration, setInterviewDuration] = useState<5 | 15 | 30>(15);
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Video states
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const coverLetterFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptRef = useRef<string>("");
  const interviewPhaseRef = useRef<"countdown" | "question" | "answering" | "processing">("countdown");
  const questionIndexRef = useRef<number>(0);

  // Extract text from PDF
  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs";
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
    return fullText.trim();
  };

  // Handle resume file upload
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);
    setExtractingResume(true);

    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else if (file.name.toLowerCase().endsWith(".txt")) {
        text = await file.text();
      } else {
        // For doc/docx, try to read as text
        text = await file.text();
      }
      setResumeText(text);
    } catch (error) {
      console.error("Error extracting resume:", error);
      alert("Could not extract text from file. Please try pasting your resume instead.");
    } finally {
      setExtractingResume(false);
    }
  };

  // Handle cover letter file upload
  const handleCoverLetterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverLetterFileName(file.name);
    setExtractingCoverLetter(true);

    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else if (file.name.toLowerCase().endsWith(".txt")) {
        text = await file.text();
      } else {
        // For doc/docx, try to read as text
        text = await file.text();
      }
      setCoverLetterText(text);
    } catch (error) {
      console.error("Error extracting cover letter:", error);
      alert("Could not extract text from file. Please try pasting your cover letter instead.");
    } finally {
      setExtractingCoverLetter(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera not supported");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => console.log("Video play error:", e));
      }
      setVideoEnabled(true);

      // Start recording
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
        mimeType = "video/webm;codecs=vp9,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
        mimeType = "video/webm;codecs=vp8,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setVideoEnabled(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis?.cancel();
      stopCamera();
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    interviewPhaseRef.current = interviewPhase;
  }, [interviewPhase]);

  useEffect(() => {
    questionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Assign camera stream to video element when phase changes
  useEffect(() => {
    if (
      (interviewPhase === "question" || interviewPhase === "answering" || interviewPhase === "processing") &&
      streamRef.current &&
      videoRef.current
    ) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.log("Video play error:", e));
    }
  }, [interviewPhase]);

  // Handle job description ready
  const handleJobDescriptionReady = (jd: JobDescription) => {
    setJobDescription(jd);
    setCurrentStep("resume");
  };

  // Generate questions from job description
  const generateQuestions = async () => {
    if (!jobDescription) return;

    setGeneratingQuestions(true);
    try {
      const res = await fetch("/api/job-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resume: resumeText || undefined,
          coverLetter: coverLetterText || undefined,
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
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Start the interview
  const startInterview = async () => {
    // Start camera first
    await startCamera();

    setCurrentStep("interview");
    setInterviewPhase("countdown");
    setCountdown(3);

    // Start elapsed time tracking
    const startTime = Date.now();
    setInterviewStartTime(startTime);
    setElapsedTime(0);

    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Check if interview time is up
      if (elapsed >= interviewDuration * 60 && questionIndexRef.current >= 2) {
        // Time's up - end the interview
        if (elapsedTimerRef.current) {
          clearInterval(elapsedTimerRef.current);
          elapsedTimerRef.current = null;
        }
        finishInterview();
      }
    }, 1000);

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
      startListening();
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

    transcriptRef.current = "";
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        setCurrentAnswer(transcriptRef.current);
      }

      // Reset silence timer on any speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // 3 seconds of silence - auto submit and move to next question
        if (transcriptRef.current.length > 10 && interviewPhaseRef.current === "answering") {
          handleAutoSubmit();
        }
      }, 3000);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      // Restart recognition if still in answering phase
      if (interviewPhaseRef.current === "answering" && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition restart error:", e);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Auto-submit when silence detected
  const handleAutoSubmit = () => {
    if (interviewPhaseRef.current !== "answering") return;

    const answer = transcriptRef.current.trim() || "(No response)";

    setInterviewPhase("processing");
    stopListening();

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Add answer to transcript
    setTranscript((prev) => [...prev, { role: "candidate", content: answer }]);
    setCurrentAnswer("");
    transcriptRef.current = "";

    // Move to next question after a brief pause
    setTimeout(() => {
      askQuestion(questionIndexRef.current + 1);
    }, 1000);
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };
  // Finish interview and analyze
  const finishInterview = async () => {
    setCurrentStep("analyzing");
    stopListening();
    stopCamera();

    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

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
          coverLetter: coverLetterText || undefined,
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

        {/* Step 2: Resume (Required) */}
        {currentStep === "resume" && jobDescription && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                Step 2 of 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Add Your Resume
              </h2>
              <p className="text-slate-600 text-sm">
                Your resume helps generate personalized questions for this role
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

            {/* Resume Input Options */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 space-y-4">
              {/* Option 1: File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Option 1: Upload Resume File
                </label>
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <button
                  onClick={() => resumeFileRef.current?.click()}
                  disabled={extractingResume}
                  className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {extractingResume ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-slate-600">Extracting text...</span>
                    </div>
                  ) : resumeFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700 font-medium">{resumeFileName}</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-slate-600">Click to upload PDF, DOC, DOCX, or TXT</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-500">or</span>
                </div>
              </div>

              {/* Option 2: Paste/Type Text */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Option 2: Type or Paste Resume Text
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Type or paste your resume content here..."
                  className="w-full min-h-[200px] px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {resumeText.length} characters
                </p>
              </div>
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
                onClick={() => setCurrentStep("cover-letter")}
                disabled={!resumeText.trim() || resumeText.length < 100}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
            {resumeText.length > 0 && resumeText.length < 100 && (
              <p className="text-sm text-amber-600 text-center">
                Please add more content (minimum 100 characters)
              </p>
            )}
          </div>
        )}

        {/* Step 3: Cover Letter (Optional) */}
        {currentStep === "cover-letter" && jobDescription && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                Step 3 of 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Add Cover Letter (Optional)
              </h2>
              <p className="text-slate-600 text-sm">
                A cover letter helps us understand your motivation for this role
              </p>
            </div>

            {/* Cover Letter Input Options */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 space-y-4">
              {/* Option 1: File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Option 1: Upload Cover Letter File
                </label>
                <input
                  ref={coverLetterFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleCoverLetterUpload}
                  className="hidden"
                />
                <button
                  onClick={() => coverLetterFileRef.current?.click()}
                  disabled={extractingCoverLetter}
                  className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {extractingCoverLetter ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-slate-600">Extracting text...</span>
                    </div>
                  ) : coverLetterFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700 font-medium">{coverLetterFileName}</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-slate-600">Click to upload PDF, DOC, DOCX, or TXT</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-500">or</span>
                </div>
              </div>

              {/* Option 2: Paste/Type Text */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Option 2: Type or Paste Cover Letter Text
                </label>
                <textarea
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  placeholder="Type or paste your cover letter here (optional)..."
                  className="w-full min-h-[200px] px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {coverLetterText.length} characters {coverLetterText.length > 0 && "(optional)"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("resume")}
                disabled={generatingQuestions}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={generateQuestions}
                disabled={generatingQuestions}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {generatingQuestions ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Preparing Interview...</span>
                  </>
                ) : (
                  coverLetterText ? "Continue with Cover Letter" : "Skip & Continue"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Setup */}
        {currentStep === "setup" && jobDescription && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-3">
                Step 4 of 4 - Ready to Start
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Your Interview is Ready
              </h2>
              <p className="text-slate-600 text-sm">
                {questions.length} questions tailored to {jobDescription.title} at {jobDescription.company}
              </p>
            </div>

            {/* Duration Selection */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4 text-center">Select Interview Duration</h3>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                <button
                  onClick={() => setInterviewDuration(5)}
                  className={`relative p-4 sm:p-6 rounded-2xl border-2 transition-all ${
                    interviewDuration === 5
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {interviewDuration === 5 && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">5</div>
                  <div className="text-slate-500 text-xs sm:text-sm">minutes</div>
                  <div className="text-slate-400 text-xs mt-1">Quick Practice</div>
                </button>
                <button
                  onClick={() => setInterviewDuration(15)}
                  className={`relative p-4 sm:p-6 rounded-2xl border-2 transition-all ${
                    interviewDuration === 15
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {interviewDuration === 15 && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Popular</div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">15</div>
                  <div className="text-slate-500 text-xs sm:text-sm">minutes</div>
                  <div className="text-slate-400 text-xs mt-1">Standard</div>
                </button>
                <button
                  onClick={() => setInterviewDuration(30)}
                  className={`relative p-4 sm:p-6 rounded-2xl border-2 transition-all ${
                    interviewDuration === 30
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {interviewDuration === 30 && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">30</div>
                  <div className="text-slate-500 text-xs sm:text-sm">minutes</div>
                  <div className="text-slate-400 text-xs mt-1">Deep Practice</div>
                </button>
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
                  <li>• Speak naturally - the interview flows like a real conversation</li>
                  <li>• Use the STAR method for behavioral questions</li>
                  <li>• Be specific with examples from your experience</li>
                  <li>• The AI will automatically move to the next question after you finish speaking</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("cover-letter")}
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

        {/* Step 5: Interview - Premium Dark Layout */}
        {currentStep === "interview" && (
          <div className="fixed inset-0 bg-slate-900 z-50 overflow-auto">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/90 to-transparent p-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <img src="/logo.png" alt="Internship.sg" className="h-8 w-auto brightness-0 invert" />
                  <span className="font-medium text-white/80">Job Interview</span>
                </Link>
                <div className="flex items-center gap-4">
                  {isRecording && (
                    <span className="flex items-center gap-2 text-sm bg-red-600 px-3 py-1 rounded-full text-white">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      REC
                    </span>
                  )}
                  <span className="text-white/60 text-sm">Q{currentQuestionIndex + 1}/{questions.length}</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="min-h-screen flex items-center justify-center p-4 pt-20">
              {/* Countdown Phase */}
              {interviewPhase === "countdown" && (
                <div className="text-center">
                  <div className="text-9xl font-bold text-red-500 mb-4 transition-all duration-300" key={countdown}>
                    {countdown}
                  </div>
                  <p className="text-white/70 text-xl">Get ready...</p>
                </div>
              )}

              {/* Interview Active Phases */}
              {(interviewPhase === "question" || interviewPhase === "answering" || interviewPhase === "processing") && (
                <div className="w-full max-w-6xl flex flex-col gap-6">
                  {/* Header Bar */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-white/60 text-sm font-medium tracking-wide uppercase">{interviewDuration} Min Interview</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/40 text-sm">Q{currentQuestionIndex + 1}/{questions.length}</span>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`font-mono text-sm ${
                          elapsedTime >= (interviewDuration * 60 - 60) ? "text-red-400" : "text-white/70"
                        }`}>
                          {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} / {interviewDuration}:00
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Main Video - Large & Centered */}
                  <div className="relative">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl overflow-hidden aspect-video max-h-[50vh] shadow-2xl shadow-black/50 border border-white/5">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                      {/* Status Badge */}
                      <div className="absolute top-6 left-6">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                          {isSpeaking ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                              <span className="text-sm font-medium text-white/90">AI Speaking</span>
                            </>
                          ) : isListening ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                              <span className="text-sm font-medium text-white/90">Listening</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-green-400"></div>
                              <span className="text-sm font-medium text-white/90">Ready</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sound Visualizer */}
                      {isListening && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                          <div className="flex items-end gap-1 h-8 px-6 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                            {[...Array(12)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-red-400 rounded-full animate-pulse"
                                style={{
                                  height: `${Math.random() * 16 + 8}px`,
                                  animationDelay: `${i * 0.05}s`,
                                  animationDuration: '0.5s'
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Cards */}
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* AI Question Card */}
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-semibold">AI Interviewer</p>
                          <p className="text-white/40 text-xs">Assessing: {questions[currentQuestionIndex]?.assessing}</p>
                        </div>
                      </div>
                      <p className="text-white/90 text-lg leading-relaxed">{questions[currentQuestionIndex]?.question || "Loading question..."}</p>
                    </div>

                    {/* Your Answer Card */}
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-semibold">Your Answer</p>
                          <p className="text-white/40 text-xs">{isListening ? "Listening..." : "Speak when ready"}</p>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed min-h-[60px]">
                        {currentAnswer || (interviewPhase === "processing" ? "Processing your answer..." : "Start speaking your answer...")}
                      </p>
                    </div>
                  </div>

                  {/* Info - Conversational Flow */}
                  <div className="flex justify-center mt-2">
                    <div className="bg-white/5 rounded-full px-4 py-2 text-white/50 text-sm">
                      Speak naturally - the AI will respond after you finish
                    </div>
                  </div>
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
                  setCoverLetterText("");
                  setResumeFileName("");
                  setCoverLetterFileName("");
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
