'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

interface Job {
  id: string;
  title: string;
  slug: string;
  location: string;
  is_active: boolean;
  created_at: string;
  applications_count?: number;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  is_verified: boolean;
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  user_email?: string;
  resume_url?: string;
  cover_letter?: string;
  job: {
    id: string;
    title: string;
  };
}

export default function EmployerDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';

  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applications' | 'company' | 'post'>('overview');
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(isWelcome);

  // New job form
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    location: 'Singapore',
    work_arrangement: 'onsite',
    duration: '',
    salary_min: '',
    salary_max: '',
    application_url: '',
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/employer/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchEmployerData();
    }
  }, [user]);

  const fetchEmployerData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/employer/dashboard');
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setJobs(data.jobs || []);
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching employer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError('');
    setPosting(true);

    try {
      const res = await fetch('/api/employer/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newJob,
          requirements: newJob.requirements.split('\n').filter(r => r.trim()),
          salary_min: newJob.salary_min ? parseInt(newJob.salary_min) : null,
          salary_max: newJob.salary_max ? parseInt(newJob.salary_max) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPostError(data.error || 'Failed to post job');
        return;
      }

      setPostSuccess(true);
      setNewJob({
        title: '',
        description: '',
        requirements: '',
        location: 'Singapore',
        work_arrangement: 'onsite',
        duration: '',
        salary_min: '',
        salary_max: '',
        application_url: '',
      });
      fetchEmployerData();
      setTimeout(() => {
        setPostSuccess(false);
        setActiveTab('jobs');
      }, 2000);
    } catch (error: any) {
      setPostError(error.message || 'Failed to post job');
    } finally {
      setPosting(false);
    }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    try {
      await fetch(`/api/employer/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchEmployerData();
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      fetchEmployerData();
    } catch (error) {
      console.error('Error toggling job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'interview': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'accepted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Modal */}
          {showWelcome && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md mx-4 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to internship.sg!</h2>
                <p className="text-zinc-400 mb-6">Your employer account has been created. Start posting internships to find top talent.</p>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {company?.name || 'Employer Dashboard'}
              </h1>
              <p className="text-zinc-400 mt-1">
                {company?.is_verified ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Company
                  </span>
                ) : (
                  'Manage your job postings and applications'
                )}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-800 pb-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'post', label: 'Post Job' },
              { id: 'jobs', label: 'My Jobs' },
              { id: 'applications', label: 'Applications' },
              { id: 'company', label: 'Company Profile' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {tab.label}
                {tab.id === 'applications' && applications.filter(a => a.status === 'pending').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {applications.filter(a => a.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <p className="text-3xl font-bold text-white">{jobs.length}</p>
                  <p className="text-zinc-400">Total Jobs</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <p className="text-3xl font-bold text-emerald-400">{jobs.filter(j => j.is_active).length}</p>
                  <p className="text-zinc-400">Active Jobs</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <p className="text-3xl font-bold text-purple-400">{applications.length}</p>
                  <p className="text-zinc-400">Applications</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <p className="text-3xl font-bold text-yellow-400">{applications.filter(a => a.status === 'pending').length}</p>
                  <p className="text-zinc-400">Pending Review</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveTab('post')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90"
                  >
                    Post New Job
                  </button>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700"
                  >
                    Review Applications
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'post' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Post New Internship</h2>

              {postSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xl text-white">Job posted successfully!</p>
                </div>
              ) : (
                <form onSubmit={handlePostJob} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      placeholder="e.g. Software Engineering Intern"
                      required
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Description *</label>
                    <textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Describe the role, responsibilities, and what interns will learn..."
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Requirements (one per line)</label>
                    <textarea
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                      placeholder="Currently pursuing Computer Science degree&#10;Proficient in Python or JavaScript&#10;Strong communication skills"
                      rows={4}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Location</label>
                      <input
                        type="text"
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        placeholder="Singapore"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Work Arrangement</label>
                      <select
                        value={newJob.work_arrangement}
                        onChange={(e) => setNewJob({ ...newJob, work_arrangement: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="onsite">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Duration</label>
                      <input
                        type="text"
                        value={newJob.duration}
                        onChange={(e) => setNewJob({ ...newJob, duration: e.target.value })}
                        placeholder="e.g. 3 months"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Min Salary (SGD/month)</label>
                      <input
                        type="number"
                        value={newJob.salary_min}
                        onChange={(e) => setNewJob({ ...newJob, salary_min: e.target.value })}
                        placeholder="e.g. 1000"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Max Salary (SGD/month)</label>
                      <input
                        type="number"
                        value={newJob.salary_max}
                        onChange={(e) => setNewJob({ ...newJob, salary_max: e.target.value })}
                        placeholder="e.g. 2000"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Application URL</label>
                    <input
                      type="url"
                      value={newJob.application_url}
                      onChange={(e) => setNewJob({ ...newJob, application_url: e.target.value })}
                      placeholder="https://company.com/apply"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Leave empty to receive applications through internship.sg</p>
                  </div>

                  {postError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-red-400 text-sm">{postError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={posting}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
                  >
                    {posting ? 'Posting...' : 'Post Internship'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">My Job Postings</h2>

              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400 mb-4">No jobs posted yet</p>
                  <button
                    onClick={() => setActiveTab('post')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl"
                  >
                    Post Your First Job
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-6 bg-zinc-800/50 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{job.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${job.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-600/20 text-zinc-400'}`}>
                            {job.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">{job.location} | Posted {formatDate(job.created_at)}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleJobStatus(job.id, job.is_active)}
                          className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 text-sm"
                        >
                          {job.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link
                          href={`/jobs/${job.slug}`}
                          className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Applications</h2>

              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="p-6 bg-zinc-800/50 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white">{app.user_email || 'Applicant'}</p>
                          <p className="text-sm text-zinc-400">Applied for: {app.job?.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">{formatDate(app.created_at)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      {app.cover_letter && (
                        <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
                          <p className="text-sm text-zinc-400">{app.cover_letter}</p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                          className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'interview')}
                          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30"
                        >
                          Schedule Interview
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'accepted')}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'company' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Company Profile</h2>

              {company ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-3xl text-white font-bold">{company.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{company.name}</h3>
                      <p className="text-zinc-400">{company.industry}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Company Size</label>
                      <p className="text-white">{company.size || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Website</label>
                      <p className="text-white">{company.website || 'Not specified'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Description</label>
                    <p className="text-zinc-300">{company.description || 'No description added'}</p>
                  </div>

                  <Link
                    href={`/companies/${company.slug}`}
                    className="inline-block px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700"
                  >
                    View Public Profile
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-400 mb-4">Company profile not set up</p>
                  <Link
                    href="/employer/claim"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl"
                  >
                    Claim or Create Company
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
