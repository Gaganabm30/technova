import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Task,
  AnalyticsOverview,
  DailyBrief,
  ActivityItem,
} from '../types';
import { DailyBriefBanner } from '../components/ai/DailyBriefBanner';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { ProjectModal } from '../components/projects/ProjectModal';
import {
  Users,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Activity,
  Plus,
  UserPlus,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer / Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, briefRes, tasksRes, actRes] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getDailyBrief(),
        api.getTasks(),
        api.getActivities(6),
      ]);

      setAnalytics(analyticsRes);
      setBrief(briefRes.brief);
      setRecentTasks(tasksRes.tasks.slice(0, 6));
      setActivities(actRes.activities);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleTaskCreated = () => fetchDashboardData();
    const handleOrgSwitched = () => fetchDashboardData();
    window.addEventListener('workflow:task-created', handleTaskCreated);
    window.addEventListener('workflow:organization-switched', handleOrgSwitched);
    return () => {
      window.removeEventListener('workflow:task-created', handleTaskCreated);
      window.removeEventListener('workflow:organization-switched', handleOrgSwitched);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isTeamLead = user?.role === 'team_lead';
  const canManageOrg = isAdmin || isManager;

  const roleLabel: Record<string, string> = {
    admin: 'Organization Admin',
    manager: 'Manager',
    team_lead: 'Team Lead',
    employee: 'Team Member',
  };

  const hasWeeklyActivity = analytics?.weeklyProductivity.some(d => d.completed > 0 || d.overdue > 0) ?? false;
  const totalCompleted = analytics?.kpis.tasksCompleted.value || 0;
  const avgVelocity = totalCompleted > 0 ? (totalCompleted / 5).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name || 'Team Member'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {roleLabel[user?.role || 'employee']} · Here's what's happening across your workspace today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="dashboard-create-task-btn"
            onClick={() => setCreateTaskOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          {canManageOrg && (
            <button
              id="dashboard-new-project-btn"
              onClick={() => setCreateProjectOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Top AI Daily Brief Banner */}
      <DailyBriefBanner brief={brief} loading={loading} onRefresh={fetchDashboardData} />

      {/* Top 4 KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Employees"
            value={analytics.kpis.activeEmployees.value}
            change={analytics.kpis.activeEmployees.change}
            comparison={analytics.kpis.activeEmployees.comparison}
            isPositive={analytics.kpis.activeEmployees.isPositive}
            icon={Users}
            onClick={() => navigate('/team')}
          />
          <StatCard
            title="Active Projects"
            value={analytics.kpis.activeProjects.value}
            change={analytics.kpis.activeProjects.change}
            comparison={analytics.kpis.activeProjects.comparison}
            isPositive={analytics.kpis.activeProjects.isPositive}
            icon={FolderGit2}
            onClick={() => navigate('/projects')}
          />
          <StatCard
            title="Tasks Completed"
            value={analytics.kpis.tasksCompleted.value}
            change={analytics.kpis.tasksCompleted.change}
            comparison={analytics.kpis.tasksCompleted.comparison}
            isPositive={analytics.kpis.tasksCompleted.isPositive}
            icon={CheckCircle2}
            onClick={() => navigate('/tasks?status=COMPLETED')}
          />
          <StatCard
            title="Tasks At Risk"
            value={analytics.kpis.tasksAtRisk.value}
            change={analytics.kpis.tasksAtRisk.change}
            comparison={analytics.kpis.tasksAtRisk.comparison}
            isPositive={analytics.kpis.tasksAtRisk.isPositive}
            icon={AlertTriangle}
            onClick={() => navigate('/tasks?status=BLOCKED')}
          />
        </div>
      )}

      {/* Empty State Banners for New Organizations */}
      {analytics && analytics.kpis.activeProjects.value === 0 && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">You haven't created any projects yet.</p>
              <p className="text-[11px] text-slate-500">Initiate your first project to organize sprint goals and track velocity.</p>
            </div>
          </div>
          <button
            onClick={() => setCreateProjectOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl self-start sm:self-auto cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      )}

      {analytics && analytics.kpis.activeEmployees.value <= 1 && (
        <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Invite your team to start managing workflow.</p>
              <p className="text-[11px] text-slate-500">Collaborate with engineers, product managers, and designers in your organization.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/team')}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl self-start sm:self-auto cursor-pointer flex items-center gap-1 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Employee</span>
          </button>
        </div>
      )}

      {/* Productivity & Workload Charts Section */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Productivity Chart */}
          <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Weekly Productivity Trends</h3>
                <p className="text-xs text-slate-500">Tasks completed vs. overdue across business days</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Completed
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overdue
                </span>
              </div>
            </div>

            {/* Custom SVG Line & Bar Chart */}
            <div className="h-56 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
              {!hasWeeklyActivity ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No Task Completions Logged Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                    As tasks are completed and deadlines tracked in MongoDB, real velocity curves appear here.
                  </p>
                </div>
              ) : (
                analytics.weeklyProductivity.map((dayData, idx) => {
                  const maxVal = Math.max(...analytics.weeklyProductivity.map(d => Math.max(d.completed, d.overdue)), 5);
                  const completedH = (dayData.completed / maxVal) * 100;
                  const overdueH = (dayData.overdue / maxVal) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow mb-1 pointer-events-none whitespace-nowrap">
                        {dayData.completed} completed · {dayData.avgHours}h avg
                      </div>

                      {/* Bars Container */}
                      <div className="w-full max-w-[40px] flex items-end justify-center gap-1.5 h-44">
                        {/* Completed Bar */}
                        <div
                          className="w-4 bg-indigo-600 rounded-t-md hover:bg-indigo-700 transition-all duration-300 relative"
                          style={{ height: `${Math.max(completedH, dayData.completed > 0 ? 8 : 0)}%` }}
                        >
                          {dayData.completed > 0 && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 tabular-nums">
                              {dayData.completed}
                            </span>
                          )}
                        </div>
                        {/* Overdue Bar */}
                        {dayData.overdue > 0 && (
                          <div
                            className="w-3 bg-rose-500 rounded-t-md hover:bg-rose-600 transition-all duration-300"
                            style={{ height: `${Math.max(overdueH, 8)}%` }}
                          />
                        )}
                      </div>

                      {/* X-axis Label */}
                      <span className="text-xs font-semibold text-slate-600 mt-2">{dayData.day}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Average velocity: {avgVelocity} tasks/day
              </span>
              <span>Tasks recorded: {analytics.totalTasks}</span>
            </div>
          </div>

          {/* Workload Distribution Chart */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Workload Distribution</h3>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Active Team
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6">Capacity balance based on active task volumes</p>
            </div>

            {/* Workload Bars Representation */}
            <div className="space-y-4">
              {analytics.workloadDistribution.map((item, idx) => {
                const colors = {
                  Low: { bar: 'bg-slate-400', text: 'text-slate-600' },
                  Normal: { bar: 'bg-emerald-500', text: 'text-emerald-700' },
                  High: { bar: 'bg-amber-500', text: 'text-amber-700' },
                  Overloaded: { bar: 'bg-rose-500', text: 'text-rose-700' },
                }[item.name] || { bar: 'bg-indigo-500', text: 'text-indigo-700' };

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {item.count} employees ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${Math.max(item.percentage, item.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => navigate('/ai-workload')}
                className="w-full py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>View Full AI Workload Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Bar Chart by Department */}
      {analytics && analytics.departmentPerformance.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Department Performance</h3>
              <p className="text-xs text-slate-500">Average workflow productivity score and on-time task delivery</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {analytics.departmentPerformance.map((dept, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-800 mb-1 truncate">{dept.department}</span>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-xl font-extrabold text-slate-900 tabular-nums">{dept.avgScore}</span>
                  <span className="text-[10px] text-slate-400">/100</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Delivery</span>
                    <span className="font-semibold text-slate-700 tabular-nums">{dept.completionRate}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${dept.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Recent Tasks & Activity Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active & At-Risk Tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Critical &amp; Active Tasks</h3>
              <p className="text-xs text-slate-500">Items requiring current attention across project teams</p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-10 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Start by creating your first task.</p>
                <p className="text-[11px] text-slate-500">Assign work to teammates to kickstart your workflow board.</p>
              </div>
              <button
                onClick={() => setCreateTaskOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => {
                    setSelectedTask(task);
                    setDrawerOpen(true);
                  }}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/50">
                        {task.projectKey || 'TASK'}
                      </span>
                      <PriorityBadge priority={task.priority} size="sm" />
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {task.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                    <div className="hidden sm:flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.dueDate}</span>
                    </div>
                    {task.assigneeAvatar ? (
                      <img
                        src={task.assigneeAvatar}
                        alt=""
                        title={task.assigneeName}
                        className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        {(task.assigneeName || 'U')[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real Activity Log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Activity Log</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Real-time</span>
            </div>

            <div className="space-y-3.5">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No recent activities</p>
              ) : (
                activities.map(act => (
                  <div key={act._id} className="flex items-start gap-2.5 text-xs">
                    <img
                      src={act.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 leading-snug">
                        {act.userName}{' '}
                        <span className="font-normal text-slate-500">{act.action}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{act.details}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Notifications &amp; History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={() => fetchDashboardData()}
        onTaskDeleted={() => fetchDashboardData()}
        onEditClick={() => {
          setDrawerOpen(false);
          setCreateTaskOpen(true);
        }}
      />

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
};
