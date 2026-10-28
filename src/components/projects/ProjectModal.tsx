import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Project, User } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  initialProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProject,
}) => {
  const { showToast } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [leadId, setLeadId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budgetHours, setBudgetHours] = useState(250);

  useEffect(() => {
    if (isOpen) {
      api.getUsers().then(res => {
        setUsers(res.users);
        if (!leadId && res.users.length > 0) {
          setLeadId(res.users[0]._id);
        }
      });

      if (initialProject) {
        setName(initialProject.name);
        setKey(initialProject.key);
        setDescription(initialProject.description);
        setDepartment(initialProject.department);
        setLeadId(initialProject.leadId);
        setDeadline(initialProject.deadline);
        setBudgetHours(initialProject.budgetHours || 250);
      } else {
        setName('');
        setKey('');
        setDescription('');
        setDepartment('Engineering');
        const inOneMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        setDeadline(inOneMonth);
        setBudgetHours(250);
      }
    }
  }, [isOpen, initialProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) {
      showToast('Project name and project key are required', 'error');
      return;
    }

    setLoading(true);
    try {
      if (initialProject) {
        const res = await api.updateProject(initialProject._id, {
          name,
          description,
          department,
          leadId,
          deadline,
          budgetHours: Number(budgetHours),
        });
        showToast('Project updated successfully', 'success');
        onSuccess(res.project);
      } else {
        const res = await api.createProject({
          name,
          key: key.toUpperCase(),
          description,
          department,
          leadId,
          deadline,
          budgetHours: Number(budgetHours),
        });
        showToast('Project created successfully', 'success');
        onSuccess(res.project);
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProject ? 'Edit Project' : 'Create New Project'}
      subtitle={initialProject ? 'Update initiative scope and milestones' : 'Track milestones, budget hours, and team workload'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Key */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (!initialProject && !key) {
                  // Auto generate 3 letter acronym
                  const acronym = e.target.value
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 4);
                  setKey(acronym);
                }
              }}
              placeholder="e.g. AI Workflow Analytics Engine"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Key <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              placeholder="e.g. AWA"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono uppercase"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief scope, target objectives, and team deliverables..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Department & Lead */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:border-indigo-500"
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Lead</label>
            <select
              value={leadId}
              onChange={e => setLeadId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:border-indigo-500"
            >
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.jobTitle})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deadline & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Effort (Hours)</label>
            <input
              type="number"
              min={10}
              max={5000}
              value={budgetHours}
              onChange={e => setBudgetHours(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Buttons */}
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
            {loading ? 'Saving...' : initialProject ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
