"use client";

import { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: "preparation" | "practice" | "materials" | "mindset";
  icon: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Preparation
  { id: "research-company", title: "Research the company", description: "Know their mission, values, recent news, and products", category: "preparation", icon: "🔍" },
  { id: "understand-role", title: "Understand the role", description: "Review job description and required skills", category: "preparation", icon: "📋" },
  { id: "prepare-questions", title: "Prepare questions to ask", description: "Have 3-5 thoughtful questions ready", category: "preparation", icon: "❓" },
  { id: "know-interviewers", title: "Research your interviewers", description: "Look them up on LinkedIn if you know their names", category: "preparation", icon: "👤" },

  // Practice
  { id: "mock-interview", title: "Complete a mock interview", description: "Practice with our AI interviewer at least once", category: "practice", icon: "🎙️" },
  { id: "practice-star", title: "Practice STAR method", description: "Prepare 5 stories using Situation, Task, Action, Result", category: "practice", icon: "⭐" },
  { id: "practice-intro", title: "Perfect your introduction", description: "Practice 'Tell me about yourself' until it's natural", category: "practice", icon: "👋" },
  { id: "practice-weakness", title: "Prepare weakness answer", description: "Have a genuine weakness with improvement plan ready", category: "practice", icon: "💪" },

  // Materials
  { id: "update-resume", title: "Update your resume", description: "Ensure it's tailored for this role", category: "materials", icon: "📄" },
  { id: "portfolio-ready", title: "Prepare portfolio/work samples", description: "Have relevant projects ready to discuss", category: "materials", icon: "💼" },
  { id: "references-ready", title: "Line up references", description: "Contact them and confirm availability", category: "materials", icon: "📞" },
  { id: "outfit-ready", title: "Plan your outfit", description: "Dress one level above company culture", category: "materials", icon: "👔" },

  // Mindset
  { id: "get-sleep", title: "Get good sleep", description: "Rest well the night before", category: "mindset", icon: "😴" },
  { id: "positive-mindset", title: "Visualize success", description: "Imagine yourself acing the interview", category: "mindset", icon: "🧠" },
  { id: "arrive-early", title: "Plan to arrive early", description: "Know the route and give yourself buffer time", category: "mindset", icon: "⏰" },
  { id: "confidence-boost", title: "Review your achievements", description: "Remind yourself of past successes", category: "mindset", icon: "🏆" },
];

interface Props {
  userEmail: string;
}

export default function PrepChecklist({ userEmail }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`checklist_${userEmail}`);
    if (saved) {
      setCompleted(new Set(JSON.parse(saved)));
    }
  }, [userEmail]);

  // Save to localStorage
  const toggleItem = (id: string) => {
    const newCompleted = new Set(completed);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompleted(newCompleted);
    localStorage.setItem(`checklist_${userEmail}`, JSON.stringify([...newCompleted]));
  };

  const categories = [
    { id: "all", label: "All", icon: "📝" },
    { id: "preparation", label: "Prep", icon: "🔍" },
    { id: "practice", label: "Practice", icon: "🎯" },
    { id: "materials", label: "Materials", icon: "📄" },
    { id: "mindset", label: "Mindset", icon: "🧠" },
  ];

  const filteredItems = activeCategory === "all"
    ? CHECKLIST_ITEMS
    : CHECKLIST_ITEMS.filter(item => item.category === activeCategory);

  const totalCompleted = completed.size;
  const totalItems = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((totalCompleted / totalItems) * 100);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">✅</span> Interview Prep Checklist
        </h3>
        <span className="text-sm text-slate-500">
          {totalCompleted}/{totalItems} done
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1 text-right">{progressPercent}% complete</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
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

      {/* Checklist Items */}
      <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
        {filteredItems.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              completed.has(item.id)
                ? "bg-green-50 border border-green-200"
                : "bg-slate-50 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
              completed.has(item.id)
                ? "bg-green-500 border-green-500"
                : "border-slate-300"
            }`}>
              {completed.has(item.id) && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${completed.has(item.id) ? "text-green-800 line-through" : "text-slate-900"}`}>
                <span className="mr-1">{item.icon}</span>
                {item.title}
              </p>
              <p className={`text-xs mt-0.5 ${completed.has(item.id) ? "text-green-600" : "text-slate-500"}`}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {totalCompleted === totalItems && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
          <p className="text-green-800 font-semibold text-sm">🎉 You're fully prepared!</p>
          <p className="text-green-600 text-xs mt-1">Go ace that interview!</p>
        </div>
      )}
    </div>
  );
}
