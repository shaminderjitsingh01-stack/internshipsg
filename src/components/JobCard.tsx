'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  industry?: string;
}

// Known company domain mappings for Singapore companies
const KNOWN_DOMAINS: Record<string, string> = {
  'dbs': 'dbs.com',
  'dbs bank': 'dbs.com',
  'ocbc': 'ocbc.com',
  'ocbc bank': 'ocbc.com',
  'uob': 'uob.com.sg',
  'google': 'google.com',
  'meta': 'meta.com',
  'facebook': 'facebook.com',
  'microsoft': 'microsoft.com',
  'amazon': 'amazon.com',
  'apple': 'apple.com',
  'grab': 'grab.com',
  'shopee': 'shopee.sg',
  'lazada': 'lazada.sg',
  'singtel': 'singtel.com',
  'starhub': 'starhub.com',
  'gojek': 'gojek.com',
  'sea': 'sea.com',
  'sea limited': 'sea.com',
  'bytedance': 'bytedance.com',
  'tiktok': 'tiktok.com',
  'stripe': 'stripe.com',
  'wise': 'wise.com',
  'revolut': 'revolut.com',
  'standard chartered': 'sc.com',
  'hsbc': 'hsbc.com',
  'citibank': 'citi.com',
  'jp morgan': 'jpmorgan.com',
  'goldman sachs': 'goldmansachs.com',
  'morgan stanley': 'morganstanley.com',
  'barclays': 'barclays.com',
  'nus': 'nus.edu.sg',
  'ntu': 'ntu.edu.sg',
  'smu': 'smu.edu.sg',
  'sutd': 'sutd.edu.sg',
  'govtech': 'tech.gov.sg',
  'temasek': 'temasek.com.sg',
  'gic': 'gic.com.sg',
  'capitaland': 'capitaland.com',
  'keppel': 'kepcorp.com',
  'sembcorp': 'sembcorp.com',
  'wilmar': 'wilmar-international.com',
  'sia': 'singaporeair.com',
  'singapore airlines': 'singaporeair.com',
  'changi airport': 'changiairport.com',
  'foodpanda': 'foodpanda.com',
  'deliveroo': 'deliveroo.com',
  'carousell': 'carousell.com',
  'ninja van': 'ninjavan.co',
  'razer': 'razer.com',
};

// Logo.dev API token for high-quality logos
const LOGO_DEV_TOKEN = 'pk_X-1ZO13GSgeOoUrIuJ6GMQ';

// Get logo URL - use logo_url if available, otherwise try logo.dev
function getLogoUrl(company?: Company): string | null {
  if (!company) return null;

  // 1. Use logo_url if available and it's already a logo.dev URL
  if (company.logo_url && company.logo_url.includes('logo.dev')) {
    return company.logo_url;
  }

  // 2. Try website field with logo.dev
  if (company.website) {
    try {
      const domain = new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`).hostname.replace('www.', '');
      return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=200`;
    } catch {
      // Continue to fallbacks
    }
  }

  // 3. Try known domain mappings with logo.dev
  const nameLower = company.name.toLowerCase().trim();
  if (KNOWN_DOMAINS[nameLower]) {
    return `https://img.logo.dev/${KNOWN_DOMAINS[nameLower]}?token=${LOGO_DEV_TOKEN}&size=200`;
  }

  // 4. Try partial matches in known domains
  for (const [key, domain] of Object.entries(KNOWN_DOMAINS)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=200`;
    }
  }

  // 5. Last resort: guess domain from company name
  const guessedDomain = nameLower
    .replace(/\s+(pte|ltd|limited|inc|corp|corporation|singapore|sg)\.?/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (guessedDomain.length >= 2) {
    return `https://img.logo.dev/${guessedDomain}.com?token=${LOGO_DEV_TOKEN}&size=200`;
  }

  return null;
}

interface Job {
  id: string;
  slug?: string;
  title: string;
  location?: string;
  work_arrangement?: string;
  duration?: string;
  salary?: string;
  application_url: string;
  company?: Company;
  posted_at?: string;
}

interface JobCardProps {
  job: Job;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

export default function JobCard({ job }: JobCardProps) {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = getLogoUrl(job.company);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[var(--card)] rounded-2xl p-6 hover:gradient-border hover:shine overflow-hidden transition-colors duration-300"
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
      <div className="absolute inset-[1px] rounded-2xl bg-[var(--card)] -z-5" />

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Company Logo with gradient ring on hover */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative flex-shrink-0"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
            <div className="relative w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-[var(--border)] group-hover:ring-0 transition-all duration-300 bg-white">
              {logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt={job.company?.name || 'Company'}
                  className="w-full h-full object-contain p-1.5"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#dc2626] to-[#b91c1c] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {job.company?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Job Details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-1 truncate">
              <Link
                href={`/jobs/${job.slug || job.id}`}
                className="hover:text-[#dc2626] transition-colors duration-200"
              >
                {job.title}
              </Link>
            </h2>
            <p className="text-[var(--muted)] mb-3">
              {job.company ? (
                <Link
                  href={`/companies/${job.company.slug}`}
                  className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:text-red-500 transition-all duration-200"
                >
                  {job.company.name}
                </Link>
              ) : (
                'Unknown Company'
              )}
              {job.company?.industry && (
                <span className="text-[var(--muted)]"> · {job.company.industry}</span>
              )}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 text-sm">
              {/* Location - Purple */}
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                {job.location || 'Singapore'}
              </span>

              {/* Work Arrangement - Pink */}
              {job.work_arrangement && job.work_arrangement !== 'onsite' && (
                <span className="px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20 capitalize">
                  {job.work_arrangement}
                </span>
              )}

              {/* Salary - Green */}
              {job.salary && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-medium">
                  {job.salary}
                </span>
              )}

              {/* Duration - Orange */}
              {job.duration && (
                <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
                  {job.duration}
                </span>
              )}
            </div>

            {/* Salary prominent display */}
            {job.salary && (
              <p className="mt-3 text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                {job.salary}
              </p>
            )}
          </div>

          {/* Apply Button - Desktop */}
          <motion.a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#dc2626] to-[#dc2626] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-shadow duration-300 flex-shrink-0"
          >
            Apply
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.a>
        </div>

        {/* Posted date */}
        {job.posted_at && (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Posted {getRelativeTime(job.posted_at)}
          </p>
        )}

        {/* Mobile Apply Button */}
        <motion.a
          href={job.application_url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#dc2626] to-[#dc2626] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-shadow duration-300 sm:hidden"
        >
          Apply Now
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.a>
      </div>
    </motion.article>
  );
}
