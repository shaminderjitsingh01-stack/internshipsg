'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { EmployerLayout } from '../components';
import { useAuth } from '@/context/AuthContext';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  careers_url: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string;
  is_verified: boolean;
}

const industrySuggestions = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'E-commerce',
  'Media & Entertainment',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Government',
  'Non-profit',
  'Real Estate',
  'Transportation',
  'Hospitality',
  'Other',
];

const companySizes = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001+',
];

export default function CompanyPageClient() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    careers_url: '',
    industry: '',
    size: '',
    location: '',
  });

  useEffect(() => {
    if (user) {
      fetchCompany();
    }
  }, [user]);

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/employer/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.company) {
          setCompany(data.company);
          setFormData({
            name: data.company.name || '',
            description: data.company.description || '',
            website: data.company.website || '',
            careers_url: data.company.careers_url || '',
            industry: data.company.industry || '',
            size: data.company.size || '',
            location: data.company.location || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/employer/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update company profile');
        return;
      }

      const updatedCompany = await res.json();
      setCompany(updatedCompany);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/employer/company/logo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to upload logo');
        return;
      }

      const data = await res.json();
      setCompany(prev => prev ? { ...prev, logo_url: data.logo_url } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <EmployerLayout title="Company Profile" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
        </div>
      </EmployerLayout>
    );
  }

  if (!company) {
    return (
      <EmployerLayout title="Company Profile" subtitle="Set up your company profile">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No company profile found</h3>
          <p className="text-zinc-400 mb-6">
            Create or claim your company profile to post jobs and attract candidates.
          </p>
          <Link
            href="/employer/claim"
            className="px-6 py-3 bg-[#dc2626] text-white rounded-xl font-medium hover:bg-[#b91c1c] transition-colors"
          >
            Claim or Create Company
          </Link>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout title="Company Profile" subtitle="Manage your company information">
      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-emerald-400">Company profile updated successfully!</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Logo Section */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Company Logo</h2>

            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden mb-4">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-zinc-500">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploadingLogo ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Logo
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-500 mt-2 text-center">
                Recommended: 400x400px, max 2MB
              </p>
            </div>

            {/* Verification Status */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex items-center gap-3">
                {company.is_verified ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-400 font-medium">Verified Company</p>
                      <p className="text-xs text-zinc-500">Your company is verified</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-yellow-400 font-medium">Pending Verification</p>
                      <p className="text-xs text-zinc-500">Verification in progress</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* View Public Profile */}
            <div className="mt-4">
              <Link
                href={`/companies/${company.slug}`}
                target="_blank"
                className="w-full px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Public Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Company Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Company Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell candidates about your company, culture, and mission..."
                  rows={5}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors resize-none"
                />
              </div>

              {/* Website & Careers URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://company.com"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Careers Page URL
                  </label>
                  <input
                    type="url"
                    name="careers_url"
                    value={formData.careers_url}
                    onChange={handleChange}
                    placeholder="https://company.com/careers"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>
              </div>

              {/* Industry & Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
                  >
                    <option value="">Select industry</option>
                    {industrySuggestions.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Company Size
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
                  >
                    <option value="">Select size</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size} employees
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Headquarters Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Singapore, Central Business District"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
        </div>
      </div>
    </EmployerLayout>
  );
}
