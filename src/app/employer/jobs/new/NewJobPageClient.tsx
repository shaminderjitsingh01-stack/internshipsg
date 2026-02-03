'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployerLayout } from '../../components';

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
}

export default function NewJobPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: 'Singapore',
    work_arrangement: 'onsite',
    duration: '',
    salary_min: '',
    salary_max: '',
    salary_period: 'monthly',
    start_date: '',
    application_url: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/employer/jobs', {
        method: 'POST',
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
        setError(data.error || 'Failed to create job posting');
        return;
      }

      router.push('/employer/jobs?created=true');
    } catch (err: any) {
      setError(err.message || 'Failed to create job posting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployerLayout title="Post New Internship" subtitle="Create a new job listing to attract top talent">
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-6">
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
              placeholder="Describe the role, responsibilities, what interns will learn, team culture..."
              required
              rows={6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">Markdown formatting is supported</p>
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
              placeholder="Currently pursuing Computer Science degree&#10;Proficient in Python or JavaScript&#10;Strong communication skills&#10;(One requirement per line)"
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
                  placeholder="Min (e.g. 800)"
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
                  placeholder="Max (e.g. 1500)"
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
            <p className="text-xs text-zinc-500 mt-1">Leave blank if salary is not disclosed</p>
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
            <p className="text-xs text-zinc-500 mt-1">
              Leave empty to receive applications through internship.sg
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-zinc-800">
            <Link
              href="/employer/jobs"
              className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Internship
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </EmployerLayout>
  );
}
