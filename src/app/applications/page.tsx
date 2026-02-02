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
  company?: {
    name: string;
    slug: string;
    logo_url?: string;
  };
}

interface Application {
  id: string;
  status: 'pending' | 'viewed' | 'rejected' | 'accepted';
  created_at: string;
  updated_at?: string;
  job: Job;
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/applications');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'viewed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'accepted':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'viewed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'accepted':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    viewed: applications.filter(a => a.status === 'viewed').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">My Applications</h1>
              <p className="text-zinc-400 mt-1">Track the status of your job applications</p>
            </div>
            <Link
              href="/dashboard"
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'viewed', label: 'Viewed' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === tab.id
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.id ? 'bg-white/20' : 'bg-zinc-800'
                }`}>
                  {statusCounts[tab.id as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Applications List */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
              </h3>
              <p className="text-zinc-400 mb-6">
                {filter === 'all'
                  ? "Start applying to internships to track them here"
                  : "Applications with this status will appear here"
                }
              </p>
              {filter === 'all' && (
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-[#dc2626] text-white font-medium rounded-xl hover:bg-[#b91c1c] transition-colors"
                >
                  Browse Internships
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Company Logo */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dc2626] to-[#991b1b] flex items-center justify-center flex-shrink-0">
                        {app.job.company?.logo_url ? (
                          <img
                            src={app.job.company.logo_url}
                            alt={app.job.company?.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-xl text-white font-bold">
                            {app.job.company?.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/jobs/${app.job.slug}`}
                          className="text-lg font-semibold text-white hover:text-[#dc2626] transition-colors"
                        >
                          {app.job.title}
                        </Link>
                        <p className="text-zinc-400 mt-0.5">
                          {app.job.company?.name && (
                            <Link
                              href={`/companies/${app.job.company.slug}`}
                              className="hover:text-white transition-colors"
                            >
                              {app.job.company.name}
                            </Link>
                          )}
                          {app.job.location && (
                            <span className="text-zinc-500"> - {app.job.location}</span>
                          )}
                        </p>
                        <p className="text-sm text-zinc-500 mt-2">
                          Applied on {formatDate(app.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        <span className="capitalize">{app.status}</span>
                      </span>
                      <Link
                        href={`/jobs/${app.job.slug}`}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                        title="View Job"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {applications.length > 0 && (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{statusCounts.all}</p>
                <p className="text-sm text-zinc-400">Total Applied</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{statusCounts.viewed}</p>
                <p className="text-sm text-zinc-400">Viewed</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{statusCounts.accepted}</p>
                <p className="text-sm text-zinc-400">Accepted</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</p>
                <p className="text-sm text-zinc-400">Pending</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
