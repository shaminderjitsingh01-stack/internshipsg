"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reporterEmail: string;
  reportedEmail?: string;
  postId?: string;
  commentId?: string;
  targetType: "user" | "post" | "comment";
}

const REPORT_TYPES = [
  { value: "spam", label: "Spam", description: "Misleading or repetitive content" },
  { value: "harassment", label: "Harassment", description: "Bullying or targeted harassment" },
  { value: "inappropriate", label: "Inappropriate Content", description: "Nudity, violence, or offensive content" },
  { value: "fake", label: "Fake Account/Information", description: "Impersonation or false information" },
  { value: "other", label: "Other", description: "Something else not listed" },
];

export default function ReportModal({
  isOpen,
  onClose,
  reporterEmail,
  reportedEmail,
  postId,
  commentId,
  targetType,
}: Props) {
  const { isDarkTheme } = useTheme();
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reportType) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/social/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter_email: reporterEmail,
          reported_email: reportedEmail,
          post_id: postId,
          comment_id: commentId,
          report_type: reportType,
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setReportType("");
          setDescription("");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${
          isDarkTheme ? "bg-slate-900" : "bg-white"
        }`}
      >
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className={`text-xl font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              Report Submitted
            </h3>
            <p className={isDarkTheme ? "text-slate-400" : "text-slate-600"}>
              We'll review this and take appropriate action.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                Report {targetType === "user" ? "User" : targetType === "post" ? "Post" : "Comment"}
              </h3>
              <button
                onClick={onClose}
                className={`p-1 rounded-lg ${isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className={`text-sm mb-4 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Why are you reporting this {targetType}?
            </p>

            {/* Report Type Selection */}
            <div className="space-y-2 mb-4">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    reportType === type.value
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : isDarkTheme
                      ? "border-slate-700 hover:border-slate-600"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {type.label}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Additional Details */}
            {reportType && (
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more context..."
                  rows={3}
                  className={`w-full p-3 rounded-lg border resize-none ${
                    isDarkTheme
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-lg font-medium ${
                  isDarkTheme
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reportType || isSubmitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
