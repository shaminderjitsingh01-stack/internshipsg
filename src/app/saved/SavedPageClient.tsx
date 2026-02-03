'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

interface Job {
  id: string;
  title: string;
  slug: string;
  location: string;
  job_type?: string;
  work_arrangement?: string;
  salary_min?: number;
  salary_max?: number;
  salary_period?: string;
  posted_at?: string;
  company?: {
    name: string;
    slug: string;
    logo_url?: string;
  };
}

export default function SavedPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/saved');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
    }
  }, [user]);

  const fetchSavedJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/saved-jobs');
      if (res.ok) {
        const data = await res.json();
        setSavedJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeSavedJob = async (jobId: string) => {
    setRemoving(jobId);
    try {
      const res = await fetch(`/api/user/saved-jobs?jobId=${jobId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSavedJobs(savedJobs.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
    } finally {
      setRemoving(null);
    }
  };

  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return null;
    const formatNum = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k` : num.toString();
    const periodLabel = period === 'hourly' ? '/hr' : period === 'monthly' ? '/mo' : '';
    if (min && max) {
      return `$${formatNum(min)} - $${formatNum(max)}${periodLabel}`;
    }
    return `$${formatNum(min || max || 0)}${periodLabel}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Saved Jobs</h1>
              <p className="text-[var(--muted)] mt-1">
                {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'} saved
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Saved Jobs List */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No saved jobs yet</h3>
              <p className="text-[var(--muted)] mb-6">
                Browse internships and save the ones you're interested in
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-[#dc2626] text-white font-medium rounded-xl hover:bg-[#b91c1c] transition-colors"
              >
                Browse Internships
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Company Logo */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#dc2626] to-[#991b1b] flex items-center justify-center flex-shrink-0">
                        {job.company?.logo_url ? (
                          <img
                            src={job.company.logo_url}
                            alt={job.company?.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-xl text-white font-bold">
                            {job.company?.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/jobs/${job.slug}`}
                          className="text-lg font-semibold text-[var(--foreground)] hover:text-[#dc2626] transition-colors block"
                        >
                          {job.title}
                        </Link>
                        <p className="text-[var(--muted)] mt-0.5">
                          {job.company?.name && (
                            <Link
                              href={`/companies/${job.company.slug}`}
                              className="hover:text-[var(--foreground)] transition-colors"
                            >
                              {job.company.name}
                            </Link>
                          )}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-3 py-1 text-xs bg-zinc-800 text-[var(--foreground)] rounded-lg border border-zinc-700">
                            {job.location}
                          </span>
                          {job.work_arrangement && job.work_arrangement !== 'onsite' && (
                            <span className="px-3 py-1 text-xs bg-[#dc2626]/10 text-[#dc2626] rounded-lg border border-[#dc2626]/20 capitalize">
                              {job.work_arrangement}
                            </span>
                          )}
                          {job.job_type && (
                            <span className="px-3 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 capitalize">
                              {job.job_type}
                            </span>
                          )}
                          {formatSalary(job.salary_min, job.salary_max, job.salary_period) && (
                            <span className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                              {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                            </span>
                          )}
                        </div>

                        {job.posted_at && (
                          <p className="text-sm text-[var(--muted)] mt-3">
                            Posted {formatDate(job.posted_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 md:flex-col md:items-end">
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="px-4 py-2 bg-[#dc2626] text-white text-sm font-medium rounded-lg hover:bg-[#b91c1c] transition-colors"
                      >
                        View Job
                      </Link>
                      <button
                        onClick={() => removeSavedJob(job.id)}
                        disabled={removing === job.id}
                        className="px-4 py-2 bg-zinc-800 text-[var(--foreground)] text-sm rounded-lg hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {removing === job.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Removing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Browse More CTA */}
          {savedJobs.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse more internships
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
