"use client";

import Link from "next/link";
import { COMPANIES } from "@/data/companies";
import { useTheme } from "@/context/ThemeContext";

// Industry color mapping
const industryColors: Record<string, { bg: string; text: string; border: string }> = {
  "E-commerce": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "Technology": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Technology / Super App": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Technology / Social Media": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  "Banking / Finance": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Fintech / Payments": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Government / Technology": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Technology / E-commerce / Cloud": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

// Company logo placeholder with initials
function CompanyLogo({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl gradient-primary flex items-center justify-center font-bold text-white shadow-lg`}
    >
      {initials}
    </div>
  );
}

export default function CompaniesPage() {
  const { isDarkTheme } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : ""}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkTheme ? "glass-dark" : "glass"} border-b ${isDarkTheme ? "border-red-800/30" : "border-gray-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">i</span>
              </div>
              <span className={`font-bold text-xl ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                internship.sg
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/job-interview"
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  isDarkTheme
                    ? "text-gray-300 hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Practice
              </Link>
              <Link
                href="/dashboard"
                className="btn-premium px-5 py-2.5 text-sm"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-6">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-medium text-red-700">Company-Specific Interview Prep</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Prepare for Your{" "}
            <span className="text-gradient">Dream Company</span>
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Get tailored interview preparation for top companies hiring interns in Singapore.
            Real questions, insider tips, and structured practice.
          </p>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            <button className="tab-pill tab-pill-active">All Companies</button>
            <button className="tab-pill tab-pill-inactive">Tech</button>
            <button className="tab-pill tab-pill-inactive">Banking</button>
            <button className="tab-pill tab-pill-inactive">E-commerce</button>
            <button className="tab-pill tab-pill-inactive">Government</button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {COMPANIES.map((company, index) => {
              const colors = industryColors[company.industry] || {
                bg: "bg-gray-50",
                text: "text-gray-700",
                border: "border-gray-200",
              };

              return (
                <Link
                  key={company.slug}
                  href={`/companies/${company.slug}`}
                  className={`card-premium p-6 group fade-in-up ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Company Logo */}
                  <div className="flex items-start justify-between mb-4">
                    <CompanyLogo name={company.name} />
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
                    >
                      {company.industry.split(" / ")[0]}
                    </span>
                  </div>

                  {/* Company Info */}
                  <h3 className={`text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                    {company.name}
                  </h3>
                  <p className={`text-sm mb-4 line-clamp-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    {company.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {company.headquarters.split(" (")[0]}
                    </div>
                    <div className={`flex items-center gap-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {company.commonQuestions.length} questions
                    </div>
                  </div>

                  {/* Prepare Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-red-600 group-hover:underline">
                      Start Preparing
                    </span>
                    <svg
                      className="w-5 h-5 text-red-600 transform group-hover:translate-x-1 transition-transform"
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
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 ${isDarkTheme ? "bg-gray-800/50" : "bg-red-50"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Don&apos;t see your target company?
          </h2>
          <p className={`text-lg mb-8 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            You can still practice with our AI interviewer using any job description.
            Just paste the job posting and get personalized interview preparation.
          </p>
          <Link href="/job-interview" className="btn-premium inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Custom Practice
          </Link>
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
