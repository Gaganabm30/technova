import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge } from '../common/Badge';
import { Calendar, Clock, MessageSquare, AlertCircle, Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'border-slate-300' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-400' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-purple-400' },
  { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-400' },
  { id: 'BLOCKED', title: 'Blocked', color: 'border-rose-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onStatusChange,
  onAddTask,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[600px] select-none">
      {COLUMNS.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.id)}
            className="w-80 shrink-0 bg-slate-100/60 rounded-2xl p-3 flex flex-col border border-slate-200/80"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full border-2 ${col.color} bg-white`} />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{col.title}</h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 tabular-nums">
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask(col.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white transition-colors"
                title={`Add task to ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Column Body */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
              {columnTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                  No tasks in {col.title}
                </div>
              ) : (
                columnTasks.map(task => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={e => handleDragStart(e, task._id)}
                    onClick={() => onTaskClick(task)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group space-y-2.5 active:cursor-grabbing"
                  >
                    {/* Project & Priority Header */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded font-mono">
                        {task.projectKey || 'TASK'}
                      </span>
                      <PriorityBadge priority={task.priority} size="sm" />
                    </div>

                    {/* Task Title */}
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {task.title}
                    </h4>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Footer: Due Date, Assignee, Comments */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="tabular-nums font-medium text-slate-600">{task.dueDate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <MessageSquare className="w-3 h-3" />
                            <span className="tabular-nums text-[10px]">{task.comments.length}</span>
                          </span>
                        )}
                        {task.assigneeAvatar ? (
                          <img
                            src={task.assigneeAvatar}
                            alt=""
                            title={task.assigneeName}
                            className="w-5 h-5 rounded-md object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold">
                            {(task.assigneeName || 'U')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
