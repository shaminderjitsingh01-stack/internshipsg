"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function ProfileNotFound() {
  const { isDarkTheme } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="text-center px-4">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkTheme ? "bg-slate-800" : "bg-slate-200"}`}
        >
          <svg
            className={`w-12 h-12 ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <h1
          className={`text-3xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
        >
          Profile Not Found
        </h1>
        <p
          className={`mb-6 max-w-md mx-auto ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
        >
          This profile doesn&apos;t exist or has been set to private. The user
          may have changed their username or disabled public visibility.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/auth/signin"
            className={`px-6 py-3 rounded-xl font-semibold transition-colors ${isDarkTheme ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-200 text-slate-900 hover:bg-slate-300"}`}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
