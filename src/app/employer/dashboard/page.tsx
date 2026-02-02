'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmployerLayout } from '../components';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplicants: number;
  totalViews: number;
  pendingReview: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'view' | 'job_posted';
  message: string;
  time: string;
}

interface RecentJob {
  id: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  applicants: number;
  posted_at: string;
}

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplicants: 0,
    totalViews: 0,
    pendingReview: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/employer/dashboard');
      if (res.ok) {
        const data = await res.json();

        const jobs = data.jobs || [];
        const applications = data.applications || [];

        setStats({
          totalJobs: jobs.length,
          activeJobs: jobs.filter((j: any) => j.status === 'active' || j.is_active).length,
          totalApplicants: applications.length,
          totalViews: jobs.reduce((sum: number, j: any) => sum + (j.views || 0), 0),
          pendingReview: applications.filter((a: any) => a.status === 'pending').length,
        });

        setRecentJobs(
          jobs.slice(0, 5).map((job: any) => ({
            id: job.id,
            title: job.title,
            slug: job.slug,
            status: job.status || (job.is_active ? 'active' : 'inactive'),
            views: job.views || 0,
            applicants: job.applications_count || 0,
            posted_at: job.posted_at || job.created_at,
          }))
        );

        // Generate recent activity from applications
        const activities: RecentActivity[] = applications.slice(0, 5).map((app: any) => ({
          id: app.id,
          type: 'application' as const,
          message: `New application for ${app.job?.title || 'a job'}`,
          time: formatTimeAgo(app.created_at),
        }));
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <EmployerLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout title="Dashboard" subtitle="Overview of your hiring activity">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{stats.totalJobs}</p>
              <p className="text-sm text-zinc-400">Total Jobs</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-emerald-400">{stats.activeJobs}</p>
              <p className="text-sm text-zinc-400">Active Jobs</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-400">{stats.totalApplicants}</p>
              <p className="text-sm text-zinc-400">Applicants</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-400">{stats.totalViews}</p>
              <p className="text-sm text-zinc-400">Total Views</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingReview}</p>
              <p className="text-sm text-zinc-400">Pending Review</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/employer/jobs/new"
            className="px-6 py-3 bg-[#dc2626] text-white font-medium rounded-xl hover:bg-[#b91c1c] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Job
          </Link>
          <Link
            href="/employer/applicants"
            className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Review Applicants
            {stats.pendingReview > 0 && (
              <span className="px-2 py-0.5 bg-[#dc2626] text-white text-xs rounded-full">
                {stats.pendingReview}
              </span>
            )}
          </Link>
          <Link
            href="/employer/company"
            className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Edit Company Profile
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Job Postings</h2>
            <Link href="/employer/jobs" className="text-[#dc2626] hover:text-red-400 text-sm">
              View All
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-4">No jobs posted yet</p>
              <Link
                href="/employer/jobs/new"
                className="px-4 py-2 bg-[#dc2626] text-white rounded-lg text-sm hover:bg-[#b91c1c]"
              >
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/employer/jobs/${job.id}/edit`}
                        className="font-medium text-white hover:text-[#dc2626] transition-colors"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {job.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {job.applicants} applicants
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-600/20 text-zinc-400'
                      }`}
                    >
                      {job.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activity.type === 'application'
                        ? 'bg-blue-500/10'
                        : activity.type === 'view'
                        ? 'bg-purple-500/10'
                        : 'bg-emerald-500/10'
                    }`}
                  >
                    {activity.type === 'application' ? (
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : activity.type === 'view' ? (
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-zinc-500 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
}
