'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

interface JobAlert {
  id: string;
  name: string;
  keywords: string[];
  industries: string[];
  locations: string[];
  work_arrangements: string[];
  frequency: string;
  is_active: boolean;
  created_at: string;
}

const industries = [
  'Technology',
  'Fintech',
  'Banking & Finance',
  'E-commerce',
  'Healthcare',
  'Media',
  'Consulting',
  'Manufacturing',
];

const locations = [
  'Singapore',
  'Central',
  'East',
  'West',
  'North',
  'Remote',
];

const workArrangements = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const frequencies = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
];

export default function JobAlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    industries: [] as string[],
    locations: [] as string[],
    work_arrangements: [] as string[],
    frequency: 'daily',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/user/job-alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/user/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
          industries: formData.industries,
          locations: formData.locations,
          work_arrangements: formData.work_arrangements,
          frequency: formData.frequency,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          keywords: '',
          industries: [],
          locations: [],
          work_arrangements: [],
          frequency: 'daily',
        });
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAlert(id: string, isActive: boolean) {
    try {
      await fetch('/api/user/job-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  }

  async function deleteAlert(id: string) {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await fetch(`/api/user/job-alerts?id=${id}`, { method: 'DELETE' });
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  }

  function toggleArrayItem(arr: string[], item: string, setter: (arr: string[]) => void) {
    if (arr.includes(item)) {
      setter(arr.filter(i => i !== item));
    } else {
      setter([...arr, item]);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Job Alerts</h1>
              <p className="text-[var(--muted)] mt-1">
                Get notified when new internships match your criteria
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors"
            >
              Create Alert
            </button>
          </div>

          {/* Create Alert Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-[var(--card)] rounded-2xl border border-[var(--border)]"
            >
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Create New Alert</h2>
              <form onSubmit={createAlert} className="space-y-6">
                {/* Alert Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                    Alert Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Software Engineering Internships"
                    required
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                    Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="e.g., python, react, data science"
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                {/* Industries */}
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                    Industries
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => toggleArrayItem(
                          formData.industries,
                          industry,
                          (arr) => setFormData({ ...formData, industries: arr })
                        )}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          formData.industries.includes(industry)
                            ? 'bg-[#dc2626] text-white'
                            : 'bg-[var(--background)] text-[var(--muted)] border border-[var(--border)] hover:border-[#dc2626]/50'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                    Locations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onClick={() => toggleArrayItem(
                          formData.locations,
                          location,
                          (arr) => setFormData({ ...formData, locations: arr })
                        )}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          formData.locations.includes(location)
                            ? 'bg-[#dc2626] text-white'
                            : 'bg-[var(--background)] text-[var(--muted)] border border-[var(--border)] hover:border-[#dc2626]/50'
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work Arrangement */}
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                    Work Arrangement
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {workArrangements.map((arr) => (
                      <button
                        key={arr.value}
                        type="button"
                        onClick={() => toggleArrayItem(
                          formData.work_arrangements,
                          arr.value,
                          (items) => setFormData({ ...formData, work_arrangements: items })
                        )}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          formData.work_arrangements.includes(arr.value)
                            ? 'bg-[#dc2626] text-white'
                            : 'bg-[var(--background)] text-[var(--muted)] border border-[var(--border)] hover:border-[#dc2626]/50'
                        }`}
                      >
                        {arr.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                    Notification Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#dc2626]"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Alert'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Alerts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
              <svg
                className="w-16 h-16 mx-auto text-[var(--muted)] mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                No job alerts yet
              </h3>
              <p className="text-[var(--muted)] mb-4">
                Create your first alert to get notified about matching internships
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-colors"
              >
                Create Your First Alert
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-[var(--card)] rounded-2xl border border-[var(--border)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                          {alert.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            alert.is_active
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {alert.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {alert.keywords?.map((keyword) => (
                          <span
                            key={keyword}
                            className="px-2 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                        {alert.industries?.map((industry) => (
                          <span
                            key={industry}
                            className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-full"
                          >
                            {industry}
                          </span>
                        ))}
                        {alert.locations?.map((location) => (
                          <span
                            key={location}
                            className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 rounded-full"
                          >
                            {location}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-[var(--muted)]">
                        {alert.frequency === 'instant' ? 'Instant notifications' :
                         alert.frequency === 'daily' ? 'Daily digest' : 'Weekly digest'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAlert(alert.id, alert.is_active)}
                        className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        title={alert.is_active ? 'Pause alert' : 'Resume alert'}
                      >
                        {alert.is_active ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-[var(--muted)] hover:text-red-500 transition-colors"
                        title="Delete alert"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
