'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

interface Company {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  is_verified: boolean;
}

export default function ClaimCompanyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/employer/login?redirect=/employer/claim');
    }
  }, [user, loading, router]);

  const searchCompanies = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setError('');

    try {
      const res = await fetch(`/api/employer/search-companies?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const claimCompany = async (companyId: string) => {
    setClaiming(true);
    setError('');

    try {
      const res = await fetch('/api/employer/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to claim company');
        return;
      }

      setSuccess('Company claimed successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/employer/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to claim company');
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Claim Your Company</h1>
            <p className="text-[var(--muted)]">
              Search for your company and claim ownership to manage job postings
            </p>
          </div>

          {/* Email Info */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--foreground)] font-medium">Verification Required</p>
                <p className="text-[var(--muted)] text-sm mt-1">
                  To claim a company, your email domain ({user.email?.split('@')[1]}) must match the company's domain.
                  Our team will verify your claim within 24-48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Search for your company</h2>

            <div className="flex gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCompanies()}
                placeholder="Enter company name..."
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={searchCompanies}
                disabled={searching}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-[var(--foreground)] font-medium rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Results */}
            {companies.length > 0 && (
              <div className="mt-6 space-y-3">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="p-4 bg-zinc-800/50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{company.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white flex items-center gap-2">
                          {company.name}
                          {company.is_verified && (
                            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </p>
                        <p className="text-sm text-[var(--muted)]">{company.industry || 'Industry not specified'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => claimCompany(company.id)}
                      disabled={claiming}
                      className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 disabled:opacity-50"
                    >
                      Claim
                    </button>
                  </div>
                ))}
              </div>
            )}

            {search && companies.length === 0 && !searching && (
              <div className="mt-6 text-center py-8">
                <p className="text-[var(--muted)] mb-4">No companies found matching "{search}"</p>
                <Link
                  href="/employer/signup"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Register a new company instead
                </Link>
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-4">
              <p className="text-emerald-400">{success}</p>
            </div>
          )}

          {/* Alternative Option */}
          <div className="text-center">
            <p className="text-[var(--muted)] mb-2">Can't find your company?</p>
            <Link
              href="/employer/signup"
              className="text-purple-400 hover:text-purple-300"
            >
              Register a new company
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
