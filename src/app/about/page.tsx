"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function AboutPage() {
  const { isDarkTheme, toggleTheme } = useTheme();

  const features = [
    {
      icon: "🏆",
      title: "Talent Leaderboard",
      description: "Compete with students across Singapore. Rise through the ranks and get noticed by employers.",
      color: "yellow",
    },
    {
      icon: "👤",
      title: "Public Profiles",
      description: "Showcase your scores, badges, and skills. Share your profile with employers and on LinkedIn.",
      color: "blue",
    },
    {
      icon: "🎖️",
      title: "Talent Tiers",
      description: "Progress from Bronze to Elite tier based on your XP and percentile ranking.",
      color: "purple",
    },
    {
      icon: "⭐",
      title: "XP & Levels",
      description: "Earn XP for every interview, challenge completed, and daily login. Level up to unlock badges.",
      color: "green",
    },
    {
      icon: "🏅",
      title: "25+ Badges",
      description: "Earn achievements for streaks, interviews, milestones, and more. Showcase them on your profile.",
      color: "amber",
    },
    {
      icon: "🤖",
      title: "AI Interviews",
      description: "Practice with our AI interviewer that adapts to your resume and provides instant feedback.",
      color: "red",
    },
  ];

  const stats = [
    { value: "65+", label: "Interview Questions" },
    { value: "12", label: "Company Prep Guides" },
    { value: "7", label: "Industry Tracks" },
    { value: "25+", label: "Badges to Earn" },
  ];

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
      {/* Nav */}
      <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isDarkTheme ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1">
              <Link href="/leaderboard" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                Leaderboard
              </Link>
              <Link href="/companies" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                Companies
              </Link>
              <Link href="/employers" className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isDarkTheme ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                For Employers
              </Link>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? '☀️' : '🌙'}
            </button>
            <Link
              href="/dashboard"
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm sm:text-base"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${isDarkTheme ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
            Where Singapore's Top Intern Talent Proves Themselves
          </div>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            About <span className="text-red-600">Internship.sg</span>
          </h1>
          <p className={`text-lg sm:text-xl max-w-2xl mx-auto ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            The platform where Singapore students build their talent profile, climb leaderboards, and get discovered by top employers.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-3xl sm:text-4xl font-bold text-red-600`}>{stat.value}</p>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Vision</h2>
            <p className="text-lg sm:text-xl leading-relaxed opacity-95">
              To become THE platform where Singapore's top intern talent lives and can be found.
              We're building a talent ecosystem where students prove their skills through practice,
              and employers discover dedicated candidates who have demonstrated their commitment.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-8 text-center ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className={`rounded-xl p-6 border text-center ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-4xl mb-4">1️⃣</div>
              <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Practice & Earn XP</h3>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Complete AI interviews, daily challenges, and learning tracks to earn XP and level up.
              </p>
            </div>
            <div className={`rounded-xl p-6 border text-center ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-4xl mb-4">2️⃣</div>
              <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Climb the Ranks</h3>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Rise through talent tiers from Bronze to Elite. Compete on school and global leaderboards.
              </p>
            </div>
            <div className={`rounded-xl p-6 border text-center ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-4xl mb-4">3️⃣</div>
              <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Get Discovered</h3>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Top performers get noticed by partner employers looking for dedicated intern talent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-8 text-center ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Platform Features
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-xl p-5 border transition-all hover:scale-[1.02] ${isDarkTheme ? 'bg-slate-900 border-slate-800 hover:border-red-500/50' : 'bg-white border-slate-200 hover:border-red-300'}`}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students & Employers */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* For Students */}
            <div className={`rounded-2xl p-6 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>For Students</h3>
              <ul className={`space-y-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Free AI interview practice with instant feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>65+ real interview questions with sample answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Company-specific prep for DBS, Grab, Google & more</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Earn badges and climb leaderboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Get discovered by partner employers</span>
                </li>
              </ul>
              <Link href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all">
                Start Practicing
              </Link>
            </div>

            {/* For Employers */}
            <div className={`rounded-2xl p-6 border ${isDarkTheme ? 'bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border-indigo-700/50' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'}`}>
              <h3 className={`text-xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>For Employers</h3>
              <ul className={`space-y-3 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">✓</span>
                  <span>Access verified talent with proven practice scores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">✓</span>
                  <span>See streak data that shows dedication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">✓</span>
                  <span>Filter by school, skills, and industry interest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">✓</span>
                  <span>Pre-qualified candidates who invest in preparation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">✓</span>
                  <span>Singapore-focused talent from top universities</span>
                </li>
              </ul>
              <Link href="/employers" className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all">
                Join Employer Waitlist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Ready to Prove Yourself?
          </h2>
          <p className={`mb-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Join hundreds of students building their talent profile and climbing the leaderboard.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 ${isDarkTheme ? 'border-slate-800 bg-slate-950' : 'border-slate-200'}`}>
        <div className={`max-w-6xl mx-auto px-4 text-center text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/companies" className="hover:text-red-600 transition-colors">Companies</Link>
            <Link href="/questions" className="hover:text-red-600 transition-colors">Questions</Link>
            <Link href="/resources" className="hover:text-red-600 transition-colors">Resources</Link>
            <Link href="/employers" className="hover:text-red-600 transition-colors">For Employers</Link>
          </div>
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
