"use client";

import { useState } from "react";

interface CoachTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  tips: string[];
  resources: { title: string; type: string }[];
}

const COACH_TOPICS: CoachTopic[] = [
  {
    id: "first-interview",
    title: "First Interview Prep",
    icon: "🎯",
    description: "Never done an interview before? Here's everything you need to know.",
    tips: [
      "Research the company thoroughly - know their products, mission, and recent news",
      "Prepare 5 stories using the STAR method (Situation, Task, Action, Result)",
      "Practice your 'Tell me about yourself' pitch until it feels natural",
      "Prepare 3-5 thoughtful questions to ask the interviewer",
      "Do a mock interview to get comfortable with the format",
      "Plan your outfit and test your video/audio setup the day before",
    ],
    resources: [
      { title: "Mock Interview Practice", type: "tool" },
      { title: "Common Questions Guide", type: "guide" },
      { title: "STAR Method Template", type: "template" },
    ],
  },
  {
    id: "nervousness",
    title: "Managing Interview Anxiety",
    icon: "😰",
    description: "Feeling nervous? That's normal! Here's how to channel it positively.",
    tips: [
      "Prepare thoroughly - confidence comes from knowing you're ready",
      "Practice deep breathing: 4 seconds in, hold 4, out 4 (repeat 3x before interview)",
      "Reframe nervousness as excitement - your body can't tell the difference",
      "Arrive 10-15 minutes early to settle in and collect yourself",
      "Remember: the interviewer wants you to succeed - they need to fill the role!",
      "Focus on having a conversation, not performing perfectly",
    ],
    resources: [
      { title: "Calming Techniques Video", type: "video" },
      { title: "Mindset Preparation Guide", type: "guide" },
    ],
  },
  {
    id: "salary-negotiation",
    title: "Salary & Offer Negotiation",
    icon: "💰",
    description: "Learn how to negotiate your internship compensation confidently.",
    tips: [
      "Research market rates on Glassdoor, LinkedIn, and InternSG before discussing",
      "Wait for them to make the first offer if possible",
      "Consider the full package: stipend, transport, meals, learning opportunities",
      "Express enthusiasm first, then discuss compensation professionally",
      "It's okay to ask for time to consider an offer - 2-3 days is reasonable",
      "Get offers in writing before making final decisions",
    ],
    resources: [
      { title: "Singapore Intern Salary Guide 2024", type: "guide" },
      { title: "Negotiation Script Templates", type: "template" },
    ],
  },
  {
    id: "no-experience",
    title: "No Experience? No Problem!",
    icon: "🌱",
    description: "How to land an internship when you don't have prior experience.",
    tips: [
      "Highlight relevant coursework, projects, and academic achievements",
      "Showcase personal projects, hackathons, or open-source contributions",
      "Emphasize transferable skills from part-time jobs, CCAs, or volunteering",
      "Demonstrate eagerness to learn and growth mindset",
      "Start with smaller companies or startups that value potential over experience",
      "Build a portfolio website or GitHub profile to showcase your work",
    ],
    resources: [
      { title: "Portfolio Building Guide", type: "guide" },
      { title: "First Internship Success Stories", type: "article" },
    ],
  },
  {
    id: "rejection",
    title: "Handling Rejection",
    icon: "💪",
    description: "Didn't get the offer? Here's how to bounce back stronger.",
    tips: [
      "Remember: rejection is not personal - there are many factors beyond your control",
      "Ask for feedback politely - some companies will share valuable insights",
      "Analyze what went well and what you can improve for next time",
      "Take a short break if needed, then get back to applying",
      "Each interview is practice - you're getting better even when rejected",
      "Keep track of your applications and follow up appropriately",
    ],
    resources: [
      { title: "Feedback Request Template", type: "template" },
      { title: "Building Resilience Guide", type: "guide" },
    ],
  },
  {
    id: "technical-prep",
    title: "Technical Interview Prep",
    icon: "💻",
    description: "Ace your technical interviews with the right preparation strategy.",
    tips: [
      "Practice coding problems daily - start with easy LeetCode problems",
      "Focus on fundamentals: arrays, strings, hash maps, trees, graphs",
      "Learn to think out loud - explain your approach as you solve",
      "Practice writing clean code on a whiteboard or shared doc",
      "Study Big O notation and be ready to analyze time/space complexity",
      "Prepare to discuss your projects in technical depth",
    ],
    resources: [
      { title: "LeetCode Study Plan", type: "guide" },
      { title: "System Design Basics", type: "guide" },
      { title: "Technical Interview Checklist", type: "template" },
    ],
  },
];

interface Props {
  userEmail: string;
}

export default function AICareerCoach({ userEmail }: Props) {
  const [selectedTopic, setSelectedTopic] = useState<CoachTopic | null>(null);
  const [expandedTips, setExpandedTips] = useState(false);

  if (selectedTopic) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
        <button
          onClick={() => setSelectedTopic(null)}
          className="flex items-center gap-1 text-blue-600 text-sm mb-4 hover:text-blue-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to topics
        </button>

        <div className="text-center mb-4">
          <span className="text-4xl mb-2 block">{selectedTopic.icon}</span>
          <h3 className="font-bold text-blue-900 text-lg">{selectedTopic.title}</h3>
          <p className="text-blue-700 text-sm mt-1">{selectedTopic.description}</p>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-slate-900 text-sm mb-3 flex items-center gap-2">
            <span>💡</span> Tips & Advice
          </h4>
          <ul className="space-y-2">
            {selectedTopic.tips.slice(0, expandedTips ? undefined : 4).map((tip, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          {selectedTopic.tips.length > 4 && (
            <button
              onClick={() => setExpandedTips(!expandedTips)}
              className="text-blue-600 text-xs mt-2 hover:underline"
            >
              {expandedTips ? "Show less" : `Show ${selectedTopic.tips.length - 4} more tips`}
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-slate-900 text-sm mb-3 flex items-center gap-2">
            <span>📚</span> Helpful Resources
          </h4>
          <div className="space-y-2">
            {selectedTopic.resources.map((resource, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
              >
                <span className="text-sm text-slate-700">{resource.title}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {resource.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-blue-900 text-sm sm:text-base flex items-center gap-2">
          <span className="text-xl">🤖</span> AI Career Coach
        </h3>
      </div>

      <p className="text-blue-700 text-sm mb-4">
        Get guidance on common interview challenges. What would you like help with?
      </p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {COACH_TOPICS.map(topic => (
          <button
            key={topic.id}
            onClick={() => {
              setSelectedTopic(topic);
              setExpandedTips(false);
            }}
            className="bg-white rounded-lg p-3 text-left hover:shadow-md transition-shadow border border-slate-100"
          >
            <span className="text-2xl mb-1 block">{topic.icon}</span>
            <h4 className="font-medium text-slate-900 text-xs sm:text-sm leading-tight">
              {topic.title}
            </h4>
          </button>
        ))}
      </div>
    </div>
  );
}
