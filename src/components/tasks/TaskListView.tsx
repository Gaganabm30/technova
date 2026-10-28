import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Calendar, Clock, MessageSquare, AlertCircle } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskClick,
  onStatusChange,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
        No tasks match the selected criteria.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Task</th>
              <th className="py-3 px-3">Project</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Assignee</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-3">Hours</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map(task => (
              <tr
                key={task._id}
                onClick={() => onTaskClick(task)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* Title */}
                <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </div>
                  )}
                </td>

                {/* Project */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {task.projectKey || 'TASK'}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <StatusBadge status={task.status} size="sm" />
                </td>

                {/* Priority */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} size="sm" />
                </td>

                {/* Assignee */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {task.assigneeAvatar ? (
                      <img src={task.assigneeAvatar} alt="" className="w-5 h-5 rounded-md object-cover ring-1 ring-slate-200" />
                    ) : (
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold">
                        {(task.assigneeName || 'U')[0]}
                      </span>
                    )}
                    <span className="font-medium text-slate-700">{task.assigneeName}</span>
                  </div>
                </td>

                {/* Due Date */}
                <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-600 tabular-nums">
                  {task.dueDate}
                </td>

                {/* Hours */}
                <td className="py-3.5 px-3 whitespace-nowrap tabular-nums text-slate-500">
                  {task.actualHours}h / {task.estimatedHours}h
                </td>

                {/* Quick Status Select */}
                <td
                  className="py-3.5 px-4 text-right whitespace-nowrap"
                  onClick={e => e.stopPropagation()}
                >
                  <select
                    value={task.status}
                    onChange={e => onStatusChange(task._id, e.target.value as TaskStatus)}
                    className="text-[11px] font-medium py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-hidden"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
