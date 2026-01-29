"use client";

import { useState, useEffect, useCallback } from "react";
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
  application_url: string | null;
  application_email: string | null;
  status: string;
  views: number;
  applications_count: number;
  created_at: string;
  expires_at: string | null;
  company?: Company;
  saved_at?: string;
}

interface Application {
  id: string;
  job_id: string;
  applicant_email: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: string;
  created_at: string;
  job?: Job;
}

type TabType = "browse" | "saved" | "applications";

// Job type badge colors
const jobTypeColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  internship: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  "full-time": { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
  "part-time": { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  contract: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "bg-amber-900/50", darkText: "text-amber-300" },
};

// Application status colors
const statusColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-700", darkBg: "bg-gray-700", darkText: "text-gray-300" },
  reviewing: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/50", darkText: "text-blue-300" },
  interviewed: { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/50", darkText: "text-purple-300" },
  offered: { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/50", darkText: "text-green-300" },
  rejected: { bg: "bg-red-100", text: "text-red-700", darkBg: "bg-red-900/50", darkText: "text-red-300" },
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

function CompanyLogo({ company, size = "md" }: { company?: Company; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  if (company?.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sizeClasses[size]} rounded-xl object-cover`}
      />
    );
  }

  const initials = company?.name
    ? company.name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div className={`${sizeClasses[size]} rounded-xl gradient-primary flex items-center justify-center font-bold text-white`}>
      {initials}
    </div>
  );
}

export default function JobsPage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();
  const userEmail = session?.user?.email;

  const [activeTab, setActiveTab] = useState<TabType>("browse");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [remoteFilter, setRemoteFilter] = useState(false);
  const [salaryMinFilter, setSalaryMinFilter] = useState("");

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (locationFilter) params.set("location", locationFilter);
      if (jobTypeFilter) params.set("job_type", jobTypeFilter);
      if (remoteFilter) params.set("is_remote", "true");
      if (salaryMinFilter) params.set("salary_min", salaryMinFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [search, locationFilter, jobTypeFilter, remoteFilter, salaryMinFilter]);

  // Fetch saved jobs
  const fetchSavedJobs = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/jobs/saved?user_email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.jobs) {
        setSavedJobs(data.jobs);
        setSavedJobIds(new Set(data.jobs.map((j: Job) => j.id)));
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  }, [userEmail]);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/jobs/applications?user_email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
        setAppliedJobIds(new Set(data.applications.map((a: Application) => a.job_id)));
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (userEmail) {
      fetchSavedJobs();
      fetchApplications();
    }
  }, [userEmail, fetchSavedJobs, fetchApplications]);

  // Save/unsave job
  const toggleSaveJob = async (jobId: string) => {
    if (!userEmail) return;

    const isSaved = savedJobIds.has(jobId);

    try {
      if (isSaved) {
        await fetch(`/api/jobs/saved?job_id=${jobId}&user_email=${encodeURIComponent(userEmail)}`, {
          method: "DELETE",
        });
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      } else {
        await fetch("/api/jobs/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId, user_email: userEmail }),
        });
        setSavedJobIds((prev) => new Set(prev).add(jobId));
        // Refresh saved jobs to get full job data
        fetchSavedJobs();
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  // Apply to job
  const applyToJob = async (jobId: string, coverLetter: string, resumeUrl?: string) => {
    if (!userEmail) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_email: userEmail,
          cover_letter: coverLetter,
          resume_url: resumeUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAppliedJobIds((prev) => new Set(prev).add(jobId));
        fetchApplications();
        setShowApplyModal(false);
        setSelectedJob(null);
      } else {
        alert(data.error || "Failed to apply");
      }
    } catch (error) {
      console.error("Error applying:", error);
      alert("Failed to apply to job");
    }
  };

  const renderJobCard = (job: Job, showActions = true) => {
    const typeColors = jobTypeColors[job.job_type] || jobTypeColors.internship;
    const isSaved = savedJobIds.has(job.id);
    const hasApplied = appliedJobIds.has(job.id);

    return (
      <div
        key={job.id}
        className={`card-premium p-5 cursor-pointer hover:shadow-lg transition-all ${
          isDarkTheme ? "bg-gray-800/80 border-gray-700 hover:border-red-500/50" : "hover:border-red-200"
        } ${selectedJob?.id === job.id ? (isDarkTheme ? "border-red-500" : "border-red-400") : ""}`}
        onClick={() => setSelectedJob(job)}
      >
        <div className="flex gap-4">
          <CompanyLogo company={job.company} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  {job.title}
                </h3>
                <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                  {job.company?.name || "Unknown Company"}
                </p>
              </div>
              {showActions && userEmail && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveJob(job.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isSaved
                      ? "text-red-500 bg-red-50 dark:bg-red-900/30"
                      : isDarkTheme
                      ? "text-gray-400 hover:bg-gray-700"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  title={isSaved ? "Remove from saved" : "Save job"}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
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

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                {(job.salary_min || job.salary_max) && (
                  <span className={`text-sm font-medium ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                  </span>
                )}
              </div>
              <span className={`text-xs ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
                {formatDate(job.created_at)}
              </span>
            </div>

            {hasApplied && (
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    isDarkTheme ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Applied
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderApplicationCard = (application: Application) => {
    const job = application.job;
    if (!job) return null;

    const appStatusColors = statusColors[application.status] || statusColors.pending;

    return (
      <div
        key={application.id}
        className={`card-premium p-5 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
      >
        <div className="flex gap-4">
          <CompanyLogo company={job.company} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  {job.title}
                </h3>
                <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                  {job.company?.name || "Unknown Company"}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  isDarkTheme ? appStatusColors.darkBg : appStatusColors.bg
                } ${isDarkTheme ? appStatusColors.darkText : appStatusColors.text}`}
              >
                {application.status}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs">
              <span className={isDarkTheme ? "text-gray-400" : "text-gray-500"}>
                Applied {formatDate(application.created_at)}
              </span>
              {job.location && (
                <span className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
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
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${
          isDarkTheme ? "border-red-800/30" : "border-gray-200/50"
        }`}
      >
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
              <span className={isDarkTheme ? "text-gray-600" : "text-gray-300"}>/</span>
              <span className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Jobs</span>
            </div>
            <Link href="/dashboard" className="btn-premium px-5 py-2.5 text-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className={`py-8 px-4 sm:px-6 lg:px-8 border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Jobs Board
          </h1>
          <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
            Discover internships and job opportunities in Singapore
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className={`border-b ${isDarkTheme ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("browse")}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "browse"
                  ? "border-red-500 text-red-600"
                  : isDarkTheme
                  ? "border-transparent text-gray-400 hover:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Browse Jobs
            </button>
            {userEmail && (
              <>
                <button
                  onClick={() => setActiveTab("saved")}
                  className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === "saved"
                      ? "border-red-500 text-red-600"
                      : isDarkTheme
                      ? "border-transparent text-gray-400 hover:text-white"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Saved Jobs ({savedJobs.length})
                </button>
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === "applications"
                      ? "border-red-500 text-red-600"
                      : isDarkTheme
                      ? "border-transparent text-gray-400 hover:text-white"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  My Applications ({applications.length})
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Filters & Job List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              {activeTab === "browse" && (
                <div className={`card-premium p-4 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="sm:col-span-2">
                      <div className="relative">
                        <svg
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                            isDarkTheme ? "text-gray-500" : "text-gray-400"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search jobs, companies..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                            isDarkTheme
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-200 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          isDarkTheme
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-200 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                      >
                        <option value="">All Locations</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Central">Central</option>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North">North</option>
                      </select>
                    </div>

                    {/* Job Type */}
                    <div>
                      <select
                        value={jobTypeFilter}
                        onChange={(e) => setJobTypeFilter(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          isDarkTheme
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-200 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                      >
                        <option value="">All Types</option>
                        <option value="internship">Internship</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                  </div>

                  {/* Extra filters */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remoteFilter}
                        onChange={(e) => setRemoteFilter(e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>Remote only</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>Min salary:</span>
                      <input
                        type="number"
                        placeholder="e.g., 1000"
                        value={salaryMinFilter}
                        onChange={(e) => setSalaryMinFilter(e.target.value)}
                        className={`w-28 px-3 py-1.5 rounded-lg border text-sm ${
                          isDarkTheme
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-200 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                      />
                    </div>

                    <button
                      onClick={() => {
                        setSearch("");
                        setLocationFilter("");
                        setJobTypeFilter("");
                        setRemoteFilter(false);
                        setSalaryMinFilter("");
                      }}
                      className={`text-sm font-medium ${
                        isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}

              {/* Job List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : activeTab === "browse" ? (
                  jobs.length > 0 ? (
                    jobs.map((job) => renderJobCard(job))
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
                      <p className="text-lg font-medium mb-1">No jobs found</p>
                      <p className="text-sm">Try adjusting your filters or check back later</p>
                    </div>
                  )
                ) : activeTab === "saved" ? (
                  savedJobs.length > 0 ? (
                    savedJobs.map((job) => renderJobCard(job))
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
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                      <p className="text-lg font-medium mb-1">No saved jobs</p>
                      <p className="text-sm">Browse jobs and save the ones you&apos;re interested in</p>
                    </div>
                  )
                ) : applications.length > 0 ? (
                  applications.map((app) => renderApplicationCard(app))
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-1">No applications yet</p>
                    <p className="text-sm">Browse jobs and apply to start your career journey</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Job Detail Panel */}
            <div className="lg:col-span-1">
              {selectedJob ? (
                <div
                  className={`card-premium p-6 sticky top-24 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <CompanyLogo company={selectedJob.company} size="lg" />
                    <div>
                      <h2 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                        {selectedJob.title}
                      </h2>
                      <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                        {selectedJob.company?.name}
                      </p>
                      {selectedJob.company?.industry && (
                        <span
                          className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isDarkTheme ? "bg-red-900/50 text-red-300" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {selectedJob.company.industry}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Key Details */}
                  <div className="space-y-3 mb-6">
                    {selectedJob.location && (
                      <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        {selectedJob.location}
                        {selectedJob.is_remote && " (Remote available)"}
                      </div>
                    )}

                    {(selectedJob.salary_min || selectedJob.salary_max) && (
                      <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}
                      </div>
                    )}

                    <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {selectedJob.job_type.charAt(0).toUpperCase() + selectedJob.job_type.slice(1)}
                    </div>

                    <div className={`flex items-center gap-2 text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Posted {formatDate(selectedJob.created_at)}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      Description
                    </h3>
                    <p
                      className={`text-sm whitespace-pre-wrap ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {selectedJob.description}
                    </p>
                  </div>

                  {/* Requirements */}
                  {selectedJob.requirements && (
                    <div className="mb-6">
                      <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                        Requirements
                      </h3>
                      <p
                        className={`text-sm whitespace-pre-wrap ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {selectedJob.requirements}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {appliedJobIds.has(selectedJob.id) ? (
                      <button
                        disabled
                        className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                      >
                        Already Applied
                      </button>
                    ) : selectedJob.application_url ? (
                      <a
                        href={selectedJob.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn-premium py-3 text-center"
                      >
                        Apply Now
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          if (!userEmail) {
                            alert("Please sign in to apply");
                            return;
                          }
                          setShowApplyModal(true);
                        }}
                        className="flex-1 btn-premium py-3"
                      >
                        Apply Now
                      </button>
                    )}

                    <button
                      onClick={() => toggleSaveJob(selectedJob.id)}
                      className={`px-4 py-3 rounded-xl border font-medium transition-colors ${
                        savedJobIds.has(selectedJob.id)
                          ? isDarkTheme
                            ? "bg-red-900/30 border-red-800 text-red-400"
                            : "bg-red-50 border-red-200 text-red-600"
                          : isDarkTheme
                          ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={savedJobIds.has(selectedJob.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Company Info */}
                  {selectedJob.company?.description && (
                    <div className={`mt-6 pt-6 border-t ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
                      <h3 className={`font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                        About {selectedJob.company.name}
                      </h3>
                      <p className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        {selectedJob.company.description}
                      </p>
                      {selectedJob.company.website && (
                        <a
                          href={selectedJob.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-sm text-red-600 hover:underline"
                        >
                          Visit website
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`card-premium p-8 text-center sticky top-24 ${
                    isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""
                  }`}
                >
                  <svg
                    className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? "text-gray-600" : "text-gray-300"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                  <p className={`font-medium ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                    Select a job to view details
                  </p>
                  <p className={`text-sm mt-1 ${isDarkTheme ? "text-gray-500" : "text-gray-500"}`}>
                    Click on any job from the list
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <ApplyModal
          job={selectedJob}
          isDarkTheme={isDarkTheme}
          onClose={() => setShowApplyModal(false)}
          onApply={applyToJob}
        />
      )}
    </div>
  );
}

// Apply Modal Component
function ApplyModal({
  job,
  isDarkTheme,
  onClose,
  onApply,
}: {
  job: Job;
  isDarkTheme: boolean;
  onClose: () => void;
  onApply: (jobId: string, coverLetter: string, resumeUrl?: string) => void;
}) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onApply(job.id, coverLetter, resumeUrl || undefined);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 ${
          isDarkTheme ? "bg-gray-800" : "bg-white"
        } shadow-xl`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            isDarkTheme ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-xl font-bold mb-1 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
          Apply to {job.title}
        </h2>
        <p className={`text-sm mb-6 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
          at {job.company?.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Resume URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://your-resume-link.com"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Cover Letter
            </label>
            <textarea
              placeholder="Tell us why you'd be a great fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              className={`w-full px-4 py-2.5 rounded-xl border resize-none ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-medium ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-premium py-3 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
