"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: "account" | "profile" | "jobs" | "social" | "billing" | "technical";
}

const faqs: FAQ[] = [
  // Account
  {
    id: "account-1",
    question: "How do I create an account?",
    answer: "You can create an account by clicking the 'Sign Up' button on the homepage. You can sign up using your email address or through Google OAuth for a faster registration process.",
    category: "account",
  },
  {
    id: "account-2",
    question: "How do I reset my password?",
    answer: "Go to the sign-in page and click 'Forgot Password'. Enter your email address and we'll send you a link to reset your password. The link expires after 24 hours.",
    category: "account",
  },
  {
    id: "account-3",
    question: "Can I delete my account?",
    answer: "Yes, you can delete your account from Settings > Account. Please note that this action is irreversible and all your data including interview history, achievements, and profile information will be permanently deleted.",
    category: "account",
  },
  {
    id: "account-4",
    question: "How do I change my email address?",
    answer: "Currently, email addresses cannot be changed directly. Please contact support with your current and new email addresses, and we'll help you migrate your account.",
    category: "account",
  },
  // Profile
  {
    id: "profile-1",
    question: "How do I make my profile public?",
    answer: "Go to Settings > Privacy and toggle on 'Public Profile'. This allows others to view your profile, achievements, and stats. You can also choose whether to appear on the leaderboard.",
    category: "profile",
  },
  {
    id: "profile-2",
    question: "What are talent tiers and how do I progress?",
    answer: "Talent tiers (Bronze, Silver, Gold, Platinum, Elite) are based on your XP and percentile ranking. Earn XP by completing AI interviews, daily challenges, and maintaining streaks. Higher tiers unlock special badges and visibility to employers.",
    category: "profile",
  },
  {
    id: "profile-3",
    question: "How do I add my education and experience?",
    answer: "Go to Settings > Experience & Education. You can add your school, degree, graduation year, as well as work experience and internships. This information appears on your public profile.",
    category: "profile",
  },
  {
    id: "profile-4",
    question: "How do streaks work?",
    answer: "Streaks track consecutive days of activity on the platform. Complete at least one practice session per day to maintain your streak. Streaks reset at midnight SGT. Longer streaks earn you special badges and XP bonuses!",
    category: "profile",
  },
  // Jobs
  {
    id: "jobs-1",
    question: "How do I search for internships?",
    answer: "Visit the Jobs page to browse available internships. You can filter by industry, location, company, and more. Save jobs you're interested in to apply later.",
    category: "jobs",
  },
  {
    id: "jobs-2",
    question: "How do I apply for a job?",
    answer: "Click on a job listing and then click 'Apply Now'. You may need to attach your resume and optionally a cover letter. Some applications redirect to the company's external application page.",
    category: "jobs",
  },
  {
    id: "jobs-3",
    question: "Can I track my applications?",
    answer: "Yes! Go to Jobs > My Applications to see all your submitted applications and their status. You'll also receive notifications when there are updates to your applications.",
    category: "jobs",
  },
  {
    id: "jobs-4",
    question: "How do I prepare for interviews with specific companies?",
    answer: "Visit the Companies page and select a company to view their interview guide. Each guide includes common questions, tips, and company-specific preparation advice.",
    category: "jobs",
  },
  // Social
  {
    id: "social-1",
    question: "How do I connect with other users?",
    answer: "Visit a user's profile and click 'Follow' to add them to your network. You can also join events, participate in discussions, and engage with posts to grow your network.",
    category: "social",
  },
  {
    id: "social-2",
    question: "How do I create a post?",
    answer: "From your dashboard or the home feed, click 'Create Post'. You can share updates, ask questions, or share your interview experiences with the community.",
    category: "social",
  },
  {
    id: "social-3",
    question: "Can I block or report users?",
    answer: "Yes, you can block or report users from their profile page using the menu (three dots). Blocked users won't be able to see your profile or interact with your content.",
    category: "social",
  },
  {
    id: "social-4",
    question: "How do I manage my notifications?",
    answer: "Go to Settings > Notifications to customize which notifications you receive. You can toggle email notifications for streaks, achievements, weekly digests, and more.",
    category: "social",
  },
  // Billing
  {
    id: "billing-1",
    question: "Is Internship.sg free to use?",
    answer: "Yes! The core features including AI interview practice, leaderboards, and basic analytics are completely free. Premium features are available for users who want additional benefits.",
    category: "billing",
  },
  {
    id: "billing-2",
    question: "What payment methods do you accept?",
    answer: "We accept major credit cards, debit cards, and PayNow for Singapore users. All payments are processed securely through Stripe.",
    category: "billing",
  },
  {
    id: "billing-3",
    question: "How do I cancel my subscription?",
    answer: "Go to Settings > Billing and click 'Cancel Subscription'. Your premium features will remain active until the end of your billing period.",
    category: "billing",
  },
  {
    id: "billing-4",
    question: "Can I get a refund?",
    answer: "We offer a 7-day refund policy for new subscriptions. Contact support within 7 days of your purchase if you'd like a refund. Refunds are processed within 5-10 business days.",
    category: "billing",
  },
  // Technical
  {
    id: "technical-1",
    question: "What browsers are supported?",
    answer: "Internship.sg works best on the latest versions of Chrome, Firefox, Safari, and Edge. For the AI interview feature, we recommend using Chrome for the best experience.",
    category: "technical",
  },
  {
    id: "technical-2",
    question: "Why isn't my microphone working?",
    answer: "Make sure you've granted microphone permissions in your browser. Check that no other application is using your microphone. Try refreshing the page or using a different browser.",
    category: "technical",
  },
  {
    id: "technical-3",
    question: "How do I export my data?",
    answer: "Go to Settings > Data Export and click 'Download My Data'. You'll receive a JSON file containing all your profile information, interview history, and achievements.",
    category: "technical",
  },
  {
    id: "technical-4",
    question: "The page isn't loading correctly. What should I do?",
    answer: "Try clearing your browser cache, disabling browser extensions, or using an incognito window. If the issue persists, please contact support with details about your browser and device.",
    category: "technical",
  },
];

const categories = [
  { id: "all", label: "All Topics", icon: "M4 6h16M4 12h16M4 18h16" },
  { id: "account", label: "Account", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "profile", label: "Profile", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "jobs", label: "Jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id: "social", label: "Social", icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
  { id: "billing", label: "Billing", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { id: "technical", label: "Technical", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

const guides = [
  {
    title: "Getting Started Guide",
    description: "Learn how to set up your profile and start practicing",
    href: "/resources/getting-started",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    title: "Interview Preparation Tips",
    description: "Best practices for acing your interviews",
    href: "/resources/interview-tips",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Understanding Your Score",
    description: "Learn how interview scores are calculated",
    href: "/resources/scoring",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    title: "Building Your Profile",
    description: "Tips for creating an impressive profile",
    href: "/resources/profile-tips",
    icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function HelpPage() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Contact form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        searchQuery === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || faq.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit ticket");
      }

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
      {/* Nav */}
      <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isDarkTheme ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 sm:h-8 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
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
              href="/dashboard"
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm sm:text-base"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${isDarkTheme ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Help & Support
          </div>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            How can we help you?
          </h1>
          <p className={`text-lg max-w-2xl mx-auto mb-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Search our knowledge base or browse categories to find answers to your questions.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border text-lg transition-all ${
                  isDarkTheme
                    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-red-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500'
                } focus:ring-2 focus:ring-red-500/20 focus:outline-none`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-red-600 text-white'
                    : isDarkTheme
                      ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                </svg>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Frequently Asked Questions
            {selectedCategory !== "all" && (
              <span className={`ml-2 text-lg font-normal ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                ({categories.find(c => c.id === selectedCategory)?.label})
              </span>
            )}
          </h2>

          {filteredFaqs.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <svg className={`w-12 h-12 mx-auto mb-4 ${isDarkTheme ? 'text-slate-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-lg ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                No results found for "{searchQuery}"
              </p>
              <p className={`text-sm mt-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                Try a different search term or contact support below
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                      isDarkTheme ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-medium pr-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        expandedFaq === faq.id ? 'rotate-180' : ''
                      } ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className={`px-6 pb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      <p className="leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Documentation & Guides */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Documentation & Guides
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {guides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className={`flex items-start gap-4 p-5 rounded-xl border transition-all hover:scale-[1.02] ${
                  isDarkTheme
                    ? 'bg-slate-900 border-slate-800 hover:border-red-500/50'
                    : 'bg-white border-slate-200 hover:border-red-300'
                }`}
              >
                <div className={`p-3 rounded-xl ${isDarkTheme ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={guide.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {guide.title}
                  </h3>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    {guide.description}
                  </p>
                </div>
                <svg className={`w-5 h-5 mt-1 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community & Quick Links */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Community Link */}
            <div className={`p-6 rounded-2xl border ${isDarkTheme ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-700/50' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                  <svg className={`w-6 h-6 ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Join Our Community
                </h3>
              </div>
              <p className={`text-sm mb-4 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                Connect with other students, share tips, and get help from the community.
              </p>
              <Link
                href="/network"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isDarkTheme
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Explore Network
              </Link>
            </div>

            {/* Response Time Info */}
            <div className={`p-6 rounded-2xl border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-green-500/20' : 'bg-green-100'}`}>
                  <svg className={`w-6 h-6 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Support Response Time
                </h3>
              </div>
              <p className={`text-sm mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Our team typically responds within <strong>24-48 hours</strong> during business days (Mon-Fri, 9am-6pm SGT).
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className={`text-sm ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                  Support team available
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support Form */}
      <section className="px-4 py-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-2xl p-6 sm:p-8 border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${isDarkTheme ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <svg className={`w-6 h-6 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Contact Support
                </h2>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  Can't find what you're looking for? Send us a message.
                </p>
              </div>
            </div>

            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Your support ticket has been submitted. We'll get back to you within 24-48 hours.</span>
              </div>
            )}

            {submitError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDarkTheme
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-500'
                    } focus:ring-2 focus:ring-red-500/20 focus:outline-none`}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDarkTheme
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-500'
                    } focus:ring-2 focus:ring-red-500/20 focus:outline-none`}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-500'
                  } focus:ring-2 focus:ring-red-500/20 focus:outline-none`}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-500'
                  } focus:ring-2 focus:ring-red-500/20 focus:outline-none`}
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Ticket
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 ${isDarkTheme ? 'border-slate-800 bg-slate-950' : 'border-slate-200'}`}>
        <div className={`max-w-6xl mx-auto px-4 text-center text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-red-600 transition-colors">Leaderboard</Link>
            <Link href="/companies" className="hover:text-red-600 transition-colors">Companies</Link>
            <Link href="/resources" className="hover:text-red-600 transition-colors">Resources</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">About</Link>
          </div>
          <p>Shaminder Technologies | UEN 53517136J</p>
        </div>
      </footer>
    </div>
  );
}
