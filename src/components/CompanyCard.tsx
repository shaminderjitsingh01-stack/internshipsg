import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industry?: string;
  size?: string;
  job_count?: number;
}

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition group"
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <span className="text-3xl font-bold text-gray-400 group-hover:text-blue-400 transition">
              {company.name?.charAt(0) || '?'}
            </span>
          )}
        </div>

        {/* Company Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
            {company.name}
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            {company.industry || 'Various Industries'}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            {company.size && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {company.size}
              </span>
            )}
            {typeof company.job_count === 'number' && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                {company.job_count} {company.job_count === 1 ? 'job' : 'jobs'} open
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="text-gray-400 group-hover:text-blue-600 transition flex-shrink-0">
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
