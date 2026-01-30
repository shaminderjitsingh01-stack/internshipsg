"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

// Available interests/skills for selection
const AVAILABLE_INTERESTS = [
  "Software Engineering",
  "Data Science",
  "Product Management",
  "UI/UX Design",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "DevOps",
  "Cybersecurity",
  "Cloud Computing",
  "Blockchain",
  "FinTech",
  "Marketing",
  "Business Analytics",
  "Consulting",
  "Finance",
  "Operations",
  "Human Resources",
  "Legal",
  "Healthcare",
];

const AVAILABLE_SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Java",
  "C++",
  "SQL",
  "AWS",
  "Docker",
  "Git",
  "Figma",
  "Excel",
  "PowerBI",
  "Tableau",
  "R",
  "TensorFlow",
  "PyTorch",
  "Kubernetes",
  "MongoDB",
];

interface SuggestedUser {
  email: string;
  username: string | null;
  name: string;
  image: string | null;
  school: string | null;
  tier: string | null;
}

interface EducationData {
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkTheme } = useTheme();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Form data
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Education
  const [education, setEducation] = useState<EducationData>({
    school: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    is_current: true,
  });

  // Interests & Skills
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Follow suggestions
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const totalSteps = 6;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load existing progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(
          `/api/onboarding?email=${encodeURIComponent(session.user.email)}`
        );
        if (res.ok) {
          const data = await res.json();

          // If onboarding is completed, redirect to home
          if (data.onboarding_completed) {
            router.push("/home");
            return;
          }

          // Load saved progress
          if (data.profile) {
            setDisplayName(data.profile.display_name || session.user.name || "");
            setUsername(data.profile.username || "");
            setBio(data.profile.bio || "");
            if (data.profile.interests) {
              setSelectedInterests(data.profile.interests);
            }
          } else {
            setDisplayName(session.user.name || "");
          }

          if (data.education) {
            setEducation({
              school: data.education.school || "",
              degree: data.education.degree || "",
              field_of_study: data.education.field_of_study || "",
              start_date: data.education.start_date || "",
              end_date: data.education.end_date || "",
              is_current: data.education.is_current ?? true,
            });
          }

          if (data.skills) {
            setSelectedSkills(data.skills);
          }

          if (data.followed_users) {
            setFollowedUsers(new Set(data.followed_users));
          }

          // Resume from saved step
          if (data.current_step && data.current_step > 1) {
            setCurrentStep(Math.min(data.current_step, totalSteps));
          }
        }
      } catch (error) {
        console.error("Failed to load onboarding progress:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadProgress();
    }
  }, [session, status, router]);

  // Load suggested users when reaching step 5
  useEffect(() => {
    const loadSuggestions = async () => {
      if (currentStep !== 5 || !session?.user?.email || suggestedUsers.length > 0) return;

      setLoadingSuggestions(true);
      try {
        // Get suggestions based on interests
        const res = await fetch(`/api/leaderboard?limit=10`);
        if (res.ok) {
          const data = await res.json();
          const suggestions =
            data.users
              ?.filter((u: any) => u.email !== session.user?.email)
              .slice(0, 6)
              .map((u: any) => ({
                email: u.email,
                username: u.username,
                name: u.name,
                image: u.image_url,
                school: u.school,
                tier: u.tier,
              })) || [];
          setSuggestedUsers(suggestions);
        }
      } catch (error) {
        console.error("Failed to load suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [currentStep, session, suggestedUsers.length]);

  // Check username availability
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameError(value ? "Username must be at least 3 characters" : "");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    setUsernameChecking(true);
    try {
      const res = await fetch(
        `/api/profile/check-username?username=${encodeURIComponent(value)}&email=${encodeURIComponent(session?.user?.email || "")}`
      );
      const data = await res.json();
      setUsernameError(data.available ? "" : "Username is taken");
    } catch {
      setUsernameError("");
    } finally {
      setUsernameChecking(false);
    }
  }, [session?.user?.email]);

  // Debounced username check
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (username) {
        checkUsername(username);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [username, checkUsername]);

  // Save progress to backend
  const saveProgress = async (step: number, additionalData?: Record<string, unknown>) => {
    if (!session?.user?.email) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        email: session.user.email,
        step,
        ...additionalData,
      };

      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    } finally {
      setSaving(false);
    }
  };

  // Handle next step
  const handleNext = async () => {
    // Save current step data
    switch (currentStep) {
      case 1:
        // Welcome step - no data to save
        break;
      case 2:
        // Profile setup
        if (usernameError || usernameChecking) return;
        await saveProgress(3, {
          display_name: displayName,
          username,
          bio,
        });
        break;
      case 3:
        // Education
        await saveProgress(4, {
          education: education.school ? education : undefined,
        });
        break;
      case 4:
        // Interests & Skills
        await saveProgress(5, {
          interests: selectedInterests,
          skills: selectedSkills,
        });
        break;
      case 5:
        // Follow suggestions
        await saveProgress(6, {
          followed_users: Array.from(followedUsers),
        });
        break;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle skip
  const handleSkip = async () => {
    if (!session?.user?.email) return;

    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      router.push("/home");
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  // Handle complete
  const handleComplete = async () => {
    if (!session?.user?.email) return;

    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      router.push("/home");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Toggle follow user
  const toggleFollow = (email: string) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  if (status === "loading" || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div
      className={`min-h-screen transition-colors ${isDarkTheme ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"}`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Internship.sg"
              className={`h-8 w-auto ${isDarkTheme ? "brightness-0 invert" : ""}`}
            />
          </Link>
          <button
            onClick={() => setShowSkipConfirm(true)}
            className={`text-sm font-medium transition-colors ${isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className={`${isDarkTheme ? "bg-slate-900" : "bg-white"} border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
              Step {currentStep} of {totalSteps}
            </span>
            <span className={`text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
              {currentStep === 1 && "Welcome"}
              {currentStep === 2 && "Profile Setup"}
              {currentStep === 3 && "Education"}
              {currentStep === 4 && "Interests & Skills"}
              {currentStep === 5 && "Follow Suggestions"}
              {currentStep === 6 && "Complete"}
            </span>
          </div>
          <div className={`h-2 rounded-full ${isDarkTheme ? "bg-slate-800" : "bg-slate-200"}`}>
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div
          className={`rounded-2xl p-6 md:p-8 shadow-sm border ${isDarkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h1
                className={`text-2xl md:text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                Welcome to Internship.sg!
              </h1>
              <p
                className={`text-lg mb-6 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
              >
                Hi {session.user?.name?.split(" ")[0] || "there"}! We're excited to have you on board.
              </p>
              <p
                className={`mb-8 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
              >
                Let's get your profile set up so you can make the most of your internship journey.
                This will only take a few minutes.
              </p>
              <div
                className={`p-4 rounded-xl mb-6 ${isDarkTheme ? "bg-slate-800" : "bg-slate-50"}`}
              >
                <h3
                  className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  What you'll get:
                </h3>
                <ul className="space-y-2 text-left">
                  {[
                    "Practice interviews with AI feedback",
                    "Track your progress and earn achievements",
                    "Connect with other students",
                    "Discover internship opportunities",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
                    >
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Profile Setup */}
          {currentStep === 2 && (
            <div>
              <h2
                className={`text-xl md:text-2xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                Set Up Your Profile
              </h2>
              <p
                className={`mb-6 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
              >
                Tell us a bit about yourself. This helps others find and connect with you.
              </p>

              <div className="space-y-5">
                {/* Display Name */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* Username */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span
                      className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
                    >
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="username"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                        isDarkTheme
                          ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      } ${usernameError ? "border-red-500" : ""}`}
                    />
                    {usernameChecking && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      </div>
                    )}
                  </div>
                  {usernameError && (
                    <p className="mt-1 text-sm text-red-500">{usernameError}</p>
                  )}
                  <p
                    className={`mt-1 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Your profile URL will be internship.sg/u/{username || "username"}
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Bio <span className={isDarkTheme ? "text-slate-500" : "text-slate-400"}>(optional)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                    placeholder="A short bio about yourself..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                  <p
                    className={`mt-1 text-xs text-right ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {bio.length}/160
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Education */}
          {currentStep === 3 && (
            <div>
              <h2
                className={`text-xl md:text-2xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                Add Your Education
              </h2>
              <p
                className={`mb-6 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
              >
                Add your current school or university. You can add more later.
              </p>

              <div className="space-y-5">
                {/* School */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                  >
                    School / University
                  </label>
                  <input
                    type="text"
                    value={education.school}
                    onChange={(e) =>
                      setEducation({ ...education, school: e.target.value })
                    }
                    placeholder="e.g., National University of Singapore"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* Degree */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Degree
                  </label>
                  <select
                    value={education.degree}
                    onChange={(e) =>
                      setEducation({ ...education, degree: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="">Select degree</option>
                    <option value="Bachelor's">Bachelor's Degree</option>
                    <option value="Master's">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certificate">Certificate</option>
                    <option value="High School">High School</option>
                  </select>
                </div>

                {/* Field of Study */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={education.field_of_study}
                    onChange={(e) =>
                      setEducation({ ...education, field_of_study: e.target.value })
                    }
                    placeholder="e.g., Computer Science"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                      isDarkTheme
                        ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Start Date
                    </label>
                    <input
                      type="month"
                      value={education.start_date}
                      onChange={(e) =>
                        setEducation({ ...education, start_date: e.target.value })
                      }
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                        isDarkTheme
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                    >
                      End Date
                    </label>
                    <input
                      type="month"
                      value={education.end_date}
                      onChange={(e) =>
                        setEducation({ ...education, end_date: e.target.value })
                      }
                      disabled={education.is_current}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                        isDarkTheme
                          ? "bg-slate-800 border-slate-700 text-white disabled:opacity-50"
                          : "bg-white border-slate-300 text-slate-900 disabled:opacity-50"
                      }`}
                    />
                  </div>
                </div>

                {/* Currently Studying */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={education.is_current}
                    onChange={(e) =>
                      setEducation({
                        ...education,
                        is_current: e.target.checked,
                        end_date: e.target.checked ? "" : education.end_date,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className={isDarkTheme ? "text-slate-300" : "text-slate-700"}>
                    I'm currently studying here
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Interests & Skills */}
          {currentStep === 4 && (
            <div>
              <h2
                className={`text-xl md:text-2xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                Your Interests & Skills
              </h2>
              <p
                className={`mb-6 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
              >
                Select your interests and skills. This helps us personalize your experience.
              </p>

              {/* Interests */}
              <div className="mb-8">
                <h3
                  className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  What areas interest you?
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedInterests.includes(interest)
                          ? "bg-red-600 text-white"
                          : isDarkTheme
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3
                  className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  What skills do you have?
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedSkills.includes(skill)
                          ? "bg-red-600 text-white"
                          : isDarkTheme
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <p
                className={`mt-4 text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
              >
                Selected: {selectedInterests.length} interests, {selectedSkills.length} skills
              </p>
            </div>
          )}

          {/* Step 5: Follow Suggestions */}
          {currentStep === 5 && (
            <div>
              <h2
                className={`text-xl md:text-2xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                People You Might Know
              </h2>
              <p
                className={`mb-6 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
              >
                Follow other students to see their updates and connect with them.
              </p>

              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div
                  className={`text-center py-8 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                >
                  No suggestions available right now. You can find people to follow later.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedUsers.map((user) => (
                    <div
                      key={user.email}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                        isDarkTheme
                          ? "bg-slate-800 hover:bg-slate-750"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`}
                        >
                          <span
                            className={`text-lg font-medium ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
                          >
                            {user.name?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                        >
                          {user.name}
                        </p>
                        {user.school && (
                          <p
                            className={`text-sm truncate ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {user.school}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => toggleFollow(user.email)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          followedUsers.has(user.email)
                            ? isDarkTheme
                              ? "bg-slate-700 text-slate-300"
                              : "bg-slate-200 text-slate-700"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        {followedUsers.has(user.email) ? "Following" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p
                className={`mt-4 text-sm ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}
              >
                Following {followedUsers.size} {followedUsers.size === 1 ? "person" : "people"}
              </p>
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 6 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1
                className={`text-2xl md:text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                You're All Set!
              </h1>
              <p
                className={`text-lg mb-6 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
              >
                Your profile is ready. Let's start your internship journey!
              </p>

              <div
                className={`p-4 rounded-xl mb-8 ${isDarkTheme ? "bg-slate-800" : "bg-slate-50"}`}
              >
                <h3
                  className={`font-semibold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  What's next:
                </h3>
                <ul className="space-y-2 text-left">
                  {[
                    "Practice your first interview",
                    "Complete challenges to earn XP",
                    "Explore job opportunities",
                    "Connect with other students",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}
                    >
                      <svg
                        className="w-5 h-5 text-red-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleComplete}
                disabled={saving}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Finishing up...
                  </>
                ) : (
                  <>
                    Go to Feed
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 6 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-0 disabled:cursor-not-allowed ${
                  isDarkTheme
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={saving || (currentStep === 2 && (!!usernameError || usernameChecking))}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSkipConfirm(false)}
          />
          <div
            className={`relative max-w-md w-full rounded-2xl p-6 shadow-xl ${isDarkTheme ? "bg-slate-900" : "bg-white"}`}
          >
            <h3
              className={`text-xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              Skip Onboarding?
            </h3>
            <p
              className={`mb-6 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
            >
              You can always complete your profile later from the Settings page. Some features work
              better with a complete profile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  isDarkTheme
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Continue Setup
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Skipping..." : "Skip for Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
