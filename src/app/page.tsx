"use client";

import { useState, useEffect } from "react";

interface CareerSuggestion {
  role: string;
  skills_needed: string[];
  internship_types: string[];
  resources: string[];
}

interface MockQuestion {
  question: string;
  type: string;
  tip: string;
}

interface FeedbackExample {
  example_answer: string;
  feedback: string;
  improvements: string;
}

interface ResumeSuggestions {
  bullet_points: string[];
  tips: string[];
}

interface DashboardRecommendations {
  mock_interviews_target: number;
  applications_target: number;
  milestones: string[];
}

interface CareerData {
  career_suggestions: CareerSuggestion[];
  mock_interview_questions: MockQuestion[];
  ai_feedback_examples: FeedbackExample[];
  resume_suggestions: ResumeSuggestions;
  cover_letter: string;
  prep_tips: string[];
  dashboard_recommendations: DashboardRecommendations;
}

interface Progress {
  mockInterviews: number;
  resumeDrafts: number;
  coverLetterDrafts: number;
  applications: number;
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
    const mockScore = Math.min(progress.mockInterviews / targets.mock_interviews_target, 1) * 30;
    const appScore = Math.min(progress.applications / targets.applications_target, 1) * 30;
    const resumeScore = progress.resumeDrafts > 0 ? 20 : 0;
    const coverScore = progress.coverLetterDrafts > 0 ? 20 : 0;
    return Math.round(mockScore + appScore + resumeScore + coverScore);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
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
                <span className="text-sm text-slate-600">Readiness Score:</span>
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
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Get Your Personalized Internship Guide
              </h2>
              <p className="text-slate-600">
                Tell us about yourself and we&apos;ll generate tailored career advice, mock interview questions, resume tips, and more.
              </p>
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
                  placeholder="e.g., Marketing, Data Analytics, Finance"
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
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Your Guide...
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
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              {[
                { id: "careers", label: "Career Paths", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { id: "interview", label: "Mock Interview", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
                { id: "resume", label: "Resume Tips", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                { id: "cover", label: "Cover Letter", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { id: "tips", label: "Prep Tips", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
                { id: "tracker", label: "Progress", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
                  <h3 className="text-xl font-bold text-slate-900">Recommended Career Paths</h3>
                  <div className="grid gap-4">
                    {careerData.career_suggestions.map((career, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition">
                        <h4 className="text-lg font-semibold text-slate-900 mb-3">{career.role}</h4>
                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 mb-1">Key Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {career.skills_needed.map((skill, j) => (
                                <span key={j} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Internship Types</p>
                            <ul className="text-slate-700 space-y-1">
                              {career.internship_types.map((type, j) => (
                                <li key={j}>• {type}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Resources</p>
                            <ul className="text-slate-700 space-y-1">
                              {career.resources.map((res, j) => (
                                <li key={j}>• {res}</li>
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
                    <h3 className="text-xl font-bold text-slate-900">Mock Interview Practice</h3>
                    <button
                      onClick={() => updateProgress("mockInterviews", progress.mockInterviews + 1)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      + Log Practice Session
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
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${
                              q.type === "behavioral" ? "bg-purple-100 text-purple-700" :
                              q.type === "situational" ? "bg-amber-100 text-amber-700" :
                              q.type === "technical" ? "bg-blue-100 text-blue-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {q.type}
                            </span>
                            <p className="font-medium text-slate-900">{q.question}</p>
                            <p className="text-sm text-slate-500 mt-1">Tip: {q.tip}</p>
                          </div>
                          <svg className={`w-5 h-5 text-slate-400 transition-transform ${selectedQuestion === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {selectedQuestion === i && careerData.ai_feedback_examples[i] && (
                          <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1">Example Answer:</p>
                              <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                                {careerData.ai_feedback_examples[i].example_answer}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-1">Feedback:</p>
                              <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].feedback}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-amber-700 mb-1">How to Improve:</p>
                              <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].improvements}</p>
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
                      + Log Resume Draft
                    </button>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Ready-to-Use Bullet Points</h4>
                    <div className="space-y-2">
                      {careerData.resume_suggestions.bullet_points.map((point, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <p className="text-slate-700">{point}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(point)}
                            className="ml-auto text-slate-400 hover:text-slate-600"
                            title="Copy"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Formatting Tips</h4>
                    <ul className="space-y-2">
                      {careerData.resume_suggestions.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {activeTab === "cover" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Tailored Cover Letter</h3>
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
                  <p className="text-sm text-slate-500">
                    Tip: Customize this template for each company by researching their values and recent projects.
                  </p>
                </div>
              )}

              {/* Prep Tips */}
              {activeTab === "tips" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Preparation Tips</h3>
                  <div className="grid gap-4">
                    {careerData.prep_tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-slate-700">{tip}</p>
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
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                    <p className="text-blue-100 mb-2">Overall Readiness Score</p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-bold">{readinessScore()}%</span>
                      <span className="text-blue-200 mb-2">
                        {readinessScore() >= 70 ? "Ready to apply!" : readinessScore() >= 40 ? "Getting there" : "Keep practicing"}
                      </span>
                    </div>
                    <div className="mt-4 bg-blue-800/30 rounded-full h-3">
                      <div
                        className="bg-white rounded-full h-3 transition-all duration-500"
                        style={{ width: `${readinessScore()}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-500 text-sm">Mock Interviews</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-bold text-slate-900">{progress.mockInterviews}</span>
                        <span className="text-sm text-slate-500">/ {careerData.dashboard_recommendations.mock_interviews_target} target</span>
                      </div>
                      <div className="flex gap-1 mt-3">
                        <button onClick={() => updateProgress("mockInterviews", Math.max(0, progress.mockInterviews - 1))} className="px-3 py-1 bg-slate-200 rounded text-sm">-</button>
                        <button onClick={() => updateProgress("mockInterviews", progress.mockInterviews + 1)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+</button>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-500 text-sm">Resume Drafts</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-bold text-slate-900">{progress.resumeDrafts}</span>
                      </div>
                      <div className="flex gap-1 mt-3">
                        <button onClick={() => updateProgress("resumeDrafts", Math.max(0, progress.resumeDrafts - 1))} className="px-3 py-1 bg-slate-200 rounded text-sm">-</button>
                        <button onClick={() => updateProgress("resumeDrafts", progress.resumeDrafts + 1)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+</button>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-500 text-sm">Cover Letter Drafts</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-bold text-slate-900">{progress.coverLetterDrafts}</span>
                      </div>
                      <div className="flex gap-1 mt-3">
                        <button onClick={() => updateProgress("coverLetterDrafts", Math.max(0, progress.coverLetterDrafts - 1))} className="px-3 py-1 bg-slate-200 rounded text-sm">-</button>
                        <button onClick={() => updateProgress("coverLetterDrafts", progress.coverLetterDrafts + 1)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+</button>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-500 text-sm">Applications Sent</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-bold text-slate-900">{progress.applications}</span>
                        <span className="text-sm text-slate-500">/ {careerData.dashboard_recommendations.applications_target} target</span>
                      </div>
                      <div className="flex gap-1 mt-3">
                        <button onClick={() => updateProgress("applications", Math.max(0, progress.applications - 1))} className="px-3 py-1 bg-slate-200 rounded text-sm">-</button>
                        <button onClick={() => updateProgress("applications", progress.applications + 1)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Recommended Milestones</h4>
                    <div className="space-y-2">
                      {careerData.dashboard_recommendations.milestones.map((milestone, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-slate-700">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Start Over Button */}
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
            <p>Internship.sg - AI-Powered Career Coaching for Singapore Students</p>
            <p className="mt-1">Built to help students land their dream internships</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
