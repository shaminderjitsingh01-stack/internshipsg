'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  const navLinks = [
    { href: '/', label: 'Jobs' },
    { href: '/companies', label: 'Companies' },
    { href: '/resources', label: 'Resources' },
    { href: '/employer/login', label: 'For Employers' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* Graduation Cap + Briefcase Logo */}
          <svg className="w-10 h-10" viewBox="0 0 44 44" fill="none">
            {/* Graduation cap */}
            <path d="M22 4 L6 12 L22 20 L38 12 Z" fill="#dc2626"/>
            <path d="M10 14 L10 22 Q22 28 34 22 L34 14" stroke="#dc2626" strokeWidth="2.5" fill="none"/>
            <line x1="36" y1="12" x2="36" y2="24" stroke="#dc2626" strokeWidth="2"/>
            <circle cx="36" cy="25" r="2" fill="#dc2626"/>

            {/* Small briefcase below */}
            <rect x="14" y="30" width="16" height="10" rx="2" fill="#dc2626"/>
            <path d="M18 30 L18 28 C18 27 19 26 22 26 C25 26 26 27 26 28 L26 30" stroke="#dc2626" strokeWidth="2" fill="none"/>
            <line x1="14" y1="34" x2="30" y2="34" stroke="white" strokeWidth="1.5"/>
          </svg>
          <span className="text-xl font-bold text-[#dc2626]">internship.sg</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative group py-2"
            >
              <span
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActiveLink(link.href)
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {link.label}
              </span>
              {/* Active/Hover underline */}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300 ${
                  isActiveLink(link.href)
                    ? 'w-full'
                    : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* Right Side - Auth */}
        <div className="hidden md:flex items-center gap-4">
          {/* Auth Buttons */}
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#dc2626] rounded-full hover:bg-[#b91c1c] hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <motion.div
              animate={mobileMenuOpen ? 'open' : 'closed'}
              className="w-6 h-6 flex flex-col justify-center items-center"
            >
              <motion.span
                className="w-5 h-0.5 bg-current block"
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 3 },
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-5 h-0.5 bg-current block mt-1"
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 },
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-5 h-0.5 bg-current block mt-1"
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -5 },
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden border-t border-[var(--border)] overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    className={`block py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActiveLink(link.href)
                        ? 'text-[var(--foreground)] bg-[var(--card)]'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      {link.label}
                      {isActiveLink(link.href) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-400" />
                      )}
                    </span>
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Auth Buttons */}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: navLinks.length * 0.1, duration: 0.3 }}
                  className="pt-4 space-y-2"
                >
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="block w-full text-center py-3 px-4 text-sm font-medium text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { signOut(); setMobileMenuOpen(false); }}
                        className="block w-full text-center py-3 px-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block w-full text-center py-3 px-4 text-sm font-medium text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        className="block w-full text-center py-3 px-4 text-sm font-semibold text-white bg-[#dc2626] rounded-lg transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
