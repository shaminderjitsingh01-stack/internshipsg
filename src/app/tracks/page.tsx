"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { INDUSTRY_TRACKS } from "@/data/industryTracks";
import { useEffect, useState } from "react";

// Icon components for each track
const TrackIcons: Record<string, React.ReactNode> = {
  code: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  "building-library": (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  "presentation-chart": (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  megaphone: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  heart: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  wrench: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  rocket: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

interface TrackProgress {
  trackSlug: string;
  completedModules: string[];
  totalModules: number;
  percentage: number;
}

export default function TracksPage() {
  const { isDarkTheme } = useTheme();
  const { data: session } = useSession();
  const [trackProgress, setTrackProgress] = useState<Record<string, TrackProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/tracks?email=${encodeURIComponent(session.user.email)}`);
          if (response.ok) {
            const data = await response.json();
            const progressMap: Record<string, TrackProgress> = {};
            data.progress?.forEach((p: TrackProgress) => {
              progressMap[p.trackSlug] = p;
            });
            setTrackProgress(progressMap);
          }
        } catch (error) {
          console.error("Error fetching track progress:", error);
        }
      }
      setLoading(false);
    }
    fetchProgress();
  }, [session]);

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">i</span>
              </div>
              <span className={`font-bold text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                internship.sg
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/companies"
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  isDarkTheme
                    ? "text-gray-300 hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Companies
              </Link>
              <Link
                href="/dashboard"
                className="btn-premium px-5 py-2.5 text-sm"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-6">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-sm font-medium text-red-700">Industry-Specific Preparation</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Master Your{" "}
            <span className="text-gradient">Industry Track</span>
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Choose your target industry and follow a structured learning path with interview questions,
            case studies, and skills tailored to your career goals.
          </p>
        </div>
      </section>

      {/* Industry Tracks Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INDUSTRY_TRACKS.map((track, index) => {
              const progress = trackProgress[track.slug];
              const progressPercentage = progress?.percentage || 0;

              return (
                <Link
                  key={track.slug}
                  href={`/tracks/${track.slug}`}
                  className={`card-premium p-6 group fade-in-up ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Track Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${track.bgColor} ${track.color} flex items-center justify-center`}>
                      {TrackIcons[track.icon]}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        track.demandLevel === 'High'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {track.demandLevel} Demand
                    </span>
                  </div>

                  {/* Track Info */}
                  <h3 className={`text-xl font-semibold mb-2 group-hover:text-red-600 transition-colors ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {track.name}
                  </h3>
                  <p className={`text-sm mb-4 line-clamp-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    {track.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {track.resourceCount} resources
                    </div>
                    <div className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {track.modules.length} modules
                    </div>
                  </div>

                  {/* Progress bar (if logged in and has progress) */}
                  {session && !loading && progressPercentage > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={isDarkTheme ? "text-gray-400" : "text-gray-500"}>
                          Progress
                        </span>
                        <span className="text-red-600 font-medium">
                          {progressPercentage}%
                        </span>
                      </div>
                      <div className={`h-2 rounded-full ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}>
                        <div
                          className="h-full rounded-full gradient-primary transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Skills Preview */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {track.skills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded text-xs ${
                          isDarkTheme ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {track.skills.length > 3 && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          isDarkTheme ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        +{track.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      {track.salaryRange}
                    </span>
                    <span className="text-sm font-medium text-red-600 group-hover:underline flex items-center gap-1">
                      {progressPercentage > 0 ? 'Continue' : 'Start Track'}
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 ${isDarkTheme ? "bg-gray-800/50" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-3xl font-bold text-center mb-12 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            What You&apos;ll Learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Industry Overview",
                description: "Understand the landscape, key players, and trends in your target industry",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Common Roles",
                description: "Learn about different positions, responsibilities, and career paths",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Interview Questions",
                description: "Practice with real interview questions and sample answers",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: "Case Studies",
                description: "Work through real-world scenarios and build problem-solving skills",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`card-premium p-6 text-center ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
              >
                <div className="w-12 h-12 mx-auto rounded-xl gradient-primary flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Not sure which track to choose?
          </h2>
          <p className={`text-lg mb-8 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Take our career path quiz to discover which industry matches your skills and interests.
          </p>
          <Link href="/dashboard" className="btn-premium inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Take Career Quiz
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
