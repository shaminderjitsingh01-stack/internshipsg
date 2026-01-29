"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function FeedbackWidget() {
  const { isDarkTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [type, setType] = useState<"bug" | "feature" | "general">("general");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      // You can connect this to your backend or use a service like Formspree
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          feedback: feedback.trim(),
          email: email || null,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setFeedback("");
          setEmail("");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
          isDarkTheme ? "bg-red-600 text-white" : "bg-red-600 text-white"
        }`}
        title="Send Feedback"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${
              isDarkTheme ? "bg-slate-900" : "bg-white"
            }`}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className={`text-xl font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Thank you!
                </h3>
                <p className={isDarkTheme ? "text-slate-400" : "text-slate-600"}>
                  Your feedback helps us improve.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    Send Feedback
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-1 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Type Selection */}
                <div className="flex gap-2 mb-4">
                  {[
                    { value: "bug", label: "🐛 Bug", color: "red" },
                    { value: "feature", label: "💡 Feature", color: "blue" },
                    { value: "general", label: "💬 General", color: "slate" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setType(option.value as typeof type)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        type === option.value
                          ? option.value === "bug"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : option.value === "feature"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          : isDarkTheme
                          ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Feedback Text */}
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    type === "bug"
                      ? "Describe the bug you encountered..."
                      : type === "feature"
                      ? "What feature would you like to see?"
                      : "Share your thoughts with us..."
                  }
                  rows={4}
                  className={`w-full p-3 rounded-lg border resize-none mb-3 ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />

                {/* Email (optional) */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional, for follow-up)"
                  className={`w-full p-3 rounded-lg border mb-4 ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!feedback.trim() || isSubmitting}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
