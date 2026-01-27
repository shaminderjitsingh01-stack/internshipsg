"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function AboutPage() {
  const { isDarkTheme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
      {/* Nav */}
      <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isDarkTheme ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-3">
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
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm sm:text-base"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            About <span className="text-red-600">Internship.sg</span>
          </h1>
          <p className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Empowering Singapore students to land their dream internships through AI-powered interview preparation.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Our Story</h2>
            <div className={`space-y-3 sm:space-y-4 leading-relaxed text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>
                Internship.sg was born from a simple observation: too many talented Singapore students
                struggle with interviews, not because they lack skills, but because they lack practice
                and feedback.
              </p>
              <p>
                Traditional interview prep is expensive, inaccessible, and often doesn&apos;t provide
                the personalized feedback students need to improve. Career centers are overwhelmed,
                mock interviews are hard to schedule, and most students go into real interviews
                underprepared.
              </p>
              <p>
                We built Internship.sg to change that. Using the latest AI technology, we&apos;ve created
                an interview coach that&apos;s available 24/7, provides instant personalized feedback,
                and helps students practice until they&apos;re confident.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Our Mission</h2>
            <p className="text-base sm:text-lg md:text-xl leading-relaxed opacity-95">
              To democratize interview preparation and give every Singapore student—regardless of
              background, school, or connections—the tools they need to succeed in their career journey.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>What We Offer</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className={`rounded-xl p-4 sm:p-6 shadow-sm border text-center ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${isDarkTheme ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className={`font-semibold mb-2 text-sm sm:text-base ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>AI Video Interviews</h3>
              <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Practice with our AI interviewer that adapts to your resume and provides real-time feedback.
              </p>
            </div>
            <div className={`rounded-xl p-4 sm:p-6 shadow-sm border text-center ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${isDarkTheme ? 'bg-green-900/50' : 'bg-green-100'}`}>
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className={`font-semibold mb-2 text-sm sm:text-base ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Resume & Cover Letter</h3>
              <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Get AI-powered suggestions to improve your resume and craft compelling cover letters.
              </p>
            </div>
            <div className={`rounded-xl p-4 sm:p-6 shadow-sm border text-center sm:col-span-2 md:col-span-1 ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${isDarkTheme ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className={`font-semibold mb-2 text-sm sm:text-base ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Skills Assessment</h3>
              <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Receive detailed scores on communication, technical knowledge, and soft skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Singapore */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Why Focus on Singapore?</h2>
            <div className={`space-y-3 sm:space-y-4 leading-relaxed text-sm sm:text-base ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>
                Singapore&apos;s competitive job market means internships are more important than ever.
                They&apos;re often the gateway to full-time employment, and the interview process can
                be intense.
              </p>
              <p>
                We understand the unique context of Singapore&apos;s internship landscape—from local
                SMEs to MNCs, from tech startups to government agencies. Our AI is trained to
                prepare you for the specific types of questions and expectations you&apos;ll face
                in Singapore interviews.
              </p>
              <p>
                Whether you&apos;re from NUS, NTU, SMU, SUTD, SIT, or any polytechnic or ITE,
                Internship.sg is here to help you succeed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Ready to Ace Your Interview?
          </h2>
          <p className={`mb-6 sm:mb-8 text-sm sm:text-base px-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Start practicing today and build the confidence you need to land your dream internship.
          </p>
          <Link
            href="/"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-base sm:text-lg"
          >
            Start Free Practice
          </Link>
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
