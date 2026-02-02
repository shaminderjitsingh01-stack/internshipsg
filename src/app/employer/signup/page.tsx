'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

export default function EmployerSignupPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    industry: '',
    website: '',
    size: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const industries = [
    'Technology',
    'Finance & Banking',
    'Healthcare',
    'E-commerce',
    'Consulting',
    'Manufacturing',
    'Media & Entertainment',
    'Education',
    'Logistics',
    'Real Estate',
    'Other',
  ];

  const companySizes = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.industry) {
      setError('Please select an industry');
      return false;
    }
    if (!formData.size) {
      setError('Please select company size');
      return false;
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      setError('Please enter a valid website URL (starting with http:// or https://)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sign up user
      const { error: signUpError } = await signUpWithEmail(formData.email, formData.password, formData.companyName);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Create company profile via API
      const res = await fetch('/api/employer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          email: formData.email,
          industry: formData.industry,
          website: formData.website,
          size: formData.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create company profile');
        return;
      }

      router.push('/employer/dashboard?welcome=true');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-lg">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#dc2626] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Register Your Company</h1>
            <p className="text-zinc-400 mt-2">Post internships and find top talent</p>
          </div>

          {/* Signup Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Company Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="hr@company.com"
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Industry *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
                >
                  <option value="">Select industry</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Company Size *
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
                  >
                    <option value="">Select size</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>{size} employees</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
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
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create Employer Account'
                )}
              </button>

              <p className="text-xs text-zinc-500 text-center">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-[#dc2626] hover:text-red-400">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#dc2626] hover:text-red-400">Privacy Policy</Link>
              </p>
            </form>

            <div className="mt-6 text-center">
              <p className="text-zinc-400">
                Already have an account?{' '}
                <Link href="/employer/login" className="text-[#dc2626] hover:text-red-400">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/employer/pricing" className="text-zinc-500 hover:text-zinc-300 text-sm">
                View pricing plans
              </Link>
            </div>
          </div>

          {/* Back to main site */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm">
              Back to internship.sg
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
