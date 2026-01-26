"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
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

type AppState = "landing" | "onboarding" | "dashboard" | "blog" | "resources" | "glossary";

// Glossary terms
const glossaryTerms = [
  { term: "STAR Method", definition: "A structured way to answer behavioral interview questions: Situation, Task, Action, Result. Helps you give clear, concise examples from your experience." },
  { term: "ATS (Applicant Tracking System)", definition: "Software used by companies to scan and filter resumes before a human sees them. Your resume needs relevant keywords to pass ATS screening." },
  { term: "Behavioral Interview", definition: "Interview questions that ask about past experiences (e.g., 'Tell me about a time when...'). They assess how you've handled real situations." },
  { term: "Cover Letter", definition: "A one-page letter introducing yourself to employers, explaining why you're interested in the role and what you can contribute." },
  { term: "Elevator Pitch", definition: "A 30-60 second summary of who you are, what you do, and what you're looking for. Useful for networking and interviews." },
  { term: "Hard Skills", definition: "Technical, teachable abilities like coding, Excel, data analysis, or specific software proficiency that can be measured." },
  { term: "Soft Skills", definition: "Interpersonal skills like communication, teamwork, adaptability, and problem-solving that affect how you work with others." },
  { term: "Networking", definition: "Building professional relationships that can help with career advice, referrals, and job opportunities." },
  { term: "Referral", definition: "When someone recommends you for a job at their company. Referrals often get priority consideration from recruiters." },
  { term: "Portfolio", definition: "A collection of your work samples, projects, and achievements that demonstrate your skills to potential employers." },
  { term: "LinkedIn", definition: "Professional social network where you can showcase your experience, connect with recruiters, and find job postings." },
  { term: "Internship", definition: "A temporary work experience, usually for students, to gain practical skills and industry exposure. Can be paid or unpaid." },
  { term: "CV (Curriculum Vitae)", definition: "A detailed document of your education, experience, and achievements. In Singapore, 'CV' and 'resume' are often used interchangeably." },
  { term: "Job Description (JD)", definition: "A document outlining the responsibilities, requirements, and qualifications for a position. Study it carefully before applying." },
  { term: "Cultural Fit", definition: "How well your values, work style, and personality align with a company's culture and team dynamics." },
  { term: "Follow-up Email", definition: "A thank-you message sent within 24 hours after an interview, reiterating your interest and key qualifications." },
  { term: "Informational Interview", definition: "A casual conversation with a professional to learn about their career path, company, or industry — not to ask for a job directly." },
  { term: "Value Proposition", definition: "The unique combination of skills, experiences, and qualities you bring that make you valuable to employers." },
  { term: "MyCareersFuture", definition: "Singapore government's official job portal with internship listings and career resources for citizens and PRs." },
  { term: "SkillsFuture", definition: "Singapore government initiative providing credits and subsidies for courses to help citizens upskill throughout their careers." },
];

// Blog posts data
const blogPosts = [
  {
    id: 1,
    title: "5 Common Interview Mistakes Singapore Students Make",
    excerpt: "Learn the top pitfalls that cost students their dream internships and how to avoid them.",
    category: "Interview Tips",
    date: "Jan 20, 2025",
    readTime: "5 min read",
    image: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2",
  },
  {
    id: 2,
    title: "How to Stand Out on LinkedIn as a Student",
    excerpt: "Optimize your profile to attract recruiters from top Singapore companies like DBS, Grab, and Shopee.",
    category: "Career Growth",
    date: "Jan 15, 2025",
    readTime: "7 min read",
    image: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    id: 3,
    title: "The Ultimate Guide to Internship Applications in Singapore",
    excerpt: "From MyCareersFuture to InternSG — a complete guide to finding and landing internships.",
    category: "Getting Started",
    date: "Jan 10, 2025",
    readTime: "10 min read",
    image: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: 4,
    title: "STAR Method: Your Secret Weapon for Behavioral Interviews",
    excerpt: "Master the Situation-Task-Action-Result framework to ace any interview question.",
    category: "Interview Tips",
    date: "Jan 5, 2025",
    readTime: "6 min read",
    image: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
  {
    id: 5,
    title: "Resume Trends for 2025: What Singapore Recruiters Want",
    excerpt: "Stay ahead with the latest resume formats, keywords, and design tips for the Singapore job market.",
    category: "Resume",
    date: "Dec 28, 2024",
    readTime: "8 min read",
    image: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: 6,
    title: "Networking 101: Building Connections as an Introvert",
    excerpt: "Practical strategies for building your professional network even if networking events terrify you.",
    category: "Career Growth",
    date: "Dec 20, 2024",
    readTime: "6 min read",
    image: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

// Resources data
const resources = [
  {
    category: "Job Portals",
    items: [
      { name: "MyCareersFuture", url: "https://www.mycareersfuture.gov.sg", desc: "Official Singapore government job portal" },
      { name: "InternSG", url: "https://www.interbsg.sg", desc: "Singapore's largest student internship platform" },
      { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs", desc: "Filter by location and experience level" },
      { name: "Glassdoor", url: "https://www.glassdoor.sg", desc: "Company reviews and salary insights" },
    ],
  },
  {
    category: "Learning Platforms",
    items: [
      { name: "LinkedIn Learning", url: "https://www.linkedin.com/learning", desc: "Professional courses with certificates" },
      { name: "Coursera", url: "https://www.coursera.org", desc: "Free courses from top universities" },
      { name: "Skillshare", url: "https://www.skillshare.com", desc: "Creative and business skills" },
      { name: "Google Digital Garage", url: "https://learndigital.withgoogle.com", desc: "Free digital marketing courses" },
    ],
  },
  {
    category: "Resume & Cover Letter",
    items: [
      { name: "Canva Resume Templates", url: "https://www.canva.com/resumes", desc: "Beautiful, professional templates" },
      { name: "Novoresume", url: "https://novoresume.com", desc: "ATS-friendly resume builder" },
      { name: "Grammarly", url: "https://www.grammarly.com", desc: "Write error-free applications" },
      { name: "Hemingway Editor", url: "https://hemingwayapp.com", desc: "Make your writing clear and concise" },
    ],
  },
  {
    category: "Interview Prep",
    items: [
      { name: "Pramp", url: "https://www.pramp.com", desc: "Free peer-to-peer mock interviews" },
      { name: "Big Interview", url: "https://www.biginterview.com", desc: "AI-powered interview practice" },
      { name: "Glassdoor Interview Questions", url: "https://www.glassdoor.sg/Interview", desc: "Real interview questions by company" },
      { name: "The Muse", url: "https://www.themuse.com", desc: "Career advice and company profiles" },
    ],
  },
  {
    category: "Singapore-Specific",
    items: [
      { name: "SGCareerGuide", url: "https://www.sgcareerguide.com", desc: "Career advice for Singapore students" },
      { name: "e2i (NTUC)", url: "https://e2i.com.sg", desc: "Employment and employability institute" },
      { name: "SkillsFuture", url: "https://www.skillsfuture.gov.sg", desc: "Government training subsidies" },
      { name: "WSG CareerConnect", url: "https://www.wsg.gov.sg", desc: "Workforce Singapore career services" },
    ],
  },
  {
    category: "Networking",
    items: [
      { name: "Meetup Singapore", url: "https://www.meetup.com/cities/sg/singapore", desc: "Professional networking events" },
      { name: "Eventbrite Singapore", url: "https://www.eventbrite.sg", desc: "Career fairs and workshops" },
      { name: "LinkedIn Events", url: "https://www.linkedin.com/events", desc: "Professional virtual events" },
      { name: "NUS/NTU Career Fairs", url: "#", desc: "University career fair schedules" },
    ],
  },
];

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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

  // Check if user is already registered
  useEffect(() => {
    const savedUser = localStorage.getItem("internship_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setFormData(prev => ({ ...prev, ...user }));
      setAppState("onboarding");
    }
    const savedProgress = localStorage.getItem("internship_progress");
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const updateProgress = (key: keyof Progress, value: number) => {
    const newProgress = { ...progress, [key]: value };
    setProgress(newProgress);
    localStorage.setItem("internship_progress", JSON.stringify(newProgress));
  };

  const handleRegister = () => {
    if (!formData.name || !formData.email) return;
    localStorage.setItem("internship_user", JSON.stringify({ name: formData.name, email: formData.email }));
    setAppState("onboarding");
  };

  const handleGenerateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to generate guidance");

      const data = await res.json();
      setCareerData(data);
      setAppState("dashboard");
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
    if (numScore >= 8) return "text-emerald-600 bg-emerald-50";
    if (numScore >= 6) return "text-amber-600 bg-amber-50";
    return "text-rose-600 bg-rose-50";
  };

  // ==================== LANDING PAGE ====================
  if (appState === "landing") {
    return (
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Internship.sg" className="h-14 w-auto" />
              </div>
              <div className="hidden md:flex items-center gap-6">
                <a href="#how-it-works" className="text-slate-600 hover:text-red-600 font-medium transition">How It Works</a>
                <button onClick={() => setAppState("blog")} className="text-slate-600 hover:text-red-600 font-medium transition">Blog</button>
                <button onClick={() => setAppState("resources")} className="text-slate-600 hover:text-red-600 font-medium transition">Resources</button>
                <button onClick={() => setAppState("glossary")} className="text-slate-600 hover:text-red-600 font-medium transition">Glossary</button>
              </div>
              <button
                onClick={() => setAppState("onboarding")}
                className="btn-premium text-sm px-6 py-2.5"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              AI-Powered Interview Prep
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Prepare for Internship
              <span className="text-gradient block">Interviews with AI</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Practice with AI-powered mock interviews, get personalized feedback on your answers,
              and build confidence before your real interviews — designed for Singapore students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => setAppState("onboarding")}
                className="btn-premium text-lg px-10 py-4 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Practicing Free
              </button>
              <a href="#how-it-works" className="px-10 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-red-300 hover:bg-red-50/50 transition-all">
                See How It Works
              </a>
            </div>

            {/* Value Props */}
            <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
              {[
                { value: "100%", label: "Free to Start" },
                { value: "AI", label: "Powered Feedback" },
                { value: "SG", label: "Focused Content" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-4xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-slate-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Tools to Help You <span className="text-gradient">Prepare</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Practice and improve your interview skills with AI-powered feedback
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                  title: "AI Mock Interviews",
                  desc: "Practice with realistic interview questions and get feedback on your answers with scoring (1-10) on structure, confidence, and relevance.",
                  color: "from-red-500 to-red-600",
                },
                {
                  icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                  title: "Resume Tips",
                  desc: "Get suggestions for bullet points and formatting tips based on your skills and the roles you're targeting.",
                  color: "from-red-600 to-red-700",
                },
                {
                  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                  title: "Progress Tracking",
                  desc: "Keep track of your practice sessions, see your improvement over time, and stay motivated with milestones.",
                  color: "from-red-500 to-rose-600",
                },
                {
                  icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                  title: "Role Recommendations",
                  desc: "Discover internship roles that match your skills and interests, with resources specific to Singapore.",
                  color: "from-rose-500 to-red-600",
                },
                {
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                  title: "Soft Skills Tips",
                  desc: "Learn about communication, teamwork, and other interpersonal skills that interviewers look for.",
                  color: "from-red-600 to-rose-600",
                },
                {
                  icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                  title: "Cover Letter Help",
                  desc: "Get a personalized cover letter template that you can customize for different applications.",
                  color: "from-rose-600 to-red-700",
                },
              ].map((feature, i) => (
                <div key={i} className="card-premium p-8 group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                How It <span className="text-gradient">Works</span>
              </h2>
              <p className="text-lg text-slate-600">Start preparing for your interviews in 3 simple steps</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Create Profile", desc: "Tell us about your course, skills, and the types of roles you're interested in" },
                { step: "02", title: "Get Practice Materials", desc: "AI generates interview questions, resume tips, and a cover letter template for you" },
                { step: "03", title: "Practice & Improve", desc: "Use mock interviews to practice, review feedback, and build your confidence" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl glow-primary">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="gradient-premium rounded-3xl p-12 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Start Practicing?
                </h2>
                <p className="text-red-200 text-lg mb-8 max-w-xl mx-auto">
                  Get personalized interview practice materials and start building your confidence today.
                </p>
                <button
                  onClick={() => setAppState("onboarding")}
                  className="bg-white text-red-600 font-bold px-10 py-4 rounded-2xl hover:bg-red-50 transition-all shadow-xl text-lg"
                >
                  Start Free Practice
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Internship.sg" className="h-12 w-auto" />
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <button onClick={() => setAppState("blog")} className="text-slate-600 hover:text-red-600 transition">Blog</button>
                <button onClick={() => setAppState("resources")} className="text-slate-600 hover:text-red-600 transition">Resources</button>
                <button onClick={() => setAppState("glossary")} className="text-slate-600 hover:text-red-600 transition">Glossary</button>
              </div>
              <div className="text-center text-slate-500 text-sm space-y-1">
                <p>Made by <a href="https://shaminder.sg" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">shaminder.sg</a></p>
                <p>Shaminder Technologies | UEN 53517136J</p>
                <p className="text-slate-400">© {new Date().getFullYear()} Internship.sg. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==================== ONBOARDING PAGE ====================
  if (appState === "onboarding") {
    const handleGoogleSignIn = () => {
      signIn("google", { callbackUrl: "/" });
    };

    const handleLinkedInSignIn = () => {
      signIn("linkedin", { callbackUrl: "/" });
    };

    const handleAppleSignIn = () => {
      signIn("apple", { callbackUrl: "/" });
    };

    const handleFacebookSignIn = () => {
      signIn("facebook", { callbackUrl: "/" });
    };

    const handleMicrosoftSignIn = () => {
      signIn("azure-ad", { callbackUrl: "/" });
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Internship.sg" className="h-20 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Profile</h1>
            <p className="text-slate-600">Tell us about yourself so we can personalize your interview practice</p>
          </div>

          <div className="card-premium p-8 space-y-6">
            {/* One-Click Sign In Options */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-slate-200 rounded-2xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleLinkedInSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#0A66C2] text-white rounded-2xl font-semibold hover:bg-[#004182] transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Continue with LinkedIn
              </button>
              <button
                type="button"
                onClick={handleAppleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                Continue with Apple
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleFacebookSignIn}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-2xl font-semibold hover:bg-[#166FE5] transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={handleMicrosoftSignIn}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                  Microsoft
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleGenerateGuide} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-premium w-full"
                  placeholder="Sarah Tan"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-premium w-full"
                  placeholder="sarah@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Course / Degree</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="input-premium w-full"
                placeholder="Business Administration, NUS"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Skills & Projects</label>
              <textarea
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                rows={3}
                className="input-premium w-full resize-none"
                placeholder="Python, Excel, built a stock portfolio tracker..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Roles</label>
              <input
                type="text"
                required
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                className="input-premium w-full"
                placeholder="Marketing, Data Analytics, Finance"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Experience</label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="input-premium w-full"
                >
                  <option value="none">No prior internships</option>
                  <option value="some">1 internship</option>
                  <option value="moderate">2+ internships</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Goal</label>
                <input
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="input-premium w-full"
                  placeholder="Marketing Internship 2025"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full flex items-center justify-center gap-2 disabled:opacity-50"
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

          <p className="text-center text-sm text-slate-500 mt-6">
            <button onClick={() => setAppState("landing")} className="text-red-600 hover:underline">
              ← Back to home
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ==================== BLOG PAGE ====================
  if (appState === "blog") {
    return (
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setAppState("landing")} className="flex items-center gap-2">
                <img src="/logo.png" alt="Internship.sg" className="h-14 w-auto" />
              </button>
              <div className="hidden md:flex items-center gap-6">
                <button onClick={() => setAppState("landing")} className="text-slate-600 hover:text-red-600 font-medium transition">Home</button>
                <button onClick={() => setAppState("resources")} className="text-slate-600 hover:text-red-600 font-medium transition">Resources</button>
                <button onClick={() => setAppState("glossary")} className="text-slate-600 hover:text-red-600 font-medium transition">Glossary</button>
              </div>
              <button onClick={() => setAppState("onboarding")} className="btn-premium text-sm px-6 py-2.5">
                Get Started Free
              </button>
            </div>
          </div>
        </nav>

        {/* Blog Header */}
        <section className="pt-16 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Career <span className="text-gradient">Blog</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tips, guides, and insights to help you prepare for your internship interviews
            </p>
          </div>
        </section>

        {/* Blog Categories */}
        <section className="pb-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-3">
            {["All", "Interview Tips", "Resume", "Career Growth", "Getting Started"].map((cat) => (
              <button key={cat} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${cat === "All" ? "bg-red-600 text-white" : "bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="pb-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <article key={post.id} className="card-premium overflow-hidden group cursor-pointer">
                  <div className="h-48 gradient-primary flex items-center justify-center relative overflow-hidden">
                    <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={post.image} />
                    </svg>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="badge-premium bg-red-50 text-red-700">{post.category}</span>
                      <span className="text-xs text-slate-500">{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-red-600 transition">{post.title}</h2>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{post.date}</span>
                      <span className="text-red-600 font-semibold group-hover:underline">Read more →</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="pb-24 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="gradient-premium rounded-3xl p-8 sm:p-12 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Get Weekly Interview Tips</h2>
              <p className="text-red-200 mb-6">Join students receiving actionable interview prep advice every week.</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" placeholder="Enter your email" className="flex-1 px-5 py-3 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50" />
                <button className="px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition">Subscribe</button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6">
              <img src="/logo.png" alt="Internship.sg" className="h-12 w-auto" />
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <button onClick={() => setAppState("landing")} className="text-slate-600 hover:text-red-600 transition">Home</button>
                <button onClick={() => setAppState("resources")} className="text-slate-600 hover:text-red-600 transition">Resources</button>
                <button onClick={() => setAppState("glossary")} className="text-slate-600 hover:text-red-600 transition">Glossary</button>
              </div>
              <div className="text-center text-slate-500 text-sm space-y-1">
                <p>Made by <a href="https://shaminder.sg" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">shaminder.sg</a></p>
                <p>Shaminder Technologies | UEN 53517136J</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==================== RESOURCES PAGE ====================
  if (appState === "resources") {
    return (
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setAppState("landing")} className="flex items-center gap-2">
                <img src="/logo.png" alt="Internship.sg" className="h-14 w-auto" />
              </button>
              <div className="hidden md:flex items-center gap-6">
                <button onClick={() => setAppState("landing")} className="text-slate-600 hover:text-red-600 font-medium transition">Home</button>
                <button onClick={() => setAppState("blog")} className="text-slate-600 hover:text-red-600 font-medium transition">Blog</button>
                <button onClick={() => setAppState("glossary")} className="text-slate-600 hover:text-red-600 font-medium transition">Glossary</button>
              </div>
              <button onClick={() => setAppState("onboarding")} className="btn-premium text-sm px-6 py-2.5">
                Get Started Free
              </button>
            </div>
          </div>
        </nav>

        {/* Resources Header */}
        <section className="pt-16 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Career <span className="text-gradient">Resources</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Curated tools, platforms, and resources to accelerate your internship search in Singapore
            </p>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="pb-24 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            {resources.map((category, i) => (
              <div key={i}>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-sm">{i + 1}</span>
                  {category.category}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.items.map((item, j) => (
                    <a
                      key={j}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-premium p-5 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition">{item.name}</h3>
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="gradient-premium rounded-3xl p-12 text-center text-white relative overflow-hidden">
              <div className="relative">
                <h2 className="text-3xl font-bold mb-4">Ready to Start Practicing?</h2>
                <p className="text-red-200 text-lg mb-8">Get AI-powered interview practice tailored to your skills and goals.</p>
                <button onClick={() => setAppState("onboarding")} className="bg-white text-red-600 font-bold px-10 py-4 rounded-2xl hover:bg-red-50 transition-all shadow-xl text-lg">
                  Start Free Practice
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6">
              <img src="/logo.png" alt="Internship.sg" className="h-12 w-auto" />
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <button onClick={() => setAppState("landing")} className="text-slate-600 hover:text-red-600 transition">Home</button>
                <button onClick={() => setAppState("blog")} className="text-slate-600 hover:text-red-600 transition">Blog</button>
                <button onClick={() => setAppState("glossary")} className="text-slate-600 hover:text-red-600 transition">Glossary</button>
              </div>
              <div className="text-center text-slate-500 text-sm space-y-1">
                <p>Made by <a href="https://shaminder.sg" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">shaminder.sg</a></p>
                <p>Shaminder Technologies | UEN 53517136J</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==================== GLOSSARY PAGE ====================
  if (appState === "glossary") {
    return (
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setAppState("landing")} className="flex items-center gap-2">
                <img src="/logo.png" alt="Internship.sg" className="h-14 w-auto" />
              </button>
              <div className="hidden md:flex items-center gap-6">
                <button onClick={() => setAppState("landing")} className="text-slate-600 hover:text-red-600 font-medium transition">Home</button>
                <button onClick={() => setAppState("blog")} className="text-slate-600 hover:text-red-600 font-medium transition">Blog</button>
                <button onClick={() => setAppState("resources")} className="text-slate-600 hover:text-red-600 font-medium transition">Resources</button>
              </div>
              <button onClick={() => setAppState("onboarding")} className="btn-premium text-sm px-6 py-2.5">
                Get Started Free
              </button>
            </div>
          </div>
        </nav>

        {/* Glossary Header */}
        <section className="pt-16 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Career <span className="text-gradient">Glossary</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Key terms and concepts you need to know for your internship search and interviews
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="pb-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search terms..."
                className="input-premium w-full pl-12"
              />
            </div>
          </div>
        </section>

        {/* Glossary Terms */}
        <section className="pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4">
              {glossaryTerms.map((item, i) => (
                <div key={i} className="card-premium p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.term}</h3>
                  <p className="text-slate-600">{item.definition}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="gradient-premium rounded-3xl p-12 text-center text-white relative overflow-hidden">
              <div className="relative">
                <h2 className="text-3xl font-bold mb-4">Ready to Put These Terms into Practice?</h2>
                <p className="text-red-200 text-lg mb-8">Start practicing your interview skills with AI-powered feedback.</p>
                <button onClick={() => setAppState("onboarding")} className="bg-white text-red-600 font-bold px-10 py-4 rounded-2xl hover:bg-red-50 transition-all shadow-xl text-lg">
                  Start Free Practice
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6">
              <img src="/logo.png" alt="Internship.sg" className="h-12 w-auto" />
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <button onClick={() => setAppState("landing")} className="text-slate-600 hover:text-red-600 transition">Home</button>
                <button onClick={() => setAppState("blog")} className="text-slate-600 hover:text-red-600 transition">Blog</button>
                <button onClick={() => setAppState("resources")} className="text-slate-600 hover:text-red-600 transition">Resources</button>
              </div>
              <div className="text-center text-slate-500 text-sm space-y-1">
                <p>Made by <a href="https://shaminder.sg" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">shaminder.sg</a></p>
                <p>Shaminder Technologies | UEN 53517136J</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==================== DASHBOARD ====================
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Internship.sg" className="h-14 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 glass px-4 py-2 rounded-xl">
                <span className="text-sm text-slate-600">Readiness</span>
                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${readinessScore()}%` }} />
                </div>
                <span className="font-bold text-red-600">{readinessScore()}%</span>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">{formData.name?.[0]?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="gradient-premium rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">Welcome back, {formData.name}!</h2>
              <p className="text-indigo-200">Your personalized guide to {formData.interests.split(",")[0]} internships</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center bg-white/10 rounded-2xl px-6 py-3 backdrop-blur">
                <p className="text-indigo-200 text-sm">Readiness</p>
                <p className="text-4xl font-bold">{readinessScore()}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
          {[
            { id: "careers", label: "Careers", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
            { id: "interview", label: "Mock Interview", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
            { id: "resume", label: "Resume", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { id: "cover", label: "Cover Letter", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
            { id: "tips", label: "Prep Tips", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
            { id: "softskills", label: "Soft Skills", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            { id: "tracker", label: "Progress", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { id: "share", label: "Share & Win", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-pill flex items-center gap-2 ${activeTab === tab.id ? "tab-pill-active" : "tab-pill-inactive"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card-premium p-6 sm:p-8">
          {/* Career Paths */}
          {activeTab === "careers" && careerData && (
            <div className="space-y-6 fade-in-up">
              <h3 className="text-2xl font-bold text-slate-900">Recommended Career Paths</h3>
              <div className="grid gap-4">
                {careerData.career_suggestions.map((career, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-xl font-bold text-slate-900">{career.role}</h4>
                      <span className="badge-premium bg-emerald-50 text-emerald-700">Good Fit</span>
                    </div>
                    <p className="text-slate-600 mb-4 bg-indigo-50 p-4 rounded-xl">{career.why_good_fit}</p>
                    <div className="grid sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-2 font-semibold">Key Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {career.skills_needed.map((skill, j) => (
                            <span key={j} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-2 font-semibold">Where to Apply</p>
                        <ul className="text-slate-700 space-y-1">
                          {career.internship_types.map((type, j) => (
                            <li key={j} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>{type}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-2 font-semibold">Resources</p>
                        <ul className="text-slate-700 space-y-1">
                          {career.resources.map((res, j) => (
                            <li key={j} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{res}
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
          {activeTab === "interview" && careerData && (
            <div className="space-y-6 fade-in-up">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Mock Interview Practice</h3>
                  <p className="text-slate-500">Click any question to see example answers and AI feedback</p>
                </div>
                <button onClick={() => updateProgress("mockInterviews", progress.mockInterviews + 1)} className="btn-premium text-sm px-4 py-2">
                  + Log Practice
                </button>
              </div>
              <div className="space-y-4">
                {careerData.mock_interview_questions.map((q, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all">
                    <button onClick={() => setSelectedQuestion(selectedQuestion === i ? null : i)} className="w-full p-5 text-left flex items-start justify-between hover:bg-slate-50 transition">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`badge-premium ${q.type === "behavioral" ? "bg-violet-50 text-violet-700" : q.type === "situational" ? "bg-amber-50 text-amber-700" : q.type === "technical" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700"}`}>
                            {q.type}
                          </span>
                          <span className="text-xs text-slate-500">Tests: {q.skill_tested}</span>
                        </div>
                        <p className="font-semibold text-slate-900 text-lg">{q.question}</p>
                        <p className="text-sm text-slate-500 mt-1">💡 {q.tip}</p>
                      </div>
                      <svg className={`w-5 h-5 text-slate-400 transition-transform ml-4 ${selectedQuestion === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {selectedQuestion === i && careerData.ai_feedback_examples[i] && (
                      <div className="border-t border-slate-100 p-5 bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-700">Example Answer Score:</span>
                          <span className={`badge-premium ${getScoreColor(careerData.ai_feedback_examples[i].score)}`}>
                            {typeof careerData.ai_feedback_examples[i].score === "number" ? `${careerData.ai_feedback_examples[i].score}/10` : careerData.ai_feedback_examples[i].score}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">Example Answer:</p>
                          <p className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">{careerData.ai_feedback_examples[i].example_answer}</p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-indigo-600 mb-1">Structure & Clarity</p>
                            <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].feedback.structure_clarity}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-violet-600 mb-1">Confidence & Tone</p>
                            <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].feedback.confidence_tone}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-emerald-600 mb-1">Role Relevance</p>
                            <p className="text-sm text-slate-600">{careerData.ai_feedback_examples[i].feedback.role_relevance}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-600 mb-2">How to Improve:</p>
                          <ul className="space-y-2">
                            {careerData.ai_feedback_examples[i].feedback.improvements.map((imp, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{j + 1}</span>
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

          {/* Resume */}
          {activeTab === "resume" && careerData && (
            <div className="space-y-6 fade-in-up">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Resume Suggestions</h3>
                <button onClick={() => updateProgress("resumeDrafts", progress.resumeDrafts + 1)} className="btn-premium text-sm px-4 py-2">+ Log Draft</button>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Ready-to-Use Bullet Points</h4>
                <div className="space-y-2">
                  {careerData.resume_suggestions.bullet_points.map((point, i) => (
                    <div key={i} onClick={() => navigator.clipboard.writeText(point)} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-indigo-50 transition group">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <p className="text-slate-700 flex-1">{point}</p>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">✅ Formatting Tips</h4>
                  <ul className="space-y-2">
                    {careerData.resume_suggestions.formatting_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-sm"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2"></span>{tip}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">❌ Common Mistakes</h4>
                  <ul className="space-y-2">
                    {careerData.resume_suggestions.common_mistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-sm"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2"></span>{mistake}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {activeTab === "cover" && careerData && (
            <div className="space-y-6 fade-in-up">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Your Cover Letter</h3>
                <div className="flex gap-2">
                  <button onClick={() => updateProgress("coverLetterDrafts", progress.coverLetterDrafts + 1)} className="btn-premium text-sm px-4 py-2">+ Log Draft</button>
                  <button onClick={() => navigator.clipboard.writeText(careerData.cover_letter)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition flex items-center gap-2 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{careerData.cover_letter}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl">
                <p className="text-sm text-indigo-700"><strong>💡 Pro Tip:</strong> Customize this template for each company by researching their values and recent projects.</p>
              </div>
            </div>
          )}

          {/* Prep Tips */}
          {activeTab === "tips" && careerData && (
            <div className="space-y-6 fade-in-up">
              <h3 className="text-2xl font-bold text-slate-900">Your Preparation Roadmap</h3>
              <div className="space-y-4">
                {careerData.prep_tips.map((tip, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 transition">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 gradient-primary text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-lg mb-2">{tip.tip}</p>
                        <p className="text-slate-600 mb-3">{tip.why_it_matters}</p>
                        <div className="bg-emerald-50 p-3 rounded-xl">
                          <p className="text-sm text-emerald-700"><strong>Action:</strong> {tip.action_step}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {activeTab === "softskills" && careerData?.soft_skills_focus && (
            <div className="space-y-6 fade-in-up">
              <h3 className="text-2xl font-bold text-slate-900">Soft Skills to Develop</h3>
              <div className="grid gap-4">
                {careerData.soft_skills_focus.map((skill, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-lg mb-2">{skill.skill}</h4>
                        <p className="text-slate-600 mb-3">{skill.why_important}</p>
                        <div className="bg-violet-50 p-3 rounded-xl">
                          <p className="text-sm text-violet-700"><strong>How to Develop:</strong> {skill.how_to_develop}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Tracker */}
          {activeTab === "tracker" && careerData && (
            <div className="space-y-6 fade-in-up">
              <h3 className="text-2xl font-bold text-slate-900">Your Progress</h3>
              <div className="gradient-primary rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-indigo-200 mb-1">Readiness Score</p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-bold">{readinessScore()}%</span>
                      <span className="text-indigo-200 mb-2">{readinessScore() >= 70 ? "Ready!" : readinessScore() >= 40 ? "Getting there" : "Keep going"}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 rounded-full h-3">
                  <div className="bg-white rounded-full h-3 transition-all duration-500" style={{ width: `${readinessScore()}%` }} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Mock Interviews", value: progress.mockInterviews, target: careerData.dashboard_recommendations.mock_interviews_target, key: "mockInterviews" as const },
                  { label: "Resume Drafts", value: progress.resumeDrafts, key: "resumeDrafts" as const },
                  { label: "Cover Letters", value: progress.coverLetterDrafts, key: "coverLetterDrafts" as const },
                  { label: "Applications", value: progress.applications, target: careerData.dashboard_recommendations.applications_target, key: "applications" as const },
                ].map((stat, i) => (
                  <div key={i} className="stat-card">
                    <p className="text-slate-500 text-sm">{stat.label}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                      {stat.target && <span className="text-sm text-slate-500">/ {stat.target}</span>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => updateProgress(stat.key, Math.max(0, stat.value - 1))} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition">-</button>
                      <button onClick={() => updateProgress(stat.key, stat.value + 1)} className="px-3 py-1.5 gradient-primary text-white rounded-lg text-sm">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share & Win */}
          {activeTab === "share" && (
            <SharingProvider>
              <ShareDashboard />
            </SharingProvider>
          )}
        </div>

        {/* Start Over */}
        <div className="mt-8 text-center">
          <button onClick={() => { setCareerData(null); setAppState("landing"); localStorage.removeItem("internship_user"); }} className="text-slate-500 hover:text-slate-700 text-sm underline">
            Start over with a new profile
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p className="font-semibold text-slate-700">Internship.sg</p>
          <p>AI-Powered Career Coaching for Singapore Students</p>
        </div>
      </footer>
    </div>
  );
}
