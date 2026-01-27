"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className="h-8 w-auto" />
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            About <span className="text-red-600">Internship.sg</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Empowering Singapore students to land their dream internships through AI-powered interview preparation.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
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
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl leading-relaxed opacity-95">
              To democratize interview preparation and give every Singapore student—regardless of
              background, school, or connections—the tools they need to succeed in their career journey.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">AI Video Interviews</h3>
              <p className="text-sm text-slate-600">
                Practice with our AI interviewer that adapts to your resume and provides real-time feedback.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Resume & Cover Letter Help</h3>
              <p className="text-sm text-slate-600">
                Get AI-powered suggestions to improve your resume and craft compelling cover letters.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Skills Assessment</h3>
              <p className="text-sm text-slate-600">
                Receive detailed scores on communication, technical knowledge, and soft skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Singapore */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Focus on Singapore?</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
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
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Ace Your Interview?
          </h2>
          <p className="text-slate-600 mb-8">
            Start practicing today and build the confidence you need to land your dream internship.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-lg"
          >
            Start Free Practice
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/sitemap.xml" className="hover:text-red-600 transition-colors">Sitemap</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
          </div>
          <p>Made by <a href="https://shaminder.sg" className="text-red-600 hover:underline">shaminder.sg</a></p>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
