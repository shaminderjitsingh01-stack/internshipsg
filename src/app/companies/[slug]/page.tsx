import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components';
import { getCompanyBySlug, getJobsByCompanyId } from '@/lib/database';

export default async function CompanyPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const jobs = await getJobsByCompanyId(company.id);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      {/* Hero Section with Gradient Background */}
      <section className="relative py-16 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          {/* Back Link */}
          <Link
            href="/companies"
            className="inline-flex items-center text-zinc-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Companies
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Large Company Logo */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl blur opacity-50" />
              <div className="relative w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shadow-2xl">
                <span className="text-5xl font-bold text-white">
                  {company.name?.charAt(0) || '?'}
                </span>
              </div>
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  {company.name}
                </span>
              </h1>

              {company.industry && (
                <span className="inline-block px-4 py-2 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 text-zinc-300 rounded-full text-sm font-medium mb-6">
                  {company.industry}
                </span>
              )}

              {/* Visit Website Button */}
              {company.website && (
                <div className="mt-4">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center px-6 py-3 font-semibold text-white transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit Website
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-6xl mx-auto px-4 -mt-4 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Employees */}
          {company.size && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-50 blur transition-all duration-500" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{company.size}</p>
                <p className="text-sm text-zinc-500">Employees</p>
              </div>
            </div>
          )}

          {/* Industry */}
          {company.industry && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-orange-600 rounded-xl opacity-0 group-hover:opacity-50 blur transition-all duration-500" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-pink-600/20 to-orange-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{company.industry}</p>
                <p className="text-sm text-zinc-500">Industry</p>
              </div>
            </div>
          )}

          {/* Location */}
          {company.location && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-50 blur transition-all duration-500" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-orange-600/20 to-purple-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{company.location}</p>
                <p className="text-sm text-zinc-500">Location</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 flex-1 w-full">
        {/* About Section - Glassmorphism Card */}
        {company.description && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              About {company.name}
            </h2>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-all duration-500" />
              <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
                <p className="text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap">
                  {company.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Open Positions */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-orange-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            Open Positions
            <span className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-full">
              {jobs.length} {jobs.length === 1 ? 'position' : 'positions'}
            </span>
          </h2>

          {jobs.length === 0 ? (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-10 blur" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-zinc-400 text-lg">No open positions at the moment.</p>
                <p className="text-zinc-600 text-sm mt-2">Check back later for new opportunities!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="group relative"
                >
                  {/* Hover gradient border effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />

                  <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-transparent transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/jobs/${job.slug}`}>
                          <h3 className="text-xl font-bold text-white mb-3 hover:text-transparent hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 hover:bg-clip-text transition-all duration-300">
                            {job.title}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm rounded-lg flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {job.location || 'Singapore'}
                          </span>
                          {job.work_arrangement && job.work_arrangement !== 'onsite' && (
                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-300 text-sm rounded-lg capitalize">
                              {job.work_arrangement}
                            </span>
                          )}
                          {job.duration && (
                            <span className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-sm rounded-lg">
                              {job.duration}
                            </span>
                          )}
                          {(job.salary_min || job.salary_max) && (
                            <span className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-300 text-sm rounded-lg">
                              ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}/month
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative inline-flex items-center justify-center px-6 py-3 font-semibold text-white transition-all duration-300 flex-shrink-0 group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-lg opacity-80 group-hover/btn:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-lg blur-lg opacity-0 group-hover/btn:opacity-40 transition-opacity" />
                        <span className="relative">Apply Now</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
