"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyBySlug, COMPANIES } from "@/data/companies";
import { useTheme } from "@/context/ThemeContext";

// Category badge colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  behavioral: { bg: "bg-blue-100", text: "text-blue-700" },
  technical: { bg: "bg-purple-100", text: "text-purple-700" },
  case: { bg: "bg-amber-100", text: "text-amber-700" },
  situational: { bg: "bg-green-100", text: "text-green-700" },
};

// Company logo placeholder
function CompanyLogo({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center font-bold text-white text-2xl shadow-lg">
      {initials}
    </div>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isDarkTheme } = useTheme();

  const company = getCompanyBySlug(slug);

  if (!company) {
    notFound();
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
            <CompanyLogo name={company.name} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className={`text-3xl md:text-4xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  {company.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  {company.industry}
                </span>
              </div>
              <p className={`text-lg mb-4 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                {company.description}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className={`flex items-center gap-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {company.headquarters}
                </div>
                <div className={`flex items-center gap-2 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {company.employeeCount} employees
                </div>
              </div>
            </div>
            <Link
              href={`/job-interview?company=${company.slug}`}
              className="btn-premium px-8 py-4 text-lg flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Practice
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Interview Process & Culture */}
            <div className="lg:col-span-1 space-y-8">
              {/* Interview Process */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Interview Process
                </h2>
                <div className="space-y-4">
                  {company.interviewProcess.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className={`pt-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Culture */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Culture
                </h2>
                <div className="flex flex-wrap gap-2">
                  {company.culture.map((trait, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-100"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Intern Benefits
                </h2>
                <ul className="space-y-2">
                  {company.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-2 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Questions & Tips */}
            <div className="lg:col-span-2 space-y-8">
              {/* Common Interview Questions */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Common Interview Questions
                </h2>
                <div className="space-y-6">
                  {company.commonQuestions.map((item, index) => {
                    const colors = categoryColors[item.category];
                    return (
                      <div
                        key={index}
                        className={`p-5 rounded-2xl border ${
                          isDarkTheme ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className={`font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                            {item.question}
                          </h3>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}
                          >
                            {item.category}
                          </span>
                        </div>
                        {item.tip && (
                          <div className={`flex items-start gap-2 text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>
                              <strong>Tip:</strong> {item.tip}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tips from Successful Candidates */}
              <div className={`card-premium p-6 ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Tips from Successful Candidates
                </h2>
                <ul className="space-y-4">
                  {company.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Card */}
              <div className="gradient-primary rounded-3xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Ace Your {company.name} Interview?</h2>
                <p className="text-white/80 mb-6 max-w-lg mx-auto">
                  Practice with our AI interviewer trained on {company.name}&apos;s interview style.
                  Get real-time feedback and improve your chances.
                </p>
                <Link
                  href={`/job-interview?company=${company.slug}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Mock Interview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Companies */}
      <section className={`py-12 px-4 sm:px-6 lg:px-8 border-t ${isDarkTheme ? "border-gray-800" : "border-gray-100"}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-2xl font-bold mb-8 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Similar Companies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPANIES.filter(
              (c) =>
                c.slug !== company.slug &&
                (c.industry === company.industry ||
                  c.industry.split(" / ").some((ind) =>
                    company.industry.includes(ind)
                  ))
            )
              .slice(0, 4)
              .map((relatedCompany) => (
                <Link
                  key={relatedCompany.slug}
                  href={`/companies/${relatedCompany.slug}`}
                  className={`card-premium p-5 group ${isDarkTheme ? "bg-gray-800/80 border-gray-700" : ""}`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                      {relatedCompany.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h3 className={`font-semibold group-hover:text-red-600 transition-colors ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                        {relatedCompany.name}
                      </h3>
                      <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                        {relatedCompany.industry.split(" / ")[0]}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-red-600 font-medium group-hover:underline">
                    View company &rarr;
                  </span>
                </Link>
              ))}
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
