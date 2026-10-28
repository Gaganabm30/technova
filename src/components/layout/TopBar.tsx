import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  Bell,
  HelpCircle,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';

import { api } from '../../api/client';
import { Organization } from '../../types';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenCreateTask: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onOpenCreateTask,
}) => {
  const { user, organization, switchOrganization, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, showToast } = useNotifications();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getOrganizations()
      .then(res => setAvailableOrgs(res.organizations || []))
      .catch(() => {});
  }, [organization?._id]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) {
        setShowOrgMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === organization?._id) {
      setShowOrgMenu(false);
      return;
    }
    try {
      await switchOrganization(orgId);
      showToast('Switched organization workspace', 'success');
      setShowOrgMenu(false);
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to switch organization', 'error');
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Workspace Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Organization & Date Pill with optional switcher */}
        <div className="relative" ref={orgRef}>
          {availableOrgs.length > 1 ? (
            <button
              type="button"
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer group"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-slate-800 font-semibold max-w-[140px] truncate">
                {organization?.name || 'TechNova Workspace'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
              <span className="text-slate-300">|</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-slate-800 font-semibold max-w-[150px] truncate">
                {organization?.name || 'TechNova Workspace'}
              </span>
              <span className="text-slate-300">|</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>
          )}

          {/* Org Switcher Menu */}
          {showOrgMenu && availableOrgs.length > 1 && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-1">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Organization Workspace
              </div>
              {availableOrgs.map(org => {
                const isSelected = org._id === organization?._id;
                return (
                  <button
                    key={org._id}
                    type="button"
                    onClick={() => handleSwitchOrg(org._id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate">{org.name}</p>
                      <span className="text-[10px] text-slate-400 font-normal">{org.industry || 'Organization'}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Global Search Input trigger */}
      <button
        onClick={onOpenSearch}
        className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200/60 text-xs text-slate-400 hover:text-slate-600 transition-all cursor-pointer group shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          <span className="font-normal">Search tasks, projects, employees...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Right Actions: Create Task, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenSearch}
          className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Primary CTA: Create Task */}
        <button
          onClick={onOpenCreateTask}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No notifications right now
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div
                      key={n._id}
                      onClick={() => {
                        markAsRead(n._id);
                        if (n.link) navigate(n.link);
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                        !n.read ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'task' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        {n.type === 'ai' && <Info className="w-4 h-4 text-indigo-600" />}
                        {n.type !== 'task' && n.type !== 'warning' && n.type !== 'ai' && (
                          <Bell className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 inline-block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="User menu"
          >
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
              />
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="mt-1.5 inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                  {user?.role.toUpperCase()}
                </span>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate(user ? `/team/${user._id}` : '/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/productivity');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  My Productivity Score
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Account Settings
                </button>
              </div>
              <div className="p-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
