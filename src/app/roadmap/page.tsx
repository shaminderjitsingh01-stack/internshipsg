"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "upcoming" | "future";
  tooltip: string;
  icon: string;
}

interface Quarter {
  id: string;
  name: string;
  period: string;
  status: "completed" | "current" | "upcoming" | "future";
  tagline: string;
  items: RoadmapItem[];
}

const roadmapData: Quarter[] = [
  {
    id: "q1-2026",
    name: "Q1 2026",
    period: "Jan - Mar 2026",
    status: "current",
    tagline: "Foundation & Core Experience",
    items: [
      {
        id: "ai-interviews",
        title: "AI Mock Interviews",
        description: "Practice with our AI interviewer that adapts to your responses and provides real-time feedback.",
        status: "completed",
        tooltip: "Live now! Over 500+ practice sessions completed.",
        icon: "🎙️",
      },
      {
        id: "resume-feedback",
        title: "Smart Resume Analysis",
        description: "Get instant AI-powered feedback on your resume with actionable improvement tips.",
        status: "completed",
        tooltip: "Analyzes structure, keywords, and impact statements.",
        icon: "📄",
      },
      {
        id: "cover-letter",
        title: "Cover Letter Assistant",
        description: "AI-guided cover letter creation tailored to your target role and company.",
        status: "completed",
        tooltip: "Personalized suggestions based on job descriptions.",
        icon: "✉️",
      },
      {
        id: "interview-streaks",
        title: "Interview Streaks",
        description: "Build consistency with daily practice streaks. Earn badges and track your progress.",
        status: "completed",
        tooltip: "Gamified motivation to keep you practicing daily.",
        icon: "🔥",
      },
      {
        id: "share-cards",
        title: "Shareable Achievement Cards",
        description: "Show off your progress on LinkedIn, Instagram, and WhatsApp with beautiful share cards.",
        status: "completed",
        tooltip: "Unlock bonus features by sharing your achievements.",
        icon: "🎴",
      },
      {
        id: "user-dashboard",
        title: "Personal Dashboard",
        description: "Track your interviews, scores, streaks, and badges all in one place.",
        status: "completed",
        tooltip: "Live now! Access your personalized dashboard.",
        icon: "📊",
      },
    ],
  },
  {
    id: "q2-2026",
    name: "Q2 2026",
    period: "Apr - Jun 2026",
    status: "upcoming",
    tagline: "Community & Accountability",
    items: [
      {
        id: "career-circles",
        title: "Career Circles",
        description: "Form small accountability groups with friends. See each other's streaks without the social media noise.",
        status: "upcoming",
        tooltip: "Accountability partners, not another social feed.",
        icon: "👥",
      },
      {
        id: "advanced-badges",
        title: "Advanced Badge System",
        description: "Unlock skill-specific badges: Voice Confident, Quick Thinker, Technical Pro, and more.",
        status: "upcoming",
        tooltip: "Showcase specific skills you've mastered.",
        icon: "🏅",
      },
      {
        id: "leaderboards",
        title: "Opt-in Leaderboards",
        description: "Compete with peers on streak length, practice sessions, and improvement scores.",
        status: "upcoming",
        tooltip: "100% optional. Only visible if you choose.",
        icon: "🏆",
      },
      {
        id: "streak-freezes",
        title: "Streak Freezes",
        description: "Life happens. Earn streak freezes to protect your progress during busy periods.",
        status: "upcoming",
        tooltip: "Earn 1 freeze per 7-day streak. Max 2 stored.",
        icon: "❄️",
      },
      {
        id: "referral-rewards",
        title: "Referral Rewards",
        description: "Invite friends and unlock premium question packs when they hit milestones.",
        status: "upcoming",
        tooltip: "Help friends prepare, earn rewards together.",
        icon: "🎁",
      },
    ],
  },
  {
    id: "q3-2026",
    name: "Q3 2026",
    period: "Jul - Sep 2026",
    status: "upcoming",
    tagline: "Employer Connections",
    items: [
      {
        id: "prep-profiles",
        title: "Verified Prep Profiles",
        description: "Opt-in profiles that showcase your consistency, improvement, and badges to potential employers.",
        status: "future",
        tooltip: "You control what's visible. Privacy-first design.",
        icon: "✅",
      },
      {
        id: "talent-discovery",
        title: "Talent Discovery (For Employers)",
        description: "Employers can discover candidates who've demonstrated dedication through consistent practice.",
        status: "future",
        tooltip: "Employers see effort, not just grades.",
        icon: "🔍",
      },
      {
        id: "sponsored-challenges",
        title: "Sponsored Interview Challenges",
        description: "Participate in company-sponsored challenges for internship fast-tracks and prizes.",
        status: "future",
        tooltip: "Real opportunities from real companies.",
        icon: "🎯",
      },
      {
        id: "industry-mentors",
        title: "Industry Mentor Sessions",
        description: "Book mock interview sessions with volunteer professionals from partner companies.",
        status: "future",
        tooltip: "Learn from people who've been there.",
        icon: "👨‍💼",
      },
    ],
  },
  {
    id: "q4-2026",
    name: "Q4 2026",
    period: "Oct - Dec 2026",
    status: "future",
    tagline: "Advanced Preparation",
    items: [
      {
        id: "role-tracks",
        title: "Role-Specific Tracks",
        description: "Customized preparation paths for Software Engineering, Marketing, Finance, Design, and more.",
        status: "future",
        tooltip: "Industry-specific questions and evaluation criteria.",
        icon: "🛤️",
      },
      {
        id: "advanced-ai",
        title: "Advanced AI Evaluation",
        description: "Deeper analysis of communication patterns, filler words, confidence levels, and body language.",
        status: "future",
        tooltip: "Video analysis with actionable coaching.",
        icon: "🤖",
      },
      {
        id: "premium-analytics",
        title: "Premium Analytics Dashboard",
        description: "Detailed progress reports, skill gap analysis, and personalized improvement plans.",
        status: "future",
        tooltip: "Know exactly where to focus your practice.",
        icon: "📈",
      },
      {
        id: "mock-contests",
        title: "Mock Interview Contests",
        description: "Weekly and monthly competitions with prizes, recognition, and employer visibility.",
        status: "future",
        tooltip: "Compete, improve, and get noticed.",
        icon: "🏁",
      },
      {
        id: "mobile-app",
        title: "Mobile App (iOS & Android)",
        description: "Practice anywhere with our native mobile app. Quick sessions during your commute.",
        status: "future",
        tooltip: "Full feature parity with web platform.",
        icon: "📱",
      },
    ],
  },
];

const whyItMatters = [
  {
    icon: "🎯",
    title: "Practice Makes Prepared",
    description: "Interviews are a skill. The more you practice, the more confident you become. Our platform makes deliberate practice accessible and engaging.",
  },
  {
    icon: "📊",
    title: "Proof of Effort",
    description: "Your streak isn't just a number — it's evidence of commitment. Future employers value candidates who invest in self-improvement.",
  },
  {
    icon: "🤝",
    title: "Community, Not Competition",
    description: "Career Circles and accountability features help you grow together with peers, without the toxic comparison of social media.",
  },
  {
    icon: "🔐",
    title: "Privacy by Design",
    description: "You control your data. Employer visibility is 100% opt-in. We'll never share your practice recordings or scores without explicit consent.",
  },
];

export default function RoadmapPage() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-yellow-500";
      case "upcoming":
        return "bg-blue-500";
      case "future":
        return "bg-slate-400";
      default:
        return "bg-slate-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return { text: "Live", bg: "bg-green-100 text-green-700" };
      case "in-progress":
        return { text: "Building", bg: "bg-yellow-100 text-yellow-700" };
      case "upcoming":
        return { text: "Planned", bg: "bg-blue-100 text-blue-700" };
      case "future":
        return { text: "Exploring", bg: "bg-slate-100 text-slate-600" };
      default:
        return { text: "Planned", bg: "bg-slate-100 text-slate-600" };
    }
  };

  const getQuarterStatus = (status: string) => {
    switch (status) {
      case "completed":
        return { text: "Completed", bg: "bg-green-600" };
      case "current":
        return { text: "In Progress", bg: "bg-red-600" };
      case "upcoming":
        return { text: "Coming Soon", bg: "bg-blue-600" };
      case "future":
        return { text: "Future", bg: "bg-slate-500" };
      default:
        return { text: "Planned", bg: "bg-slate-500" };
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-b from-slate-50 to-white'}`}>
      {/* Navigation */}
      <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isDarkTheme ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-8 sm:h-10 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
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
            <Link href="/about" className={`transition-colors text-sm sm:text-base ${isDarkTheme ? 'text-slate-300 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}>
              About
            </Link>
            <Link
              href="/auth/signin"
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-16 text-center">
        <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 ${isDarkTheme ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Public Roadmap
        </div>

        <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          Building the Future of
          <span className="text-red-600 block">Interview Preparation</span>
        </h1>

        <p className={`text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-6 sm:mb-8 px-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          We're on a mission to help every student in Singapore ace their internship interviews.
          Here's what we're building — and what's coming next.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Live
          </div>
          <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            Building
          </div>
          <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Planned
          </div>
          <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="w-3 h-3 rounded-full bg-slate-400"></span>
            Exploring
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
          <div className={`rounded-xl p-3 sm:p-4 border shadow-sm ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">6</p>
            <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Features Live</p>
          </div>
          <div className={`rounded-xl p-3 sm:p-4 border shadow-sm ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">12</p>
            <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>In Development</p>
          </div>
          <div className={`rounded-xl p-3 sm:p-4 border shadow-sm ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <p className={`text-2xl sm:text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>4</p>
            <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Quarters Planned</p>
          </div>
          <div className={`rounded-xl p-3 sm:p-4 border shadow-sm ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">100%</p>
            <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Student-Focused</p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <h2 className={`text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-12 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          2026 Roadmap
        </h2>

        {/* Quarter Navigation */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          {roadmapData.map((quarter) => {
            const status = getQuarterStatus(quarter.status);
            return (
              <button
                key={quarter.id}
                onClick={() => setSelectedQuarter(selectedQuarter === quarter.id ? null : quarter.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedQuarter === quarter.id
                    ? "bg-red-600 text-white"
                    : quarter.status === "current"
                    ? isDarkTheme ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-100 text-red-700 hover:bg-red-200"
                    : isDarkTheme ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {quarter.name}
                {quarter.status === "current" && (
                  <span className="ml-2 text-xs">← We're here</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className={`absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

          {roadmapData
            .filter((q) => !selectedQuarter || q.id === selectedQuarter)
            .map((quarter, quarterIndex) => {
              const quarterStatus = getQuarterStatus(quarter.status);
              return (
                <div key={quarter.id} className="mb-16">
                  {/* Quarter Header */}
                  <div className="relative flex items-center justify-center mb-8">
                    <div className={`${quarterStatus.bg} text-white px-6 py-3 rounded-full font-semibold z-10 shadow-lg`}>
                      <span className="text-lg">{quarter.name}</span>
                      <span className="text-white/70 text-sm ml-2">· {quarter.period}</span>
                    </div>
                  </div>

                  {/* Quarter Tagline */}
                  <p className={`text-center mb-8 font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    {quarter.tagline}
                  </p>

                  {/* Items Grid */}
                  <div className="grid md:grid-cols-2 gap-6 relative">
                    {quarter.items.map((item, itemIndex) => {
                      const badge = getStatusBadge(item.status);
                      const isLeft = itemIndex % 2 === 0;

                      return (
                        <div
                          key={item.id}
                          className={`relative ${isLeft ? "md:pr-8" : "md:pl-8"}`}
                          onMouseEnter={() => setActiveTooltip(item.id)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          {/* Connector dot */}
                          <div
                            className={`hidden md:block absolute top-6 ${
                              isLeft ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"
                            } w-4 h-4 rounded-full ${getStatusColor(item.status)} border-4 border-white shadow z-10`}
                          ></div>

                          {/* Card */}
                          <div
                            className={`rounded-xl p-4 sm:p-6 border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              isDarkTheme
                                ? `bg-slate-900 border-slate-800 hover:border-red-900 ${item.status === "completed" ? "border-l-4 border-l-green-500" : ""}`
                                : `bg-white border-slate-200 hover:border-red-200 ${item.status === "completed" ? "border-l-4 border-l-green-500" : ""}`
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                              <span className="text-2xl sm:text-3xl">{item.icon}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
                                {badge.text}
                              </span>
                            </div>

                            <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>

                            {/* Tooltip */}
                            {activeTooltip === item.id && (
                              <div className={`mt-3 pt-3 border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                                <p className={`text-xs italic ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>💡 {item.tooltip}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="bg-slate-900 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3 sm:mb-4">
            Why This Matters
          </h2>
          <p className="text-slate-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base px-2">
            We're not just building features — we're building a platform that respects your time,
            protects your privacy, and genuinely helps you succeed.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {whyItMatters.map((item, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700 hover:border-red-500/50 transition-colors"
              >
                <span className="text-3xl sm:text-4xl mb-3 sm:mb-4 block">{item.icon}</span>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Employers Preview */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-8 md:p-12 text-white">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Coming Q3 2026
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              For Employer Partners
            </h2>
            <p className="text-white/80 mb-6">
              We're building ethical ways for employers to discover dedicated candidates.
              Students who practice consistently demonstrate the work ethic companies value —
              and we want to help make those connections.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Discover candidates by consistency, not just credentials
              </li>
              <li className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sponsor challenges to find motivated interns
              </li>
              <li className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All candidate data is opt-in and privacy-first
              </li>
            </ul>
            <a
              href="mailto:partners@internship.sg"
              className="inline-block px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Partner With Us →
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-16 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
          Ready to Start Preparing?
        </h2>
        <p className="text-slate-600 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base px-2">
          Don't wait for all the features. Start building your interview skills today.
          Every feature on this roadmap is being built for students like you.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/signin"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Start Free Practice →
          </Link>
          <a
            href="https://github.com/shaminderjitsingh01-stack/internshipsg"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-slate-300 transition-colors text-sm sm:text-base"
          >
            Follow on GitHub
          </a>
        </div>
      </section>

      {/* Feedback Section */}
      <section className={`py-8 sm:py-12 border-t ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className={`font-semibold mb-2 text-sm sm:text-base ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Have a Feature Request?</h3>
          <p className={`mb-4 text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            We're building this for you. Tell us what features would help you most.
          </p>
          <a
            href="mailto:feedback@internship.sg"
            className="text-red-600 font-medium hover:underline text-sm sm:text-base"
          >
            Send us feedback →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-6 sm:py-8 ${isDarkTheme ? 'border-slate-800 bg-slate-950' : 'border-slate-200'}`}>
        <div className={`max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/roadmap" className="hover:text-red-600 transition-colors">Roadmap</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
            <a href="/sitemap.xml" className="hover:text-red-600 transition-colors">Sitemap</a>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
