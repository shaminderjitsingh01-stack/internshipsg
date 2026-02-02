'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/employer/dashboard', label: 'Overview' },
  { href: '/employer/jobs', label: 'Jobs' },
  { href: '/employer/jobs/new', label: 'Post' },
  { href: '/employer/applicants', label: 'Applicants' },
  { href: '/employer/company', label: 'Company' },
  { href: '/employer/settings', label: 'Settings' },
];

export default function EmployerMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/employer/dashboard') {
      return pathname === '/employer/dashboard';
    }
    if (href === '/employer/jobs') {
      return pathname === '/employer/jobs' || (pathname.startsWith('/employer/jobs/') && !pathname.includes('/new'));
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden mb-6 overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
              isActive(item.href)
                ? 'bg-[#dc2626] text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
