'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: 'Resume Tips',
      description: 'Craft the perfect resume that stands out to recruiters and passes ATS systems.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
      tips: [
        { title: 'Tailor Your Resume', text: 'Customize for each application. Match keywords from the job description.' },
        { title: 'Quantify Achievements', text: 'Use numbers: "Increased sales by 25%" beats "Improved sales".' },
        { title: 'Keep It Concise', text: '1-2 pages max. Recruiters spend 6-7 seconds on initial screening.' },
        { title: 'Use Action Verbs', text: 'Start with "Developed", "Led", "Implemented", or "Achieved".' },
      ],
    },
    {
      title: 'Interview Prep',
      description: 'Ace your interviews with proven strategies and practice frameworks.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      gradient: 'from-pink-500 to-orange-500',
      tips: [
        { title: 'Research the Company', text: 'Know their mission, values, recent news, and the role specifics.' },
        { title: 'Master STAR Method', text: 'Structure answers: Situation, Task, Action, Result.' },
        { title: 'Prepare Questions', text: 'Ask about role, team culture, and growth opportunities.' },
        { title: 'Follow Up', text: 'Send a thank-you email within 24 hours of your interview.' },
      ],
    },
    {
      title: 'Salary Guide',
      description: 'Know your worth with comprehensive internship salary data for Singapore.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-yellow-500',
      salaryData: [
        { role: 'Software Engineering', range: '$1,000 - $3,000/mo' },
        { role: 'Data Science', range: '$1,200 - $3,500/mo' },
        { role: 'Marketing', range: '$800 - $1,800/mo' },
        { role: 'Finance', range: '$1,000 - $2,500/mo' },
        { role: 'Design', range: '$800 - $2,000/mo' },
        { role: 'Business Development', range: '$800 - $2,000/mo' },
      ],
    },
    {
      title: 'Industry Guides',
      description: 'Deep dive into different industries and discover where you belong.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: 'from-purple-500 to-blue-500',
      industries: [
        { name: 'Technology', companies: 'Google, Meta, Grab, Shopee' },
        { name: 'Finance & Banking', companies: 'DBS, OCBC, JP Morgan, Goldman Sachs' },
        { name: 'Consulting', companies: 'McKinsey, BCG, Bain, Deloitte' },
        { name: 'Healthcare & Biotech', companies: 'Roche, Novartis, Abbott, A*STAR' },
      ],
    },
  ];

  const externalResources = [
    {
      title: 'LinkedIn Learning',
      description: 'Free courses on professional skills, software, and career development.',
      url: 'https://www.linkedin.com/learning/',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      title: 'Glassdoor',
      description: 'Company reviews, salary data, and interview experiences from real employees.',
      url: 'https://www.glassdoor.com/',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.144 20.572H6.857A6.857 6.857 0 010 13.715v-.572a6.857 6.857 0 016.857-6.857h10.287v14.286zM6.857 9.143a4 4 0 00-4 4v.572a4 4 0 004 4h7.429V9.143H6.857zM24 10.857a6.857 6.857 0 01-6.857 6.857V3.429A6.857 6.857 0 0124 10.286v.571z"/>
        </svg>
      ),
    },
    {
      title: 'Indeed Career Guide',
      description: 'Career advice, resume tips, and job search strategies.',
      url: 'https://www.indeed.com/career-advice',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.567 9.833c0 4.666-3.5 10.834-7.834 10.834v-3.334c2.333 0 4.5-2.666 4.5-5.666V8.333h-3V5h3V1.667h3.334V9.833zm5.5-5.5a2.167 2.167 0 11-.001-4.333 2.167 2.167 0 01.001 4.333zm-1.667 18.334h3.334V7.333H15.4v15.334z"/>
        </svg>
      ),
    },
    {
      title: 'SkillsFuture Singapore',
      description: 'Government-supported courses and training programs for career development.',
      url: 'https://www.skillsfuture.gov.sg/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[var(--background)] to-pink-900/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm font-medium text-purple-400 tracking-wider uppercase mb-4 block">
              Resource Hub
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Career Resources
              </span>
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
              Everything you need to land your dream internship. Free guides, tips, and tools.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Resource Categories */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Resume Tips - Large Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${resourceCategories[0].gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${resourceCategories[0].gradient} p-[1px] mb-6`}>
                <div className="w-full h-full rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
                  {resourceCategories[0].icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">{resourceCategories[0].title}</h3>
              <p className="text-[var(--muted)] mb-6">{resourceCategories[0].description}</p>
              <div className="space-y-4">
                {resourceCategories[0].tips?.map((tip, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <h4 className="font-semibold text-[var(--foreground)] mb-1">{tip.title}</h4>
                    <p className="text-sm text-[var(--muted)]">{tip.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Interview Prep - Large Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-pink-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${resourceCategories[1].gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${resourceCategories[1].gradient} p-[1px] mb-6`}>
                <div className="w-full h-full rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
                  {resourceCategories[1].icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">{resourceCategories[1].title}</h3>
              <p className="text-[var(--muted)] mb-6">{resourceCategories[1].description}</p>
              <div className="space-y-4">
                {resourceCategories[1].tips?.map((tip, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <h4 className="font-semibold text-[var(--foreground)] mb-1">{tip.title}</h4>
                    <p className="text-sm text-[var(--muted)]">{tip.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Salary Guide - Wide Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 transition-all duration-300 overflow-hidden lg:col-span-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${resourceCategories[2].gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="flex items-start gap-6 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${resourceCategories[2].gradient} p-[1px] flex-shrink-0`}>
                  <div className="w-full h-full rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
                    {resourceCategories[2].icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">{resourceCategories[2].title}</h3>
                  <p className="text-zinc-400">{resourceCategories[2].description}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {resourceCategories[2].salaryData?.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex justify-between items-center">
                    <span className="text-white font-medium">{item.role}</span>
                    <span className="text-transparent bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text font-bold">{item.range}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--muted)] mt-4">* Based on reported salaries from interns in Singapore (2024-2025)</p>
            </motion.div>

            {/* Industry Guides - Wide Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group relative p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 overflow-hidden lg:col-span-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${resourceCategories[3].gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="flex items-start gap-6 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${resourceCategories[3].gradient} p-[1px] flex-shrink-0`}>
                  <div className="w-full h-full rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
                    {resourceCategories[3].icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">{resourceCategories[3].title}</h3>
                  <p className="text-zinc-400">{resourceCategories[3].description}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {resourceCategories[3].industries?.map((industry, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-purple-500/30 transition-colors">
                    <h4 className="font-semibold text-[var(--foreground)] mb-2">{industry.name}</h4>
                    <p className="text-xs text-[var(--muted)]">{industry.companies}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* External Resources Section */}
      <section className="py-16 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-medium text-purple-400 tracking-wider uppercase mb-4 block">
              Learn More
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">External Resources</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {externalResources.map((resource, index) => (
              <motion.a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-purple-400 transition-colors">
                    {resource.icon}
                  </div>
                  <svg className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2 group-hover:text-purple-400 transition-colors">{resource.title}</h3>
                <p className="text-sm text-[var(--muted)]">{resource.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[var(--background)] to-pink-900/30" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-[var(--muted)] mb-10 max-w-2xl mx-auto">
              Apply what you have learned and find your dream internship today.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Browse Internships
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
