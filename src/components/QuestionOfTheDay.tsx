"use client";

import { useState, useEffect } from "react";

interface Question {
  id: number;
  question: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tip: string;
}

// Daily questions pool - rotates based on day of year
const QUESTIONS: Question[] = [
  { id: 1, question: "Tell me about yourself.", category: "Behavioral", difficulty: "Easy", tip: "Keep it to 2 minutes. Focus on education, relevant experience, and what you're looking for." },
  { id: 2, question: "Why do you want this internship?", category: "Motivation", difficulty: "Easy", tip: "Show genuine interest in the company and how the role aligns with your goals." },
  { id: 3, question: "What's your greatest strength?", category: "Behavioral", difficulty: "Easy", tip: "Choose a strength relevant to the role and back it up with a specific example." },
  { id: 4, question: "Describe a time you faced a challenge and how you overcame it.", category: "Behavioral", difficulty: "Medium", tip: "Use the STAR method: Situation, Task, Action, Result." },
  { id: 5, question: "Where do you see yourself in 5 years?", category: "Career Goals", difficulty: "Medium", tip: "Show ambition but be realistic. Connect it to the company's growth." },
  { id: 6, question: "Why should we hire you over other candidates?", category: "Self-Promotion", difficulty: "Hard", tip: "Highlight your unique combination of skills, experiences, and enthusiasm." },
  { id: 7, question: "Tell me about a time you worked in a team.", category: "Teamwork", difficulty: "Medium", tip: "Focus on your specific contribution and the outcome achieved together." },
  { id: 8, question: "How do you handle criticism?", category: "Behavioral", difficulty: "Medium", tip: "Show you're open to feedback and give an example of how you improved from it." },
  { id: 9, question: "What motivates you?", category: "Motivation", difficulty: "Easy", tip: "Be authentic. Connect your motivation to what the role offers." },
  { id: 10, question: "Describe a time you showed leadership.", category: "Leadership", difficulty: "Medium", tip: "Leadership isn't just about titles. Show initiative and influence." },
  { id: 11, question: "What's your biggest weakness?", category: "Self-Awareness", difficulty: "Hard", tip: "Choose a real weakness and explain what you're doing to improve it." },
  { id: 12, question: "How do you prioritize your work?", category: "Organization", difficulty: "Medium", tip: "Mention specific tools or methods you use to stay organized." },
  { id: 13, question: "Tell me about a mistake you made and what you learned.", category: "Self-Awareness", difficulty: "Hard", tip: "Be honest, focus on the learning, and show you don't repeat mistakes." },
  { id: 14, question: "How do you handle stress and pressure?", category: "Resilience", difficulty: "Medium", tip: "Give specific strategies you use and an example of handling a stressful situation." },
  { id: 15, question: "What questions do you have for us?", category: "Engagement", difficulty: "Easy", tip: "Always have 2-3 thoughtful questions ready about the role, team, or company." },
  { id: 16, question: "Describe your ideal work environment.", category: "Culture Fit", difficulty: "Easy", tip: "Research the company culture first and align your answer accordingly." },
  { id: 17, question: "How do you stay updated with industry trends?", category: "Initiative", difficulty: "Medium", tip: "Mention specific resources, communities, or habits you have." },
  { id: 18, question: "Tell me about a project you're proud of.", category: "Achievement", difficulty: "Medium", tip: "Quantify results if possible. Show your role and the impact." },
  { id: 19, question: "How would your professors/colleagues describe you?", category: "Self-Awareness", difficulty: "Medium", tip: "Be honest and choose traits relevant to the job." },
  { id: 20, question: "What do you know about our company?", category: "Preparation", difficulty: "Easy", tip: "Research thoroughly. Mention recent news, products, values, or achievements." },
  { id: 21, question: "Describe a time you had to learn something quickly.", category: "Adaptability", difficulty: "Medium", tip: "Show your learning process and how you applied the new knowledge." },
  { id: 22, question: "How do you handle disagreements with teammates?", category: "Conflict Resolution", difficulty: "Hard", tip: "Focus on listening, understanding different perspectives, and finding common ground." },
  { id: 23, question: "What makes you unique?", category: "Self-Promotion", difficulty: "Hard", tip: "Think about your unique combination of experiences, skills, and perspectives." },
  { id: 24, question: "Describe a time you went above and beyond.", category: "Initiative", difficulty: "Medium", tip: "Show you don't just meet expectations - you exceed them." },
  { id: 25, question: "How do you define success?", category: "Values", difficulty: "Medium", tip: "Be authentic and show alignment with the company's values." },
  { id: 26, question: "What's the most difficult decision you've made?", category: "Decision Making", difficulty: "Hard", tip: "Walk through your decision-making process and the outcome." },
  { id: 27, question: "How do you handle multiple deadlines?", category: "Time Management", difficulty: "Medium", tip: "Describe your prioritization method and give a specific example." },
  { id: 28, question: "Tell me about a time you failed.", category: "Resilience", difficulty: "Hard", tip: "Own the failure, explain what you learned, and how you've grown." },
  { id: 29, question: "What are your salary expectations?", category: "Negotiation", difficulty: "Hard", tip: "Research market rates. Give a range based on the role and your experience." },
  { id: 30, question: "When can you start?", category: "Logistics", difficulty: "Easy", tip: "Be honest about your availability. Show enthusiasm to start." },
  { id: 31, question: "Describe your communication style.", category: "Communication", difficulty: "Medium", tip: "Give examples of how you adapt your communication to different audiences." },
];

interface Props {
  userEmail: string;
  onAnswer?: () => void;
}

export default function QuestionOfTheDay({ userEmail, onAnswer }: Props) {
  const [answered, setAnswered] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's question based on day of year
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const todayQuestion = QUESTIONS[getDayOfYear() % QUESTIONS.length];

  // Check if already answered today
  useEffect(() => {
    const lastAnswered = localStorage.getItem(`qotd_${userEmail}`);
    const today = new Date().toDateString();
    if (lastAnswered === today) {
      setAnswered(true);
    }
  }, [userEmail]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);

    // Mark as answered for today
    localStorage.setItem(`qotd_${userEmail}`, new Date().toDateString());
    setAnswered(true);
    setIsSubmitting(false);

    // Trigger streak update
    if (onAnswer) {
      onAnswer();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-700";
      case "Medium": return "bg-yellow-100 text-yellow-700";
      case "Hard": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (answered) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-xl sm:text-2xl">✅</span>
          </div>
          <div>
            <h3 className="font-semibold text-green-900 text-sm sm:text-base">Question of the Day - Complete!</h3>
            <p className="text-xs sm:text-sm text-green-700">You've answered today's question. Come back tomorrow!</p>
          </div>
        </div>
        <div className="bg-white/50 rounded-lg p-3 mt-3">
          <p className="text-xs sm:text-sm text-green-800 font-medium">Today's Question:</p>
          <p className="text-sm sm:text-base text-green-900 mt-1">{todayQuestion.question}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl sm:text-2xl">💬</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Question of the Day</h3>
            <p className="text-xs sm:text-sm text-blue-700">Answer to maintain your streak!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(todayQuestion.difficulty)}`}>
            {todayQuestion.difficulty}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {todayQuestion.category}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4">
        <p className="text-base sm:text-lg font-medium text-slate-900">{todayQuestion.question}</p>
      </div>

      <button
        onClick={() => setShowTip(!showTip)}
        className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
      >
        <span>💡</span> {showTip ? "Hide tip" : "Show tip"}
      </button>

      {showTip && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Tip:</span> {todayQuestion.tip}
          </p>
        </div>
      )}

      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Type your answer here... (minimum 50 characters)"
        className="w-full min-h-[120px] p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm sm:text-base"
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-slate-500">
          {userAnswer.length}/50 characters minimum
        </span>
        <button
          onClick={handleSubmit}
          disabled={userAnswer.length < 50 || isSubmitting}
          className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {isSubmitting ? "Submitting..." : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}
