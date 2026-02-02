'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Check your email</h1>
            <p className="text-[var(--muted)] mb-6">
              We've sent a password reset link to <strong className="text-[var(--foreground)]">{email}</strong>. Click the link in the email to reset your password.
            </p>
            <p className="text-sm text-[var(--muted)] mb-6">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-[#dc2626] hover:underline"
              >
                try again
              </button>
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <svg className="w-10 h-10" viewBox="0 0 44 44" fill="none">
            <path d="M22 4 L6 12 L22 20 L38 12 Z" fill="#dc2626"/>
            <path d="M10 14 L10 22 Q22 28 34 22 L34 14" stroke="#dc2626" strokeWidth="2.5" fill="none"/>
            <line x1="36" y1="12" x2="36" y2="24" stroke="#dc2626" strokeWidth="2"/>
            <circle cx="36" cy="25" r="2" fill="#dc2626"/>
            <rect x="14" y="30" width="16" height="10" rx="2" fill="#dc2626"/>
            <path d="M18 30 L18 28 C18 27 19 26 22 26 C25 26 26 27 26 28 L26 30" stroke="#dc2626" strokeWidth="2" fill="none"/>
            <line x1="14" y1="34" x2="30" y2="34" stroke="white" strokeWidth="1.5"/>
          </svg>
          <span className="text-2xl font-bold text-[#dc2626]">internship.sg</span>
        </Link>

        {/* Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
          <div className="w-12 h-12 bg-[#dc2626]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#dc2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] text-center mb-2">
            Forgot your password?
          </h1>
          <p className="text-[var(--muted)] text-center mb-8">
            No worries! Enter your email and we'll send you a reset link.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#dc2626] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          {/* Back to login link */}
          <p className="mt-6 text-center text-[var(--muted)]">
            Remember your password?{' '}
            <Link href="/login" className="text-[#dc2626] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="mt-6 text-center">
          <Link href="/" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
