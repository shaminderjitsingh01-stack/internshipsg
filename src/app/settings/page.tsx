'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const supabase = getSupabase();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    email_job_alerts: true,
    email_application_updates: true,
    email_marketing: false,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Message state
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchNotificationPreferences();
    }
  }, [user]);

  const fetchNotificationPreferences = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile?.notification_preferences) {
          setNotifications(data.profile.notification_preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setChangingPassword(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    setSavingNotifications(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: newNotifications }),
      });

      if (!res.ok) throw new Error('Failed to save preferences');
    } catch (error) {
      // Revert on error
      setNotifications(notifications);
      setMessage({ type: 'error', text: 'Failed to save notification preferences' });
    } finally {
      setSavingNotifications(false);
    }
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'long',
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Account Settings</h1>
              <p className="text-zinc-400 mt-1">Manage your account and privacy</p>
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

          {/* Account Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Account Created</label>
                <p className="text-white">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="px-6 py-3 bg-[#dc2626] text-white font-medium rounded-xl hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-white font-medium">Job Alert Emails</p>
                  <p className="text-sm text-zinc-400">Receive emails when new jobs match your alerts</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifications.email_job_alerts}
                    onChange={(e) => handleNotificationChange('email_job_alerts', e.target.checked)}
                    disabled={savingNotifications}
                    className="sr-only"
                  />
                  <div className={`w-14 h-8 rounded-full transition-colors ${notifications.email_job_alerts ? 'bg-[#dc2626]' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${notifications.email_job_alerts ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-white font-medium">Application Updates</p>
                  <p className="text-sm text-zinc-400">Receive emails when your application status changes</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifications.email_application_updates}
                    onChange={(e) => handleNotificationChange('email_application_updates', e.target.checked)}
                    disabled={savingNotifications}
                    className="sr-only"
                  />
                  <div className={`w-14 h-8 rounded-full transition-colors ${notifications.email_application_updates ? 'bg-[#dc2626]' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${notifications.email_application_updates ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-white font-medium">Marketing Emails</p>
                  <p className="text-sm text-zinc-400">Receive tips, career advice, and platform updates</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifications.email_marketing}
                    onChange={(e) => handleNotificationChange('email_marketing', e.target.checked)}
                    disabled={savingNotifications}
                    className="sr-only"
                  />
                  <div className={`w-14 h-8 rounded-full transition-colors ${notifications.email_marketing ? 'bg-[#dc2626]' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${notifications.email_marketing ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Privacy & Data</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Under Singapore's PDPA, you have the right to access, correct, and delete your personal data.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="text-white font-medium">Export Your Data</p>
                  <p className="text-zinc-400 text-sm">Download all your personal data in JSON format</p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 transition-colors"
                >
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="text-white font-medium">Privacy Policy</p>
                  <p className="text-zinc-400 text-sm">Read how we handle your personal data</p>
                </div>
                <Link
                  href="/privacy"
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  View
                </Link>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-300">This will permanently delete:</p>
                <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
                  <li>Your profile and personal information</li>
                  <li>All saved jobs and applications</li>
                  <li>Your resume and uploaded files</li>
                  <li>All job alerts and preferences</li>
                </ul>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== 'DELETE'}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
