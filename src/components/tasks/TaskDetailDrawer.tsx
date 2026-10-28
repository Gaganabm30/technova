import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { api } from '../../api/client';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useNotifications } from '../../context/NotificationContext';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
  FolderGit2,
  Send,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  History,
} from 'lucide-react';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onEditClick: (task: Task) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  onEditClick,
}) => {
  const { showToast } = useNotifications();
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !task) return null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      const res = await api.updateTaskStatus(task._id, newStatus);
      showToast(`Task moved to ${newStatus}`, 'success');
      onTaskUpdated(res.task);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    try {
      const res = await api.updateTaskPriority(task._id, newPriority);
      showToast(`Priority updated to ${newPriority}`, 'success');
      onTaskUpdated(res.task);
    } catch (err: any) {
      showToast(err.message || 'Failed to update priority', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.addTaskComment(task._id, commentText.trim());
      setCommentText('');
      showToast('Comment posted', 'success');
      onTaskUpdated(res.task);
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTask(task._id);
      showToast('Task deleted successfully', 'success');
      onTaskDeleted(task._id);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Progress calculation
  const progressPercent = task.status === 'COMPLETED' ? 100 : task.status === 'IN_REVIEW' ? 80 : task.status === 'IN_PROGRESS' ? 40 : 10;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-200 ease-in-out">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {task.projectKey || 'TASK'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">{task.projectName || 'Project'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditClick(task)}
              className="text-slate-600 hover:text-indigo-600 p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
              title="Edit Task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-white border border-transparent hover:border-rose-100 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white border border-slate-200/60 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Title & Status Bar */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-3">{task.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'] as TaskStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      task.status === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st === 'IN_PROGRESS' ? 'In Progress' : st === 'IN_REVIEW' ? 'In Review' : st === 'COMPLETED' ? 'Done' : st === 'TODO' ? 'To Do' : 'Blocked'}
                  </button>
                ))}
              </div>

              {/* Priority Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium ml-2">Priority:</span>
                <select
                  value={task.priority}
                  onChange={e => handlePriorityChange(e.target.value as TaskPriority)}
                  className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Workflow Progress</span>
              <span className="font-bold text-slate-900 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  task.status === 'COMPLETED' ? 'bg-emerald-500' : task.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200/80 bg-white">
            <div>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                <UserIcon className="w-3.5 h-3.5" /> Assignee
              </span>
              <div className="flex items-center gap-2">
                {task.assigneeAvatar && (
                  <img src={task.assigneeAvatar} alt="" className="w-5 h-5 rounded-md object-cover" />
                )}
                <span className="text-xs font-semibold text-slate-800 truncate">{task.assigneeName || 'Unassigned'}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </span>
              <span className="text-xs font-semibold text-slate-800 tabular-nums">{task.dueDate}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5" /> Effort Hours
              </span>
              <span className="text-xs font-semibold text-slate-800 tabular-nums">
                {task.actualHours}h actual / {task.estimatedHours}h est
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Description</h4>
            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
              {task.description || 'No description provided for this task.'}
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments System */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Comments ({task.comments?.length || 0})
              </h4>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {!task.comments || task.comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
              ) : (
                task.comments.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                    <img src={c.userAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className="text-xs font-semibold text-slate-800">{c.userName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Activity Timeline
            </h4>
            <div className="space-y-3 border-l-2 border-slate-200 pl-3 ml-1.5">
              {task.activity && task.activity.length > 0 ? (
                task.activity.map(act => (
                  <div key={act.id} className="relative text-xs">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                    <p className="font-medium text-slate-800">{act.text}</p>
                    <span className="text-[10px] text-slate-400">
                      {act.userName} · {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete this task?"
        description="This action cannot be undone. The task and all associated comments will be permanently removed from the system."
        confirmLabel="Delete Task"
        isDestructive={true}
      />
    </div>
  );
};
