'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  job_count?: number;
}

interface CompanyCardProps {
  company: Company;
}

// Logo.dev API token
const LOGO_DEV_TOKEN = 'pk_X-1ZO13GSgeOoUrIuJ6GMQ';

// Get logo URL with logo.dev fallback
function getLogoUrl(company: Company): string | null {
  // 1. Use logo_url if it's already a logo.dev URL
  if (company.logo_url && company.logo_url.includes('logo.dev')) {
    return company.logo_url;
  }

  // 2. Try website field
  if (company.website) {
    try {
      const domain = new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`).hostname.replace('www.', '');
      return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=200`;
    } catch {
      // Continue
    }
  }

  // 3. Use provided logo_url if available
  if (company.logo_url) {
    return company.logo_url;
  }

  // 4. Guess from company name
  const guessedDomain = company.name
    .toLowerCase()
    .replace(/\s+(pte|ltd|limited|inc|corp|corporation|singapore|sg)\.?/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (guessedDomain.length >= 2) {
    return `https://img.logo.dev/${guessedDomain}.com?token=${LOGO_DEV_TOKEN}&size=200`;
  }

  return null;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = getLogoUrl(company);

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="block bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-red-300 hover:shadow-md transition group"
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 transition overflow-hidden">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={company.name}
              className="w-12 h-12 object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-3xl font-bold text-gray-400 group-hover:text-red-500 transition">
              {company.name?.charAt(0) || '?'}
            </span>
          )}
        </div>

        {/* Company Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-red-600 transition truncate">
            {company.name}
          </h3>
          <p className="text-[var(--muted)] text-sm mb-2">
            {company.industry || 'Various Industries'}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            {company.size && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {company.size}
              </span>
            )}
            {typeof company.job_count === 'number' && (
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded">
                {company.job_count} {company.job_count === 1 ? 'job' : 'jobs'} open
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="text-gray-400 group-hover:text-red-600 transition flex-shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
