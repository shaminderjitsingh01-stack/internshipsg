'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  headline: string;
  bio: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  resume_url: string;
  skills: string[];
  education: string;
  university: string;
  graduation_year: string;
  is_visible: boolean;
  is_open_to_work: boolean;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    headline: '',
    bio: '',
    location: 'Singapore',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    resume_url: '',
    skills: [],
    education: '',
    university: '',
    graduation_year: '',
    is_visible: true,
    is_open_to_work: true,
  });
  const [skillInput, setSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile({ ...profile, ...data.profile, email: user?.email || '' });
        } else {
          setProfile({ ...profile, email: user?.email || '' });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setProfile({ ...profile, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only PDF and Word documents are allowed' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/user/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      setProfile({ ...profile, resume_url: data.url });
      setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
              <p className="text-zinc-400 mt-1">Complete your profile to stand out to employers</p>
            </div>
            <Link
              href="/dashboard"
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Basic Information</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="+65 9123 4567"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={profile.location}
                      onChange={handleChange}
                      placeholder="Singapore"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Headline</label>
                  <input
                    type="text"
                    name="headline"
                    value={profile.headline}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science Student at NUS"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder="Tell employers about yourself..."
                    rows={4}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Education</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">University</label>
                  <select
                    name="university"
                    value={profile.university}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
                  >
                    <option value="">Select university</option>
                    <option value="NUS">National University of Singapore (NUS)</option>
                    <option value="NTU">Nanyang Technological University (NTU)</option>
                    <option value="SMU">Singapore Management University (SMU)</option>
                    <option value="SUTD">Singapore University of Technology and Design (SUTD)</option>
                    <option value="SIT">Singapore Institute of Technology (SIT)</option>
                    <option value="SUSS">Singapore University of Social Sciences (SUSS)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Degree/Major</label>
                    <input
                      type="text"
                      name="education"
                      value={profile.education}
                      onChange={handleChange}
                      placeholder="e.g., BSc Computer Science"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Expected Graduation</label>
                    <input
                      type="text"
                      name="graduation_year"
                      value={profile.graduation_year}
                      onChange={handleChange}
                      placeholder="e.g., 2026"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Skills</h2>

              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill (e.g., Python, React, Data Analysis)"
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-6 py-3 bg-[#dc2626]/20 text-[#dc2626] rounded-xl hover:bg-[#dc2626]/30 transition-colors font-medium"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.skills.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No skills added yet</p>
                ) : (
                  profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg flex items-center gap-2 border border-zinc-700"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-zinc-500 hover:text-[#dc2626] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Resume Upload */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Resume</h2>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />

              {profile.resume_url ? (
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#dc2626]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Resume uploaded</p>
                      <p className="text-sm text-zinc-400">Click to replace</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                  >
                    {uploading ? 'Uploading...' : 'Replace'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full p-8 border-2 border-dashed border-zinc-700 rounded-xl text-center hover:border-[#dc2626]/50 transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-zinc-400">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <svg className="w-12 h-12 mx-auto text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-zinc-400">Click to upload your resume</p>
                      <p className="text-sm text-zinc-500 mt-1">PDF or Word, max 5MB</p>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Links */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Links</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={profile.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">GitHub</label>
                  <input
                    type="url"
                    name="github_url"
                    value={profile.github_url}
                    onChange={handleChange}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Portfolio Website</label>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={profile.portfolio_url}
                    onChange={handleChange}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>{message.text}</p>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
