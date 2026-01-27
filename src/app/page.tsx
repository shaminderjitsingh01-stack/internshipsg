"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";

// Types
interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
}

interface ResultsData {
  resumeTips: string[];
  coverLetterTips: string[];
  prepTips: string[];
  softSkills: { skill: string; tip: string }[];
  interviewScore: number;
  interviewFeedback: string;
}

type Step = "landing" | "career" | "resume" | "cover-letter" | "interview" | "results";

export default function Home() {
  const { data: session, status } = useSession();

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>("landing");

  // User data
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    targetRole: "",
    experience: "student",
  });
  const [resumeText, setResumeText] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");

  // Interview state
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);

  // Results
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Video interview
  const [videoEnabled, setVideoEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewMessages]);

  // Handle OAuth sign-in
  useEffect(() => {
    if (status === "authenticated" && session?.user && currentStep === "landing") {
      setProfile(prev => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || "",
      }));
      setCurrentStep("career");
    }
  }, [session, status, currentStep]);

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

  // Generate results
  const generateResults = async () => {
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
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <img src="/logo.png" alt="Internship.sg" className="h-12 w-auto" />
          </div>
        </nav>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            AI-Powered Interview Prep
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
            Ace Your Internship
            <span className="text-red-600 block">Interview</span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Complete our 4-step preparation system: Career Profile → Resume → Cover Letter → Mock Interview.
            Get instant AI feedback and personalized tips.
          </p>

          {/* Sign In Options */}
          <div className="max-w-sm mx-auto space-y-3">
            <button
              onClick={() => signIn("google")}
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

            <button
              onClick={() => setCurrentStep("career")}
              className="w-full px-6 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Get Started →
            </button>
          </div>

          {/* Steps Preview */}
          <div className="mt-16 grid sm:grid-cols-4 gap-4 text-left">
            {[
              { num: 1, title: "Career Profile", desc: "Tell us your target role" },
              { num: 2, title: "Resume", desc: "Paste your resume" },
              { num: 3, title: "Cover Letter", desc: "Add your cover letter" },
              { num: 4, title: "Mock Interview", desc: "Practice with AI" },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-sm mb-2">
                  {step.num}
                </div>
                <h3 className="font-semibold text-slate-800">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-8 mt-20">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
            <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
            <p>Shaminder Technologies | UEN 53517136J</p>
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
          <img src="/logo.png" alt="Internship.sg" className="h-10 w-auto" />
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Role / Industry</label>
            <input
              type="text"
              value={profile.targetRole}
              onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Marketing Intern, Software Developer, Data Analyst"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
            <select
              value={profile.experience}
              onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="student">Student (no internships yet)</option>
              <option value="1-internship">Completed 1 internship</option>
              <option value="2+-internships">Completed 2+ internships</option>
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
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setResumeText(data.text);
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
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setCoverLetterText(data.text);
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
                startInterview();
              }}
              className="flex-1 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
            >
              Next: Mock Interview →
            </button>
          </div>
        </div>
      </StepLayout>
    );
  }

  // ==================== STEP 4: MOCK INTERVIEW ====================
  if (currentStep === "interview") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        {/* Nav */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Internship.sg" className="h-10 w-auto" />
              <span className="font-medium text-slate-600">Mock Interview</span>
            </div>
            <div className="flex items-center gap-4">
              {!interviewComplete && (
                <span className="text-sm text-slate-500">Question {questionNumber} of 5</span>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Chat Area */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 min-h-[400px] max-h-[60vh] overflow-y-auto p-4">
            {interviewMessages.length === 0 && interviewLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600 mx-auto mb-3"></div>
                  <p className="text-slate-600">Starting interview...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {interviewMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-800"
                    }`}>
                      {msg.role === "assistant" && (
                        <div className="text-xs font-medium text-red-600 mb-1">Interviewer</div>
                      )}
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {interviewLoading && interviewMessages.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input or Complete */}
          {!interviewComplete ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex gap-3">
                <textarea
                  value={interviewInput}
                  onChange={(e) => setInterviewInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendInterviewResponse();
                    }
                  }}
                  placeholder="Type your answer... (Enter to send)"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={2}
                  disabled={interviewLoading}
                />
                <button
                  onClick={sendInterviewResponse}
                  disabled={interviewLoading || !interviewInput.trim()}
                  className="px-6 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 self-end"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tip: Use STAR method (Situation, Task, Action, Result) for behavioral questions
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Interview Complete!</h3>
              <p className="text-slate-600 mb-6">Great job! Now let&apos;s generate your personalized feedback.</p>
              <button
                onClick={generateResults}
                disabled={loading}
                className="px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Get My Results →"
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
            <img src="/logo.png" alt="Internship.sg" className="h-10 w-auto" />
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

          {/* Interview Score */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Interview Score</h2>
              <div className="text-3xl font-bold text-red-600">{results.interviewScore}/10</div>
            </div>
            <p className="text-slate-600">{results.interviewFeedback}</p>
          </div>

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
            <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
            <p>Shaminder Technologies | UEN 53517136J</p>
          </div>
        </footer>
      </div>
    );
  }

  // Fallback
  return null;
}
