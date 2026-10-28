import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../api/client';
import {
  User,
  Shield,
  Building,
  Bell,
  Palette,
  Key,
  LogOut,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'organization' | 'notifications' | 'appearance'>('profile');

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Organization
  const [orgName, setOrgName] = useState('TechNova Solutions India');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [workHours, setWorkHours] = useState(8);

  // Demo reset
  const [resettingDemo, setResettingDemo] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await api.updateProfile(user._id, {
        name,
        jobTitle,
        bio,
        phone,
      });
      showToast('Profile updated successfully', 'success');
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      showToast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSavingPassword(false);
    }, 600);
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all tasks, projects, and activities back to the initial demo seed data?')) {
      return;
    }
    setResettingDemo(true);
    try {
      await api.resetDemoData();
      showToast('Demo data reset to pristine state', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      showToast('Failed to reset demo data', 'error');
      setResettingDemo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal employee profile, authentication credentials, and workspace preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'security', label: 'Security & Auth', icon: Key },
            { id: 'organization', label: 'Organization & Workspace', icon: Building },
            { id: 'notifications', label: 'Notification Preferences', icon: Bell },
            { id: 'appearance', label: 'Interface Appearance', icon: Palette },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleResetDemoData}
              disabled={resettingDemo}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors text-left"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{resettingDemo ? 'Resetting...' : 'Reset Demo Data'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panes */}
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                <p className="text-xs text-slate-500">Your details visible to team members across the workspace</p>
              </div>

              {/* Avatar Preview */}
              <div className="flex items-center gap-4">
                <img
                  src={user?.avatar}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{user?.name}</h4>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                    {user?.role.toUpperCase()} · {user?.department}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security &amp; Password</h3>
                <p className="text-xs text-slate-500">Update your workspace password and manage active sessions</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full max-w-sm px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {savingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-1">Active Sessions</h4>
                <p className="text-xs text-slate-500 mb-3">Logout from all active browsers and mobile clients</p>
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                >
                  Logout of All Devices
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Organization */}
          {activeTab === 'organization' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Organization &amp; Workspace</h3>
                <p className="text-xs text-slate-500">Configure corporate operating schedule and timezones</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Domain</label>
                  <input
                    type="text"
                    disabled
                    value="technova.io"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Hours per Day</label>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    value={workHours}
                    onChange={e => setWorkHours(parseInt(e.target.value) || 8)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast('Organization settings updated', 'success')}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
                >
                  Save Workspace Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification Preferences</h3>
                <p className="text-xs text-slate-500">Configure what updates trigger alerts</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { title: 'Task Assignments', desc: 'When you are assigned a new work ticket or deliverable', def: true },
                  { title: 'Status Transitions', desc: 'When tasks in your projects are moved to In Review or Completed', def: true },
                  { title: 'AI Workload Imbalance Alerts', desc: 'When AI identifies team capacity or burnout risks', def: true },
                  { title: 'Sprint Milestone Reminders', desc: '48 hours before project phase deadlines', def: true },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/60 transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked={item.def} className="w-4 h-4 text-indigo-600 rounded mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Interface Appearance</h3>
                <p className="text-xs text-slate-500">Theme and contrast settings</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl border-2 border-indigo-600 bg-white flex flex-col items-center justify-center gap-2 cursor-pointer shadow-xs">
                  <div className="w-full h-8 bg-slate-100 rounded-lg flex items-center px-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Enterprise Light (Active)</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white flex flex-col items-center justify-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                  <div className="w-full h-8 bg-slate-800 rounded-lg flex items-center px-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <span className="text-xs font-bold">Deep Charcoal (Available)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
