import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { NotificationItem, ActivityItem } from '../types';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  Calendar,
  History,
  ArrowRight,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'tasks' | 'ai'>('all');

  useEffect(() => {
    api.getActivities(40).then(res => setActivities(res.activities));
  }, []);

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'tasks') return n.type === 'task';
    if (filter === 'ai') return n.type === 'ai';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Notification Center &amp; Activity Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System announcements, sprint assignments, dependency blocker alerts, and team audits.
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${notifications.filter(n => !n.read).length})` },
              { id: 'tasks', label: 'Tasks' },
              { id: 'ai', label: 'AI Alerts' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {filteredNotifs.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No notifications matching this filter.
              </div>
            ) : (
              filteredNotifs.map(n => (
                <div
                  key={n._id}
                  onClick={() => {
                    markAsRead(n._id);
                    if (n.link) navigate(n.link);
                  }}
                  className={`p-4 flex items-start gap-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    !n.read ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'task' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                    {n.type === 'ai' && <Info className="w-5 h-5 text-indigo-600" />}
                    {n.type !== 'task' && n.type !== 'warning' && n.type !== 'ai' && (
                      <Bell className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  </div>

                  {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Activity Timeline Column */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Organization Activity Audit</h3>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No activity entries recorded.</p>
            ) : (
              activities.map(act => (
                <div key={act._id} className="flex items-start gap-2.5 text-xs">
                  <img
                    src={act.userAvatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 leading-snug">
                      {act.userName} <span className="font-normal text-slate-500">{act.action}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{act.details}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block tabular-nums">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
