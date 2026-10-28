import React, { useState, useEffect } from 'react';
import { api, getToken } from '../api/client';
import { AnalyticsOverview } from '../types';
import { StatCard } from '../components/common/StatCard';
import { useNotifications } from '../context/NotificationContext';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  PieChart,
  Layers,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalyticsOverview()
      .then(res => setData(res))
      .catch(err => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  }, [timeframe]);

  const handleExportCsv = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/analytics/export-csv', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `technova-workflow-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Analytics CSV report downloaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to download report', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workflow &amp; Velocity Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics on sprint velocity, cross-department output, effort variance, and delivery health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe filter */}
          <div className="flex items-center p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            {(['today', '7d', '30d', '90d'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                  timeframe === t
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'today' ? 'Today' : t}
              </button>
            ))}
          </div>

          {/* Export CSV Report Button */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Tasks in System"
              value={data.totalTasks}
              change="+18%"
              comparison="vs prev period"
              isPositive={true}
              icon={CheckCircle2}
            />
            <StatCard
              title="Tasks Completed"
              value={data.kpis.tasksCompleted.value}
              change={data.kpis.tasksCompleted.change}
              comparison={data.kpis.tasksCompleted.comparison}
              isPositive={true}
              icon={TrendingUp}
            />
            <StatCard
              title="Active Initiatives"
              value={data.kpis.activeProjects.value}
              change="+1"
              comparison="healthy delivery"
              isPositive={true}
              icon={Layers}
            />
            <StatCard
              title="At-Risk Deliverables"
              value={data.kpis.tasksAtRisk.value}
              change="-2"
              comparison="mitigated by AI"
              isPositive={true}
              icon={AlertTriangle}
            />
          </div>

          {/* Charts Row 1: Weekly Velocity & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Velocity Line/Bar Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Task Completion Velocity Trend</h3>
                  <p className="text-xs text-slate-500">Daily throughput across active business hours</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Completed
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overdue
                  </span>
                </div>
              </div>

              {/* Chart Bars */}
              <div className="h-60 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
                {data.weeklyProductivity.map((dayData, idx) => {
                  const maxVal = 18;
                  const completedH = (dayData.completed / maxVal) * 100;
                  const overdueH = (dayData.overdue / maxVal) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow mb-1 pointer-events-none whitespace-nowrap">
                        {dayData.completed} completed · {dayData.avgHours}h avg
                      </div>

                      <div className="w-full max-w-[44px] flex items-end justify-center gap-1.5 h-48">
                        <div
                          className="w-5 bg-indigo-600 rounded-t-lg hover:bg-indigo-700 transition-all duration-300 relative"
                          style={{ height: `${completedH}%` }}
                        >
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 tabular-nums">
                            {dayData.completed}
                          </span>
                        </div>
                        {dayData.overdue > 0 && (
                          <div
                            className="w-3.5 bg-rose-500 rounded-t-lg hover:bg-rose-600 transition-all duration-300"
                            style={{ height: `${overdueH}%` }}
                          />
                        )}
                      </div>

                      <span className="text-xs font-semibold text-slate-600 mt-2">{dayData.day}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Average completion time: <strong>5.7 hours/task</strong></span>
                <span>On-time adherence: <strong>89.4%</strong></span>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Task Status Breakdown</h3>
                <p className="text-xs text-slate-500">Current workflow funnel distribution</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'Completed', count: data.statusDistribution.COMPLETED, color: 'bg-emerald-500', bar: 'bg-emerald-500' },
                  { label: 'In Review', count: data.statusDistribution.IN_REVIEW, color: 'bg-purple-500', bar: 'bg-purple-500' },
                  { label: 'In Progress', count: data.statusDistribution.IN_PROGRESS, color: 'bg-blue-500', bar: 'bg-blue-500' },
                  { label: 'To Do', count: data.statusDistribution.TODO, color: 'bg-slate-400', bar: 'bg-slate-400' },
                  { label: 'Blocked', count: data.statusDistribution.BLOCKED, color: 'bg-rose-500', bar: 'bg-rose-500' },
                ].map(item => {
                  const pct = data.totalTasks > 0 ? Math.round((item.count / data.totalTasks) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Department Performance & Priority Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Performance */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department Performance &amp; Output</h3>
                <p className="text-xs text-slate-500">Throughput, staffing headcount, and average productivity index</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-center">Team Members</th>
                      <th className="py-2.5 px-3 text-center">Total Tasks</th>
                      <th className="py-2.5 px-3 text-center">Completed</th>
                      <th className="py-2.5 px-3">Delivery Rate</th>
                      <th className="py-2.5 px-3 text-right">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.departmentPerformance.map(dept => (
                      <tr key={dept.department} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{dept.department}</td>
                        <td className="py-3 px-3 text-center tabular-nums text-slate-600">{dept.headcount}</td>
                        <td className="py-3 px-3 text-center tabular-nums text-slate-600">{dept.totalTasks}</td>
                        <td className="py-3 px-3 text-center tabular-nums font-semibold text-emerald-600">{dept.completedTasks}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 tabular-nums">{dept.completionRate}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${dept.completionRate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                          {dept.avgScore}/100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Task Priority Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Priority Distribution</h3>
                <p className="text-xs text-slate-500">Urgency classification across current sprint</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'Urgent', count: data.priorityDistribution.URGENT, bar: 'bg-rose-500', text: 'text-rose-700' },
                  { label: 'High', count: data.priorityDistribution.HIGH, bar: 'bg-amber-500', text: 'text-amber-700' },
                  { label: 'Medium', count: data.priorityDistribution.MEDIUM, bar: 'bg-sky-500', text: 'text-sky-700' },
                  { label: 'Low', count: data.priorityDistribution.LOW, bar: 'bg-slate-400', text: 'text-slate-600' },
                ].map(item => {
                  const pct = data.totalTasks > 0 ? Math.round((item.count / data.totalTasks) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
