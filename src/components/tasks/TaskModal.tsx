import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Task, Project, User, TaskPriority } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  initialTask?: Task | null;
  defaultProjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTask,
  defaultProjectId,
}) => {
  const { showToast } = useNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getProjects().then(res => {
        setProjects(res.projects);
        if (!projectId && res.projects.length > 0) {
          setProjectId(defaultProjectId || res.projects[0]._id);
        }
      });
      api.getUsers().then(res => {
        setUsers(res.users);
        if (!assignedTo && res.users.length > 0) {
          setAssignedTo(res.users[0]._id);
        }
      });

      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description);
        setProjectId(initialTask.projectId);
        setAssignedTo(initialTask.assignedTo);
        setPriority(initialTask.priority);
        setDueDate(initialTask.dueDate);
        setEstimatedHours(initialTask.estimatedHours || 8);
        setTagsInput(initialTask.tags.join(', '));
      } else {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        setDueDate(nextWeek);
        setEstimatedHours(8);
        setTagsInput('');
        if (defaultProjectId) setProjectId(defaultProjectId);
      }
    }
  }, [isOpen, initialTask, defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }
    if (!projectId) {
      showToast('Please select a project', 'error');
      return;
    }

    setLoading(true);
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      if (initialTask) {
        const res = await api.updateTask(initialTask._id, {
          title,
          description,
          projectId,
          assignedTo,
          priority,
          dueDate,
          estimatedHours: Number(estimatedHours),
          tags,
        });
        showToast('Task updated successfully', 'success');
        onSuccess(res.task);
      } else {
        const res = await api.createTask({
          title,
          description,
          projectId,
          assignedTo,
          priority,
          dueDate,
          estimatedHours: Number(estimatedHours),
          tags,
        });
        showToast('Task created successfully', 'success');
        onSuccess(res.task);
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : 'Create New Task'}
      subtitle={initialTask ? 'Update task details and assignments' : 'Add a new work item to the workflow board'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Implement Webhook Idempotency & Retry Backoff"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Provide context, acceptance criteria, or relevant links..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Project & Assignee Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white font-medium"
            >
              {projects.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white font-medium"
            >
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority & Due Date & Est Hours Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white font-medium"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
            <input
              type="number"
              min={1}
              max={160}
              value={estimatedHours}
              onChange={e => setEstimatedHours(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="Backend, API, Security, React"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
