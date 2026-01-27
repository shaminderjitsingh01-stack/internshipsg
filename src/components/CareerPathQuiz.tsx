"use client";

import { useState } from "react";

interface Question {
  id: number;
  question: string;
  options: { text: string; traits: string[] }[];
}

interface CareerPath {
  title: string;
  description: string;
  icon: string;
  skills: string[];
  roles: string[];
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "When working on a group project, you typically:",
    options: [
      { text: "Take charge and organize the team", traits: ["leadership", "management"] },
      { text: "Focus on the creative aspects", traits: ["creative", "design"] },
      { text: "Handle the technical details", traits: ["technical", "analytical"] },
      { text: "Ensure everyone communicates well", traits: ["communication", "hr"] },
    ],
  },
  {
    id: 2,
    question: "Which activity sounds most enjoyable?",
    options: [
      { text: "Solving complex puzzles or coding challenges", traits: ["technical", "analytical"] },
      { text: "Designing something visually appealing", traits: ["creative", "design"] },
      { text: "Pitching ideas and convincing others", traits: ["sales", "communication"] },
      { text: "Analyzing data to find insights", traits: ["analytical", "finance"] },
    ],
  },
  {
    id: 3,
    question: "In your free time, you're most likely to:",
    options: [
      { text: "Build side projects or learn new tech", traits: ["technical", "engineering"] },
      { text: "Create art, music, or content", traits: ["creative", "marketing"] },
      { text: "Network and meet new people", traits: ["sales", "hr", "communication"] },
      { text: "Research markets or investment trends", traits: ["finance", "analytical"] },
    ],
  },
  {
    id: 4,
    question: "What frustrates you the most?",
    options: [
      { text: "Poorly designed user interfaces", traits: ["design", "product"] },
      { text: "Inefficient processes or systems", traits: ["operations", "management"] },
      { text: "Miscommunication between teams", traits: ["hr", "communication"] },
      { text: "Bugs and technical issues", traits: ["technical", "engineering"] },
    ],
  },
  {
    id: 5,
    question: "Which skill would you most like to develop?",
    options: [
      { text: "Programming and software development", traits: ["technical", "engineering"] },
      { text: "Visual design and branding", traits: ["creative", "design"] },
      { text: "Public speaking and negotiation", traits: ["sales", "communication"] },
      { text: "Financial modeling and analysis", traits: ["finance", "analytical"] },
    ],
  },
  {
    id: 6,
    question: "What type of work environment appeals to you?",
    options: [
      { text: "Fast-paced startup culture", traits: ["technical", "product", "marketing"] },
      { text: "Structured corporate environment", traits: ["finance", "management", "operations"] },
      { text: "Creative agency or studio", traits: ["creative", "design", "marketing"] },
      { text: "Collaborative team-focused space", traits: ["hr", "communication", "management"] },
    ],
  },
];

const CAREER_PATHS: Record<string, CareerPath> = {
  technical: {
    title: "Software Engineering",
    description: "Build products that millions use. You thrive on solving complex technical problems.",
    icon: "💻",
    skills: ["Python", "JavaScript", "System Design", "Data Structures"],
    roles: ["Software Engineer Intern", "Backend Developer", "Full-Stack Intern", "DevOps Intern"],
  },
  design: {
    title: "UI/UX Design",
    description: "Create beautiful, user-friendly experiences. Your eye for design sets you apart.",
    icon: "🎨",
    skills: ["Figma", "User Research", "Prototyping", "Visual Design"],
    roles: ["Product Design Intern", "UX Research Intern", "UI Designer", "Design System Intern"],
  },
  analytical: {
    title: "Data & Analytics",
    description: "Turn data into actionable insights. You love finding patterns and telling stories with numbers.",
    icon: "📊",
    skills: ["SQL", "Python", "Data Visualization", "Statistics"],
    roles: ["Data Analyst Intern", "Business Intelligence Intern", "Data Science Intern"],
  },
  finance: {
    title: "Finance & Consulting",
    description: "Drive business decisions with financial expertise. Strategy and numbers are your forte.",
    icon: "💰",
    skills: ["Financial Modeling", "Excel", "Valuation", "Market Research"],
    roles: ["Investment Banking Intern", "Consulting Intern", "Financial Analyst Intern"],
  },
  marketing: {
    title: "Marketing & Growth",
    description: "Grow brands and acquire users. You understand what makes people tick.",
    icon: "📢",
    skills: ["Digital Marketing", "Content Strategy", "Analytics", "SEO/SEM"],
    roles: ["Marketing Intern", "Growth Intern", "Content Marketing Intern", "Social Media Intern"],
  },
  product: {
    title: "Product Management",
    description: "Shape the future of products. You bridge business, design, and engineering.",
    icon: "🚀",
    skills: ["User Research", "Roadmapping", "Stakeholder Management", "Analytics"],
    roles: ["Product Management Intern", "Associate PM", "Technical PM Intern"],
  },
  hr: {
    title: "HR & People Operations",
    description: "Build great teams and culture. You care about people and organizational success.",
    icon: "👥",
    skills: ["Recruiting", "Employee Relations", "HRIS", "Employer Branding"],
    roles: ["HR Intern", "Talent Acquisition Intern", "People Operations Intern"],
  },
  sales: {
    title: "Sales & Business Development",
    description: "Drive revenue and partnerships. You're persuasive and love closing deals.",
    icon: "🤝",
    skills: ["Negotiation", "CRM Tools", "Cold Outreach", "Relationship Building"],
    roles: ["Sales Intern", "Business Development Intern", "Account Executive Intern"],
  },
};

interface Props {
  userEmail: string;
}

export default function CareerPathQuiz({ userEmail }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<CareerPath | null>(null);
  const [started, setStarted] = useState(false);

  const handleAnswer = (traits: string[]) => {
    const newTraits = [...selectedTraits, ...traits];
    setSelectedTraits(newTraits);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newTraits);
    }
  };

  const calculateResult = (traits: string[]) => {
    const traitCounts: Record<string, number> = {};
    traits.forEach(trait => {
      traitCounts[trait] = (traitCounts[trait] || 0) + 1;
    });

    const topTrait = Object.entries(traitCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    setResult(CAREER_PATHS[topTrait] || CAREER_PATHS.technical);
    setShowResults(true);

    // Save result
    localStorage.setItem(`career_quiz_${userEmail}`, JSON.stringify({
      result: topTrait,
      completedAt: new Date().toISOString(),
    }));
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedTraits([]);
    setShowResults(false);
    setResult(null);
    setStarted(false);
  };

  if (!started) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-indigo-200">
        <div className="text-center">
          <span className="text-4xl mb-3 block">🧭</span>
          <h3 className="font-semibold text-indigo-900 text-base sm:text-lg mb-2">
            Career Path Explorer
          </h3>
          <p className="text-indigo-700 text-sm mb-4">
            Discover which internship path matches your personality and skills!
          </p>
          <p className="text-indigo-600 text-xs mb-4">
            6 quick questions • 2 min
          </p>
          <button
            onClick={() => setStarted(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (showResults && result) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-indigo-200">
        <div className="text-center mb-4">
          <span className="text-5xl mb-2 block">{result.icon}</span>
          <h3 className="font-bold text-indigo-900 text-lg sm:text-xl">
            {result.title}
          </h3>
          <p className="text-indigo-700 text-sm mt-2">{result.description}</p>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-slate-900 text-sm mb-2">Key Skills to Develop</h4>
          <div className="flex flex-wrap gap-2">
            {result.skills.map(skill => (
              <span key={skill} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-slate-900 text-sm mb-2">Recommended Roles</h4>
          <ul className="space-y-1">
            {result.roles.map(role => (
              <li key={role} className="text-sm text-slate-600 flex items-center gap-2">
                <span className="text-indigo-500">•</span> {role}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={resetQuiz}
          className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors text-sm"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-indigo-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
          <span>🧭</span> Career Path Quiz
        </h3>
        <span className="text-xs text-indigo-600">
          {currentQuestion + 1}/{QUIZ_QUESTIONS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-indigo-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="font-medium text-slate-900 text-sm sm:text-base mb-4">
        {question.question}
      </p>

      <div className="space-y-2">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option.traits)}
            className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-sm"
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
