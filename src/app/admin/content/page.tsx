"use client";

import { useState, useEffect } from "react";

type QuestionCategory = "Behavioral" | "Technical" | "Case Study" | "Situational";
type QuestionDifficulty = "Easy" | "Medium" | "Hard";
type Industry = "General" | "Technology" | "Finance" | "Consulting" | "Marketing" | "Healthcare" | "Engineering" | "Startup";

interface InterviewQuestion {
  id: number;
  question: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  industry: Industry;
  company?: string;
  tips: string[];
}

interface DailyChallenge {
  id: string;
  date: string;
  question_id: number;
  question_text: string;
  category: string;
  difficulty: string;
  participants: number;
  avg_score: number | null;
}

// Local question data (from interviewQuestions.ts)
const categoryOptions: QuestionCategory[] = ["Behavioral", "Technical", "Case Study", "Situational"];
const difficultyOptions: QuestionDifficulty[] = ["Easy", "Medium", "Hard"];
const industryOptions: Industry[] = ["General", "Technology", "Finance", "Consulting", "Marketing", "Healthcare", "Engineering", "Startup"];

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<"questions" | "challenges">("questions");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    category: "Behavioral" as QuestionCategory,
    difficulty: "Medium" as QuestionDifficulty,
    industry: "General" as Industry,
    company: "",
    tips: ["", "", "", ""],
  });

  useEffect(() => {
    fetchQuestions();
    fetchChallenges();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Fetch questions from local data (or API if available)
      const res = await fetch("/api/admin/content/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      } else {
        // Fallback: use local import
        const { interviewQuestions } = await import("@/data/interviewQuestions");
        setQuestions(interviewQuestions);
      }
    } catch (err) {
      // Fallback: use local import
      try {
        const { interviewQuestions } = await import("@/data/interviewQuestions");
        setQuestions(interviewQuestions);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/admin/content/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      } else {
        // Mock data
        setChallenges(getMockChallenges());
      }
    } catch (err) {
      setChallenges(getMockChallenges());
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || q.category === filterCategory;
    const matchesDifficulty = !filterDifficulty || q.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const res = await fetch("/api/admin/content/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingQuestion),
      });

      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
        );
        setEditingQuestion(null);
      }
    } catch (err) {
      // For now, update locally
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
      );
      setEditingQuestion(null);
    }
  };

  const handleAddQuestion = async () => {
    const newId = Math.max(...questions.map((q) => q.id)) + 1;
    const questionToAdd: InterviewQuestion = {
      id: newId,
      question: newQuestion.question,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      industry: newQuestion.industry,
      company: newQuestion.company || undefined,
      tips: newQuestion.tips.filter((t) => t.trim() !== ""),
    };

    try {
      const res = await fetch("/api/admin/content/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionToAdd),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions((prev) => [...prev, data.question || questionToAdd]);
      } else {
        setQuestions((prev) => [...prev, questionToAdd]);
      }
    } catch (err) {
      setQuestions((prev) => [...prev, questionToAdd]);
    }

    setShowAddModal(false);
    setNewQuestion({
      question: "",
      category: "Behavioral",
      difficulty: "Medium",
      industry: "General",
      company: "",
      tips: ["", "", "", ""],
    });
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await fetch(`/api/admin/content/questions?id=${id}`, { method: "DELETE" });
    } catch (err) {
      // Continue with local delete
    }

    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-600/20 text-green-400";
      case "Medium":
        return "bg-yellow-600/20 text-yellow-400";
      case "Hard":
        return "bg-red-600/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Behavioral":
        return "bg-blue-600/20 text-blue-400";
      case "Technical":
        return "bg-purple-600/20 text-purple-400";
      case "Case Study":
        return "bg-orange-600/20 text-orange-400";
      case "Situational":
        return "bg-cyan-600/20 text-cyan-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Content Management</h1>
        <p className="text-slate-400">Manage interview questions and daily challenges</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${
            activeTab === "questions"
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Interview Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab("challenges")}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${
            activeTab === "challenges"
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Daily Challenges ({challenges.length})
        </button>
      </div>

      {activeTab === "questions" ? (
        <>
          {/* Questions Header */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            >
              <option value="">All Difficulties</option>
              {difficultyOptions.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {categoryOptions.map((cat) => {
              const count = questions.filter((q) => q.category === cat).length;
              return (
                <div key={cat} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-sm text-slate-400">{cat}</div>
                </div>
              );
            })}
          </div>

          {/* Questions List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400">No questions found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-500">#{question.id}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(question.category)}`}>
                            {question.category}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-600/20 text-slate-400">
                            {question.industry}
                          </span>
                          {question.company && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-600/20 text-purple-400">
                              {question.company}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium mb-2">{question.question}</p>
                        <div className="flex flex-wrap gap-2">
                          {question.tips.slice(0, 2).map((tip, i) => (
                            <span key={i} className="text-xs text-slate-500 truncate max-w-xs">
                              Tip: {tip}
                            </span>
                          ))}
                          {question.tips.length > 2 && (
                            <span className="text-xs text-slate-500">+{question.tips.length - 2} more tips</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingQuestion(question)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Daily Challenges */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {challenges.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400">No challenges found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Question</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Difficulty</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {challenges.map((challenge) => (
                      <tr key={challenge.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{challenge.date}</td>
                        <td className="px-6 py-4 text-slate-300 max-w-md truncate">{challenge.question_text}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(challenge.category)}`}>
                            {challenge.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">{challenge.participants}</td>
                        <td className="px-6 py-4 text-white">
                          {challenge.avg_score !== null ? `${challenge.avg_score.toFixed(1)}/10` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Edit Question #{editingQuestion.id}</h2>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Question</label>
                <textarea
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                  <select
                    value={editingQuestion.category}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value as QuestionCategory })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Difficulty</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as QuestionDifficulty })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    {difficultyOptions.map((diff) => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Industry</label>
                  <select
                    value={editingQuestion.industry}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, industry: e.target.value as Industry })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    {industryOptions.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Company (optional)</label>
                <input
                  type="text"
                  value={editingQuestion.company || ""}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, company: e.target.value || undefined })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="e.g., Google, McKinsey"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Tips</label>
                {editingQuestion.tips.map((tip, index) => (
                  <input
                    key={index}
                    type="text"
                    value={tip}
                    onChange={(e) => {
                      const newTips = [...editingQuestion.tips];
                      newTips[index] = e.target.value;
                      setEditingQuestion({ ...editingQuestion, tips: newTips });
                    }}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-2"
                    placeholder={`Tip ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Add New Question</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Question *</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Enter the interview question..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Category *</label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value as QuestionCategory })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Difficulty *</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as QuestionDifficulty })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    {difficultyOptions.map((diff) => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Industry *</label>
                  <select
                    value={newQuestion.industry}
                    onChange={(e) => setNewQuestion({ ...newQuestion, industry: e.target.value as Industry })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    {industryOptions.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Company (optional)</label>
                <input
                  type="text"
                  value={newQuestion.company}
                  onChange={(e) => setNewQuestion({ ...newQuestion, company: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="e.g., Google, McKinsey"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Tips (at least 2)</label>
                {newQuestion.tips.map((tip, index) => (
                  <input
                    key={index}
                    type="text"
                    value={tip}
                    onChange={(e) => {
                      const newTips = [...newQuestion.tips];
                      newTips[index] = e.target.value;
                      setNewQuestion({ ...newQuestion, tips: newTips });
                    }}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-2"
                    placeholder={`Tip ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={!newQuestion.question || newQuestion.tips.filter((t) => t.trim()).length < 2}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockChallenges(): DailyChallenge[] {
  const today = new Date();
  const challenges: DailyChallenge[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    challenges.push({
      id: `challenge-${i}`,
      date: date.toISOString().split("T")[0],
      question_id: Math.floor(Math.random() * 65) + 1,
      question_text: [
        "Tell me about yourself.",
        "Why do you want to work here?",
        "Describe a challenge you overcame.",
        "What are your strengths?",
        "Where do you see yourself in 5 years?",
        "Tell me about a time you worked in a team.",
        "How do you handle criticism?",
      ][i % 7],
      category: ["Behavioral", "Technical", "Situational", "Case Study"][i % 4],
      difficulty: ["Easy", "Medium", "Hard"][i % 3],
      participants: Math.floor(Math.random() * 100) + 20,
      avg_score: i === 0 ? null : Math.round((5 + Math.random() * 4) * 10) / 10,
    });
  }

  return challenges;
}
