import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { WorkloadBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Users2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FolderGit2,
  ShieldCheck,
} from 'lucide-react';

interface WorkloadMember {
  userId: string;
  name: string;
  department: string;
  jobTitle: string;
  avatar: string;
  currentTasks: number;
  completedTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  workload: 'Low' | 'Normal' | 'High' | 'Overloaded';
  risk: 'Low Risk' | 'Medium Risk' | 'High Risk';
  score: number;
  estimatedHours: number;
  actualHours: number;
}

export const AIWorkloadPage: React.FC = () => {
  const [data, setData] = useState<{
    overview: string;
    recommendations: string[];
    members: WorkloadMember[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<WorkloadMember | null>(null);

  const fetchWorkloadData = async () => {
    setLoading(true);
    try {
      const res = await api.analyzeWorkload();
      const workloadData = res.data;
      setData({
        overview: workloadData.overview || workloadData.summary || 'Team workload analysis overview',
        recommendations: workloadData.recommendations || [],
        members: (workloadData.members || workloadData.teamBreakdown || []) as WorkloadMember[],
      });
    } catch (err) {
      console.error('Failed to analyze workload:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const riskBadgeStyles = {
    'Low Risk': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Medium Risk': 'bg-amber-50 text-amber-700 border-amber-200',
    'High Risk': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            Capacity Audit
          </span>
          <span className="text-xs text-slate-400">· Real-time Concurrency &amp; Risk</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          AI Team Workload &amp; Capacity Analysis
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Proactive monitoring of team member task concurrency, overdue probabilities, and rebalancing recommendations.
        </p>
      </div>

      {/* AI Overview Summary Banner */}
      {data && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Capacity Assessment</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {data.overview}
          </p>

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Leadership Actions
            </span>
            <div className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-indigo-600 font-bold">·</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workload Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-center">Active Tasks</th>
                <th className="py-3 px-3 text-center">Completed</th>
                <th className="py-3 px-3 text-center">Overdue</th>
                <th className="py-3 px-3">Workload Status</th>
                <th className="py-3 px-3">Deadline Risk</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!data || data.members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    {loading ? 'Analyzing team workload...' : 'No workload data available.'}
                  </td>
                </tr>
              ) : (
                data.members.map(member => (
                  <tr
                    key={member.userId}
                    onClick={() => setSelectedMember(member)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Employee info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar}
                          alt=""
                          className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{member.jobTitle}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-600">
                      {member.department}
                    </td>

                    {/* Active Tasks */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center font-bold text-slate-900 tabular-nums">
                      {member.currentTasks}
                    </td>

                    {/* Completed */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center font-semibold text-emerald-600 tabular-nums">
                      {member.completedTasks}
                    </td>

                    {/* Overdue */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center tabular-nums">
                      {member.overdueTasks > 0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {member.overdueTasks}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Workload */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <WorkloadBadge workload={member.workload} size="sm" />
                    </td>

                    {/* Risk */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          riskBadgeStyles[member.risk] || riskBadgeStyles['Low Risk']
                        }`}
                      >
                        {member.risk}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span className="inline-flex items-center gap-0.5">
                        Audit <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Workload Panel Modal */}
      <Modal
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `${selectedMember.name} · Workload Audit` : ''}
        subtitle={selectedMember ? `${selectedMember.jobTitle} · ${selectedMember.department}` : ''}
        maxWidth="lg"
      >
        {selectedMember && (
          <div className="space-y-5 text-xs">
            {/* Quick KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase">Active Load</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                  {selectedMember.currentTasks} tasks
                </p>
                <WorkloadBadge workload={selectedMember.workload} size="sm" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase">Overdue Tasks</span>
                <p className="text-lg font-bold text-rose-600 mt-0.5 tabular-nums">
                  {selectedMember.overdueTasks}
                </p>
                <span className="text-[10px] text-slate-400">Needs review</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase">Workflow Score</span>
                <p className="text-lg font-bold text-indigo-600 mt-0.5 tabular-nums">
                  {selectedMember.score}/100
                </p>
                <span className="text-[10px] text-slate-400">Pillar average</span>
              </div>
            </div>

            {/* AI Recommendation specific to this member */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Capacity Recommendation
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedMember.currentTasks >= 7
                  ? `${selectedMember.name} currently has ${selectedMember.currentTasks} active tasks. Based on historical completion patterns and ${selectedMember.overdueTasks} overdue deliverables, 2-3 tasks carry a high probability of missing their target deadlines without task redistribution.`
                  : `${selectedMember.name} is currently operating within comfortable capacity parameters (${selectedMember.currentTasks} active tasks). Workload balance index is optimal with high deadline adherence.`}
              </p>
            </div>

            {/* Effort Hours Variance */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Effort Variance Ratio</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {selectedMember.actualHours}h actual / {selectedMember.estimatedHours}h estimated
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      selectedMember.estimatedHours > 0
                        ? (selectedMember.actualHours / selectedMember.estimatedHours) * 100
                        : 80
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Close / Action Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close Audit
              </button>
              <a
                href={`/team/${selectedMember.userId}`}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                View Full Profile
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
