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

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'applications' | 'settings'>('overview');
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
      // Fetch saved jobs and applications
      const [savedRes, appsRes] = await Promise.all([
        fetch(`/api/user/saved-jobs`),
        fetch(`/api/user/applications`),
      ]);

      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setSavedJobs(savedData.jobs || []);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
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
      case 'reviewed':
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
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-800 pb-4">
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'saved', label: 'Saved Jobs', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
              { id: 'applications', label: 'Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{savedJobs.length}</p>
                      <p className="text-zinc-400">Saved Jobs</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{applications.length}</p>
                      <p className="text-zinc-400">Applications</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {applications.filter(a => a.status === 'interview' || a.status === 'accepted').length}
                      </p>
                      <p className="text-zinc-400">Interviews</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Saved Jobs */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recent Saved Jobs</h2>
                    <button
                      onClick={() => setActiveTab('saved')}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View All
                    </button>
                  </div>

                  {savedJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-500">No saved jobs yet</p>
                      <Link href="/jobs" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">
                        Browse Jobs
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedJobs.slice(0, 3).map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.slug}`}
                          className="block p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold">
                                {job.company?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="min-w-0">
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
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recent Applications</h2>
                    <button
                      onClick={() => setActiveTab('applications')}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View All
                    </button>
                  </div>

                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-500">No applications yet</p>
                      <Link href="/jobs" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">
                        Start Applying
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="p-4 bg-zinc-800/50 rounded-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{app.job?.title}</p>
                              <p className="text-sm text-zinc-400">{app.job?.company?.name}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Saved Jobs</h2>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : savedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 mb-4">You haven't saved any jobs yet</p>
                  <Link
                    href="/jobs"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-6 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl text-white font-bold">
                              {job.company?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <Link href={`/jobs/${job.slug}`} className="font-semibold text-white hover:text-purple-400 transition-colors">
                              {job.title}
                            </Link>
                            <p className="text-zinc-400">{job.company?.name}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg">
                                {job.location}
                              </span>
                              {job.work_arrangement && job.work_arrangement !== 'onsite' && (
                                <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-lg capitalize">
                                  {job.work_arrangement}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors text-sm"
                          >
                            View
                          </Link>
                          <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">My Applications</h2>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 mb-4">You haven't applied to any jobs yet</p>
                  <Link
                    href="/jobs"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Find Internships
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-4 px-4 text-zinc-400 font-medium">Position</th>
                        <th className="text-left py-4 px-4 text-zinc-400 font-medium">Company</th>
                        <th className="text-left py-4 px-4 text-zinc-400 font-medium">Applied</th>
                        <th className="text-left py-4 px-4 text-zinc-400 font-medium">Status</th>
                        <th className="text-right py-4 px-4 text-zinc-400 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                          <td className="py-4 px-4">
                            <p className="font-medium text-white">{app.job?.title}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-zinc-400">{app.job?.company?.name}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-zinc-400">{formatDate(app.created_at)}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Link
                              href={`/jobs/${app.job?.slug}`}
                              className="text-purple-400 hover:text-purple-300 text-sm"
                            >
                              View Job
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-500 mt-2">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Member Since</label>
                    <input
                      type="text"
                      value={user.created_at ? formatDate(user.created_at) : 'N/A'}
                      disabled
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
                <p className="text-zinc-400 mb-6">
                  Once you sign out, you'll need to log in again to access your dashboard.
                </p>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
