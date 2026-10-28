import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Task, Project, User, TaskStatus, TaskPriority } from '../types';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskListView } from '../components/tasks/TaskListView';
import { TaskCalendarView } from '../components/tasks/TaskCalendarView';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { Modal } from '../components/common/Modal';
import { useNotifications } from '../context/NotificationContext';
import {
  Kanban,
  List,
  Calendar,
  Plus,
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  CheckSquare,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState(() => searchParams.get('project') || '');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get('priority') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam !== null) setStatusFilter(statusParam);
    const projectParam = searchParams.get('project');
    if (projectParam !== null) setProjectFilter(projectParam);
    const priorityParam = searchParams.get('priority');
    if (priorityParam !== null) setPriorityFilter(priorityParam);
  }, [searchParams]);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>('TODO');

  // AI Prioritization state
  const [aiPrioritizeModalOpen, setAiPrioritizeModalOpen] = useState(false);
  const [aiPrioritizing, setAiPrioritizing] = useState(false);
  const [aiPriorityResult, setAiPriorityResult] = useState<{
    strategicSummary: string;
    prioritizedTasks: {
      taskId: string;
      title: string;
      currentPriority: TaskPriority;
      recommendedPriority: TaskPriority;
      order: number;
      reason: string;
    }[];
  } | null>(null);
  const [applyingPriorities, setApplyingPriorities] = useState(false);

  const fetchTasks = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
        api.getUsers(),
      ]);
      setTasks(tRes.tasks);
      setProjects(pRes.projects);
      setUsers(uRes.users);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      showToast(`Task moved to ${newStatus}`, 'success');
      setTasks(prev => prev.map(t => (t._id === taskId ? res.task : t)));
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleRunAiPrioritization = async () => {
    setAiPrioritizeModalOpen(true);
    setAiPrioritizing(true);
    try {
      const res = await api.prioritizeTasks();
      setAiPriorityResult(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze task priorities', 'error');
    } finally {
      setAiPrioritizing(false);
    }
  };

  const handleApplyAiPriorities = async () => {
    if (!aiPriorityResult) return;
    setApplyingPriorities(true);
    try {
      await api.applyPriorities(
        aiPriorityResult.prioritizedTasks.map(p => ({
          taskId: p.taskId,
          recommendedPriority: p.recommendedPriority,
        }))
      );
      showToast('AI priorities applied to tasks successfully!', 'success');
      setAiPrioritizeModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to apply priorities', 'error');
    } finally {
      setApplyingPriorities(false);
    }
  };

  // Filter tasks client-side
  const filteredTasks = tasks.filter(t => {
    if (projectFilter && t.projectId !== projectFilter) return false;
    if (assigneeFilter && t.assignedTo !== assigneeFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Workflows &amp; Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization work items, track status changes, and optimize priorities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* AI Prioritize Button */}
          <button
            onClick={handleRunAiPrioritization}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Prioritize Tasks</span>
          </button>

          {/* Create Task Button */}
          <button
            onClick={() => {
              setEditingTask(null);
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter tasks by keyword, tag..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
            />
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'calendar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="">All Assignees ({users.length})</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          {/* Reset Filters */}
          {(projectFilter || assigneeFilter || priorityFilter || statusFilter || search) && (
            <button
              onClick={() => {
                setProjectFilter('');
                setAssigneeFilter('');
                setPriorityFilter('');
                setStatusFilter('');
                setSearch('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
            >
              Clear Filters
            </button>
          )}

          <span className="ml-auto text-[11px] text-slate-400 font-medium tabular-nums">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Main View Render */}
      {tasks.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div className="max-w-sm">
            <h3 className="text-base font-bold text-slate-900">Start by creating your first task.</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add work items, assign them to team members, set deadlines, and track real progress in real-time.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      ) : (
        <>
          {view === 'kanban' && (
            <KanbanBoard
              tasks={filteredTasks}
              onTaskClick={t => {
                setSelectedTask(t);
                setDrawerOpen(true);
              }}
              onStatusChange={handleStatusChange}
              onAddTask={status => {
                setDefaultStatusForNew(status);
                setEditingTask(null);
                setCreateModalOpen(true);
              }}
            />
          )}

          {view === 'list' && (
            <TaskListView
              tasks={filteredTasks}
              onTaskClick={t => {
                setSelectedTask(t);
                setDrawerOpen(true);
              }}
              onStatusChange={handleStatusChange}
            />
          )}

          {view === 'calendar' && (
            <TaskCalendarView
              tasks={filteredTasks}
              onTaskClick={t => {
                setSelectedTask(t);
                setDrawerOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Task Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskUpdated={updated => {
          setSelectedTask(updated);
          setTasks(prev => prev.map(t => (t._id === updated._id ? updated : t)));
        }}
        onTaskDeleted={id => {
          setDrawerOpen(false);
          setTasks(prev => prev.filter(t => t._id !== id));
        }}
        onEditClick={taskToEdit => {
          setDrawerOpen(false);
          setEditingTask(taskToEdit);
          setCreateModalOpen(true);
        }}
      />

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={createModalOpen}
        initialTask={editingTask}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={saved => {
          fetchTasks();
          setEditingTask(null);
        }}
      />

      {/* AI Task Prioritization Modal */}
      <Modal
        isOpen={aiPrioritizeModalOpen}
        onClose={() => setAiPrioritizeModalOpen(false)}
        title="AI Workflow Task Prioritization"
        subtitle="Gemini AI analyzes deadlines, effort estimates, blockers, and dependencies"
        maxWidth="2xl"
      >
        {aiPrioritizing ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-800">
              Evaluating critical paths, effort variances, and blocker dependencies...
            </p>
            <p className="text-[11px] text-slate-400">Grounded in actual sprint task metrics</p>
          </div>
        ) : aiPriorityResult ? (
          <div className="space-y-4">
            {/* Strategic Summary */}
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 leading-relaxed font-medium">
              <span className="font-bold flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Strategic Alignment Rationale
              </span>
              {aiPriorityResult.strategicSummary}
            </div>

            {/* Recommended Prioritized Order */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {aiPriorityResult.prioritizedTasks.map(item => (
                <div
                  key={item.taskId}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 tabular-nums">
                      {item.order}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.reason}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Recommended</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        item.recommendedPriority === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.recommendedPriority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {item.recommendedPriority}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAiPrioritizeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Dismiss
              </button>

              <button
                type="button"
                onClick={handleApplyAiPriorities}
                disabled={applyingPriorities}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{applyingPriorities ? 'Applying to Database...' : 'Apply AI Priorities'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
