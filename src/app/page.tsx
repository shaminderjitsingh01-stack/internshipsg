"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";

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

// Types
interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
}

interface QuestionBreakdown {
  question: string;
  answerSummary: string;
  score: number;
  whatWentWell: string;
  improvement: string;
  idealAnswer: string;
}

interface ConfidenceIndicators {
  overallConfidence: number;
  fillerWordsCount: "low" | "medium" | "high";
  answerStructure: "good" | "needs-work";
  specificExamples: "used" | "lacking";
  enthusiasmLevel: "high" | "medium" | "low";
}

interface ComparisonToTopPerformers {
  percentile: number;
  aboveAverage: string[];
  belowAverage: string[];
}

interface ResultsData {
  resumeTips: string[];
  coverLetterTips: string[];
  prepTips: string[];
  softSkills: { skill: string; tip: string }[];
  interviewScore: number;
  interviewFeedback: string;
  // Detailed scores
  communicationScore?: number;
  communicationFeedback?: string;
  technicalScore?: number;
  technicalFeedback?: string;
  softSkillsScore?: number;
  softSkillsFeedback?: string;
  strengths?: string[];
  areasToImprove?: string[];
  // Question-by-question breakdown
  questionBreakdown?: QuestionBreakdown[];
  // Confidence analysis
  confidenceIndicators?: ConfidenceIndicators;
  // Comparison to others
  comparisonToTopPerformers?: ComparisonToTopPerformers;
}

type Step = "landing" | "choose-mode" | "career" | "resume" | "cover-letter" | "interview" | "results";

export default function Home() {
  const { data: session, status } = useSession();

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>("landing");

  // Check for start parameter to auto-start interview flow
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = urlParams.get("start");
      if (startParam === "interview" && status === "authenticated") {
        setCurrentStep("choose-mode");
        // Clear the URL parameter
        window.history.replaceState({}, "", "/");
      }
    }
  }, [status]);

  // User data
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    targetRole: "",
    experience: "no-internship",
  });
  const [resumeText, setResumeText] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");

  // Interview state
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [interviewDuration, setInterviewDuration] = useState<2 | 5 | 15 | 30>(2);
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Video interview states
  const [interviewPhase, setInterviewPhase] = useState<"setup" | "countdown" | "question" | "answering" | "confirming" | "processing" | "paused" | "complete">("setup");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answerTimer, setAnswerTimer] = useState(120); // 2 minutes per answer
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastSpeechTime, setLastSpeechTime] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const interviewPhaseRef = useRef<"setup" | "countdown" | "question" | "answering" | "confirming" | "processing" | "paused" | "complete">("setup");
  const questionNumberRef = useRef<number>(0);
  const interviewMessagesRef = useRef<InterviewMessage[]>([]);
  const silencePromptCountRef = useRef<number>(0);
  const noSpeechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const listeningStartTimeRef = useRef<number>(0);

  // Results
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Video interview
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Extract text from PDF client-side
  const extractPdfText = async (file: File): Promise<string> => {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist");

    // Use CDN worker matching our installed version
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

  // Start camera and recording
  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported in this browser. Please use Chrome or Edge.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        await videoRef.current.play().catch(e => console.log("Video play error:", e));
      }
      setVideoEnabled(true);

      // Start recording with supported mimeType
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
        mimeType = "video/webm;codecs=vp9,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
        mimeType = "video/webm;codecs=vp8,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
    } catch (err: unknown) {
      console.error("Camera error:", err);
      const error = err as Error & { name?: string };
      if (error.name === "NotAllowedError") {
        setError("Camera permission denied. Please click the camera icon in your browser's address bar and allow access.");
      } else if (error.name === "NotFoundError") {
        setError("No camera found. Please connect a camera and try again.");
      } else if (error.name === "NotReadableError") {
        setError("Camera is being used by another application. Please close other apps using the camera.");
      } else {
        setError(`Camera error: ${error.message || "Could not access camera. Please check permissions."}`);
      }
    }
  };

  // Stop camera and recording
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

  // Upload recorded video
  const uploadVideo = async (): Promise<string | null> => {
    if (recordedChunks.length === 0) return null;

    setUploadingVideo(true);
    try {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const formData = new FormData();
      formData.append("video", blob, "interview.webm");
      formData.append("userEmail", profile.email);

      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      return data.url;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    } finally {
      setUploadingVideo(false);
    }
  };

  // Save interview to database
  const saveInterview = async (videoUrl: string | null, score: number, feedback: string) => {
    try {
      await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: profile.email,
          userName: profile.name,
          targetRole: profile.targetRole,
          videoUrl,
          transcript: interviewMessages,
          score,
          feedback,
        }),
      });
    } catch (err) {
      console.error("Save interview error:", err);
    }
  };

  // Select and cache the best voice for consistent speech
  const selectVoice = (): SpeechSynthesisVoice | null => {
    // Return cached voice if available
    if (cachedVoiceRef.current) {
      return cachedVoiceRef.current;
    }

    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Priority order: Premium/Neural voices first, then standard female voices
    const preferredVoices = [
      // Windows natural voices (Edge/Chrome)
      "Microsoft Aria Online (Natural)",
      "Microsoft Jenny Online (Natural)",
      "Microsoft Zira",
      "Microsoft Zira Desktop",
      // Google voices
      "Google UK English Female",
      "Google US English Female",
      // macOS voices
      "Samantha",
      "Karen",
      "Victoria",
      "Allison",
      // Generic female matches
      "Female",
      "female",
    ];

    let selectedVoice: SpeechSynthesisVoice | null = null;
    for (const preferred of preferredVoices) {
      const found = voices.find(v => v.name.includes(preferred));
      if (found) {
        selectedVoice = found;
        break;
      }
    }

    // Fallback: find any English female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v =>
        v.lang.startsWith("en") &&
        (v.name.toLowerCase().includes("female") ||
         v.name.includes("Zira") ||
         v.name.includes("Samantha") ||
         v.name.includes("Karen"))
      ) || null;
    }

    // Cache the selected voice for future use
    if (selectedVoice) {
      cachedVoiceRef.current = selectedVoice;
    }

    return selectedVoice;
  };

  // Text-to-speech for AI interviewer - natural female voice
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for more natural pacing
      utterance.pitch = 1.05; // Slightly higher for warmth
      utterance.volume = 1;

      // Use cached voice for consistency
      const voice = selectVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      speechSynthesis.speak(utterance);
    });
  };

  // Handle silence - prompt user if they haven't spoken
  const handleSilenceCheck = async () => {
    if (interviewPhaseRef.current !== "answering") return;

    // Only check if no speech has been detected yet
    const hasSpoken = transcriptRef.current.trim().length > 0 || interimTranscriptRef.current.trim().length > 0;

    if (!hasSpoken) {
      silencePromptCountRef.current += 1;

      if (silencePromptCountRef.current === 1) {
        // First prompt - ask if they're there
        await speakText("Are you still there? Take your time, I'm ready when you are.");
        startNoSpeechTimer();
      } else if (silencePromptCountRef.current === 2) {
        // Second prompt
        await speakText("No worries if you need a moment. Let me know when you're ready to continue.");
        startNoSpeechTimer();
      } else {
        // After 2 prompts, move to next question
        await speakText("Let's move on to the next question.");
        handleAutoSubmit();
      }
    }
  };

  // Start timer to check for no speech
  const startNoSpeechTimer = () => {
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current);
    }
    noSpeechTimerRef.current = setTimeout(() => {
      handleSilenceCheck();
    }, 10000); // 10 seconds
  };

  // Voice command handlers
  const handleVoiceCommand = async (text: string): Promise<boolean> => {
    const lowerText = text.toLowerCase().trim();

    // Check for stop command
    if (lowerText.includes("stop interview") || lowerText.includes("stop the interview") ||
        lowerText.includes("end interview") || lowerText.includes("end the interview") ||
        (lowerText.includes("stop") && lowerText.length < 20)) {
      await handleStopInterview();
      return true;
    }

    // Check for pause command
    if (lowerText.includes("pause interview") || lowerText.includes("pause the interview") ||
        (lowerText.includes("pause") && lowerText.length < 20)) {
      await handlePauseInterview();
      return true;
    }

    return false;
  };

  const handleStopInterview = async () => {
    stopListening();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }

    await speakText("It's alright, we'll continue another time. Great effort today!");
    setInterviewPhase("complete");
    setInterviewComplete(true);
  };

  const handlePauseInterview = async () => {
    stopListening();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }

    await speakText("Interview paused. Say 'resume' when you're ready to continue.");
    setInterviewPhase("paused");

    // Start listening for resume command
    startListeningForResume();
  };

  const handleResumeInterview = async () => {
    stopListening();
    await speakText("Welcome back! Let's continue where we left off.");

    // Resume the elapsed timer
    const startTime = interviewStartTime;
    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    setInterviewPhase("answering");
    startListening();

    // Restart answer timer
    timerRef.current = setInterval(() => {
      setAnswerTimer(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startListeningForResume = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.toLowerCase();
        if (text.includes("resume") || text.includes("continue") || text.includes("start")) {
          recognition.stop();
          handleResumeInterview();
          return;
        }
      }
    };

    recognition.onend = () => {
      // Keep listening for resume if still paused
      if (interviewPhaseRef.current === "paused") {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart recognition for resume:", e);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Speech recognition for candidate answers with auto-detection
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }

    // Reset silence prompt count when starting to listen
    silencePromptCountRef.current = 0;
    listeningStartTimeRef.current = Date.now();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Start the no-speech timer
    startNoSpeechTimer();

    recognition.onresult = (event) => {
      // Reset silence timer on any speech activity
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      // Reset no-speech timer since user is speaking
      if (noSpeechTimerRef.current) {
        clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = null;
      }
      silencePromptCountRef.current = 0; // Reset prompt count since user spoke

      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + " ";
        } else {
          interimTranscript += text;
        }
      }

      // Update transcript with final results
      if (finalTranscript) {
        // Check for voice commands first
        handleVoiceCommand(finalTranscript).then(isCommand => {
          if (isCommand) return; // Command was handled, don't process as answer
        });

        const newTranscript = transcriptRef.current + finalTranscript;
        transcriptRef.current = newTranscript;
        interimTranscriptRef.current = ""; // Clear interim when we get final
        setTranscript(newTranscript);
      }

      // Track interim results for fallback
      if (interimTranscript) {
        interimTranscriptRef.current = interimTranscript;
        setTranscript(transcriptRef.current + interimTranscript);
      }

      setLastSpeechTime(Date.now());

      // Start silence timer after ANY speech activity (interim or final)
      // This ensures we advance even if the API is slow to finalize
      silenceTimerRef.current = setTimeout(() => {
        // Get the best available transcript (final + any pending interim)
        const fullTranscript = (transcriptRef.current + interimTranscriptRef.current).trim();
        if (fullTranscript.length > 10) {
          // If we have pending interim results, add them to the final transcript
          if (interimTranscriptRef.current) {
            transcriptRef.current = transcriptRef.current + interimTranscriptRef.current;
            interimTranscriptRef.current = "";
          }
          handleAutoSubmit();
        }
      }, 4000);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // Restart if still listening
      if (isListening && interviewPhase === "answering") {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart recognition:", e);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Auto-submit when silence detected
  const handleAutoSubmit = async () => {
    // Use ref to get current phase (avoids stale closure in setTimeout)
    if (interviewPhaseRef.current !== "answering") return;

    // Use ref for current transcript value (avoids stale closure)
    const currentTranscript = transcriptRef.current.trim();

    // Only auto-submit if user has said something meaningful
    if (currentTranscript.length > 10) {
      // Notify user we're moving on
      setInterviewPhase("processing");
      stopListening();

      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Save answer and get next question
      const userMessage: InterviewMessage = { role: "user", content: currentTranscript };
      interviewMessagesRef.current = [...interviewMessagesRef.current, userMessage];
      setInterviewMessages(prev => [...prev, userMessage]);
      transcriptRef.current = "";
      interimTranscriptRef.current = "";
      setTranscript("");
      setAnswerTimer(120);

      // Get next question
      await askNextQuestion();
    }
  };

  // Manual submit button
  const manualSubmit = async () => {
    if (interviewPhase !== "answering") return;

    setInterviewPhase("processing");
    stopListening();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Include any pending interim transcript
    const answer = (transcriptRef.current + interimTranscriptRef.current).trim() || "(No response provided)";
    const userMessage: InterviewMessage = { role: "user", content: answer };
    interviewMessagesRef.current = [...interviewMessagesRef.current, userMessage];
    setInterviewMessages(prev => [...prev, userMessage]);
    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
    setAnswerTimer(120);

    await askNextQuestion();
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }
  };

  // Start the video interview
  const startVideoInterview = async () => {
    // Start camera first
    await startCamera();

    // 3 second countdown
    setInterviewPhase("countdown");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start elapsed time tracking
    const startTime = Date.now();
    setInterviewStartTime(startTime);
    setElapsedTime(0);

    // Update elapsed time every second
    elapsedTimerRef.current = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Check if interview time is up AND minimum questions answered
      // Minimum 2 questions required (questionNumberRef >= 3 means 2 Q&As completed)
      const minQuestionsCompleted = questionNumberRef.current >= 3;
      if (elapsed >= interviewDuration * 60 && minQuestionsCompleted) {
        // Time's up and minimum questions answered - end the interview
        if (elapsedTimerRef.current) {
          clearInterval(elapsedTimerRef.current);
          elapsedTimerRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (noSpeechTimerRef.current) {
          clearTimeout(noSpeechTimerRef.current);
          noSpeechTimerRef.current = null;
        }
        stopListening();

        // Speak completion message then show complete screen
        await speakText("That's all the time we have for today. Great job completing this practice session!");
        setInterviewPhase("complete");
        setInterviewComplete(true);
      }
    }, 1000);

    // Get first question
    await askNextQuestion();
  };

  // Ask the next question
  const askNextQuestion = async () => {
    // Calculate remaining time
    const currentElapsed = interviewStartTime > 0 ? Math.floor((Date.now() - interviewStartTime) / 1000) : 0;
    const totalSeconds = interviewDuration * 60;
    const remainingSeconds = Math.max(0, totalSeconds - currentElapsed);

    // If less than 40 seconds left AND at least 2 questions answered, wrap up the interview
    // Minimum 2 questions required before ending (questionNumber >= 3 means we've completed 2 Q&As)
    const minimumQuestionsAnswered = questionNumberRef.current >= 3;
    if (remainingSeconds <= 40 && minimumQuestionsAnswered) {
      // Stop all timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      stopListening();

      // Give closing remarks
      setInterviewPhase("processing");
      await speakText("We're almost out of time, so let me wrap up. Thank you so much for practicing with me today. You did a great job, and I can see your potential. Remember, every interview is a chance to learn and grow. Keep practicing, and you'll ace your real interviews. Good luck!");

      setInterviewPhase("complete");
      setInterviewComplete(true);
      return;
    }

    const isTimeUp = remainingSeconds <= 60; // Less than 1 minute = last question

    setInterviewPhase("question");
    setInterviewLoading(true);
    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
    setAnswerTimer(120);

    try {
      // Use refs to get current values (avoids stale closures in async callbacks)
      const currentQuestionNum = questionNumberRef.current;
      const currentMessages = interviewMessagesRef.current;

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: currentQuestionNum === 0 ? "start" : "respond",
          messages: currentMessages,
          userProfile: {
            name: profile.name,
            targetRole: profile.targetRole,
            experience: profile.experience,
          },
          resumeText,
          coverLetterText,
          interviewDuration,
          elapsedMinutes: Math.floor(currentElapsed / 60),
          remainingMinutes: Math.floor(remainingSeconds / 60),
          isTimeUp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentQuestion(data.message);
      setQuestionNumber(data.questionNumber);
      questionNumberRef.current = data.questionNumber;
      const assistantMessage: InterviewMessage = { role: "assistant", content: data.message };
      interviewMessagesRef.current = [...interviewMessagesRef.current, assistantMessage];
      setInterviewMessages(prev => [...prev, assistantMessage]);

      // Speak the question
      await speakText(data.message);

      if (data.isComplete || isTimeUp) {
        // Stop elapsed timer
        if (elapsedTimerRef.current) {
          clearInterval(elapsedTimerRef.current);
        }
        setInterviewPhase("complete");
        setInterviewComplete(true);
      } else {
        // Start listening for answer
        setInterviewPhase("answering");
        startListening();

        // Start answer timer as backup (2 minutes max)
        timerRef.current = setInterval(() => {
          setAnswerTimer(prev => {
            if (prev <= 1) {
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get question");
    } finally {
      setInterviewLoading(false);
    }
  };

  // Submit the candidate's answer

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Pre-cache voice when voices load (they load asynchronously)
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Try to select voice immediately
      selectVoice();

      // Also listen for voices to load (Chrome loads them async)
      speechSynthesis.onvoiceschanged = () => {
        selectVoice();
      };
    }
  }, []);

  // Keep refs in sync for closure-safe access
  useEffect(() => {
    interviewPhaseRef.current = interviewPhase;
  }, [interviewPhase]);

  useEffect(() => {
    questionNumberRef.current = questionNumber;
  }, [questionNumber]);

  useEffect(() => {
    interviewMessagesRef.current = interviewMessages;
  }, [interviewMessages]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewMessages]);

  // Handle OAuth sign-in - only populate profile, don't auto-redirect
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setProfile(prev => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || "",
      }));
      // Don't auto-redirect - let user click "Get Started"
    }
  }, [session, status]);

  // Step indicator
  const steps = [
    { id: "career", label: "Career", num: 1 },
    { id: "resume", label: "Resume", num: 2 },
    { id: "cover-letter", label: "Cover Letter", num: 3 },
    { id: "interview", label: "Interview", num: 4 },
    { id: "results", label: "Results", num: 5 },
  ];

  const currentStepNum = steps.findIndex(s => s.id === currentStep) + 1;

  // Start interview
  const startInterview = async () => {
    setInterviewMessages([]);
    setInterviewComplete(false);
    setInterviewLoading(true);
    setQuestionNumber(1);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          userProfile: {
            name: profile.name,
            targetRole: profile.targetRole,
            experience: profile.experience,
          },
          resumeText,
          coverLetterText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInterviewMessages([{ role: "assistant", content: data.message }]);
      setQuestionNumber(data.questionNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setInterviewLoading(false);
    }
  };

  // Send interview response
  const sendInterviewResponse = async () => {
    if (!interviewInput.trim() || interviewLoading) return;

    const userMessage = interviewInput.trim();
    setInterviewInput("");
    setInterviewLoading(true);

    const newMessages: InterviewMessage[] = [...interviewMessages, { role: "user", content: userMessage }];
    setInterviewMessages(newMessages);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          messages: newMessages,
          userProfile: {
            name: profile.name,
            targetRole: profile.targetRole,
            experience: profile.experience,
          },
          resumeText,
          coverLetterText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInterviewMessages([...newMessages, { role: "assistant", content: data.message }]);
      setQuestionNumber(data.questionNumber);

      if (data.isComplete) {
        setInterviewComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send response");
    } finally {
      setInterviewLoading(false);
    }
  };

  // Generate results and save interview
  const generateResults = async (videoUrl?: string | null) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          resumeText,
          coverLetterText,
          interviewTranscript: interviewMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save interview with results
      if (profile.email) {
        await saveInterview(videoUrl || null, data.interviewScore, data.interviewFeedback);
      }

      setResults(data);
      setCurrentStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate results");
    } finally {
      setLoading(false);
    }
  };

  // Reset and start over
  const startOver = () => {
    setCurrentStep("career");
    setProfile({ name: "", email: "", targetRole: "", experience: "student" });
    setResumeText("");
    setCoverLetterText("");
    setInterviewMessages([]);
    setInterviewComplete(false);
    setResults(null);
    setError("");
  };

  // ==================== LANDING PAGE ====================
  if (currentStep === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        {/* Nav */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <a href="/">
              <img src="/logo.png" alt="Internship.sg" className="h-10 sm:h-12 w-auto" />
            </a>
          </div>
        </nav>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            AI-Powered Interview Prep
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4 sm:mb-6">
            Ace Your Internship
            <span className="text-red-600 block">Interview</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
            Complete our 4-step preparation system: Career Profile → Resume → Cover Letter → Mock Interview.
            Get instant AI feedback and personalized tips.
          </p>

          {/* Sign In Options */}
          <div className="max-w-sm mx-auto space-y-3">
            {status === "authenticated" ? (
              <>
                <a
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                >
                  Go to Dashboard
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <button
                  onClick={() => setCurrentStep("choose-mode")}
                  className="w-full px-6 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-red-300 hover:bg-red-50 transition-all"
                >
                  Start Interview Prep →
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-gradient-to-br from-red-50 to-white text-slate-500">or</span>
                  </div>
                </div>

                <a
                  href="/auth/signin"
                  className="w-full block px-6 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-center"
                >
                  Get Started →
                </a>
              </>
            )}
          </div>

          {/* Steps Preview */}
          <div className="mt-10 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
            {[
              { num: 1, title: "Career Profile", desc: "Tell us your target role" },
              { num: 2, title: "Resume", desc: "Paste your resume" },
              { num: 3, title: "Cover Letter", desc: "Add your cover letter" },
              { num: 4, title: "Mock Interview", desc: "Practice with AI" },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm mb-2">
                  {step.num}
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Employer Visibility Disclaimer */}
          <div className="mt-8 sm:mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6 text-left">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Your profile could be seen by future employer partners</h3>
                <p className="text-xs sm:text-sm text-blue-700">
                  We're building connections with companies seeking internship-ready students.
                  Staying active and completing practice sessions may increase your visibility to potential employers
                  — however, employer contact is not guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-6 sm:py-8 mt-12 sm:mt-20">
          <div className="max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm text-slate-500">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
              <a href="/roadmap" className="hover:text-red-600 transition-colors">Roadmap</a>
              <a href="/about" className="hover:text-red-600 transition-colors">About</a>
              <a href="/sitemap.xml" className="hover:text-red-600 transition-colors">Sitemap</a>
            </div>
            <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
            <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
          </div>
        </footer>
      </div>
    );
  }

  // ==================== STEP LAYOUT WRAPPER ====================
  const StepLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/">
            <img src="/logo.png" alt="Internship.sg" className="h-10 w-auto" />
          </a>
          <button onClick={startOver} className="text-sm text-slate-500 hover:text-red-600">
            Start Over
          </button>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStepNum > step.num
                  ? "bg-green-500 text-white"
                  : currentStepNum === step.num
                    ? "bg-red-600 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}>
                {currentStepNum > step.num ? "✓" : step.num}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-12 sm:w-20 h-1 mx-1 ${
                  currentStepNum > step.num ? "bg-green-500" : "bg-slate-200"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          {steps.map(step => (
            <span key={step.id} className={currentStepNum === step.num ? "text-red-600 font-medium" : ""}>
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
          <p className="text-slate-600">{subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {children}
      </div>
    </div>
  );

  // ==================== STEP 0: CHOOSE MODE ====================
  if (currentStep === "choose-mode") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <a href="/">
              <img src="/logo.png" alt="Internship.sg" className="h-8 sm:h-10 w-auto" />
            </a>
            {session && (
              <a href="/dashboard" className="text-sm text-slate-600 hover:text-red-600">
                Dashboard
              </a>
            )}
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Choose Your Prep Mode
            </h1>
            <p className="text-slate-600">
              How would you like to practice today?
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Option 1: General Interview */}
            <button
              onClick={() => setCurrentStep("career")}
              className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200 hover:border-red-400 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">General Interview Prep</h2>
              <p className="text-slate-600 text-sm mb-4">
                Choose your target career field and experience level. Get general interview questions to practice common scenarios.
              </p>
              <ul className="text-sm text-slate-500 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Choose from 10+ career fields
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> General behavioral questions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Resume & cover letter tips
                </li>
              </ul>
              <div className="mt-6 flex items-center text-red-600 font-semibold">
                Start General Prep
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>

            {/* Option 2: Job-Specific Interview */}
            <a
              href="/job-interview"
              className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Job-Specific Interview</h2>
              <p className="text-slate-600 text-sm mb-4">
                Paste a job URL or description. Get tailored questions based on specific job requirements.
              </p>
              <ul className="text-sm text-slate-500 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Supports LinkedIn, Indeed, etc.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Role-specific questions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Requirement match analysis
                </li>
              </ul>
              <div className="mt-6 flex items-center text-blue-600 font-semibold">
                Start Job-Specific Prep
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </a>
          </div>

          {/* Back button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setCurrentStep("landing")}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 1: CAREER PROFILE ====================
  if (currentStep === "career") {
    return (
      <StepLayout title="Career Profile" subtitle="Tell us about yourself and your target role">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="john@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Industry</label>
            <select
              value={profile.targetRole}
              onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select an industry...</option>
              <optgroup label="Technology & IT">
                <option value="Software Development">Software Development</option>
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="Artificial Intelligence / Machine Learning">Artificial Intelligence / Machine Learning</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile App Development">Mobile App Development</option>
                <option value="IT Support & Infrastructure">IT Support & Infrastructure</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Product Management (Tech)">Product Management (Tech)</option>
                <option value="DevOps & Site Reliability">DevOps & Site Reliability</option>
                <option value="Game Development">Game Development</option>
              </optgroup>
              <optgroup label="Finance & Banking">
                <option value="Investment Banking">Investment Banking</option>
                <option value="Corporate Finance">Corporate Finance</option>
                <option value="Financial Analysis">Financial Analysis</option>
                <option value="Accounting & Audit">Accounting & Audit</option>
                <option value="Risk Management">Risk Management</option>
                <option value="Wealth Management">Wealth Management</option>
                <option value="FinTech">FinTech</option>
                <option value="Insurance">Insurance</option>
                <option value="Private Equity / Venture Capital">Private Equity / Venture Capital</option>
              </optgroup>
              <optgroup label="Marketing & Communications">
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Content Marketing">Content Marketing</option>
                <option value="Social Media Marketing">Social Media Marketing</option>
                <option value="Brand Management">Brand Management</option>
                <option value="Public Relations">Public Relations</option>
                <option value="Advertising">Advertising</option>
                <option value="Market Research">Market Research</option>
                <option value="SEO / SEM">SEO / SEM</option>
                <option value="Communications">Communications</option>
              </optgroup>
              <optgroup label="Sales & Business Development">
                <option value="Sales">Sales</option>
                <option value="Business Development">Business Development</option>
                <option value="Account Management">Account Management</option>
                <option value="Retail Sales">Retail Sales</option>
                <option value="B2B Sales">B2B Sales</option>
              </optgroup>
              <optgroup label="Consulting & Strategy">
                <option value="Management Consulting">Management Consulting</option>
                <option value="Strategy Consulting">Strategy Consulting</option>
                <option value="Business Analysis">Business Analysis</option>
                <option value="Operations Consulting">Operations Consulting</option>
              </optgroup>
              <optgroup label="Human Resources">
                <option value="HR Generalist">HR Generalist</option>
                <option value="Talent Acquisition / Recruitment">Talent Acquisition / Recruitment</option>
                <option value="Learning & Development">Learning & Development</option>
                <option value="Compensation & Benefits">Compensation & Benefits</option>
                <option value="HR Analytics">HR Analytics</option>
              </optgroup>
              <optgroup label="Healthcare & Life Sciences">
                <option value="Healthcare Administration">Healthcare Administration</option>
                <option value="Pharmaceutical">Pharmaceutical</option>
                <option value="Biotechnology">Biotechnology</option>
                <option value="Medical Devices">Medical Devices</option>
                <option value="Clinical Research">Clinical Research</option>
                <option value="Public Health">Public Health</option>
                <option value="Nursing">Nursing</option>
              </optgroup>
              <optgroup label="Engineering">
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Chemical Engineering">Chemical Engineering</option>
                <option value="Aerospace Engineering">Aerospace Engineering</option>
                <option value="Environmental Engineering">Environmental Engineering</option>
                <option value="Industrial Engineering">Industrial Engineering</option>
              </optgroup>
              <optgroup label="Legal">
                <option value="Corporate Law">Corporate Law</option>
                <option value="Litigation">Litigation</option>
                <option value="Intellectual Property">Intellectual Property</option>
                <option value="Compliance">Compliance</option>
                <option value="Legal Operations">Legal Operations</option>
              </optgroup>
              <optgroup label="Media & Entertainment">
                <option value="Journalism">Journalism</option>
                <option value="Film & Video Production">Film & Video Production</option>
                <option value="Music Industry">Music Industry</option>
                <option value="Broadcasting">Broadcasting</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Animation">Animation</option>
              </optgroup>
              <optgroup label="Education">
                <option value="Teaching">Teaching</option>
                <option value="EdTech">EdTech</option>
                <option value="Curriculum Development">Curriculum Development</option>
                <option value="Educational Administration">Educational Administration</option>
              </optgroup>
              <optgroup label="Hospitality & Tourism">
                <option value="Hotel Management">Hotel Management</option>
                <option value="Event Management">Event Management</option>
                <option value="Travel & Tourism">Travel & Tourism</option>
                <option value="Food & Beverage">Food & Beverage</option>
              </optgroup>
              <optgroup label="Real Estate & Construction">
                <option value="Real Estate">Real Estate</option>
                <option value="Property Management">Property Management</option>
                <option value="Construction Management">Construction Management</option>
                <option value="Architecture">Architecture</option>
              </optgroup>
              <optgroup label="Supply Chain & Logistics">
                <option value="Supply Chain Management">Supply Chain Management</option>
                <option value="Logistics">Logistics</option>
                <option value="Procurement">Procurement</option>
                <option value="Warehouse Operations">Warehouse Operations</option>
              </optgroup>
              <optgroup label="Manufacturing">
                <option value="Production Management">Production Management</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Process Engineering">Process Engineering</option>
              </optgroup>
              <optgroup label="Government & Public Sector">
                <option value="Public Administration">Public Administration</option>
                <option value="Policy Analysis">Policy Analysis</option>
                <option value="Urban Planning">Urban Planning</option>
                <option value="International Relations">International Relations</option>
              </optgroup>
              <optgroup label="Non-Profit & Social Impact">
                <option value="Non-Profit Management">Non-Profit Management</option>
                <option value="Social Work">Social Work</option>
                <option value="Sustainability / ESG">Sustainability / ESG</option>
                <option value="Community Development">Community Development</option>
              </optgroup>
              <optgroup label="E-commerce & Retail">
                <option value="E-commerce">E-commerce</option>
                <option value="Retail Management">Retail Management</option>
                <option value="Merchandising">Merchandising</option>
                <option value="Customer Experience">Customer Experience</option>
              </optgroup>
              <optgroup label="Other">
                <option value="General Business">General Business</option>
                <option value="Entrepreneurship / Startups">Entrepreneurship / Startups</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Other">Other</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
            <select
              value={profile.experience}
              onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <optgroup label="Student">
                <option value="secondary-student">Secondary School Student</option>
                <option value="jc-student">JC / Pre-University Student</option>
                <option value="poly-student">Polytechnic Student</option>
                <option value="ite-student">ITE Student</option>
                <option value="uni-year1-2">University Year 1-2</option>
                <option value="uni-year3-4">University Year 3-4</option>
                <option value="masters-student">Masters / Postgraduate Student</option>
              </optgroup>
              <optgroup label="Fresh Graduate">
                <option value="fresh-grad-poly">Fresh Graduate (Polytechnic)</option>
                <option value="fresh-grad-uni">Fresh Graduate (University)</option>
                <option value="fresh-grad-masters">Fresh Graduate (Masters)</option>
              </optgroup>
              <optgroup label="Working Professional">
                <option value="0-1-years">0-1 Years Experience</option>
                <option value="1-2-years">1-2 Years Experience</option>
                <option value="2-3-years">2-3 Years Experience</option>
                <option value="3-5-years">3-5 Years Experience</option>
                <option value="5+-years">5+ Years Experience</option>
                <option value="career-switcher">Career Switcher</option>
              </optgroup>
              <optgroup label="Internship Experience">
                <option value="no-internship">No internship experience</option>
                <option value="1-internship">Completed 1 internship</option>
                <option value="2-internships">Completed 2 internships</option>
                <option value="3+-internships">Completed 3+ internships</option>
              </optgroup>
            </select>
          </div>

          <button
            onClick={() => setCurrentStep("resume")}
            disabled={!profile.name || !profile.targetRole}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Add Resume →
          </button>
        </div>
      </StepLayout>
    );
  }

  // ==================== STEP 2: RESUME ====================
  if (currentStep === "resume") {
    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError("");

      try {
        const fileName = file.name.toLowerCase();

        // Handle PDF client-side
        if (fileName.endsWith(".pdf")) {
          const text = await extractPdfText(file);
          if (!text.trim()) {
            throw new Error("Could not extract text from PDF. Please paste the text instead.");
          }
          setResumeText(text);
        } else {
          // Handle DOCX and TXT server-side
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/parse-resume", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setResumeText(data.text);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file");
      } finally {
        setLoading(false);
      }
    };

    return (
      <StepLayout title="Your Resume" subtitle="Upload or paste your resume for AI analysis">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          {/* Upload Option */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Option 1: Upload Resume
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {loading ? (
                  <>
                    <svg className="w-8 h-8 text-red-500 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-slate-500">Processing...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-slate-500"><span className="font-semibold text-red-600">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-400">PDF, DOCX, or TXT</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleResumeUpload}
                disabled={loading}
              />
            </label>
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

          {/* Paste Option */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Option 2: Paste Resume Text
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
              placeholder="Paste your resume text here..."
            />
          </div>

          {resumeText && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Resume loaded ({resumeText.length} characters)
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("career")}
              className="flex-1 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep("cover-letter")}
              disabled={!resumeText.trim()}
              className="flex-1 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Cover Letter →
            </button>
          </div>
        </div>
      </StepLayout>
    );
  }

  // ==================== STEP 3: COVER LETTER ====================
  if (currentStep === "cover-letter") {
    const handleCoverLetterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError("");

      try {
        const fileName = file.name.toLowerCase();

        // Handle PDF client-side
        if (fileName.endsWith(".pdf")) {
          const text = await extractPdfText(file);
          if (!text.trim()) {
            throw new Error("Could not extract text from PDF. Please paste the text instead.");
          }
          setCoverLetterText(text);
        } else {
          // Handle DOCX and TXT server-side
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/parse-resume", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setCoverLetterText(data.text);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file");
      } finally {
        setLoading(false);
      }
    };

    return (
      <StepLayout title="Your Cover Letter" subtitle="Upload or paste your cover letter (optional)">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          {/* Upload Option */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Option 1: Upload Cover Letter
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {loading ? (
                  <>
                    <svg className="w-8 h-8 text-red-500 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-slate-500">Processing...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-slate-500"><span className="font-semibold text-red-600">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-400">PDF, DOCX, or TXT</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleCoverLetterUpload}
                disabled={loading}
              />
            </label>
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

          {/* Paste Option */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Option 2: Paste Cover Letter Text
            </label>
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
              placeholder="Paste your cover letter here (optional)..."
            />
          </div>

          {coverLetterText && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Cover letter loaded ({coverLetterText.length} characters)
            </div>
          )}

          <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
            💡 Cover letter is optional. Skip if you don&apos;t have one ready.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("resume")}
              className="flex-1 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                setCurrentStep("interview");
              }}
              className="flex-1 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Next: AI Interview →
            </button>
          </div>
        </div>
      </StepLayout>
    );
  }

  // ==================== STEP 4: AI VIDEO INTERVIEW ====================
  if (currentStep === "interview") {
    // Format timer as MM:SS
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/90 to-transparent p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Internship.sg" className="h-8 w-auto brightness-0 invert" />
              <span className="font-medium text-white/80">AI Interview</span>
            </a>
            <div className="flex items-center gap-4">
              {isRecording && (
                <span className="flex items-center gap-2 text-sm bg-red-600 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  REC
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-screen flex items-center justify-center p-4">
          {/* Setup Phase */}
          {interviewPhase === "setup" && (
            <div className="text-center max-w-2xl">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">AI Interview Practice</h1>
              <p className="text-white/50 mb-8">
                Personalized for <span className="text-red-400 font-medium">{profile.targetRole}</span>
              </p>

              {/* Duration Selection */}
              <div className="mb-6 sm:mb-8">
                <p className="text-white/70 text-sm mb-3 sm:mb-4 uppercase tracking-wide">Select Interview Duration</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <button
                    onClick={() => setInterviewDuration(2)}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      interviewDuration === 2
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {interviewDuration === 2 && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">Test</div>
                    <div className="text-3xl font-bold mb-1">2</div>
                    <div className="text-white/50 text-sm">minutes</div>
                    <div className="text-white/30 text-xs mt-2">Quick Test</div>
                  </button>
                  <button
                    onClick={() => setInterviewDuration(5)}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      interviewDuration === 5
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {interviewDuration === 5 && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="text-3xl font-bold mb-1">5</div>
                    <div className="text-white/50 text-sm">minutes</div>
                    <div className="text-white/30 text-xs mt-2">Quick Practice</div>
                  </button>
                  <button
                    onClick={() => setInterviewDuration(15)}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      interviewDuration === 15
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {interviewDuration === 15 && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-xs px-2 py-0.5 rounded-full">Popular</div>
                    <div className="text-3xl font-bold mb-1">15</div>
                    <div className="text-white/50 text-sm">minutes</div>
                    <div className="text-white/30 text-xs mt-2">Standard Session</div>
                  </button>
                  <button
                    onClick={() => setInterviewDuration(30)}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      interviewDuration === 30
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {interviewDuration === 30 && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="text-3xl font-bold mb-1">30</div>
                    <div className="text-white/50 text-sm">minutes</div>
                    <div className="text-white/30 text-xs mt-2">Deep Practice</div>
                  </button>
                </div>
              </div>

              {/* What You'll Practice */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 mb-8 text-left border border-white/5">
                <h3 className="font-semibold mb-4 text-center">What You&apos;ll Practice</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium">Communication</div>
                    <div className="text-xs text-white/40">Clarity & confidence</div>
                  </div>
                  <div className="p-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium">Technical Skills</div>
                    <div className="text-xs text-white/40">Industry knowledge</div>
                  </div>
                  <div className="p-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium">Soft Skills</div>
                    <div className="text-xs text-white/40">Teamwork & leadership</div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="flex flex-wrap justify-center gap-3 mb-8 text-xs">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-white/60">
                  <span className="text-green-400">✓</span> Quiet environment
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-white/60">
                  <span className="text-green-400">✓</span> Camera & mic ready
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-white/60">
                  <span className="text-green-400">✓</span> Speak naturally
                </span>
              </div>

              {error && (
                <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep("cover-letter")}
                  className="px-6 py-4 border border-white/20 text-white/70 rounded-xl font-medium hover:bg-white/5 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={startVideoInterview}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-500 hover:to-red-400 transition-all text-lg shadow-lg shadow-red-500/25"
                >
                  Start {interviewDuration} Min Interview
                </button>
              </div>
            </div>
          )}

          {/* Countdown Phase */}
          {interviewPhase === "countdown" && (
            <div className="text-center">
              <div className="text-8xl font-bold text-red-500 animate-pulse mb-4">3</div>
              <p className="text-white/70">Get ready...</p>
            </div>
          )}

          {/* Interview Active Phases - Premium Layout */}
          {(interviewPhase === "question" || interviewPhase === "answering" || interviewPhase === "processing" || interviewPhase === "paused") && (
            <div className="w-full max-w-6xl flex flex-col gap-6">
              {/* Header Bar */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-white/60 text-sm font-medium tracking-wide uppercase">{interviewDuration} Min Session</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/40 text-sm">Q{questionNumber}</span>
                  {/* Elapsed Time */}
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`font-mono text-sm ${
                      elapsedTime >= (interviewDuration * 60 - 120) ? "text-red-400" : "text-white/70"
                    }`}>
                      {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} / {interviewDuration}:00
                    </span>
                  </div>
                  {interviewPhase === "answering" && (
                    <div className={`px-3 py-1.5 rounded-full font-mono text-sm ${
                      answerTimer <= 30 ? "bg-red-600/80 text-white" : "bg-white/10 text-white/60"
                    }`}>
                      {formatTime(answerTimer)}
                    </div>
                  )}
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

                  {/* Sound Visualizer - Bottom */}
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

              {/* Content Cards - Below Video */}
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
                      <p className="text-white/40 text-xs">Personalized for your profile</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed">{currentQuestion || "Loading question..."}</p>
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
                      <p className="text-white font-semibold">Your Response</p>
                      <p className="text-white/40 text-xs">Live transcription</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-lg leading-relaxed min-h-[80px]">
                    {transcript || (
                      <span className="text-white/40 italic">
                        {isListening ? "Listening... start speaking" : isSpeaking ? "Wait for the question..." : "Waiting..."}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Status Bar */}
              {interviewPhase === "answering" && (
                <div className="text-center space-y-2">
                  <p className="text-white/40 text-sm">
                    Pause for 4 seconds when done speaking to continue
                  </p>
                  <p className="text-white/30 text-xs">
                    Voice commands: Say &quot;pause&quot; to pause • &quot;stop&quot; to end interview
                  </p>
                </div>
              )}

              {/* Paused State */}
              {interviewPhase === "paused" && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Interview Paused</h3>
                  <p className="text-white/60 mb-4">Take your time. Say &quot;resume&quot; when you&apos;re ready to continue.</p>
                  <button
                    onClick={handleResumeInterview}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors"
                  >
                    Resume Interview
                  </button>
                </div>
              )}

              {/* Processing Indicator */}
              {interviewPhase === "processing" && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500 animate-spin"></div>
                  </div>
                  <span className="text-white/60 font-medium">Processing your response...</span>
                </div>
              )}
            </div>
          )}

          {/* Complete Phase */}
          {interviewPhase === "complete" && (
            <div className="text-center max-w-xl">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4">Interview Complete!</h1>
              <p className="text-white/70 mb-8">
                Great job! You&apos;ve completed all 7 questions. Let&apos;s analyze your performance and provide personalized feedback to help you ace your real interview.
              </p>
              <button
                onClick={async () => {
                  stopCamera();
                  const videoUrl = await uploadVideo();
                  await generateResults(videoUrl);
                }}
                disabled={loading || uploadingVideo}
                className="px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-lg disabled:opacity-50"
              >
                {uploadingVideo ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading Recording...
                  </span>
                ) : loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing Performance...
                  </span>
                ) : (
                  "Get My Results"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== STEP 5: RESULTS ====================
  if (currentStep === "results" && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        {/* Nav */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/">
              <img src="/logo.png" alt="Internship.sg" className="h-10 w-auto" />
            </a>
            <button onClick={startOver} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
              Start Over
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Results</h1>
            <p className="text-slate-600">Here&apos;s your personalized feedback based on your profile, resume, cover letter, and interview performance.</p>
          </div>

          {/* Score Cards Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white text-center">
              <div className="text-5xl font-bold mb-2">{results.interviewScore}</div>
              <div className="text-red-100 text-sm font-medium">Overall Score</div>
              <div className="text-red-200 text-xs mt-1">out of 100</div>
            </div>

            {/* Communication Score */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{results.communicationScore || Math.round(results.interviewScore * 0.9)}</div>
              <div className="text-slate-500 text-sm">Communication</div>
            </div>

            {/* Technical Score */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{results.technicalScore || Math.round(results.interviewScore * 0.85)}</div>
              <div className="text-slate-500 text-sm">Technical</div>
            </div>

            {/* Soft Skills Score */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{results.softSkillsScore || Math.round(results.interviewScore * 0.95)}</div>
              <div className="text-slate-500 text-sm">Soft Skills</div>
            </div>
          </div>

          {/* Overall Feedback Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Overall Feedback
            </h2>
            <p className="text-slate-600 leading-relaxed">{results.interviewFeedback}</p>
          </div>

          {/* Strengths & Areas to Improve */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
              <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Your Strengths
              </h3>
              <ul className="space-y-2">
                {(results.strengths || ["Clear communication", "Good enthusiasm", "Relevant experience"]).map((strength, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Areas to Improve
              </h3>
              <ul className="space-y-2">
                {(results.areasToImprove || ["Use more specific examples", "Quantify achievements", "Practice concise answers"]).map((area, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">→</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Confidence Indicators & Comparison */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Confidence Indicators */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                Confidence Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Overall Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${results.confidenceIndicators?.overallConfidence || 75}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800">{results.confidenceIndicators?.overallConfidence || 75}/100</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Filler Words (um, uh)</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    results.confidenceIndicators?.fillerWordsCount === "low" ? "bg-green-100 text-green-700" :
                    results.confidenceIndicators?.fillerWordsCount === "high" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {results.confidenceIndicators?.fillerWordsCount || "medium"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Answer Structure</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    results.confidenceIndicators?.answerStructure === "good" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {results.confidenceIndicators?.answerStructure || "good"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Specific Examples</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    results.confidenceIndicators?.specificExamples === "used" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {results.confidenceIndicators?.specificExamples || "used"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Enthusiasm Level</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    results.confidenceIndicators?.enthusiasmLevel === "high" ? "bg-green-100 text-green-700" :
                    results.confidenceIndicators?.enthusiasmLevel === "low" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {results.confidenceIndicators?.enthusiasmLevel || "medium"}
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison to Top Performers */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                vs. Other Candidates
              </h3>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-1">{results.comparisonToTopPerformers?.percentile || 75}%</div>
                <div className="text-indigo-200 text-sm">Percentile Ranking</div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-indigo-200 uppercase tracking-wide mb-1">Above Average In</div>
                  <div className="flex flex-wrap gap-1">
                    {(results.comparisonToTopPerformers?.aboveAverage || ["Communication", "Enthusiasm"]).map((item, i) => (
                      <span key={i} className="text-xs bg-white/20 px-2 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-indigo-200 uppercase tracking-wide mb-1">Room to Grow</div>
                  <div className="flex flex-wrap gap-1">
                    {(results.comparisonToTopPerformers?.belowAverage || ["Technical depth"]).map((item, i) => (
                      <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question-by-Question Breakdown */}
          {results.questionBreakdown && results.questionBreakdown.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                Question-by-Question Breakdown
              </h2>
              <div className="space-y-4">
                {results.questionBreakdown.map((q, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                          Q{i + 1}
                        </span>
                        <span className="font-medium text-slate-800 text-sm">{q.question.substring(0, 60)}...</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        q.score >= 80 ? "bg-green-100 text-green-700" :
                        q.score >= 60 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {q.score}/100
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Your Answer</div>
                        <p className="text-sm text-slate-600 italic">&quot;{q.answerSummary}&quot;</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs text-green-700 font-medium mb-1">✓ What Went Well</div>
                          <p className="text-sm text-green-800">{q.whatWentWell}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3">
                          <div className="text-xs text-amber-700 font-medium mb-1">→ To Improve</div>
                          <p className="text-sm text-amber-800">{q.improvement}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-blue-700 font-medium mb-1">💡 Ideal Answer Would Include</div>
                        <p className="text-sm text-blue-800">{q.idealAnswer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Resume Tips */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Resume Tips
              </h2>
              <ul className="space-y-2">
                {results.resumeTips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cover Letter Tips */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                Cover Letter Tips
              </h2>
              <ul className="space-y-2">
                {results.coverLetterTips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interview/Prep Tips */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                Interview Prep Tips
              </h2>
              <ul className="space-y-2">
                {results.prepTips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Soft Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Soft Skills to Develop
              </h2>
              <ul className="space-y-3">
                {results.softSkills.map((item, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-slate-800">{item.skill}</span>
                    <p className="text-slate-500">{item.tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={startOver}
              className="px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
            >
              Practice Again
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-8 mt-12">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
            <div className="flex justify-center gap-6 mb-4">
              <a href="/roadmap" className="hover:text-red-600 transition-colors">Roadmap</a>
              <a href="/about" className="hover:text-red-600 transition-colors">About</a>
              <a href="/sitemap.xml" className="hover:text-red-600 transition-colors">Sitemap</a>
            </div>
            <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
            <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
          </div>
        </footer>
      </div>
    );
  }

  // Fallback
  return null;
}
