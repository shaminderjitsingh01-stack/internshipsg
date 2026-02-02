'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

export default function EmployerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error.message);
      } else {
        router.push('/employer/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#dc2626] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Employer Login</h1>
            <p className="text-zinc-400 mt-2">Access your company dashboard</p>
          </div>

          {/* Login Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@company.com"
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#dc2626] focus:ring-[#dc2626]" />
                  <span className="ml-2 text-sm text-zinc-400">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-[#dc2626] hover:text-red-400">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-zinc-400">
                Don't have an account?{' '}
                <Link href="/employer/signup" className="text-[#dc2626] hover:text-red-400">
                  Register your company
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/employer/pricing" className="text-zinc-500 hover:text-zinc-300 text-sm">
                View pricing plans
              </Link>
            </div>
          </div>

          {/* Back to main site */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm">
              Back to internship.sg
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
