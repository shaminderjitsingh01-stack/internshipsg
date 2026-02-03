'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';

export default function DashboardSettingsPageClient() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard/settings');
    }
  }, [user, loading, router]);

  const handleExportData = async () => {
    setExporting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/export-data');
      if (!res.ok) throw new Error('Failed to export data');

      const data = await res.json();

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `internship-sg-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Your data has been exported successfully.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to export data' });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    setDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');

      await signOut();
      router.push('/?deleted=true');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Settings</h1>
              <p className="text-[var(--muted)] mt-1">Manage your account and privacy</p>
            </div>
            <Link href="/dashboard" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              Back to Dashboard
            </Link>
          </div>

          {/* Account Info */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Email</label>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Account Created</label>
                <p className="text-white">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-SG', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Data (PDPA Compliance) */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Privacy & Data Rights</h2>
            <p className="text-[var(--muted)] text-sm mb-6">
              Under Singapore's PDPA, you have the right to access, correct, and delete your personal data.
            </p>

            <div className="space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Export Your Data</p>
                  <p className="text-[var(--muted)] text-sm">Download all your personal data in JSON format</p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 disabled:opacity-50"
                >
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
              </div>

              {/* Privacy Policy */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Privacy Policy</p>
                  <p className="text-[var(--muted)] text-sm">Read how we handle your personal data</p>
                </div>
                <Link
                  href="/privacy"
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                >
                  View
                </Link>
              </div>

              {/* Cookie Preferences */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Cookie Preferences</p>
                  <p className="text-[var(--muted)] text-sm">Manage your cookie consent settings</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('cookie_consent');
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-[var(--muted)] text-sm mb-6">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-[var(--foreground)]">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside text-[var(--muted)] text-sm space-y-1">
                  <li>Your profile and personal information</li>
                  <li>All saved jobs and applications</li>
                  <li>Your resume and uploaded files</li>
                </ul>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">
                    Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== 'DELETE'}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mt-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>{message.text}</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
