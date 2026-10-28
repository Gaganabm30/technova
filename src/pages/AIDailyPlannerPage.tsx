import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User } from '../types';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import {
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Zap,
  Users,
  Loader2,
} from 'lucide-react';

interface PlannerTask {
  taskId: string;
  title: string;
  suggestedOrder: number;
  estimatedHours: number;
  urgencyReason: string;
  status: string;
  priority: string;
  dueDate: string;
}

interface PlannerData {
  workingCapacityHours: number;
  plannedHoursTotal: number;
  capacityUtilizationPercent: number;
  strategicSummary: string;
  recommendedTasks: PlannerTask[];
  generatedAt: string;
}

export const AIDailyPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [capacityHours, setCapacityHours] = useState(8);
  const [plannerData, setPlannerData] = useState<PlannerData | null>(null);
  const [planUser, setPlanUser] = useState<{ id: string; name: string; role: string; department: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.getUsers();
        setAllUsers(res.users);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    fetchUsers();
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const userId = selectedUserId || user?._id;
      const res = await api.getDailyPlanner(capacityHours, userId);
      setPlannerData(res.data);
      setPlanUser(res.user);
      setHasFetched(true);
      showToast('Daily plan generated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate daily plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const utilizationColor = (percent: number) => {
    if (percent <= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percent <= 90) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const utilizationBarColor = (percent: number) => {
    if (percent <= 70) return 'bg-emerald-500';
    if (percent <= 90) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const canSelectOtherUsers =
    user?.role === 'admin' || user?.role === 'manager' || user?.role === 'team_lead';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            AI Planner
          </span>
          <span className="text-xs text-slate-400">· Powered by Gemini</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          AI Daily Task Planner
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate an intelligent daily work plan based on priorities, deadlines, and capacity.
        </p>
      </div>

      {/* Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          Plan Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Working Hours Today
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={capacityHours}
                onChange={e => setCapacityHours(Number(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-sm font-bold text-slate-800 w-12 text-right">
                {capacityHours}h
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Set your available working capacity for today
            </p>
          </div>

          {canSelectOtherUsers && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Users className="w-3 h-3 inline mr-1" />
                Generate plan for
              </label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Myself ({user?.name})</option>
                {allUsers
                  .filter(u => u._id !== user?._id)
                  .map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} — {u.jobTitle}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {hasFetched ? 'Regenerate Plan' : 'Generate Daily Plan'}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {plannerData && planUser && (
        <>
          {/* Capacity Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Capacity Overview
              </h2>
              <div
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${utilizationColor(
                  plannerData.capacityUtilizationPercent
                )}`}
              >
                {Math.round(plannerData.capacityUtilizationPercent)}% utilized
              </div>
            </div>

            <div className="flex gap-6 mb-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  For
                </p>
                <p className="text-sm font-bold text-slate-900">{planUser.name}</p>
                <p className="text-xs text-slate-500">{planUser.role} · {planUser.department}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Capacity
                </p>
                <p className="text-sm font-bold text-slate-900">{plannerData.workingCapacityHours}h</p>
                <p className="text-xs text-slate-500">available today</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Planned
                </p>
                <p className="text-sm font-bold text-slate-900">{plannerData.plannedHoursTotal}h</p>
                <p className="text-xs text-slate-500">across {plannerData.recommendedTasks.length} tasks</p>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${utilizationBarColor(plannerData.capacityUtilizationPercent)}`}
                style={{ width: `${Math.min(plannerData.capacityUtilizationPercent, 100)}%` }}
              />
            </div>

            {/* Strategic Summary */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> AI Strategic Summary
              </p>
              <p className="text-xs text-indigo-800 leading-relaxed">{plannerData.strategicSummary}</p>
            </div>
          </div>

          {/* Recommended Task Order */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Recommended Task Order
            </h2>

            {plannerData.recommendedTasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No open tasks found. You're all caught up! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {plannerData.recommendedTasks.map((task, idx) => (
                  <div
                    key={task.taskId}
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all group"
                  >
                    {/* Order Badge */}
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <PriorityBadge priority={task.priority as any} />
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {task.estimatedHours}h
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                        {task.urgencyReason}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={task.status as any} />
                        {task.dueDate && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 text-center pb-4">
            Generated at {new Date(plannerData.generatedAt).toLocaleTimeString()} · Plans are AI suggestions based on priorities and deadlines
          </p>
        </>
      )}

      {/* Empty State */}
      {!hasFetched && !loading && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No plan generated yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Configure your working capacity above and click "Generate Daily Plan" to get an AI-powered prioritized task schedule for today.
          </p>
        </div>
      )}
    </div>
  );
};
