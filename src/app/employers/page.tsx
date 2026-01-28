"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface WaitlistForm {
  email: string;
  companyName: string;
  yourName: string;
  role: string;
  companySize: string;
  message: string;
}

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];

// Sample talent data for preview
const SAMPLE_TALENT = [
  {
    name: "J*** T**",
    school: "NUS Business School",
    score: 87,
    streak: 14,
    tier: "Gold",
    tierColor: "from-yellow-400 to-yellow-600",
    avatar: "JT",
  },
  {
    name: "S*** L**",
    school: "NTU Engineering",
    score: 92,
    streak: 21,
    tier: "Platinum",
    tierColor: "from-slate-300 to-slate-500",
    avatar: "SL",
  },
  {
    name: "A*** C**",
    school: "SMU Computing",
    score: 78,
    streak: 7,
    tier: "Silver",
    tierColor: "from-gray-300 to-gray-500",
    avatar: "AC",
  },
  {
    name: "M*** W**",
    school: "SUTD",
    score: 95,
    streak: 30,
    tier: "Diamond",
    tierColor: "from-cyan-300 to-blue-500",
    avatar: "MW",
  },
];

const VALUE_PROPS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "See Verified Practice Scores",
    description: "Access AI-graded interview scores that show real communication and technical skills.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Track Consistency",
    description: "Practice streaks reveal dedication and commitment - traits that predict workplace success.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Pre-qualified Talent",
    description: "Students who invest time in preparation are more likely to succeed in your internship.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Singapore Focused",
    description: "All students are from local universities - NUS, NTU, SMU, SUTD, SIT, and polytechnics.",
  },
];

const FAQS = [
  {
    question: "When will employer access launch?",
    answer: "We're targeting Q2 2025 for employer beta access. Waitlist members will get priority access and help shape the features we build.",
  },
  {
    question: "How much does it cost?",
    answer: "Pricing will depend on company size and hiring volume. Early waitlist members will receive significant discounts and potentially free pilot access.",
  },
  {
    question: "What data can I see about candidates?",
    answer: "You'll see verified interview scores, practice consistency (streaks), skill breakdowns, and profile information students choose to share. All data is consent-based.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Join the Waitlist",
    description: "Sign up with your work email to secure your spot for early access.",
  },
  {
    step: 2,
    title: "Get Early Access",
    description: "We'll notify you when employer features launch - waitlist members get priority.",
  },
  {
    step: 3,
    title: "Browse & Connect",
    description: "Search verified talent profiles and reach out to candidates who match your needs.",
  },
];

export default function EmployersPage() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [form, setForm] = useState<WaitlistForm>({
    email: "",
    companyName: "",
    yourName: "",
    role: "",
    companySize: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Stats (will be fetched from API)
  const [stats, setStats] = useState({
    studentsCount: 1250,
    interviewsCount: 8400,
    avgStreakDays: 7,
  });

  useEffect(() => {
    // Fetch real stats
    fetch("/api/employer-waitlist?stats=true")
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {
        // Use defaults
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/employer-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setSubmitStatus("success");
      setForm({
        email: "",
        companyName: "",
        yourName: "",
        role: "",
        companySize: "",
        message: "",
      });
    } catch (error: any) {
      setSubmitStatus("error");
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className="h-7 sm:h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm sm:text-base"
            >
              For Students
            </Link>
            <a
              href="#waitlist"
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition-all text-sm sm:text-base"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Coming Q2 2025
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Find Interns Who've{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Proven Their Dedication
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Discover students who practice consistently - not just impressive resumes.
            Our AI-verified practice scores help you identify candidates who invest in preparation.
          </p>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
          >
            Join Employer Waitlist
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-12 px-4 border-y border-slate-200 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-1">
                {stats.studentsCount.toLocaleString()}+
              </div>
              <div className="text-slate-600 text-sm sm:text-base">Students Practicing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-1">
                {stats.interviewsCount.toLocaleString()}+
              </div>
              <div className="text-slate-600 text-sm sm:text-base">Interviews Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-1">
                {stats.avgStreakDays}
              </div>
              <div className="text-slate-600 text-sm sm:text-base">Avg Streak Days</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
            Why Hire From Internship.sg?
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            Traditional hiring relies on resumes and brief interviews.
            We give you data on what really matters - consistent effort and proven skills.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUE_PROPS.map((prop, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center mb-4">
                  {prop.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{prop.title}</h3>
                <p className="text-slate-600">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Talent Preview Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-slate-900 to-indigo-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            Preview Our Talent Pool
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Get a glimpse of the verified talent available. Full profiles unlocked for waitlist members.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {SAMPLE_TALENT.map((talent, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 relative overflow-hidden"
              >
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-[2px] bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10" />

                {/* Avatar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${talent.tierColor} flex items-center justify-center text-white font-bold`}>
                    {talent.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{talent.name}</div>
                    <div className="text-sm text-slate-400">{talent.school}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Interview Score</span>
                    <span className="text-white font-semibold">{talent.score}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Practice Streak</span>
                    <span className="text-white font-semibold">{talent.streak} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Tier</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${talent.tierColor} text-white`}>
                      {talent.tier}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Overlay CTA */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <a
                href="#waitlist"
                className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Join Waitlist to Access Full Profiles
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
            How It Works
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            Getting started is simple. Join now to secure your early access spot.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 w-24">
                    <svg className="w-full text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section id="waitlist" className="py-16 sm:py-20 px-4 bg-gradient-to-br from-indigo-600 to-blue-700">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            Join the Employer Waitlist
          </h2>
          <p className="text-indigo-100 text-center mb-8">
            Be among the first employers to access our verified talent pool when we launch.
          </p>

          {submitStatus === "success" ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">You're on the list!</h3>
              <p className="text-slate-600 mb-6">
                We'll notify you as soon as employer access is ready. Thank you for your interest in Internship.sg!
              </p>
              <button
                onClick={() => setSubmitStatus("idle")}
                className="text-indigo-600 font-medium hover:underline"
              >
                Submit another company
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Acme Pte Ltd"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={form.yourName}
                    onChange={(e) => setForm({ ...form, yourName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="HR Manager"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Size
                </label>
                <select
                  value={form.companySize}
                  onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                >
                  <option value="">Select company size</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your hiring needs or any questions..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                />
              </div>

              {submitStatus === "error" && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining...
                  </>
                ) : (
                  "Join Waitlist"
                )}
              </button>

              <p className="text-center text-slate-500 text-sm mt-4">
                We respect your privacy. Your information is only used for waitlist purposes.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-center mb-12">
            Have questions? We've got answers.
          </p>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-500 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-slate-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Find Better Interns?
          </h2>
          <p className="text-slate-400 mb-8">
            Join forward-thinking companies who want to hire based on proven effort, not just credentials.
          </p>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all"
          >
            Join the Waitlist
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-indigo-600 transition-colors">For Students</Link>
            <Link href="/resources" className="hover:text-indigo-600 transition-colors">Resources</Link>
            <Link href="/about" className="hover:text-indigo-600 transition-colors">About</Link>
            <Link href="/roadmap" className="hover:text-indigo-600 transition-colors">Roadmap</Link>
          </div>
          <p className="mt-1">Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
