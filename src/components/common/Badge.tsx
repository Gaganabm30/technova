import React from 'react';
import { TaskStatus, TaskPriority, ProjectHealth } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'status' | 'priority' | 'health' | 'workload' | 'neutral';
  value?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<{ status: TaskStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const styles: Record<TaskStatus, { bg: string; text: string; dot: string; label: string }> = {
    TODO: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', label: 'To Do' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
    IN_REVIEW: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'In Review' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
    BLOCKED: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Blocked' },
  };

  const current = styles[status] || styles.TODO;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-black/5 ${current.bg} ${current.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority; size?: 'sm' | 'md' }> = ({ priority, size = 'md' }) => {
  const styles: Record<TaskPriority, { bg: string; text: string; label: string }> = {
    LOW: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-600', label: 'Low' },
    MEDIUM: { bg: 'bg-sky-50 text-sky-700 border-sky-200', text: 'text-sky-700', label: 'Medium' },
    HIGH: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'High' },
    URGENT: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Urgent' },
  };

  const current = styles[priority] || styles.MEDIUM;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded border ${current.bg} ${sizeClasses}`}>
      {current.label}
    </span>
  );
};

export const HealthBadge: React.FC<{ health: ProjectHealth; size?: 'sm' | 'md' }> = ({ health, size = 'md' }) => {
  const styles: Record<ProjectHealth, { bg: string; dot: string; label: string }> = {
    Healthy: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Healthy' },
    'At Risk': { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'At Risk' },
    Delayed: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Delayed' },
  };

  const current = styles[health] || styles.Healthy;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${current.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};

export const WorkloadBadge: React.FC<{ workload: 'Low' | 'Normal' | 'High' | 'Overloaded'; size?: 'sm' | 'md' }> = ({
  workload,
  size = 'md',
}) => {
  const styles = {
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
    Normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Overloaded: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${styles[workload] || styles.Normal} ${sizeClasses}`}>
      {workload}
    </span>
  );
};
