"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  followers_count: number;
  jobs_count: number;
  created_at: string;
}

interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  is_remote: boolean;
  status: string;
  created_at: string;
}

// Job type badge colors
const jobTypeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  internship: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  "full-time": { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
  "part-time": { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  contract: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
};

function formatSalary(min: number | null, max: number | null, currency: string = "SGD"): string {
  if (!min && !max) return "";
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min) return `From ${currency} ${min.toLocaleString()}`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  return "";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

// Company logo placeholder
function CompanyLogo({ company, size = "lg" }: { company: Company | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  if (!company) {
    return (
      <div className={`${sizeClasses[size]} rounded-2xl bg-gray-200 animate-pulse`}></div>
    );
  }

  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sizeClasses[size]} rounded-2xl object-cover shadow-lg`}
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
    <div className={`${sizeClasses[size]} rounded-2xl gradient-primary flex items-center justify-center font-bold text-white shadow-lg`}>
      {initials}
    </div>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch company data
  const fetchCompany = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (userEmail) params.set("user_email", userEmail);

      const res = await fetch(`/api/companies/${companyId}?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Company not found");
        return;
      }

      setCompany(data.company);
      setJobs(data.jobs || []);
      setIsFollowing(data.isFollowing || false);
    } catch (error) {
      console.error("Error fetching company:", error);
      setError("Failed to load company");
    } finally {
      setLoading(false);
    }
  }, [companyId, userEmail]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  // Toggle follow company
  const toggleFollow = async () => {
    if (!userEmail) {
      alert("Please sign in to follow companies");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await fetch(`/api/companies/${companyId}/follow?user_email=${encodeURIComponent(userEmail)}`, {
          method: "DELETE",
        });
        setIsFollowing(false);
        if (company) {
          setCompany({ ...company, followers_count: Math.max(0, company.followers_count - 1) });
        }
      } else {
        await fetch(`/api/companies/${companyId}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_email: userEmail }),
        });
        setIsFollowing(true);
        if (company) {
          setCompany({ ...company, followers_count: company.followers_count + 1 });
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
        <div className="flex flex-col items-center justify-center h-screen">
          <svg
            className={`w-16 h-16 mb-4 ${isDarkTheme ? "text-gray-600" : "text-gray-300"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h1 className={`text-xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Company Not Found
          </h1>
          <p className={`mb-4 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
            {error || "The company you're looking for doesn't exist."}
          </p>
          <Link href="/companies" className="btn-premium px-6 py-2">
            Browse Companies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                href="/companies"
                className={`text-sm font-medium ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
              >
                Companies
              </Link>
            </div>
            <Link
              href="/dashboard"
              className="btn-premium px-5 py-2.5 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`py-12 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-100"}`}>
        <div className="max-w-7xl mx-auto">
          <Link
            href="/companies"
            className={`inline-flex items-center gap-2 text-sm font-medium mb-6 ${
              isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Companies
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <CompanyLogo company={company} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className={`text-3xl md:text-4xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  {company.name}
                </h1>
                {company.industry && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                    {company.industry}
                  </span>
                )}
              </div>
              <p className={`text-lg mb-4 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                {company.description || "No description available"}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                {company.location && (
                  <div className={`flex items-center gap-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {company.location}
                  </div>
                )}
                {company.size && (
                  <div className={`flex items-center gap-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {company.size} employees
                  </div>
                )}
                <div className={`flex items-center gap-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {company.followers_count} followers
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`px-8 py-3 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                  isFollowing
                    ? isDarkTheme
                      ? "bg-red-900/30 border-2 border-red-700 text-red-400 hover:bg-red-900/50"
                      : "bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100"
                    : "btn-premium"
                } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {followLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : isFollowing ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Following
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Follow Company
                  </>
                )}
              </button>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3 rounded-xl font-medium text-center border transition-colors ${
                    isDarkTheme
                      ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - About */}
            <div className="lg:col-span-1 space-y-8">
              {/* About Section */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </h2>
                <div className="space-y-4">
                  {company.description && (
                    <p className={`${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                      {company.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    {company.industry && (
                      <div className={`flex items-center justify-between ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>Industry</span>
                        <span className="font-medium">{company.industry}</span>
                      </div>
                    )}
                    {company.size && (
                      <div className={`flex items-center justify-between ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>Company size</span>
                        <span className="font-medium">{company.size}</span>
                      </div>
                    )}
                    {company.location && (
                      <div className={`flex items-center justify-between ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>Location</span>
                        <span className="font-medium">{company.location}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className={`flex items-center justify-between ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>Website</span>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-red-600 hover:underline truncate max-w-[150px]"
                        >
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Quick Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${isDarkTheme ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <div className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      {jobs.length}
                    </div>
                    <div className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      Open Positions
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkTheme ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <div className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      {company.followers_count}
                    </div>
                    <div className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      Followers
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Jobs */}
            <div className="lg:col-span-2">
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Open Positions ({jobs.length})
                </h2>

                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => {
                      const typeColors = jobTypeColors[job.job_type] || jobTypeColors.internship;

                      return (
                        <Link
                          key={job.id}
                          href={`/jobs?job=${job.id}`}
                          className={`block p-5 rounded-2xl border transition-all hover:shadow-md ${
                            isDarkTheme
                              ? "bg-gray-700/50 border-gray-600 hover:border-red-500/50"
                              : "bg-gray-50 border-gray-100 hover:border-red-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className={`font-semibold text-lg ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                                {job.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    isDarkTheme ? typeColors.darkBg : typeColors.bg
                                  } ${isDarkTheme ? typeColors.darkText : typeColors.text}`}
                                >
                                  {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                                </span>
                                {job.is_remote && (
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                      isDarkTheme ? "bg-teal-900/50 text-teal-300" : "bg-teal-100 text-teal-700"
                                    }`}
                                  >
                                    Remote
                                  </span>
                                )}
                                {job.location && (
                                  <span className={`flex items-center gap-1 text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    {job.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <svg
                              className={`w-5 h-5 flex-shrink-0 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>

                          <p className={`text-sm line-clamp-2 mb-3 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                            {job.description}
                          </p>

                          <div className="flex items-center justify-between">
                            {(job.salary_min || job.salary_max) && (
                              <span className={`text-sm font-medium ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                                {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                              </span>
                            )}
                            <span className={`text-xs ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                              Posted {formatDate(job.created_at)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    <svg
                      className="w-16 h-16 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-1">No open positions</p>
                    <p className="text-sm">Follow this company to get notified when new jobs are posted</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 px-4 sm:px-6 lg:px-8 ${isDarkTheme ? "bg-gray-800/50" : "bg-red-50"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Interested in {company.name}?
          </h2>
          <p className={`text-lg mb-8 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Follow the company to stay updated on new job openings and company news.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isFollowing && (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className="btn-premium px-8 py-3 text-lg"
              >
                Follow {company.name}
              </button>
            )}
            <Link
              href="/companies"
              className={`px-8 py-3 rounded-xl font-semibold text-lg border transition-colors ${
                isDarkTheme
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Browse More Companies
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${isDarkTheme ? "border-gray-800 bg-gray-900" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">i</span>
            </div>
            <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              internship.sg
            </span>
          </div>
          <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
            Helping Singapore students land their dream internships
          </p>
        </div>
      </footer>
    </div>
  );
}
