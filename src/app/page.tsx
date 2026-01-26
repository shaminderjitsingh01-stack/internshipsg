"use client";

import { useState, useEffect } from "react";
import { SharingProvider } from "@/lib/sharing-context";
import ShareDashboard from "@/components/ShareDashboard";

interface CareerSuggestion {
  role: string;
  skills_needed: string[];
  internship_types: string[];
  resources: string[];
  why_good_fit: string;
}

interface MockQuestion {
  question: string;
  type: string;
  tip: string;
  skill_tested: string;
}

interface FeedbackDetail {
  structure_clarity: string;
  confidence_tone: string;
  role_relevance: string;
  improvements: string[];
}

interface FeedbackExample {
  example_answer: string;
  feedback: FeedbackDetail;
  score: number | string;
}

interface ResumeSuggestions {
  bullet_points: string[];
  formatting_tips: string[];
  common_mistakes: string[];
}

interface PrepTip {
  tip: string;
  why_it_matters: string;
  action_step: string;
}

interface DashboardRecommendations {
  mock_interviews_target: number;
  applications_target: number;
  milestones: string[];
  weekly_goals: string[];
  next_actions: string[];
}

interface ReflectionPrompt {
  prompt: string;
  purpose: string;
}

interface SoftSkill {
  skill: string;
  why_important: string;
  how_to_develop: string;
}

interface CareerData {
  career_suggestions: CareerSuggestion[];
  mock_interview_questions: MockQuestion[];
  ai_feedback_examples: FeedbackExample[];
  resume_suggestions: ResumeSuggestions;
  cover_letter: string;
  prep_tips: PrepTip[];
  dashboard_recommendations: DashboardRecommendations;
  reflection_prompts: ReflectionPrompt[];
  soft_skills_focus: SoftSkill[];
}

interface Progress {
  mockInterviews: number;
  resumeDrafts: number;
  coverLetterDrafts: number;
  applications: number;
  reflectionsCompleted: number;
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    skills: "",
    interests: "",
    experience: "none",
    goal: "",
  });
  const [loading, setLoading] = useState(false);
  const [careerData, setCareerData] = useState<CareerData | null>(null);
  const [activeTab, setActiveTab] = useState("careers");
  const [progress, setProgress] = useState<Progress>({
    mockInterviews: 0,
    resumeDrafts: 0,
    coverLetterDrafts: 0,
    applications: 0,
    reflectionsCompleted: 0,
  });
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("internship_progress");
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage
  const updateProgress = (key: keyof Progress, value: number) => {
    const newProgress = { ...progress, [key]: value };
    setProgress(newProgress);
    localStorage.setItem("internship_progress", JSON.stringify(newProgress));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to generate guidance");
      }

      const data = await res.json();
      setCareerData(data);
      setActiveTab("careers");
    } catch {
      setError("Failed to generate career guidance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const readinessScore = () => {
    if (!careerData) return 0;
    const targets = careerData.dashboard_recommendations;
    const mockScore = Math.min(progress.mockInterviews / targets.mock_interviews_target, 1) * 25;
    const appScore = Math.min(progress.applications / targets.applications_target, 1) * 25;
    const resumeScore = progress.resumeDrafts > 0 ? 20 : 0;
    const coverScore = progress.coverLetterDrafts > 0 ? 15 : 0;
    const reflectionScore = progress.reflectionsCompleted > 0 ? 15 : 0;
    return Math.round(mockScore + appScore + resumeScore + coverScore + reflectionScore);
  };

  const getScoreColor = (score: number | string) => {
    const numScore = typeof score === "string" ? parseInt(score) : score;
    if (numScore >= 8) return "text-green-600 bg-green-50";
    if (numScore >= 6) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Internship.sg</h1>
                <p className="text-xs text-slate-500">AI Career Coach for Singapore Students</p>
              </div>
            </div>
            {careerData && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                <span className="text-sm text-slate-600">Readiness:</span>
                <span className={`text-lg font-bold ${readinessScore() >= 70 ? "text-green-600" : readinessScore() >= 40 ? "text-amber-600" : "text-red-500"}`}>
                  {readinessScore()}%
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!careerData ? (
          /* Student Profile Form */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Powered by AI
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                Your Personalized Internship Coach
              </h2>
              <p className="text-slate-600 text-lg">
                Get tailored career advice, mock interviews with detailed feedback, resume tips, and a structured roadmap to land your dream internship.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Mock Interviews", desc: "With scoring & feedback" },
                { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Resume & Cover Letter", desc: "Ready-to-use templates" },
                { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Progress Tracking", desc: "Stay on target" },
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., Sarah Tan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Course / Degree</label>
                  <input
                    type="text"
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., Business Administration, NUS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Skills & Projects</label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                  placeholder="e.g., Python, Excel, built a stock portfolio tracker, organized marketing campaign for school event..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Internship Roles</label>
                <input
                  type="text"
                  required
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., Marketing, Data Analytics, Software Engineering"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="none">No prior internships</option>
                    <option value="some">1 internship</option>
                    <option value="moderate">2+ internships</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Goal</label>
                  <input
                    type="text"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., Get Marketing Internship Summer 2026"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Your Personalized Guide...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate My Career Guide
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Results Dashboard */
          <div className="fade-in">
            {/* Welcome Back */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Welcome, {formData.name}!</h2>
                  <p className="text-blue-100">Your personalized internship guide is ready. Let&apos;s get you that {formData.interests.split(",")[0]} internship!</p>
                </div>
                <div className="text-center bg-white/10 rounded-xl px-6 py-3">
                  <p className="text-blue-100 text-sm">Readiness Score</p>
                  <p className="text-4xl font-bold">{readinessScore()}%</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              {[
                { id: "careers", label: "Careers", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { id: "interview", label: "Interview", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
                { id: "resume", label: "Resume", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                { id: "cover", label: "Cover Letter", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { id: "tips", label: "Prep Tips", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
                { id: "softskills", label: "Soft Skills", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                { id: "reflect", label: "Reflect", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
                { id: "tracker", label: "Progress", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                { id: "share", label: "Share & Win", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              {/* Career Paths */}
              {activeTab === "careers" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Recommended Career Paths for You</h3>
                  <div className="grid gap-4">
                    {careerData.career_suggestions.map((career, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-semibold text-slate-900">{career.role}</h4>
                          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">Good Fit</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded-lg">{career.why_good_fit}</p>
                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 mb-2 font-medium">Key Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {career.skills_needed.map((skill, j) => (
                                <span key={j} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-2 font-medium">Where to Apply</p>
                            <ul className="text-slate-700 space-y-1">
                              {career.internship_types.map((type, j) => (
                                <li key={j} className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                  {type}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-2 font-medium">Resources</p>
                            <ul className="text-slate-700 space-y-1">
                              {career.resources.map((res, j) => (
                                <li key={j} className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                  {res}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mock Interview */}
              {activeTab === "interview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Mock Interview Practice</h3>
                      <p className="text-sm text-slate-500">Click on any question to see example answers and detailed feedback</p>
                    </div>
                    <button
                      onClick={() => updateProgress("mockInterviews", progress.mockInterviews + 1)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      + Log Practice
                    </button>
                  </div>
                  <div className="space-y-4">
                    {careerData.mock_interview_questions.map((q, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setSelectedQuestion(selectedQuestion === i ? null : i)}
                          className="w-full p-4 text-left flex items-start justify-between hover:bg-slate-50 transition"
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                                q.type === "behavioral" ? "bg-purple-100 text-purple-700" :
                                q.type === "situational" ? "bg-amber-100 text-amber-700" :
                                q.type === "technical" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {q.type}
                              </span>
                              <span className="text-xs text-slate-500">Tests: {q.skill_tested}</span>
                            </div>
                            <p className="font-medium text-slate-900">{q.question}</p>
                            <p className="text-sm text-slate-500 mt-1">Tip: {q.tip}</p>
                          </div>
                          <svg className={`w-5 h-5 text-slate-400 transition-transform ml-4 ${selectedQuestion === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {selectedQuestion === i && careerData.ai_feedback_examples[i] && (
                          <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                            {/* Score Badge */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">Example Answer Score:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(careerData.ai_feedback_examples[i].score)}`}>
                                {typeof careerData.ai_feedback_examples[i].score === "number"
                                  ? `${careerData.ai_feedback_examples[i].score}/10`
                                  : careerData.ai_feedback_examples[i].score}
                              </span>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-2">Example Answer:</p>
                              <p className="text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200 leading-relaxed">
                                {careerData.ai_feedback_examples[i].example_answer}
                              </p>
                            </div>

                            {/* Detailed Feedback */}
                            <div className="grid sm:grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-blue-600 mb-1">Structure & Clarity</p>
                                <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].feedback.structure_clarity}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-purple-600 mb-1">Confidence & Tone</p>
                                <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].feedback.confidence_tone}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-green-600 mb-1">Role Relevance</p>
                                <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].feedback.role_relevance}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-amber-700 mb-2">How to Improve:</p>
                              <ul className="space-y-2">
                                {careerData.ai_feedback_examples[i].feedback.improvements.map((imp, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{j + 1}</span>
                                    {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume Tips */}
              {activeTab === "resume" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Resume Suggestions</h3>
                    <button
                      onClick={() => updateProgress("resumeDrafts", progress.resumeDrafts + 1)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      + Log Draft
                    </button>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Ready-to-Use Bullet Points</h4>
                    <p className="text-sm text-slate-500 mb-3">Based on your skills and projects. Click to copy.</p>
                    <div className="space-y-2">
                      {careerData.resume_suggestions.bullet_points.map((point, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg group hover:bg-blue-50 transition cursor-pointer" onClick={() => navigator.clipboard.writeText(point)}>
                          <span className="text-blue-600 mt-0.5">•</span>
                          <p className="text-slate-700 flex-1">{point}</p>
                          <button className="text-slate-400 group-hover:text-blue-600 transition" title="Copy">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Formatting Tips
                      </h4>
                      <ul className="space-y-2">
                        {careerData.resume_suggestions.formatting_tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Common Mistakes to Avoid
                      </h4>
                      <ul className="space-y-2">
                        {careerData.resume_suggestions.common_mistakes.map((mistake, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {activeTab === "cover" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Your Cover Letter Template</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProgress("coverLetterDrafts", progress.coverLetterDrafts + 1)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                      >
                        + Log Draft
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(careerData.cover_letter)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {careerData.cover_letter}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Pro Tip:</strong> Customize this template for each company by researching their values, recent news, and specific role requirements. Mention something specific about the company to show genuine interest.
                    </p>
                  </div>
                </div>
              )}

              {/* Prep Tips */}
              {activeTab === "tips" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Your Preparation Roadmap</h3>
                  <div className="space-y-4">
                    {careerData.prep_tips.map((tip, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 mb-2">{tip.tip}</p>
                            <p className="text-sm text-slate-600 mb-3">{tip.why_it_matters}</p>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm text-green-700">
                                <strong>Action Step:</strong> {tip.action_step}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {activeTab === "softskills" && careerData.soft_skills_focus && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Soft Skills to Develop</h3>
                  <p className="text-slate-600">These skills will set you apart from other candidates.</p>
                  <div className="grid gap-4">
                    {careerData.soft_skills_focus.map((skill, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 text-lg mb-2">{skill.skill}</h4>
                            <p className="text-sm text-slate-600 mb-3">{skill.why_important}</p>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-sm text-purple-700">
                                <strong>How to Develop:</strong> {skill.how_to_develop}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reflection Prompts */}
              {activeTab === "reflect" && careerData.reflection_prompts && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Self-Reflection</h3>
                      <p className="text-sm text-slate-500">Take time to reflect on your progress and identify areas for growth</p>
                    </div>
                    <button
                      onClick={() => updateProgress("reflectionsCompleted", progress.reflectionsCompleted + 1)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      + Complete Reflection
                    </button>
                  </div>
                  <div className="space-y-4">
                    {careerData.reflection_prompts.map((prompt, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 text-lg mb-2">{prompt.prompt}</p>
                            <p className="text-sm text-slate-600 bg-white/50 p-3 rounded-lg">{prompt.purpose}</p>
                            <textarea
                              placeholder="Write your reflection here..."
                              className="w-full mt-3 p-3 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Tracker */}
              {activeTab === "tracker" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Your Progress Dashboard</h3>

                  {/* Readiness Score */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-blue-100 mb-1">Overall Readiness Score</p>
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-bold">{readinessScore()}%</span>
                          <span className="text-blue-200 mb-2">
                            {readinessScore() >= 70 ? "Ready to apply!" : readinessScore() >= 40 ? "Getting there!" : "Keep going!"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-800/30 rounded-full h-3">
                      <div
                        className="bg-white rounded-full h-3 transition-all duration-500"
                        style={{ width: `${readinessScore()}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Mock Interviews", value: progress.mockInterviews, target: careerData.dashboard_recommendations.mock_interviews_target, key: "mockInterviews" as const },
                      { label: "Resume Drafts", value: progress.resumeDrafts, key: "resumeDrafts" as const },
                      { label: "Cover Letters", value: progress.coverLetterDrafts, key: "coverLetterDrafts" as const },
                      { label: "Applications", value: progress.applications, target: careerData.dashboard_recommendations.applications_target, key: "applications" as const },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-4">
                        <p className="text-slate-500 text-sm">{stat.label}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                          {stat.target && <span className="text-sm text-slate-500">/ {stat.target}</span>}
                        </div>
                        <div className="flex gap-1 mt-3">
                          <button onClick={() => updateProgress(stat.key, Math.max(0, stat.value - 1))} className="px-3 py-1 bg-slate-200 rounded text-sm hover:bg-slate-300 transition">-</button>
                          <button onClick={() => updateProgress(stat.key, stat.value + 1)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Next Actions */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Next Actions</h4>
                      <div className="space-y-2">
                        {careerData.dashboard_recommendations.next_actions.map((action, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-slate-700 text-sm">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Weekly Goals</h4>
                      <div className="space-y-2">
                        {careerData.dashboard_recommendations.weekly_goals.map((goal, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500" />
                            <span className="text-slate-700 text-sm">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Preparation Milestones</h4>
                    <div className="space-y-2">
                      {careerData.dashboard_recommendations.milestones.map((milestone, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                            {i + 1}
                          </div>
                          <span className="text-slate-700">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Share & Win Tab */}
              {activeTab === "share" && (
                <SharingProvider>
                  <ShareDashboard />
                </SharingProvider>
              )}
            </div>

            {/* Start Over */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setCareerData(null);
                  setFormData({ name: "", course: "", skills: "", interests: "", experience: "none", goal: "" });
                }}
                className="text-slate-500 hover:text-slate-700 text-sm underline"
              >
                Start over with a new profile
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p className="font-medium text-slate-700">Internship.sg</p>
            <p className="mt-1">AI-Powered Career Coaching for Singapore Students</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
