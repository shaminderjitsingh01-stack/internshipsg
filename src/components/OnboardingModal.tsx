"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  userEmail: string;
  userName?: string;
  onComplete: () => void;
}

const SCHOOLS = [
  "NUS",
  "NTU",
  "SMU",
  "SIT",
  "SUSS",
  "SUTD",
  "Singapore Poly",
  "Ngee Ann Poly",
  "Temasek Poly",
  "Republic Poly",
  "Nanyang Poly",
  "ITE",
  "Other",
];

const YEARS_OF_STUDY = [
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Fresh Grad",
  "Working Professional",
];

export default function OnboardingModal({ userEmail, userName, onComplete }: Props) {
  const { isDarkTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Username
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Step 2: School & Year
  const [school, setSchool] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");

  // Step 3: Target Role & Public Toggle
  const [targetRole, setTargetRole] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Debounced username check
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(value.length > 0 ? "Username must be at least 3 characters" : "");
      return;
    }

    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(value.toLowerCase())) {
      setUsernameAvailable(false);
      setUsernameError("Only lowercase letters, numbers, and underscores allowed");
      return;
    }

    setCheckingUsername(true);
    setUsernameError("");

    try {
      const res = await fetch(
        `/api/profile/check-username?username=${encodeURIComponent(value)}&email=${encodeURIComponent(userEmail)}`
      );
      const data = await res.json();
      setUsernameAvailable(data.available);
      if (!data.available) {
        setUsernameError(data.error || "Username is not available");
      }
    } catch (err) {
      console.error("Username check failed:", err);
      setUsernameError("Failed to check username");
    } finally {
      setCheckingUsername(false);
    }
  }, [userEmail]);

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsername(username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const canProceedStep1 = username.length >= 3 && usernameAvailable === true;
  const canProceedStep2 = school !== "" && yearOfStudy !== "";

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          username: username.toLowerCase(),
          display_name: userName || null,
          school,
          year_of_study: yearOfStudy,
          target_role: targetRole || null,
          is_public: isPublic,
          is_looking: true,
          onboarding_completed: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Internship.sg!</h2>
          <p className="text-white/80">Let's set up your profile in 3 quick steps</p>

          {/* Progress Indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Username */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <span className="text-2xl">@</span>
                </div>
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Pick your username
                </h3>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  This will be your unique profile URL
                </p>
              </div>

              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="your_username"
                  maxLength={20}
                  autoFocus
                  className={`w-full pl-9 pr-10 py-4 rounded-xl border text-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  </div>
                )}
                {!checkingUsername && usernameAvailable === true && username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
              {usernameAvailable && username && (
                <p className="text-sm text-green-500">Username is available!</p>
              )}

              <p className={`text-sm text-center ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                internship.sg/u/<span className="font-medium">{username || "username"}</span>
              </p>
            </div>
          )}

          {/* Step 2: School & Year */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <svg className={`w-6 h-6 ${isDarkTheme ? 'text-white' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Where are you studying?
                </h3>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  This helps us personalize your experience
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  School
                </label>
                <select
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">Select your school...</option>
                  {SCHOOLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">Select your year...</option>
                  {YEARS_OF_STUDY.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Target Role & Public Toggle */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <svg className={`w-6 h-6 ${isDarkTheme ? 'text-white' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  What role are you targeting?
                </h3>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Help employers find you for the right opportunities
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Software Engineering Intern"
                  maxLength={100}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      Public Profile
                    </p>
                    <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                      Allow employers to discover you
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPublic ? 'bg-red-600' : isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={handleBack}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  isDarkTheme
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2)
                }
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
