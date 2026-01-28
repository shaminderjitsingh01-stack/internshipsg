"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { getTrackBySlug, INDUSTRY_TRACKS } from "@/data/industryTracks";
import { COMPANIES } from "@/data/companies";
import { useEffect, useState } from "react";

// Category badge colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  behavioral: { bg: "bg-blue-100", text: "text-blue-700" },
  technical: { bg: "bg-purple-100", text: "text-purple-700" },
  case: { bg: "bg-amber-100", text: "text-amber-700" },
  situational: { bg: "bg-green-100", text: "text-green-700" },
};

// Module type icons
const moduleTypeIcons: Record<string, React.ReactNode> = {
  overview: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  roles: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  questions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "case-study": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  skills: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  completedAt?: string;
}

export default function TrackDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isDarkTheme } = useTheme();
  const { data: session } = useSession();

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const track = getTrackBySlug(slug);

  useEffect(() => {
    if (track) {
      setActiveModuleId(track.modules[0]?.id || null);
    }
  }, [track]);

  useEffect(() => {
    async function fetchProgress() {
      if (session?.user?.email && track) {
        try {
          const response = await fetch(`/api/tracks?email=${encodeURIComponent(session.user.email)}&trackSlug=${track.slug}`);
          if (response.ok) {
            const data = await response.json();
            if (data.trackProgress?.completedModules) {
              setCompletedModules(new Set(data.trackProgress.completedModules));
            }
          }
        } catch (error) {
          console.error("Error fetching progress:", error);
        }
      }
      setLoading(false);
    }
    fetchProgress();
  }, [session, track]);

  if (!track) {
    notFound();
  }

  const activeModule = track.modules.find(m => m.id === activeModuleId);
  const completedCount = completedModules.size;
  const progressPercentage = Math.round((completedCount / track.modules.length) * 100);

  const relatedCompanies = COMPANIES.filter(company =>
    track.relatedCompanies.includes(company.slug)
  );

  const handleMarkComplete = async (moduleId: string) => {
    if (!session?.user?.email) {
      // Redirect to sign in
      window.location.href = "/auth/signin";
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          trackSlug: track.slug,
          moduleId,
          action: completedModules.has(moduleId) ? "uncomplete" : "complete",
        }),
      });

      if (response.ok) {
        const newCompleted = new Set(completedModules);
        if (completedModules.has(moduleId)) {
          newCompleted.delete(moduleId);
        } else {
          newCompleted.add(moduleId);
        }
        setCompletedModules(newCompleted);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
    setSaving(false);
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">i</span>
                </div>
                <span className={`font-bold text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  internship.sg
                </span>
              </Link>
              <span className={`${isDarkTheme ? "text-gray-600" : "text-gray-300"}`}>/</span>
              <Link
                href="/tracks"
                className={`text-sm font-medium ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
              >
                Tracks
              </Link>
            </div>
            <Link
              href="/dashboard"
              className="btn-premium px-5 py-2.5 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`py-12 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-100"}`}>
        <div className="max-w-7xl mx-auto">
          <Link
            href="/tracks"
            className={`inline-flex items-center gap-2 text-sm font-medium mb-6 ${
              isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tracks
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl ${track.bgColor} ${track.color} flex items-center justify-center`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h1 className={`text-3xl md:text-4xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {track.name} Track
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      {track.modules.length} modules
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      track.demandLevel === 'High'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {track.demandLevel} Demand
                    </span>
                  </div>
                </div>
              </div>
              <p className={`text-lg mb-6 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                {track.description}
              </p>

              {/* Progress bar */}
              {session && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={isDarkTheme ? "text-gray-400" : "text-gray-500"}>
                      Your Progress
                    </span>
                    <span className="text-red-600 font-medium">
                      {completedCount}/{track.modules.length} modules ({progressPercentage}%)
                    </span>
                  </div>
                  <div className={`h-3 rounded-full ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div
                      className="h-full rounded-full gradient-primary transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="flex flex-wrap gap-2">
                {track.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${track.bgColor} ${track.color} ${track.borderColor} border`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className={`w-full lg:w-80 card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Track Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className={isDarkTheme ? "text-gray-400" : "text-gray-500"}>Salary Range</span>
                  <span className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>{track.salaryRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkTheme ? "text-gray-400" : "text-gray-500"}>Resources</span>
                  <span className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>{track.resourceCount}+ materials</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkTheme ? "text-gray-400" : "text-gray-500"}>Demand</span>
                  <span className={`font-medium ${
                    track.demandLevel === 'High' ? 'text-green-600' : 'text-amber-600'
                  }`}>{track.demandLevel}</span>
                </div>
              </div>
              <Link
                href="/job-interview"
                className="btn-premium w-full mt-6 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Practice Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Module Navigation */}
            <div className="lg:col-span-1">
              <div className={`card-premium p-4 sticky top-24 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  Learning Path
                </h3>
                <div className="space-y-2">
                  {track.modules.map((module, index) => {
                    const isCompleted = completedModules.has(module.id);
                    const isActive = activeModuleId === module.id;

                    return (
                      <button
                        key={module.id}
                        onClick={() => setActiveModuleId(module.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                          isActive
                            ? isDarkTheme
                              ? "bg-red-900/30 border border-red-800"
                              : "bg-red-50 border border-red-200"
                            : isDarkTheme
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                              ? "gradient-primary text-white"
                              : isDarkTheme
                                ? "bg-gray-700 text-gray-400"
                                : "bg-gray-200 text-gray-500"
                        }`}>
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${
                            isActive
                              ? "text-red-600"
                              : isDarkTheme
                                ? "text-white"
                                : "text-gray-900"
                          }`}>
                            {module.title}
                          </p>
                          <p className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                            {module.duration}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Module Content */}
            <div className="lg:col-span-3">
              {activeModule && (
                <div className={`card-premium p-8 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${track.bgColor} ${track.color} flex items-center justify-center`}>
                        {moduleTypeIcons[activeModule.type]}
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                          {activeModule.title}
                        </h2>
                        <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                          {activeModule.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkComplete(activeModule.id)}
                      disabled={saving || !session}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        completedModules.has(activeModule.id)
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${!session ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {saving ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : completedModules.has(activeModule.id) ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark Complete
                        </>
                      )}
                    </button>
                  </div>

                  {/* Content Sections */}
                  <div className="space-y-8">
                    {activeModule.content.sections.map((section, index) => (
                      <div key={index}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                          {section.title}
                        </h3>
                        <ul className="space-y-3">
                          {section.items.map((item, itemIndex) => (
                            <li
                              key={itemIndex}
                              className={`flex items-start gap-3 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
                            >
                              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Questions Section */}
                    {activeModule.content.questions && activeModule.content.questions.length > 0 && (
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                          Practice Questions
                        </h3>
                        <div className="space-y-4">
                          {activeModule.content.questions.map((q, index) => {
                            const colors = categoryColors[q.category];
                            return (
                              <div
                                key={index}
                                className={`p-5 rounded-2xl border ${
                                  isDarkTheme ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-100"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <h4 className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                                    {q.question}
                                  </h4>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}>
                                    {q.category}
                                  </span>
                                </div>
                                {q.sampleAnswer && (
                                  <details className="group">
                                    <summary className={`cursor-pointer text-sm font-medium text-red-600 hover:underline flex items-center gap-1`}>
                                      <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                      View Sample Answer
                                    </summary>
                                    <div className={`mt-3 pl-5 border-l-2 border-red-200 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                                      {q.sampleAnswer}
                                    </div>
                                  </details>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Resources Section */}
                    {activeModule.content.resources && activeModule.content.resources.length > 0 && (
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                          Recommended Resources
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {activeModule.content.resources.map((resource, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-3 p-4 rounded-xl border ${
                                isDarkTheme ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-100"
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                resource.type === 'book' ? 'bg-amber-100 text-amber-700' :
                                resource.type === 'video' ? 'bg-red-100 text-red-700' :
                                resource.type === 'course' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {resource.type === 'book' && (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                )}
                                {resource.type === 'video' && (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                {resource.type === 'course' && (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                )}
                                {resource.type === 'article' && (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className={`font-medium text-sm ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                                  {resource.title}
                                </p>
                                <p className={`text-xs capitalize ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                                  {resource.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        const currentIndex = track.modules.findIndex(m => m.id === activeModuleId);
                        if (currentIndex > 0) {
                          setActiveModuleId(track.modules[currentIndex - 1].id);
                        }
                      }}
                      disabled={track.modules.findIndex(m => m.id === activeModuleId) === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        track.modules.findIndex(m => m.id === activeModuleId) === 0
                          ? "opacity-50 cursor-not-allowed"
                          : isDarkTheme
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                      } ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous Module
                    </button>
                    <button
                      onClick={() => {
                        const currentIndex = track.modules.findIndex(m => m.id === activeModuleId);
                        if (currentIndex < track.modules.length - 1) {
                          setActiveModuleId(track.modules[currentIndex + 1].id);
                        }
                      }}
                      disabled={track.modules.findIndex(m => m.id === activeModuleId) === track.modules.length - 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        track.modules.findIndex(m => m.id === activeModuleId) === track.modules.length - 1
                          ? "opacity-50 cursor-not-allowed"
                          : "btn-premium"
                      }`}
                    >
                      Next Module
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Companies Section */}
      {relatedCompanies.length > 0 && (
        <section className={`py-12 px-4 sm:px-6 lg:px-8 border-t ${isDarkTheme ? "border-gray-800" : "border-gray-100"}`}>
          <div className="max-w-7xl mx-auto">
            <h2 className={`text-2xl font-bold mb-8 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              Companies in {track.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCompanies.map((company) => (
                <Link
                  key={company.slug}
                  href={`/companies/${company.slug}`}
                  className={`card-premium p-5 group ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                      {company.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h3 className={`font-semibold group-hover:text-red-600 transition-colors ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                        {company.name}
                      </h3>
                      <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                        {company.industry.split(" / ")[0]}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-red-600 font-medium group-hover:underline">
                    Prepare now &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 ${isDarkTheme ? "bg-gray-800/50" : "bg-red-50"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Ready to Practice?
          </h2>
          <p className={`text-lg mb-8 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Start a mock interview session and get real-time feedback on your answers.
            Practice with AI-powered interviews tailored to the {track.name} industry.
          </p>
          <Link href="/job-interview" className="btn-premium inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Mock Interview
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${isDarkTheme ? "border-gray-800 bg-gray-900" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">i</span>
            </div>
            <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              internship.sg
            </span>
          </div>
          <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
            Helping Singapore students land their dream internships
          </p>
        </div>
      </footer>
    </div>
  );
}
