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
  salary_min?: number;
  salary_max?: number;
  work_arrangement?: string;
  company?: {
    name: string;
    slug: string;
    logo_url?: string;
  };
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  job: Job;
}

interface JobAlert {
  id: string;
  name: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch saved jobs, applications, and alerts in parallel
      const [savedRes, appsRes, alertsRes] = await Promise.all([
        fetch(`/api/user/saved-jobs`),
        fetch(`/api/user/applications`),
        fetch(`/api/user/job-alerts`),
      ]);

      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setSavedJobs(savedData.jobs || []);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setJobAlerts(alertsData.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'viewed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'interview':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'accepted':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-zinc-400">Manage your internship applications and saved jobs</p>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link
              href="/profile"
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#dc2626]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-zinc-300 group-hover:text-white transition-colors">Edit Profile</span>
            </Link>
            <Link
              href="/saved"
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#dc2626]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <span className="text-zinc-300 group-hover:text-white transition-colors">Saved Jobs</span>
            </Link>
            <Link
              href="/applications"
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#dc2626]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-zinc-300 group-hover:text-white transition-colors">Applications</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#dc2626]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-zinc-300 group-hover:text-white transition-colors">Settings</span>
            </Link>
          </div>

          {/* Stats Cards */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link href="/saved" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#dc2626]/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{savedJobs.length}</p>
                      <p className="text-zinc-400">Saved Jobs</p>
                    </div>
                  </div>
                </Link>

                <Link href="/applications" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{applications.length}</p>
                      <p className="text-zinc-400">Applications</p>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/alerts" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{jobAlerts.filter(a => a.is_active).length}</p>
                      <p className="text-zinc-400">Active Job Alerts</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Saved Jobs */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Saved Jobs</h2>
                    <Link
                      href="/saved"
                      className="text-[#dc2626] hover:text-[#b91c1c] text-sm font-medium"
                    >
                      View All
                    </Link>
                  </div>

                  {savedJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <p className="text-zinc-500 mb-3">No saved jobs yet</p>
                      <Link href="/" className="text-[#dc2626] hover:text-[#b91c1c] text-sm font-medium">
                        Browse Internships
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedJobs.slice(0, 4).map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.slug}`}
                          className="block p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#dc2626] to-[#991b1b] flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold">
                                {job.company?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{job.title}</p>
                              <p className="text-sm text-zinc-400 truncate">{job.company?.name}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Applications */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recent Applications</h2>
                    <Link
                      href="/applications"
                      className="text-[#dc2626] hover:text-[#b91c1c] text-sm font-medium"
                    >
                      View All
                    </Link>
                  </div>

                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-zinc-500 mb-3">No applications yet</p>
                      <Link href="/" className="text-[#dc2626] hover:text-[#b91c1c] text-sm font-medium">
                        Start Applying
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 4).map((app) => (
                        <div
                          key={app.id}
                          className="p-4 bg-zinc-800/50 rounded-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{app.job?.title}</p>
                              <p className="text-sm text-zinc-400">{app.job?.company?.name}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Sign Out Section */}
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">
                Signed in as <span className="text-white">{user.email}</span>
              </p>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
