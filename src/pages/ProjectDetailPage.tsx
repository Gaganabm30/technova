import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Project, Task, TaskStatus } from '../types';
import { HealthBadge, StatusBadge, PriorityBadge } from '../components/common/Badge';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useNotifications } from '../context/NotificationContext';
import {
  FolderGit2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Sparkles,
  Layers,
  Flag,
  BarChart3,
  Trash2,
  Edit,
  RefreshCw,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'timeline' | 'ai'>('overview');
  const [loading, setLoading] = useState(true);

  // AI Deadline Risk
  const [deadlineRisk, setDeadlineRisk] = useState<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    ruleBasedSummary?: string;
    daysRemaining?: number;
    remainingTasks?: number;
    overdueTasks?: number;
    blockedTasks?: number;
    evidenceFactors?: { factor: string; impact: string; detail: string }[];
    mainContributingFactors?: string[];
    recommendedMitigation?: string[];
  } | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Task drawer & modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      const res = await api.getProject(id);
      setProject(res.project);

      // Fetch AI deadline risk
      setLoadingRisk(true);
      api.predictDeadlineRisk(id)
        .then(r => setDeadlineRisk(r.data))
        .catch(() => {})
        .finally(() => setLoadingRisk(false));
    } catch (err: any) {
      showToast('Project not found', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateRisk = async () => {
    if (!id) return;
    setLoadingRisk(true);
    try {
      const r = await api.predictDeadlineRisk(id);
      setDeadlineRisk(r.data);
      showToast('AI Deadline Risk assessment updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to calculate deadline risk', 'error');
    } finally {
      setLoadingRisk(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  if (loading || !project) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading project workspace details...
      </div>
    );
  }

  const progress = project.progress || 0;

  const handleDeleteProject = async () => {
    try {
      await api.deleteProject(project._id);
      showToast('Project deleted successfully', 'success');
      navigate('/projects');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {project.key}
              </span>
              <HealthBadge health={project.health} />
              <span className="text-xs text-slate-400">· {project.department}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="sm:text-right shrink-0 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Sprint Deadline</span>
            <div className="text-sm font-bold text-slate-900 flex items-center sm:justify-end gap-1.5 tabular-nums">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{project.deadline}</span>
            </div>
          </div>
        </div>

        {/* Progress summary */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Project Completion</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {progress}% ({project.completedTaskCount || 0} / {project.taskCount || 0} tasks)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: FolderGit2 },
            { id: 'tasks', label: `Tasks (${project.taskCount || 0})`, icon: CheckCircle2 },
            { id: 'team', label: `Team (${project.members?.length || 0})`, icon: Users },
            { id: 'timeline', label: 'Timeline & Milestones', icon: Flag },
            { id: 'ai', label: 'AI Risk Predictor', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Budget Effort</span>
                <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{project.budgetHours} hrs</p>
                <span className="text-[10px] text-slate-400">Allocated</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Lead Assigned</span>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">{project.leadName}</p>
                <span className="text-[10px] text-slate-400">{project.leadJobTitle || 'Tech Lead'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Start Date</span>
                <p className="text-xs font-bold text-slate-900 mt-1 tabular-nums">{project.startDate}</p>
                <span className="text-[10px] text-slate-400">Kickoff</span>
              </div>
            </div>

            {/* AI Deadline Risk Assessment Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                deadlineRisk?.riskLevel === 'HIGH'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : deadlineRisk?.riskLevel === 'MEDIUM'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>
                    AI Deadline Risk Assessment:{' '}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        deadlineRisk?.riskLevel === 'HIGH'
                          ? 'bg-rose-200/80 text-rose-800'
                          : deadlineRisk?.riskLevel === 'MEDIUM'
                          ? 'bg-amber-200/80 text-amber-800'
                          : 'bg-emerald-200/80 text-emerald-800'
                      }`}
                    >
                      {deadlineRisk?.riskLevel || 'ANALYZING'} RISK
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRecalculateRisk}
                  disabled={loadingRisk}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRisk ? 'animate-spin' : ''}`} />
                  <span>{loadingRisk ? 'Evaluating...' : 'Re-evaluate'}</span>
                </button>
              </div>

              {deadlineRisk?.ruleBasedSummary && (
                <p className="text-xs leading-relaxed font-medium mb-3">
                  {deadlineRisk.ruleBasedSummary}
                </p>
              )}

              {/* Factors & Mitigations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-black/5 text-xs">
                {deadlineRisk?.evidenceFactors && deadlineRisk.evidenceFactors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                      Evidence Factors:
                    </p>
                    <ul className="space-y-1">
                      {deadlineRisk.evidenceFactors.map((ef, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-600">
                          <span className="font-semibold text-slate-800 shrink-0">• {ef.factor}:</span>
                          <span>{ef.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {deadlineRisk?.recommendedMitigation && deadlineRisk.recommendedMitigation.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                      Recommended Mitigations:
                    </p>
                    <ul className="space-y-1">
                      {deadlineRisk.recommendedMitigation.map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-600">
                          <span className="text-emerald-700 font-bold shrink-0">✓</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tasks in Project */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Key Deliverables
              </h3>
              <div className="divide-y divide-slate-100">
                {project.tasks && project.tasks.slice(0, 5).map(task => (
                  <div
                    key={task._id}
                    onClick={() => {
                      setSelectedTask(task);
                      setDrawerOpen(true);
                    }}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{task.title}</p>
                      <span className="text-[11px] text-slate-400">Assigned: {task.assigneeName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} size="sm" />
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info: Members & Milestones */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Team</h3>
              <div className="space-y-2.5">
                {project.members && project.members.map(member => (
                  <div key={member.id} className="flex items-center gap-2.5">
                    <img src={member.avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{member.jobTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Milestones</h3>
              <div className="space-y-2">
                {project.milestones && project.milestones.map(m => (
                  <div key={m.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-2 text-xs">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        m.completed ? 'text-emerald-600' : 'text-slate-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold ${m.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {m.title}
                      </p>
                      <span className="text-[10px] text-slate-400">Target: {m.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tasks List */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Project Tasks</h3>
            <button
              onClick={() => setCreateTaskOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {project.tasks && project.tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No tasks currently assigned to this project.</p>
            ) : (
              project.tasks?.map(task => (
                <div
                  key={task._id}
                  onClick={() => {
                    setSelectedTask(task);
                    setDrawerOpen(true);
                  }}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                    <p className="text-[11px] text-slate-400">
                      Assignee: {task.assigneeName} · Due: {task.dueDate} · {task.actualHours}h/{task.estimatedHours}h
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Team Directory */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.members && project.members.map(member => (
            <div key={member.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <img src={member.avatar} alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                <p className="text-[11px] text-slate-500 truncate">{member.jobTitle}</p>
                <span className="text-[10px] text-indigo-600 font-medium">{member.department}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Visual Timeline / Milestones */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sprint Delivery Timeline</h3>
            <p className="text-xs text-slate-500">Scheduled phase milestones and target completion dates</p>
          </div>

          <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-6">
            {project.milestones && project.milestones.map((m, idx) => (
              <div key={m.id} className="relative">
                <div
                  className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ring-2 ${
                    m.completed ? 'bg-emerald-500 ring-emerald-200' : 'bg-slate-300 ring-slate-100'
                  }`}
                />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 max-w-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{m.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                      {m.dueDate}
                    </span>
                  </div>
                  <span className={`text-[11px] font-medium ${m.completed ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {m.completed ? 'Milestone Achieved' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: AI Insights */}
      {activeTab === 'ai' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Deadline Risk &amp; Velocity Synthesis</h3>
              <p className="text-xs text-slate-500">Predictive timeline modeling using remaining backlog &amp; member velocity</p>
            </div>
          </div>

          {deadlineRisk ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Risk Assessment Tier</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                    deadlineRisk.riskLevel === 'HIGH'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : deadlineRisk.riskLevel === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {deadlineRisk.riskLevel} RISK
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {deadlineRisk.ruleBasedSummary || 'Comprehensive timeline synthesis complete.'}
              </p>

              {deadlineRisk.evidenceFactors && deadlineRisk.evidenceFactors.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-2">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Identified Risk Drivers</p>
                  <div className="space-y-1">
                    {deadlineRisk.evidenceFactors.map((ef, idx) => (
                      <div key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="font-semibold text-slate-800 shrink-0">• {ef.factor}:</span>
                        <span>{ef.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deadlineRisk.recommendedMitigation && deadlineRisk.recommendedMitigation.length > 0 && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-2">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Suggested Actions</p>
                  <div className="space-y-1">
                    {deadlineRisk.recommendedMitigation.map((m, idx) => (
                      <div key={idx} className="text-xs text-emerald-900 flex items-start gap-1.5">
                        <span className="font-bold text-emerald-600 shrink-0">✓</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Days remaining: <strong>{deadlineRisk.daysRemaining ?? 0} days</strong></span>
                <span>Uncompleted tasks: <strong>{deadlineRisk.remainingTasks ?? 0} tasks</strong></span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">Evaluating project timeline...</div>
          )}
        </div>
      )}

      {/* Task Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskUpdated={() => fetchProjectDetails()}
        onTaskDeleted={() => {
          setDrawerOpen(false);
          fetchProjectDetails();
        }}
        onEditClick={t => {
          setDrawerOpen(false);
          setCreateTaskOpen(true);
        }}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={createTaskOpen}
        defaultProjectId={project._id}
        onClose={() => setCreateTaskOpen(false)}
        onSuccess={() => fetchProjectDetails()}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete this project?"
        description={`This will permanently remove "${project.name}" and all its assigned tasks from the system.`}
        confirmLabel="Delete Project"
        isDestructive={true}
      />
    </div>
  );
};
