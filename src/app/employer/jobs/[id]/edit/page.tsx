'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { EmployerLayout } from '../../../components';
import { useAuth } from '@/context/AuthContext';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  work_arrangement: string;
  duration: string;
  salary_min: string;
  salary_max: string;
  salary_period: string;
  start_date: string;
  application_url: string;
  is_active: boolean;
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    work_arrangement: 'onsite',
    duration: '',
    salary_min: '',
    salary_max: '',
    salary_period: 'monthly',
    start_date: '',
    application_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (user && jobId) {
      fetchJob();
    }
  }, [user, jobId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`);
      if (!res.ok) {
        router.push('/employer/jobs');
        return;
      }

      const job = await res.json();
      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: Array.isArray(job.requirements)
          ? job.requirements.join('\n')
          : job.requirements || '',
        location: job.location || '',
        work_arrangement: job.work_arrangement || 'onsite',
        duration: job.duration || '',
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        salary_period: job.salary_period || 'monthly',
        start_date: job.start_date?.split('T')[0] || '',
        application_url: job.application_url || '',
        is_active: job.is_active ?? job.status === 'active',
      });
    } catch (err) {
      console.error('Error fetching job:', err);
      router.push('/employer/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update job posting');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update job posting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <EmployerLayout title="Edit Job" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout title="Edit Job Posting" subtitle="Update your internship listing">
      <form onSubmit={handleSubmit} className="max-w-3xl">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-emerald-400">Job posting updated successfully!</p>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
            <div>
              <p className="font-medium text-white">Job Status</p>
              <p className="text-sm text-zinc-400">
                {formData.is_active ? 'This job is visible to candidates' : 'This job is hidden from candidates'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Job Title <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Software Engineering Intern"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Job Description <span className="text-[#dc2626]">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role, responsibilities, what interns will learn..."
              required
              rows={6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors resize-none"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="One requirement per line"
              rows={5}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">Enter each requirement on a new line</p>
          </div>

          {/* Location & Work Arrangement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Location <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Singapore, Central"
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Work Arrangement
              </label>
              <select
                name="work_arrangement"
                value={formData.work_arrangement}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
              >
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Duration & Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 3 months, 6 months"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
              />
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Salary Range (SGD)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleChange}
                  placeholder="Min"
                  min="0"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleChange}
                  placeholder="Max"
                  min="0"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>
              <div>
                <select
                  name="salary_period"
                  value={formData.salary_period}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
                >
                  <option value="monthly">Per Month</option>
                  <option value="hourly">Per Hour</option>
                  <option value="total">Total</option>
                </select>
              </div>
            </div>
          </div>

          {/* Application URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Application URL
            </label>
            <input
              type="url"
              name="application_url"
              value={formData.application_url}
              onChange={handleChange}
              placeholder="https://company.com/careers/apply"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <Link
              href="/employer/jobs"
              className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              Back to Jobs
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>
    </EmployerLayout>
  );
}
