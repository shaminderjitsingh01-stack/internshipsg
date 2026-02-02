'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ShareButton from './ShareButton';
import { Job } from '@/lib/mockData';

interface JobDetailClientProps {
  job: Job;
  salaryRange: string | null;
  postedDate: string;
  niceToHave: string[];
  similarJobs: Job[];
}

export default function JobDetailClient({
  job,
  salaryRange,
  postedDate,
  niceToHave,
  similarJobs,
}: JobDetailClientProps) {
  return (
    <>
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/jobs"
          className="group inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-300 mb-8"
        >
          <motion.div
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700 group-hover:border-purple-500/50 group-hover:bg-zinc-800 transition-all duration-300"
            whileHover={{ x: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.div>
          <span className="text-sm font-medium">Back to Jobs</span>
        </Link>
      </motion.div>

      {/* Job Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800 mb-8 overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
          {/* Company Logo with Gradient Ring */}
          <motion.div
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-75 blur-sm" />
            <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden bg-zinc-800">
              {job.company?.logo_url ? (
                <img
                  src={job.company.logo_url}
                  alt={job.company.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {job.company?.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* Job Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-300 mb-3">
              {job.title}
            </h1>

            {/* Company Name Link */}
            <Link
              href={`/companies/${job.company?.slug}`}
              className="inline-block text-lg text-zinc-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-400 hover:to-pink-400 transition-all duration-300 mb-4"
            >
              {job.company?.name}
            </Link>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Location Badge */}
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>

              {/* Work Arrangement Badge */}
              {job.work_arrangement && (
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium capitalize ${
                  job.work_arrangement === 'remote'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : job.work_arrangement === 'hybrid'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {job.work_arrangement === 'remote' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    )}
                  </svg>
                  {job.work_arrangement}
                </span>
              )}

              {/* Duration Badge */}
              {job.duration && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.duration}
                </span>
              )}

              {/* Posted Date */}
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-full border border-zinc-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Posted {postedDate}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About This Role */}
          {job.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="relative bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  About this role
                </h2>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </motion.div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="relative bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                  Requirements
                </h2>
                <ul className="space-y-3">
                  {job.requirements.map((req, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-3 text-zinc-300"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span>{req}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Nice to Have */}
          {niceToHave && niceToHave.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="relative bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-pink-500 to-orange-500 rounded-full" />
                  Nice to have
                </h2>
                <ul className="space-y-3">
                  {niceToHave.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                      className="flex items-start gap-3 text-zinc-400"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:sticky lg:top-24 space-y-6"
          >
            {/* Salary Card */}
            {salaryRange && (
              <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5 pointer-events-none" />

                <div className="relative z-10">
                  <p className="text-sm text-zinc-400 mb-2">Monthly Salary</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                    {salaryRange}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">SGD / month</p>
                </div>
              </div>
            )}

            {/* Apply Now Button */}
            <motion.a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative block w-full text-center py-4 rounded-2xl font-semibold text-white overflow-hidden"
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 transition-all duration-300" />

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />

              {/* Button content */}
              <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                Apply Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </motion.a>

            {/* Share Buttons */}
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
              <p className="text-sm text-zinc-400 mb-4 text-center">Share this opportunity</p>
              <ShareButton title={`${job.title} at ${job.company?.name}`} />
            </div>

            {/* Company Mini Card */}
            <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 blur-sm" />
                    <div className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-zinc-800">
                      {job.company?.logo_url ? (
                        <img
                          src={job.company.logo_url}
                          alt={job.company.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {job.company?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{job.company?.name}</p>
                    {job.company?.industry && (
                      <p className="text-sm text-zinc-400">{job.company.industry}</p>
                    )}
                  </div>
                </div>

                {job.company?.description && (
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-3">
                    {job.company.description}
                  </p>
                )}

                <div className="space-y-2 text-sm mb-4">
                  {job.company?.location && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.company.location}
                    </div>
                  )}
                  {job.company?.size && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {job.company.size} employees
                    </div>
                  )}
                </div>

                {job.company?.slug && (
                  <Link
                    href={`/companies/${job.company.slug}`}
                    className="block w-full text-center py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:text-white hover:border-purple-500/50 hover:bg-zinc-800 transition-all duration-300 text-sm font-medium"
                  >
                    View all jobs from {job.company.name}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Similar Jobs Section */}
      {similarJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-purple-500 via-pink-500 to-orange-500 rounded-full" />
            Similar opportunities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarJobs.map((similarJob, index) => (
              <motion.article
                key={similarJob.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm" />
                      <div className="relative w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-zinc-800">
                        {similarJob.company?.logo_url ? (
                          <img
                            src={similarJob.company.logo_url}
                            alt={similarJob.company.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {similarJob.company?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                        {similarJob.title}
                      </h3>
                      <p className="text-sm text-zinc-400 truncate">{similarJob.company?.name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs border border-purple-500/20">
                      {similarJob.location}
                    </span>
                    {similarJob.work_arrangement && similarJob.work_arrangement !== 'onsite' && (
                      <span className="px-2.5 py-1 bg-pink-500/10 text-pink-400 rounded-full text-xs border border-pink-500/20 capitalize">
                        {similarJob.work_arrangement}
                      </span>
                    )}
                  </div>

                  {similarJob.salary_min && similarJob.salary_max && (
                    <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-4">
                      ${similarJob.salary_min.toLocaleString()} - ${similarJob.salary_max.toLocaleString()}
                    </p>
                  )}

                  <Link
                    href={`/jobs/${similarJob.slug}`}
                    className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
