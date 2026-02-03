'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Footer, JobCard } from '@/components';
import { useAuth } from '@/context/AuthContext';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  industry?: string;
}

interface Job {
  id: string;
  slug: string;
  title: string;
  description?: string;
  location: string;
  work_arrangement?: string;
  duration?: string;
  salary_min?: number;
  salary_max?: number;
  application_url: string;
  company?: Company;
  industry?: string;
  posted_at: string;
  created_at: string;
}

const industries = [
  'All Industries',
  'Technology',
  'Fintech',
  'Banking & Finance',
  'E-commerce',
  'Healthcare',
  'Media',
  'Consulting',
];

const workArrangements = [
  { value: 'all', label: 'All' },
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'salary_high', label: 'Salary: High to Low' },
  { value: 'salary_low', label: 'Salary: Low to High' },
];

export default function JobsPageClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedArrangement, setSelectedArrangement] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Job Alert Widget State
  const [showAlertWidget, setShowAlertWidget] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = [...jobs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company?.name.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query)
      );
    }

    // Industry filter
    if (selectedIndustry !== 'All Industries') {
      filtered = filtered.filter(
        (job) =>
          job.industry === selectedIndustry ||
          job.company?.industry === selectedIndustry
      );
    }

    // Work arrangement filter (case-insensitive)
    if (selectedArrangement !== 'all') {
      filtered = filtered.filter(
        (job) => job.work_arrangement?.toLowerCase() === selectedArrangement.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.posted_at || b.created_at).getTime() - new Date(a.posted_at || a.created_at).getTime();
        case 'oldest':
          return new Date(a.posted_at || a.created_at).getTime() - new Date(b.posted_at || b.created_at).getTime();
        case 'salary_high': {
          const salaryA = a.salary_max || a.salary_min || 0;
          const salaryB = b.salary_max || b.salary_min || 0;
          return salaryB - salaryA;
        }
        case 'salary_low': {
          const salaryA = a.salary_min || a.salary_max || Infinity;
          const salaryB = b.salary_min || b.salary_max || Infinity;
          return salaryA - salaryB;
        }
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  }, [searchQuery, selectedIndustry, selectedArrangement, sortBy, jobs]);

  // Save current filters as job alert
  async function saveJobAlert() {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!alertName.trim()) return;

    setAlertSaving(true);
    try {
      const res = await fetch('/api/user/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: alertName,
          keywords: searchQuery ? searchQuery.split(' ').filter(Boolean) : [],
          industries: selectedIndustry !== 'All Industries' ? [selectedIndustry] : [],
          work_arrangements: selectedArrangement !== 'all' ? [selectedArrangement] : [],
          frequency: 'daily',
        }),
      });

      if (res.ok) {
        setAlertSuccess(true);
        setAlertName('');
        setTimeout(() => {
          setShowAlertWidget(false);
          setAlertSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving alert:', error);
    } finally {
      setAlertSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">
              All Internships
            </h1>
            <p className="text-[var(--muted)]">
              Browse {filteredJobs.length} internship opportunities in Singapore
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-[var(--muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, companies, or keywords..."
                className="w-full pl-12 pr-4 py-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#dc2626] transition-colors"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-4">
              {/* Industry Filter */}
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#dc2626] transition-colors"
              >
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#dc2626] transition-colors"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Work Arrangement Filter */}
              <div className="flex gap-2">
                {workArrangements.map((arr) => (
                  <button
                    key={arr.value}
                    onClick={() => setSelectedArrangement(arr.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selectedArrangement === arr.value
                        ? 'bg-[#dc2626] text-white'
                        : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)] hover:border-[#dc2626]/50'
                    }`}
                  >
                    {arr.label}
                  </button>
                ))}
              </div>
              {/* Create Alert Button */}
              <button
                onClick={() => setShowAlertWidget(!showAlertWidget)}
                className="px-4 py-3 rounded-xl text-sm font-medium bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:border-[#dc2626]/50 hover:bg-[#dc2626]/10 transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Create Alert
              </button>
            </div>

            {/* Job Alert Widget */}
            <AnimatePresence>
              {showAlertWidget && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                    {alertSuccess ? (
                      <div className="flex items-center gap-3 text-green-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Alert created! You'll be notified of new matches.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={alertName}
                            onChange={(e) => setAlertName(e.target.value)}
                            placeholder="Name your alert (e.g., Software Internships)"
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#dc2626]"
                          />
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Get notified when new jobs match: {searchQuery || 'all keywords'}
                            {selectedIndustry !== 'All Industries' && ` in ${selectedIndustry}`}
                            {selectedArrangement !== 'all' && ` (${selectedArrangement})`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveJobAlert}
                            disabled={alertSaving || !alertName.trim()}
                            className="px-6 py-3 bg-[#dc2626] text-white font-semibold rounded-lg hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {alertSaving ? 'Saving...' : 'Save Alert'}
                          </button>
                          <button
                            onClick={() => setShowAlertWidget(false)}
                            className="px-4 py-3 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Jobs List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-[var(--muted)]">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-[var(--card)] rounded-2xl border border-[var(--border)]"
              >
                <svg
                  className="w-16 h-16 mx-auto text-[var(--muted)] mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  No jobs found
                </h3>
                <p className="text-[var(--muted)]">
                  Try adjusting your search or filters
                </p>
              </motion.div>
            ) : (
              filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <JobCard
                    job={{
                      id: job.id,
                      slug: job.slug,
                      title: job.title,
                      company: job.company
                        ? {
                            id: job.company.id,
                            name: job.company.name,
                            slug: job.company.slug,
                            logo_url: job.company.logo_url,
                            website: job.company.website,
                            industry: job.company.industry,
                          }
                        : undefined,
                      location: job.location || 'Singapore',
                      salary:
                        job.salary_min && job.salary_max
                          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}/mo`
                          : job.salary_min
                          ? `From $${job.salary_min.toLocaleString()}/mo`
                          : job.salary_max
                          ? `Up to $${job.salary_max.toLocaleString()}/mo`
                          : undefined,
                      work_arrangement: job.work_arrangement,
                      duration: job.duration,
                      application_url: job.application_url,
                      posted_at: job.posted_at || job.created_at,
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
