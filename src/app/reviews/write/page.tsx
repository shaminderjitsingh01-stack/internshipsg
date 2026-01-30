"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
}

function CompanyLogo({ company, size = "md" }: { company: { name: string; logo_url: string | null }; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sizeClasses[size]} rounded-xl object-cover`}
      />
    );
  }

  const initials = company.name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`${sizeClasses[size]} rounded-xl gradient-primary flex items-center justify-center font-bold text-white`}>
      {initials}
    </div>
  );
}

function RatingSlider({
  label,
  value,
  onChange,
  isDarkTheme,
  required = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isDarkTheme: boolean;
  required?: boolean;
}) {
  const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`text-sm font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className={`text-sm font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
          {value > 0 ? `${value}/5 - ${labels[value - 1]}` : "Not rated"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`flex-1 h-10 rounded-lg transition-all ${
              star <= value
                ? "bg-yellow-400 hover:bg-yellow-500"
                : isDarkTheme
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            <svg
              className={`w-5 h-5 mx-auto ${star <= value ? "text-white" : isDarkTheme ? "text-gray-500" : "text-gray-400"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function WriteReviewContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form state
  const [employmentType, setEmploymentType] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrentEmployee, setIsCurrentEmployee] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [workLifeRating, setWorkLifeRating] = useState(0);
  const [cultureRating, setCultureRating] = useState(0);
  const [growthRating, setGrowthRating] = useState(0);
  const [compensationRating, setCompensationRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [interviewTips, setInterviewTips] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch company if ID is in URL
  useEffect(() => {
    const companyId = searchParams.get("company");
    if (companyId) {
      fetch(`/api/companies/${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.company) {
            setSelectedCompany(data.company);
          }
        })
        .catch(console.error);
    }
  }, [searchParams]);

  // Search companies
  const searchCompanies = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/companies?search=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.companies || []);
    } catch (error) {
      console.error("Error searching companies:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchCompanies(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchCompanies]);

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userEmail) {
      setError("Please sign in to submit a review");
      return;
    }

    if (!selectedCompany) {
      setError("Please select a company");
      return;
    }

    if (!employmentType) {
      setError("Please select your employment type");
      return;
    }

    if (overallRating === 0) {
      setError("Please provide an overall rating");
      return;
    }

    if (pros.trim().length < 20) {
      setError("Please provide at least 20 characters for pros");
      return;
    }

    if (cons.trim().length < 20) {
      setError("Please provide at least 20 characters for cons");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: selectedCompany.id,
          user_email: userEmail,
          employment_type: employmentType,
          department: department || null,
          start_date: startDate || null,
          end_date: isCurrentEmployee ? null : endDate || null,
          is_current_employee: isCurrentEmployee,
          overall_rating: overallRating,
          work_life_rating: workLifeRating || null,
          culture_rating: cultureRating || null,
          growth_rating: growthRating || null,
          compensation_rating: compensationRating || null,
          pros: pros.trim(),
          cons: cons.trim(),
          interview_tips: interviewTips.trim() || null,
          is_anonymous: isAnonymous,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Redirect to company reviews page
      router.push(`/companies/${selectedCompany.id}/reviews?success=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
        <div className="flex flex-col items-center justify-center h-screen px-4">
          <svg
            className={`w-16 h-16 mb-4 ${isDarkTheme ? "text-gray-600" : "text-gray-300"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className={`text-xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Sign In Required
          </h1>
          <p className={`mb-4 text-center ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
            Please sign in to write a review
          </p>
          <Link href="/auth/signin" className="btn-premium px-6 py-2">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">i</span>
                </div>
                <span className={`font-bold text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  internship.sg
                </span>
              </Link>
              <span className={`${isDarkTheme ? "text-gray-600" : "text-gray-300"}`}>/</span>
              <Link
                href="/reviews"
                className={`text-sm font-medium ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
              >
                Reviews
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              Write a Review
            </h1>
            <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              Share your work experience to help others make informed career decisions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Selection */}
            <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Company
              </h2>

              {selectedCompany ? (
                <div className="flex items-center gap-4">
                  <CompanyLogo company={selectedCompany} size="lg" />
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      {selectedCompany.name}
                    </h3>
                    {selectedCompany.industry && (
                      <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                        {selectedCompany.industry}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDarkTheme
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <svg
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search for a company..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                        isDarkTheme
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-200 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                    />
                  </div>

                  {showDropdown && (searchResults.length > 0 || searchLoading) && searchQuery && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-10 ${
                      isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                      {searchLoading ? (
                        <div className="p-4 text-center">
                          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : (
                        searchResults.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => {
                              setSelectedCompany(company);
                              setSearchQuery("");
                              setShowDropdown(false);
                            }}
                            className={`flex items-center gap-4 w-full p-4 text-left transition-colors ${
                              isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-50"
                            }`}
                          >
                            <CompanyLogo company={company} size="sm" />
                            <div>
                              <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                                {company.name}
                              </h3>
                              {company.industry && (
                                <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                                  {company.industry}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Employment Details */}
            <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Employment Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    required
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  >
                    <option value="">Select type</option>
                    <option value="intern">Intern</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Engineering, Marketing"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Start Date
                  </label>
                  <input
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    End Date
                  </label>
                  <input
                    type="month"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isCurrentEmployee}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-500"
                        : "bg-white border-gray-200 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCurrentEmployee}
                    onChange={(e) => setIsCurrentEmployee(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    I currently work here
                  </span>
                </label>
              </div>
            </div>

            {/* Ratings */}
            <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Ratings
              </h2>

              <div className="space-y-6">
                <RatingSlider
                  label="Overall Rating"
                  value={overallRating}
                  onChange={setOverallRating}
                  isDarkTheme={isDarkTheme}
                  required
                />
                <RatingSlider
                  label="Work-Life Balance"
                  value={workLifeRating}
                  onChange={setWorkLifeRating}
                  isDarkTheme={isDarkTheme}
                />
                <RatingSlider
                  label="Culture & Values"
                  value={cultureRating}
                  onChange={setCultureRating}
                  isDarkTheme={isDarkTheme}
                />
                <RatingSlider
                  label="Career Growth"
                  value={growthRating}
                  onChange={setGrowthRating}
                  isDarkTheme={isDarkTheme}
                />
                <RatingSlider
                  label="Compensation & Benefits"
                  value={compensationRating}
                  onChange={setCompensationRating}
                  isDarkTheme={isDarkTheme}
                />
              </div>
            </div>

            {/* Written Review */}
            <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Your Review
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Pros <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                    placeholder="What did you like about working here? (minimum 20 characters)"
                    rows={4}
                    required
                    minLength={20}
                    className={`w-full px-4 py-3 rounded-xl border resize-none ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                  <p className={`text-xs mt-1 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                    {pros.length}/20 characters minimum
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Cons <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                    placeholder="What could be improved? (minimum 20 characters)"
                    rows={4}
                    required
                    minLength={20}
                    className={`w-full px-4 py-3 rounded-xl border resize-none ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                  <p className={`text-xs mt-1 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                    {cons.length}/20 characters minimum
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Interview Tips
                  </label>
                  <textarea
                    value={interviewTips}
                    onChange={(e) => setInterviewTips(e.target.value)}
                    placeholder="Share tips for people interviewing at this company (optional)"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border resize-none ${
                      isDarkTheme
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Options */}
            <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Privacy
              </h2>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className={`text-sm font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Post anonymously
                  </span>
                  <p className={`text-xs mt-1 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                    Your name and profile will not be shown with this review
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <Link
                href="/reviews"
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  isDarkTheme
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedCompany}
                className={`btn-premium px-8 py-3 ${
                  (submitting || !selectedCompany) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </span>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <WriteReviewContent />
    </Suspense>
  );
}
