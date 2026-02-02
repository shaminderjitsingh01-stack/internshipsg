'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Header, Footer } from '@/components';
import { getCompaniesFromDB, getIndustries, getJobCountByCompany, type Company } from '@/lib/database';

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    // Get URL params on mount
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const ind = params.get('industry') || '';
    setSearch(q);
    setIndustry(ind);

    // Fetch data from database
    const fetchData = async () => {
      const [companiesData, industriesData, jobCountsData] = await Promise.all([
        getCompaniesFromDB(q, ind),
        getIndustries(),
        getJobCountByCompany(),
      ]);
      setCompanies(companiesData);
      setIndustries(industriesData);
      setJobCounts(jobCountsData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      const data = await getCompaniesFromDB(search, industry);
      setCompanies(data);
      setVisibleCount(9);
    };
    fetchCompanies();
  }, [search, industry]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (search) url.searchParams.set('q', search);
    else url.searchParams.delete('q');
    if (industry) url.searchParams.set('industry', industry);
    window.history.pushState({}, '', url);
  };

  const handleIndustryChange = (ind: string) => {
    setIndustry(ind);
    const url = new URL(window.location.href);
    if (ind) url.searchParams.set('industry', ind);
    else url.searchParams.delete('industry');
    if (search) url.searchParams.set('q', search);
    window.history.pushState({}, '', url);
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const visibleCompanies = companies.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Top Companies Hiring
            </span>
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            {companies.length.toLocaleString()} {companies.length === 1 ? 'company' : 'companies'} offering internship opportunities in Singapore
          </p>

          {/* Glassmorphism Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative flex flex-col sm:flex-row gap-3 p-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search companies by name..."
                    className="w-full pl-12 pr-4 py-4 bg-transparent text-white text-lg placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Industry Filter Chips */}
      <section className="py-6 border-y border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => handleIndustryChange('')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                !industry
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-700/50'
              }`}
            >
              All Industries
            </button>
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => handleIndustryChange(ind)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  industry === ind
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-700/50'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12 flex-1">
        {search && (
          <p className="text-zinc-400 mb-8 text-center">
            Showing results for <span className="text-white font-medium">&quot;{search}&quot;</span>
          </p>
        )}

        {companies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No companies found</h2>
            <p className="text-zinc-500 max-w-md mx-auto">
              {search
                ? `No results for "${search}". Try a different search term.`
                : 'No companies available at the moment. Check back soon!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.slug}`}
                  className="group relative"
                >
                  {/* Hover gradient border effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />

                  <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-transparent transition-all duration-500 group-hover:-translate-y-1 h-full">
                    <div className="flex flex-col h-full">
                      {/* Company Logo/Initial */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                        <span className="text-2xl font-bold text-white">
                          {company.name?.charAt(0) || '?'}
                        </span>
                      </div>

                      {/* Company Name */}
                      <h2 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-orange-400 group-hover:bg-clip-text transition-all duration-300">
                        {company.name}
                      </h2>

                      {/* Industry Tag */}
                      {company.industry && (
                        <span className="inline-block px-3 py-1 bg-zinc-800 text-zinc-400 text-sm rounded-lg mb-4 w-fit">
                          {company.industry}
                        </span>
                      )}

                      <div className="mt-auto">
                        {/* Open Positions Badge with Glow */}
                        {jobCounts[company.id] > 0 && (
                          <div className="relative inline-block">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-md opacity-50" />
                            <span className="relative px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-full inline-flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                              {jobCounts[company.id]} open {jobCounts[company.id] === 1 ? 'position' : 'positions'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < companies.length && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  className="group relative px-8 py-4 font-semibold text-white transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    Load More
                    <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
