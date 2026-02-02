'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerLayout } from '../components';
import { useAuth } from '@/context/AuthContext';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'account' | 'team' | 'notifications' | 'billing'>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Account settings
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Team management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    newApplications: true,
    applicationUpdates: true,
    weeklyDigest: true,
    marketingEmails: false,
  });

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/employer/team');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members || []);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/employer/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update password');
        return;
      }

      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviting(true);

    try {
      const res = await fetch('/api/employer/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send invitation');
        return;
      }

      setSuccess('Invitation sent successfully');
      setInviteEmail('');
      fetchTeamMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const res = await fetch(`/api/employer/team/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTeamMembers(members => members.filter(m => m.id !== memberId));
        setSuccess('Team member removed');
      }
    } catch (err) {
      setError('Failed to remove team member');
    }
  };

  const handleNotificationChange = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));

    try {
      await fetch('/api/employer/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });
    } catch (err) {
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    if (!confirm('This will delete all your job postings and company data. Are you absolutely sure?')) return;

    try {
      const res = await fetch('/api/employer/account', {
        method: 'DELETE',
      });

      if (res.ok) {
        await signOut();
        router.push('/');
      } else {
        setError('Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'team', label: 'Team' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'billing', label: 'Billing' },
  ];

  return (
    <EmployerLayout title="Settings" subtitle="Manage your account and preferences">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-emerald-400">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#dc2626] text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Email Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-2">Contact support to change your email address</p>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#dc2626] text-white font-medium rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Sign Out & Delete */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Session</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-3 bg-red-500/10 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Invite Team Member */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Invite Team Member</h2>
            <form onSubmit={handleInviteTeamMember} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#dc2626] transition-colors"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#dc2626] transition-colors"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="px-6 py-3 bg-[#dc2626] text-white font-medium rounded-xl hover:bg-[#b91c1c] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
            <div className="mt-4 text-sm text-zinc-500">
              <p><strong>Viewer:</strong> Can view jobs and applications</p>
              <p><strong>Editor:</strong> Can edit jobs and manage applications</p>
              <p><strong>Admin:</strong> Full access including team management</p>
            </div>
          </div>

          {/* Team Members List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Team Members</h2>

            {teamMembers.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">No team members yet. Invite colleagues to collaborate.</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#dc2626] to-red-700 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{member.name || member.email}</p>
                        <p className="text-sm text-zinc-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {member.status === 'pending' ? 'Pending' : member.role}
                      </span>
                      <button
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Email Notifications</h2>

          <div className="space-y-4">
            {[
              { key: 'newApplications', label: 'New Applications', description: 'Get notified when someone applies to your jobs' },
              { key: 'applicationUpdates', label: 'Application Updates', description: 'Updates when candidates respond or withdraw' },
              { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of your hiring activity every week' },
              { key: 'marketingEmails', label: 'Marketing Emails', description: 'Tips, product updates, and special offers' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-sm text-zinc-400">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={() => handleNotificationChange(item.key as keyof typeof notifications)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#dc2626]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-xl font-bold text-white">Free Plan</p>
                <p className="text-sm text-zinc-400">Up to 3 active job postings</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                Active
              </span>
            </div>
          </div>

          {/* Upgrade Options */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Upgrade Your Plan</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 bg-zinc-800/50 rounded-xl border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-2">Pro</h3>
                <p className="text-3xl font-bold text-white mb-1">
                  $49<span className="text-sm font-normal text-zinc-400">/month</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    10 active job postings
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Featured job listings
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced analytics
                  </li>
                </ul>
                <button className="w-full mt-6 px-4 py-2 bg-[#dc2626] text-white rounded-lg font-medium hover:bg-[#b91c1c] transition-colors">
                  Upgrade to Pro
                </button>
              </div>

              <div className="p-6 bg-zinc-800/50 rounded-xl border border-[#dc2626]">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">Enterprise</h3>
                  <span className="px-2 py-0.5 bg-[#dc2626] text-white text-xs rounded-full">Popular</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  $199<span className="text-sm font-normal text-zinc-400">/month</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited job postings
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Custom branding
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    API access
                  </li>
                </ul>
                <button className="w-full mt-6 px-4 py-2 bg-[#dc2626] text-white rounded-lg font-medium hover:bg-[#b91c1c] transition-colors">
                  Upgrade to Enterprise
                </button>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
            <p className="text-zinc-400 text-center py-8">No payment history available</p>
          </div>
        </div>
      )}
    </EmployerLayout>
  );
}
