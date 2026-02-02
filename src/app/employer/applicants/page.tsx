'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmployerLayout } from '../components';
import { useAuth } from '@/context/AuthContext';

interface Application {
  id: string;
  status: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  resume_url?: string;
  cover_letter?: string;
  phone?: string;
  linkedin_url?: string;
  job: {
    id: string;
    title: string;
    slug: string;
  };
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export default function ApplicantsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/employer/dashboard');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setJobs(data.jobs?.map((j: any) => ({ id: j.id, title: j.title })) || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/employer/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setApplications(apps =>
          apps.map(app =>
            app.id === appId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredApplications = applications.filter(app => {
    const statusMatch = filter === 'all' || app.status === filter;
    const jobMatch = jobFilter === 'all' || app.job?.id === jobFilter;
    return statusMatch && jobMatch;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <EmployerLayout title="Applicants" subtitle="Review applications from candidates">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout
      title="Applicants"
      subtitle={`${applications.length} total applications${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}`}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#dc2626] text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            All ({applications.length})
          </button>
          {statusOptions.map((status) => {
            const count = applications.filter(a => a.status === status.value).length;
            if (count === 0) return null;
            return (
              <button
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status.value
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {status.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Job Filter */}
        {jobs.length > 1 && (
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#dc2626]"
          >
            <option value="all">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No applications found</h3>
          <p className="text-zinc-400">
            {filter === 'all' && jobFilter === 'all'
              ? 'No one has applied to your jobs yet.'
              : 'No applications match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#dc2626] to-red-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-lg">
                        {(app.user_name || app.user_email || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white">
                          {app.user_name || app.user_email || 'Anonymous Applicant'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        Applied for <span className="text-white">{app.job?.title}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{formatDate(app.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Status Actions */}
                    <select
                      value={app.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(app.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#dc2626]"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>

                    {/* Expand Icon */}
                    <svg
                      className={`w-5 h-5 text-zinc-400 transition-transform ${expandedApp === app.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedApp === app.id && (
                <div className="px-6 pb-6 border-t border-zinc-800 pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Contact Info */}
                    <div>
                      <h4 className="text-sm font-medium text-zinc-300 mb-3">Contact Information</h4>
                      <div className="space-y-2">
                        {app.user_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${app.user_email}`} className="text-zinc-300 hover:text-white">
                              {app.user_email}
                            </a>
                          </div>
                        )}
                        {app.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${app.phone}`} className="text-zinc-300 hover:text-white">
                              {app.phone}
                            </a>
                          </div>
                        )}
                        {app.linkedin_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white">
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                        {app.resume_url && (
                          <div className="flex items-center gap-2 text-sm mt-3">
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cover Letter */}
                    {app.cover_letter && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-300 mb-3">Cover Letter</h4>
                        <p className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-4 whitespace-pre-wrap">
                          {app.cover_letter}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => updateStatus(app.id, 'reviewed')}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, 'interview')}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, 'accepted')}
                      className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, 'rejected')}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </EmployerLayout>
  );
}
