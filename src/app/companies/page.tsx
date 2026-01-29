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
  followers_count: number;
  jobs_count: number;
  created_at: string;
}

// Industry color mapping
const industryColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  "E-commerce": { bg: "bg-orange-50", text: "text-orange-700", darkBg: "bg-orange-900/30", darkText: "text-orange-400" },
  "Technology": { bg: "bg-blue-50", text: "text-blue-700", darkBg: "bg-blue-900/30", darkText: "text-blue-400" },
  "Finance": { bg: "bg-emerald-50", text: "text-emerald-700", darkBg: "bg-emerald-900/30", darkText: "text-emerald-400" },
  "Banking": { bg: "bg-emerald-50", text: "text-emerald-700", darkBg: "bg-emerald-900/30", darkText: "text-emerald-400" },
  "Fintech": { bg: "bg-violet-50", text: "text-violet-700", darkBg: "bg-violet-900/30", darkText: "text-violet-400" },
  "Healthcare": { bg: "bg-pink-50", text: "text-pink-700", darkBg: "bg-pink-900/30", darkText: "text-pink-400" },
  "Education": { bg: "bg-cyan-50", text: "text-cyan-700", darkBg: "bg-cyan-900/30", darkText: "text-cyan-400" },
  "Government": { bg: "bg-red-50", text: "text-red-700", darkBg: "bg-red-900/30", darkText: "text-red-400" },
  "Media": { bg: "bg-amber-50", text: "text-amber-700", darkBg: "bg-amber-900/30", darkText: "text-amber-400" },
  "Retail": { bg: "bg-lime-50", text: "text-lime-700", darkBg: "bg-lime-900/30", darkText: "text-lime-400" },
};

// Company size options
const companySizes = [
  { value: "", label: "All Sizes" },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1001+", label: "1000+ employees" },
];

function getIndustryColors(industry: string | null) {
  if (!industry) return { bg: "bg-gray-50", text: "text-gray-700", darkBg: "bg-gray-700", darkText: "text-gray-300" };

  // Check if any key matches the industry
  for (const [key, colors] of Object.entries(industryColors)) {
    if (industry.toLowerCase().includes(key.toLowerCase())) {
      return colors;
    }
  }
  return { bg: "bg-gray-50", text: "text-gray-700", darkBg: "bg-gray-700", darkText: "text-gray-300" };
}

// Company logo placeholder with initials
function CompanyLogo({ company, size = "md" }: { company: Company; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

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
    <div
      className={`${sizeClasses[size]} rounded-2xl gradient-primary flex items-center justify-center font-bold text-white shadow-lg`}
    >
      {initials}
    </div>
  );
}

export default function CompaniesPage() {
  const { data: session } = useSession();
  const { isDarkTheme } = useTheme();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Get unique industries from companies
  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (industryFilter) params.set("industry", industryFilter);
      if (sizeFilter) params.set("size", sizeFilter);
      if (locationFilter) params.set("location", locationFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/companies?${params.toString()}`);
      const data = await res.json();
      if (data.companies) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  }, [search, industryFilter, sizeFilter, locationFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Filter tabs
  const industryTabs = ["All", "Tech", "Banking", "E-commerce", "Fintech", "Government"];

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">i</span>
              </div>
              <span className={`font-bold text-lg sm:text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                internship.sg
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/jobs"
                className={`hidden sm:block px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base transition-all ${
                  isDarkTheme
                    ? "text-gray-300 hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Jobs
              </Link>
              <Link
                href="/dashboard"
                className="btn-premium px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[40px] sm:min-h-0 flex items-center"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-50 border border-red-200 mb-4 sm:mb-6">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xs sm:text-sm font-medium text-red-700">Company Profiles</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Discover{" "}
            <span className="text-gradient">Top Companies</span>
          </h1>
          <p className={`text-base sm:text-lg md:text-xl max-w-3xl mx-auto ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Explore companies hiring interns in Singapore. Find your dream workplace.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className={`card-premium p-4 sm:p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
            {/* Search Bar */}
            <div className="relative mb-4">
              <svg
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
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
                placeholder="Search companies by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Industry Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                  Industry
                </label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  <option value="">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Banking">Banking</option>
                  <option value="Finance">Finance</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Government">Government</option>
                  <option value="Media">Media</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>

              {/* Size Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                  Company Size
                </label>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                >
                  {companySizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                  Location
                </label>
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
                  <option value="CBD">CBD</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(search || industryFilter || sizeFilter || locationFilter) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearch("");
                    setIndustryFilter("");
                    setSizeFilter("");
                    setLocationFilter("");
                  }}
                  className={`text-sm font-medium ${
                    isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              {loading ? "Loading..." : `${companies.length} companies found`}
            </p>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : companies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {companies.map((company, index) => {
                const colors = getIndustryColors(company.industry);

                return (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className={`card-premium p-4 sm:p-6 group fade-in-up ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Company Logo */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <CompanyLogo company={company} size="sm" />
                      {company.industry && (
                        <span
                          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            isDarkTheme ? colors.darkBg : colors.bg
                          } ${isDarkTheme ? colors.darkText : colors.text}`}
                        >
                          {company.industry.split("/")[0].trim()}
                        </span>
                      )}
                    </div>

                    {/* Company Info */}
                    <h3 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 group-hover:text-red-600 transition-colors ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                      {company.name}
                    </h3>
                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      {company.description || "No description available"}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
                      {company.location && (
                        <div className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate max-w-[60px] sm:max-w-none">{company.location}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {company.jobs_count || 0} jobs
                      </div>
                    </div>

                    {/* View Company */}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700 min-h-[40px]">
                      <span className="text-xs sm:text-sm font-medium text-red-600 group-hover:underline">
                        View Company
                      </span>
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No companies found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-10 sm:py-16 px-4 sm:px-6 lg:px-8 ${isDarkTheme ? "bg-gray-800/50" : "bg-red-50"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Looking for internship opportunities?
          </h2>
          <p className={`text-sm sm:text-base md:text-lg mb-6 sm:mb-8 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Browse our job board to find the perfect internship match.
          </p>
          <Link href="/jobs" className="btn-premium inline-flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px]">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Browse Jobs
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-6 sm:py-8 px-4 border-t ${isDarkTheme ? "border-gray-800 bg-gray-900" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">i</span>
            </div>
            <span className={`font-semibold text-sm sm:text-base ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              internship.sg
            </span>
          </div>
          <p className={`text-xs sm:text-sm text-center ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
            Helping Singapore students land their dream internships
          </p>
        </div>
      </footer>
    </div>
  );
}
