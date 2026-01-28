"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Profile {
  email: string;
  username: string | null;
  display_name: string | null;
  school: string | null;
  year_of_study: string | null;
  target_role: string | null;
  bio: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  skills: string[] | null;
  preferred_industries: string[] | null;
  is_public: boolean;
  is_looking: boolean;
  onboarding_completed: boolean;
}

interface Props {
  userEmail: string;
  userName?: string;
  onSave?: () => void;
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

const SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "SQL",
  "Java",
  "C++",
  "Go",
  "Rust",
  "Excel",
  "PowerPoint",
  "Tableau",
  "Power BI",
  "Figma",
  "Adobe Creative Suite",
  "Communication",
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Project Management",
  "Data Analysis",
  "Machine Learning",
  "Cloud Computing",
  "DevOps",
  "Agile",
];

const INDUSTRIES = [
  "Tech",
  "Finance",
  "Consulting",
  "Marketing",
  "Healthcare",
  "E-commerce",
  "Education",
  "Manufacturing",
  "Real Estate",
  "Logistics",
  "Media & Entertainment",
  "Government",
  "Non-Profit",
  "Startups",
];

export default function ProfileSettings({ userEmail, userName, onSave }: Props) {
  const { isDarkTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isLooking, setIsLooking] = useState(true);

  // Skills dropdown state
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);
  const [industriesDropdownOpen, setIndustriesDropdownOpen] = useState(false);

  // Fetch existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p: Profile = data.profile;
            setUsername(p.username || "");
            setDisplayName(p.display_name || userName || "");
            setSchool(p.school || "");
            setYearOfStudy(p.year_of_study || "");
            setTargetRole(p.target_role || "");
            setBio(p.bio || "");
            setLinkedinUrl(p.linkedin_url || "");
            setPortfolioUrl(p.portfolio_url || "");
            setSelectedSkills(p.skills || []);
            setSelectedIndustries(p.preferred_industries || []);
            setIsPublic(p.is_public ?? false);
            setIsLooking(p.is_looking ?? true);
          } else {
            // No profile yet, set display name from session
            setDisplayName(userName || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userEmail, userName]);

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

  const handleSave = async () => {
    setError("");
    setSuccess("");

    // Validate required fields
    if (username && !usernameAvailable) {
      setError("Please choose an available username");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          username: username || null,
          display_name: displayName || null,
          school: school || null,
          year_of_study: yearOfStudy || null,
          target_role: targetRole || null,
          bio: bio || null,
          linkedin_url: linkedinUrl || null,
          portfolio_url: portfolioUrl || null,
          skills: selectedSkills.length > 0 ? selectedSkills : null,
          preferred_industries: selectedIndustries.length > 0 ? selectedIndustries : null,
          is_public: isPublic,
          is_looking: isLooking,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }

      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  if (loading) {
    return (
      <div className={`rounded-2xl p-8 ${isDarkTheme ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 shadow-sm border ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <h2 className={`text-xl font-semibold mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
        Profile Settings
      </h2>

      <div className="space-y-6">
        {/* Username */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            Username
          </label>
          <div className="relative">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="your_username"
              maxLength={20}
              className={`w-full pl-8 pr-10 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {!checkingUsername && usernameAvailable === false && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          {usernameError && (
            <p className="mt-1 text-sm text-red-500">{usernameError}</p>
          )}
          {usernameAvailable && username && (
            <p className="mt-1 text-sm text-green-500">Username is available!</p>
          )}
          <p className={`mt-1 text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
            Your public profile URL will be internship.sg/u/{username || "username"}
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            maxLength={50}
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
              isDarkTheme
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* School & Year Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <option value="">Select school...</option>
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
              <option value="">Select year...</option>
              {YEARS_OF_STUDY.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Role */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            Target Role
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

        {/* Bio */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Tell us a bit about yourself..."
            rows={3}
            maxLength={200}
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none ${
              isDarkTheme
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <p className={`mt-1 text-xs text-right ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
            {bio.length}/200 characters
          </p>
        </div>

        {/* LinkedIn & Portfolio URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                isDarkTheme
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
              Portfolio URL
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.com"
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                isDarkTheme
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Skills Multi-select */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            Skills
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSkillsDropdownOpen(!skillsDropdownOpen);
                setIndustriesDropdownOpen(false);
              }}
              className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                isDarkTheme
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <span className={selectedSkills.length === 0 ? (isDarkTheme ? 'text-slate-500' : 'text-slate-400') : ''}>
                {selectedSkills.length === 0
                  ? "Select skills..."
                  : `${selectedSkills.length} skill${selectedSkills.length > 1 ? "s" : ""} selected`}
              </span>
              <svg className={`w-5 h-5 transition-transform ${skillsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {skillsDropdownOpen && (
              <div className={`absolute z-20 w-full mt-2 rounded-xl border shadow-lg max-h-60 overflow-y-auto ${
                isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                {SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                      isDarkTheme
                        ? 'hover:bg-slate-700 text-white'
                        : 'hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedSkills.includes(skill)
                        ? 'bg-red-600 border-red-600'
                        : isDarkTheme ? 'border-slate-600' : 'border-slate-300'
                    }`}>
                      {selectedSkills.includes(skill) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    isDarkTheme ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Industries Multi-select */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
            Preferred Industries
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIndustriesDropdownOpen(!industriesDropdownOpen);
                setSkillsDropdownOpen(false);
              }}
              className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                isDarkTheme
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <span className={selectedIndustries.length === 0 ? (isDarkTheme ? 'text-slate-500' : 'text-slate-400') : ''}>
                {selectedIndustries.length === 0
                  ? "Select industries..."
                  : `${selectedIndustries.length} industr${selectedIndustries.length > 1 ? "ies" : "y"} selected`}
              </span>
              <svg className={`w-5 h-5 transition-transform ${industriesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {industriesDropdownOpen && (
              <div className={`absolute z-20 w-full mt-2 rounded-xl border shadow-lg max-h-60 overflow-y-auto ${
                isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => toggleIndustry(industry)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                      isDarkTheme
                        ? 'hover:bg-slate-700 text-white'
                        : 'hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedIndustries.includes(industry)
                        ? 'bg-red-600 border-red-600'
                        : isDarkTheme ? 'border-slate-600' : 'border-slate-300'
                    }`}>
                      {selectedIndustries.includes(industry) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {industry}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedIndustries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedIndustries.map((industry) => (
                <span
                  key={industry}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    isDarkTheme ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {industry}
                  <button
                    type="button"
                    onClick={() => toggleIndustry(industry)}
                    className="hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-50'}`}>
          <div className="space-y-4">
            {/* Public Profile Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Public Profile
                </p>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Allow others to view your profile at /u/{username || "username"}
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

            {/* Looking for Internship Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Looking for Internship
                </p>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Show employers that you're actively seeking opportunities
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLooking(!isLooking)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isLooking ? 'bg-red-600' : isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isLooking ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-100 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || (username.length > 0 && !usernameAvailable)}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </div>
  );
}
