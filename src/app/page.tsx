'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Header, Footer, JobCard } from '@/components';
import { getJobsFromDB, getStats } from '@/lib/database';

// Popular search tags
const popularSearches = [
  'Software Engineer',
  'Data Science',
  'Product Management',
  'Marketing',
  'UI/UX Design',
  'Finance',
];

// Filter categories for jobs
const filterCategories = [
  { id: 'all', label: 'All' },
  { id: 'tech', label: 'Tech', industries: ['Technology', 'Fintech'] },
  { id: 'finance', label: 'Finance', industries: ['Banking & Finance', 'Fintech'] },
  { id: 'marketing', label: 'Marketing', industries: ['E-commerce'] },
];

// University logos with SVG representations
const universities = [
  {
    name: 'NUS',
    logo: (
      <svg viewBox="0 0 120 40" className="h-10 w-auto">
        <text x="0" y="30" className="fill-current" style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'serif' }}>NUS</text>
      </svg>
    )
  },
  {
    name: 'NTU',
    logo: (
      <svg viewBox="0 0 120 40" className="h-10 w-auto">
        <text x="0" y="30" className="fill-current" style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'serif' }}>NTU</text>
      </svg>
    )
  },
  {
    name: 'SMU',
    logo: (
      <svg viewBox="0 0 120 40" className="h-10 w-auto">
        <text x="0" y="30" className="fill-current" style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'serif' }}>SMU</text>
      </svg>
    )
  },
  {
    name: 'SUTD',
    logo: (
      <svg viewBox="0 0 140 40" className="h-10 w-auto">
        <text x="0" y="30" className="fill-current" style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'serif' }}>SUTD</text>
      </svg>
    )
  },
];

// Features for bento grid
const features = [
  {
    id: 'one-click-apply',
    title: 'One-Click Apply',
    description: 'Save your profile once and apply to multiple internships instantly with a single click.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    size: 'large',
    gradient: 'from-[#dc2626] to-[#b91c1c]',
  },
  {
    id: 'real-time',
    title: 'Real-time Updates',
    description: 'Get notified instantly when new opportunities match your profile.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    size: 'small',
    gradient: 'from-[#dc2626] to-[#b91c1c]',
  },
  {
    id: 'verified',
    title: 'Verified Companies',
    description: 'Every company is verified to ensure legitimate opportunities.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    size: 'small',
    gradient: 'from-[#dc2626] to-[#b91c1c]',
  },
  {
    id: 'tracking',
    title: 'Application Tracking',
    description: 'Track all your applications in one place and never miss a deadline.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    size: 'large',
    gradient: 'from-[#dc2626] to-[#b91c1c]',
  },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({ jobs: 0, companies: 0 });
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();

  // Parallax effect for blobs
  const blob1Y = useTransform(scrollY, [0, 500], [0, 150]);
  const blob2Y = useTransform(scrollY, [0, 500], [0, -100]);
  const blob3Y = useTransform(scrollY, [0, 500], [0, 75]);

  useEffect(() => {
    setMounted(true);

    // Fetch jobs and stats from database
    async function fetchData() {
      try {
        const [jobsData, statsData] = await Promise.all([
          getJobsFromDB(),
          getStats(),
        ]);
        setJobs(jobsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter jobs based on category
  const filteredJobs = activeFilter === 'all'
    ? jobs.slice(0, 6)
    : jobs.filter(job => {
        const category = filterCategories.find(c => c.id === activeFilter);
        return category?.industries?.includes(job.company?.industry || job.industry);
      }).slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTagClick = (tag: string) => {
    router.push(`/jobs?q=${encodeURIComponent(tag)}`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col transition-colors duration-300">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Gradient Blobs */}
        <motion.div
          style={{ y: blob1Y }}
          className="absolute top-20 -left-40 w-96 h-96 bg-[#dc2626]/30 rounded-full blur-[128px] animate-pulse"
        />
        <motion.div
          style={{ y: blob2Y }}
          className="absolute top-40 -right-40 w-96 h-96 bg-[#dc2626]/20 rounded-full blur-[128px] animate-pulse"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ y: blob3Y }}
          className="absolute bottom-20 left-1/3 w-96 h-96 bg-[#dc2626]/15 rounded-full blur-[128px] animate-pulse"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="gradient-text">
              Find Your Dream
            </span>
            <br />
            <span className="text-[var(--foreground)]">Internship</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-xl text-[var(--muted)] mb-10 max-w-2xl mx-auto"
          >
            Discover top internship opportunities from Singapore&apos;s leading companies.
            Launch your career with the perfect match.
          </motion.p>

          {/* Search Bar with Glassmorphism */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="relative group">
              {/* Gradient border on focus */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-400 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="relative flex items-center glass rounded-2xl overflow-hidden">
                <div className="pl-5 pr-2 text-[var(--muted)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for roles, companies, or skills..."
                  className="flex-1 px-4 py-5 bg-transparent text-[var(--foreground)] placeholder-[var(--muted)] text-lg focus:outline-none"
                />
                <button
                  type="submit"
                  className="m-2 px-8 py-3 bg-gradient-to-r from-[#dc2626] to-[#dc2626] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 hover:scale-105"
                >
                  Search
                </button>
              </div>
            </div>
          </motion.form>

          {/* Popular Search Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            <span className="text-sm text-[var(--muted)] mr-2">Popular:</span>
            {popularSearches.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-4 py-1.5 text-sm text-[var(--muted)] bg-[var(--card)] rounded-full border border-[var(--border)] hover:border-red-500/50 hover:text-[#dc2626] hover:bg-red-500/10 transition-all duration-300"
              >
                {tag}
              </button>
            ))}
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
            className="flex flex-wrap justify-center gap-8 md:gap-16"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#dc2626]">
                {stats.jobs}+
              </div>
              <div className="text-sm text-[var(--muted)]">Internships</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#dc2626]">
                {stats.companies}+
              </div>
              <div className="text-sm text-[var(--muted)]">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#dc2626]">
                #1
              </div>
              <div className="text-sm text-[var(--muted)]">in Singapore</div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-[var(--border)] flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[var(--muted)] mb-8 text-sm uppercase tracking-wider"
          >
            Trusted by students from
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
          >
            {universities.map((uni, index) => (
              <motion.div
                key={uni.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="h-12 flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-300 text-[var(--muted)] group-hover:text-[#dc2626]">
                  {uni.logo}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-20 relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#dc2626]/5 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">
                Latest Opportunities
              </span>
            </h2>
            <p className="text-[var(--muted)] max-w-2xl mx-auto">
              Fresh internship openings from top companies, updated daily
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide justify-center"
          >
            {filterCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeFilter === category.id
                    ? 'bg-gradient-to-r from-[#dc2626] to-[#dc2626] text-white shadow-lg shadow-[#dc2626]/25'
                    : 'bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] border border-[var(--border)]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </motion.div>

          {/* Jobs Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 mb-8">
            {loading ? (
              <div className="col-span-full text-center py-12 text-[var(--muted)]">
                Loading jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[var(--muted)]">
                No jobs found
              </div>
            ) : (
              filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <JobCard
                    job={{
                      id: job.id,
                      slug: job.slug,
                      title: job.title,
                      company: job.company ? {
                        id: job.company.id,
                        name: job.company.name,
                        slug: job.company.slug || job.company.id,
                        logo_url: job.company.logo_url || job.company.logo,
                        website: job.company.website,
                        industry: job.company.industry,
                      } : undefined,
                      location: job.location || 'Singapore',
                      salary: job.salary_min && job.salary_max
                        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}/mo`
                        : undefined,
                      work_arrangement: job.work_arrangement || 'onsite',
                      duration: job.duration,
                      application_url: job.application_url || '#',
                      posted_at: job.posted_at || job.created_at,
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-8 py-4 text-[var(--foreground)] font-semibold rounded-xl border border-[var(--border)] hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 group"
            >
              View All Jobs
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-20 relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#dc2626]/10 rounded-full blur-[128px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#dc2626]/10 rounded-full blur-[128px] -translate-y-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--foreground)]">
              Why Choose Us
            </h2>
            <p className="text-[var(--muted)] max-w-2xl mx-auto">
              Everything you need to land your dream internship
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`group relative p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--border-hover)] overflow-hidden transition-all duration-300 ${
                  feature.size === 'large' ? 'md:col-span-2 md:row-span-1' : 'col-span-1'
                }`}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 flex items-center justify-center mb-4 text-white`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 group-hover:text-[#dc2626] transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-[#dc2626]">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium mb-6">
              Start Your Career Journey
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Ready to launch your career?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Join thousands of students who have landed their dream internships through our platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/jobs"
              className="px-8 py-4 bg-white text-[#dc2626] font-semibold rounded-xl hover:shadow-lg hover:shadow-black/20 transition-all duration-300 hover:scale-105"
            >
              Browse Jobs
            </Link>
            <Link
              href="/employer/signup"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-[#dc2626] transition-all duration-300"
            >
              For Employers
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
