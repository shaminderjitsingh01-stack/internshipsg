'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmployerLayout } from '../components';
import { useAuth } from '@/context/AuthContext';

interface Job {
  id: string;
  title: string;
  slug: string;
  location: string;
  work_arrangement: string;
  status: string;
  is_active: boolean;
  views: number;
  applications_count: number;
  posted_at: string;
  created_at: string;
  expires_at: string | null;
}

export default function EmployerJobsPageClient() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/employer/dashboard');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (res.ok) {
        setJobs(jobs.map(job =>
          job.id === jobId ? { ...job, is_active: !currentStatus, status: !currentStatus ? 'active' : 'inactive' } : job
        ));
      }
    } catch (error) {
      console.error('Error toggling job status:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setJobs(jobs.filter(job => job.id !== jobId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'active') return job.is_active || job.status === 'active';
    return !job.is_active && job.status !== 'active';
  });

  if (loading) {
    return (
      <EmployerLayout title="Job Postings" subtitle="Manage your internship listings">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout title="Job Postings" subtitle="Manage your internship listings">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-2 text-xs">
                  ({jobs.filter(j => f === 'active' ? (j.is_active || j.status === 'active') : (!j.is_active && j.status !== 'active')).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <Link
          href="/employer/jobs/new"
          className="px-4 py-2 bg-[#dc2626] text-white rounded-lg font-medium hover:bg-[#b91c1c] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Post New Job
        </Link>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-zinc-400 mb-6">
            {filter === 'all'
              ? "You haven't posted any jobs yet."
              : `No ${filter} jobs found.`}
          </p>
          {filter === 'all' && (
            <Link
              href="/employer/jobs/new"
              className="px-6 py-3 bg-[#dc2626] text-white rounded-xl font-medium hover:bg-[#b91c1c]"
            >
              Post Your First Job
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.is_active || job.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-600/20 text-zinc-400 border border-zinc-600/30'
                      }`}
                    >
                      {job.is_active || job.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Posted {formatDate(job.posted_at || job.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {job.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {job.applications_count || 0} applicants
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleJobStatus(job.id, job.is_active || job.status === 'active')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      job.is_active || job.status === 'active'
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    }`}
                  >
                    {job.is_active || job.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>

                  <Link
                    href={`/employer/jobs/${job.id}/edit`}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                  >
                    Edit
                  </Link>

                  <Link
                    href={`/jobs/${job.slug}`}
                    target="_blank"
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                  >
                    View
                  </Link>

                  {deleteConfirm === job.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(job.id)}
                      className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </EmployerLayout>
  );
}
