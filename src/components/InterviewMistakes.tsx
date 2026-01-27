"use client";

import { useState } from "react";

interface Mistake {
  id: string;
  question: string;
  category: "behavioral" | "technical" | "situational";
  weakAnswer: {
    text: string;
    issues: string[];
  };
  strongAnswer: {
    text: string;
    strengths: string[];
  };
  tip: string;
}

const INTERVIEW_MISTAKES: Mistake[] = [
  {
    id: "tell-me-about-yourself",
    question: "Tell me about yourself",
    category: "behavioral",
    weakAnswer: {
      text: "I'm John, I'm 22 years old, I like playing video games and hanging out with friends. I'm studying computer science because my parents wanted me to.",
      issues: [
        "Too personal and irrelevant",
        "Shows lack of genuine interest",
        "No professional context",
        "Doesn't highlight skills or goals",
      ],
    },
    strongAnswer: {
      text: "I'm a final-year Computer Science student at NUS with a passion for building products that solve real problems. Last summer, I interned at a fintech startup where I developed a payment reconciliation tool that reduced processing time by 40%. I'm particularly excited about this role because it combines my technical skills with my interest in the financial industry.",
      strengths: [
        "Professional and relevant",
        "Quantifiable achievements",
        "Shows genuine interest",
        "Connects experience to role",
      ],
    },
    tip: "Keep it professional, relevant, and under 2 minutes. Structure: Present → Past → Future.",
  },
  {
    id: "greatest-weakness",
    question: "What is your greatest weakness?",
    category: "behavioral",
    weakAnswer: {
      text: "I'm a perfectionist. I just care too much about doing things right. Sometimes I work too hard.",
      issues: [
        "Cliché disguised strength",
        "Not genuine or self-aware",
        "Shows poor preparation",
        "Interviewer has heard this 1000 times",
      ],
    },
    strongAnswer: {
      text: "I've struggled with public speaking. In group projects, I'd let others present while I handled the technical work. I've been actively working on this by joining a Toastmasters club on campus and volunteering to present in smaller team meetings. I recently led a 10-minute presentation to our class and received positive feedback.",
      strengths: [
        "Genuine and specific weakness",
        "Shows self-awareness",
        "Demonstrates growth mindset",
        "Provides concrete improvement actions",
      ],
    },
    tip: "Choose a real weakness that isn't critical to the role, and show how you're actively improving.",
  },
  {
    id: "why-this-company",
    question: "Why do you want to work here?",
    category: "behavioral",
    weakAnswer: {
      text: "Your company is really famous and it would look good on my resume. I also heard you have good benefits and work-life balance.",
      issues: [
        "Self-centered motivation",
        "No company research",
        "Shows no genuine interest",
        "Focused on perks, not contribution",
      ],
    },
    strongAnswer: {
      text: "I've been following your company's expansion into Southeast Asian markets, and I'm impressed by how you've adapted your product for local needs. Your recent feature for QR payments aligns with a project I worked on during my internship. I'm excited about the opportunity to contribute to a team that's solving real payment challenges in the region.",
      strengths: [
        "Shows company research",
        "Connects personal experience",
        "Demonstrates genuine interest",
        "Focuses on contribution",
      ],
    },
    tip: "Research the company thoroughly. Connect their mission, recent news, or products to your genuine interests and experience.",
  },
  {
    id: "conflict-question",
    question: "Tell me about a time you had a conflict with a teammate",
    category: "situational",
    weakAnswer: {
      text: "I don't really have conflicts. I'm easy to work with and get along with everyone. Maybe once someone disagreed with me but I just let it go to avoid drama.",
      issues: [
        "Avoids the question",
        "Seems dishonest or unaware",
        "Shows conflict avoidance",
        "No problem-solving demonstrated",
      ],
    },
    strongAnswer: {
      text: "During a hackathon, my teammate wanted to use a complex microservices architecture, while I advocated for a simpler monolithic approach given our 48-hour timeline. I suggested we list pros and cons of each, which helped us realize a hybrid approach would work best. We built the core features as a monolith but kept the AI component separate. We ended up winning second place.",
      strengths: [
        "Specific situation (STAR method)",
        "Shows mature conflict resolution",
        "Demonstrates collaboration",
        "Positive outcome achieved",
      ],
    },
    tip: "Use the STAR method. Show you can disagree professionally and find collaborative solutions.",
  },
  {
    id: "questions-for-interviewer",
    question: "Do you have any questions for me?",
    category: "behavioral",
    weakAnswer: {
      text: "No, I think you covered everything. When will I hear back about the decision?",
      issues: [
        "Shows lack of interest",
        "Missed opportunity to engage",
        "Only asks about logistics",
        "Doesn't demonstrate curiosity",
      ],
    },
    strongAnswer: {
      text: "Yes! I'm curious about the team structure - how do interns typically collaborate with full-time engineers? Also, I read about your recent product launch. What were some of the biggest technical challenges the team faced? And finally, what does success look like for an intern in this role after 3 months?",
      strengths: [
        "Shows genuine curiosity",
        "Demonstrates company research",
        "Asks about team dynamics",
        "Focused on success and growth",
      ],
    },
    tip: "Always prepare 3-5 thoughtful questions. Focus on the role, team, growth opportunities, and company culture.",
  },
  {
    id: "failure-question",
    question: "Tell me about a time you failed",
    category: "situational",
    weakAnswer: {
      text: "I can't think of a major failure. I usually plan things carefully and things work out. Maybe I got a B+ once when I wanted an A.",
      issues: [
        "Seems arrogant or unaware",
        "Trivial example",
        "No learning demonstrated",
        "Doesn't show resilience",
      ],
    },
    strongAnswer: {
      text: "In my first internship, I was tasked with building a dashboard feature. I was so focused on making it perfect that I missed the deadline by a week. My manager had to scramble to adjust the sprint. I learned the importance of shipping MVPs and getting feedback early. Now I break projects into milestones and check in frequently. In my next project, I delivered two days early.",
      strengths: [
        "Honest about real failure",
        "Takes responsibility",
        "Shows concrete learning",
        "Demonstrates improvement",
      ],
    },
    tip: "Choose a genuine failure, take ownership, and focus 70% of your answer on what you learned and how you improved.",
  },
];

export default function InterviewMistakes() {
  const [selectedMistake, setSelectedMistake] = useState<Mistake>(INTERVIEW_MISTAKES[0]);
  const [showStrong, setShowStrong] = useState(false);

  const categories = [
    { id: "all", label: "All", icon: "📚" },
    { id: "behavioral", label: "Behavioral", icon: "💬" },
    { id: "situational", label: "Situational", icon: "📖" },
  ];

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredMistakes = activeCategory === "all"
    ? INTERVIEW_MISTAKES
    : INTERVIEW_MISTAKES.filter(m => m.category === activeCategory);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">📖</span> Real Interview Mistakes
        </h3>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              const newFiltered = cat.id === "all"
                ? INTERVIEW_MISTAKES
                : INTERVIEW_MISTAKES.filter(m => m.category === cat.id);
              if (newFiltered.length > 0) {
                setSelectedMistake(newFiltered[0]);
                setShowStrong(false);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Question Selector */}
      <div className="mb-4">
        <select
          value={selectedMistake.id}
          onChange={(e) => {
            const mistake = INTERVIEW_MISTAKES.find(m => m.id === e.target.value);
            if (mistake) {
              setSelectedMistake(mistake);
              setShowStrong(false);
            }
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          {filteredMistakes.map(mistake => (
            <option key={mistake.id} value={mistake.id}>
              "{mistake.question}"
            </option>
          ))}
        </select>
      </div>

      {/* Answer Comparison */}
      <div className="space-y-4">
        {/* Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setShowStrong(false)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              !showStrong ? "bg-white shadow text-red-600" : "text-slate-600"
            }`}
          >
            ❌ Weak Answer
          </button>
          <button
            onClick={() => setShowStrong(true)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              showStrong ? "bg-white shadow text-green-600" : "text-slate-600"
            }`}
          >
            ✅ Strong Answer
          </button>
        </div>

        {/* Answer Display */}
        {!showStrong ? (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-slate-700 italic mb-3">
              "{selectedMistake.weakAnswer.text}"
            </p>
            <div className="border-t border-red-200 pt-3">
              <p className="text-xs font-medium text-red-700 mb-2">Issues:</p>
              <ul className="space-y-1">
                {selectedMistake.weakAnswer.issues.map((issue, idx) => (
                  <li key={idx} className="text-xs text-red-600 flex items-start gap-2">
                    <span>✗</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-slate-700 italic mb-3">
              "{selectedMistake.strongAnswer.text}"
            </p>
            <div className="border-t border-green-200 pt-3">
              <p className="text-xs font-medium text-green-700 mb-2">Why it works:</p>
              <ul className="space-y-1">
                {selectedMistake.strongAnswer.strengths.map((strength, idx) => (
                  <li key={idx} className="text-xs text-green-600 flex items-start gap-2">
                    <span>✓</span> {strength}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Pro Tip */}
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs text-amber-800">
            <span className="font-medium">💡 Pro Tip:</span> {selectedMistake.tip}
          </p>
        </div>
      </div>
    </div>
  );
}
