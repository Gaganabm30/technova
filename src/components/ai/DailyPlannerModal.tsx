import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Sparkles, Clock, CheckCircle2, AlertCircle, ArrowRight, Play, Check } from 'lucide-react';

interface DailyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export const DailyPlannerModal: React.FC<DailyPlannerModalProps> = ({ isOpen, onClose, onTaskUpdated }) => {
  const { showToast } = useNotifications();
  const [capacityHours, setCapacityHours] = useState(8);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [acceptedTaskIds, setAcceptedTaskIds] = useState<Set<string>>(new Set());

  const fetchPlan = async (hours = capacityHours) => {
    setLoading(true);
    try {
      const res = await api.getDailyPlanner(hours);
      setPlan(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate daily action plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlan();
    }
  }, [isOpen]);

  const handleStartTask = async (taskId: string) => {
    try {
      await api.updateTaskStatus(taskId, 'IN_PROGRESS');
      setAcceptedTaskIds(prev => new Set(prev).add(taskId));
      showToast('Task moved to In Progress', 'success');
      onTaskUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Daily Action Planner" maxWidth="lg">
      <div className="space-y-6">
        {/* Capacity Selector Bar */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Declared Daily Working Capacity</p>
              <p className="text-xs text-slate-400">AI sequences your real tasks to prevent cognitive overload.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[4, 6, 8, 10].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setCapacityHours(h);
                  fetchPlan(h);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  capacityHours === h
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Analyzing pending tasks, deadlines, and dependencies...</p>
          </div>
        ) : plan ? (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Strategic Daily Briefing
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {plan.plannedHoursTotal}h planned / {plan.workingCapacityHours}h target ({plan.capacityUtilizationPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{plan.strategicSummary}</p>
            </div>

            {/* Recommended Tasks Sequence */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Prioritized Action Sequence ({plan.recommendedTasks?.length || 0})
              </h4>

              {plan.recommendedTasks?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium text-slate-200">All clear for today!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending incomplete tasks require scheduling right now.</p>
                </div>
              ) : (
                plan.recommendedTasks?.map((task: any) => {
                  const isAccepted = acceptedTaskIds.has(task.taskId) || task.status === 'IN_PROGRESS';
                  return (
                    <div
                      key={task.taskId}
                      className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between gap-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {task.suggestedOrder}
                        </span>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200 truncate">{task.title}</span>
                            <PriorityBadge priority={task.priority} size="sm" />
                            <StatusBadge status={task.status} size="sm" />
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{task.urgencyReason}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" /> ~{task.estimatedHours}h effort
                            </span>
                            <span>Due: {task.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" /> In Progress
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartTask(task.taskId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Task
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        <div className="pt-4 border-t border-slate-700/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
