import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { User, Task } from '../types';
import { WorkloadBadge, StatusBadge, PriorityBadge } from '../components/common/Badge';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { useNotifications } from '../context/NotificationContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Sparkles,
  Gauge,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [member, setMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Productivity Analysis
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    summary: string;
    strengths: string[];
    bottlenecks: string[];
    risks: string[];
    recommendations: string[];
  } | null>(null);

  // Drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchProfile = async () => {
    if (!id) return;
    try {
      const res = await api.getUser(id);
      setMember(res.user);
    } catch (err) {
      showToast('User profile not found', 'error');
      navigate('/team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleAnalyzeProductivity = async () => {
    if (!id) return;
    setAnalyzingAi(true);
    try {
      const res = await api.analyzeProductivity(id);
      setAiAnalysisResult(res.data);
      showToast('AI Workflow analysis generated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze productivity', 'error');
    } finally {
      setAnalyzingAi(false);
    }
  };

  if (loading || !member) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">Loading member profile...</div>
    );
  }

  const breakdown = member.scoreBreakdown || {
    completionRate: 85,
    deadlineAdherence: 85,
    workloadBalance: 85,
    consistency: 85,
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/team')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Team Directory</span>
      </button>

      {/* Profile Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={member.avatar}
            alt={member.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{member.name}</h1>
              {member.workloadCategory && (
                <WorkloadBadge workload={member.workloadCategory} />
              )}
            </div>
            <p className="text-xs font-medium text-slate-600">{member.jobTitle}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {member.department}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {member.email}
              </span>
              {member.phone && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {member.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleAnalyzeProductivity}
          disabled={analyzingAi}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{analyzingAi ? 'Analyzing Workflow...' : 'Analyze Workflow with AI'}</span>
        </button>
      </div>

      {/* Productivity Score Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Workflow Productivity Index
            </h3>
            <p className="text-xs text-slate-500">
              Mathematical synthesis of task completion, on-time adherence, capacity, and velocity
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-400 italic">
            *Performance indicator based on sprint workflows, not personal evaluation
          </span>
        </div>

        {/* Score and Metric Breakdown Bars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Big Score Number */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-slate-900 tabular-nums">
              {member.productivityScore || 85}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Score / 100
            </span>
            <span className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              High Operational Velocity
            </span>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">Task Completion</span>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{breakdown.completionRate}%</p>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${breakdown.completionRate}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">Deadline Adherence</span>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{breakdown.deadlineAdherence}%</p>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${breakdown.deadlineAdherence}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">Workload Balance</span>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{breakdown.workloadBalance}%</p>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${breakdown.workloadBalance}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">Consistency Index</span>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{breakdown.consistency}%</p>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${breakdown.consistency}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Explanation text */}
        {member.explanation && (
          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
            {member.explanation}
          </p>
        )}
      </div>

      {/* AI Analysis Result Panel (if generated) */}
      {aiAnalysisResult && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-200/80 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Gemini AI Workflow Intelligence Report
            </h3>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
            {aiAnalysisResult.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Key Strengths
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5">
                {aiAnalysisResult.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span>·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Bottlenecks &amp; Risks
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5">
                {aiAnalysisResult.bottlenecks.concat(aiAnalysisResult.risks).map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span>·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Actionable Workflow Recommendations
            </span>
            <ul className="text-xs text-slate-600 space-y-1.5">
              {aiAnalysisResult.recommendations.map((r, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">{idx + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Assigned Tasks Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Assigned Tasks ({member.tasks?.length || 0})
        </h3>

        <div className="divide-y divide-slate-100">
          {!member.tasks || member.tasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No tasks currently assigned to this member.</p>
          ) : (
            member.tasks.map(task => (
              <div
                key={task._id}
                onClick={() => {
                  setSelectedTask(task);
                  setDrawerOpen(true);
                }}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{task.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Due: {task.dueDate} · {task.actualHours}h actual / {task.estimatedHours}h est
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

      {/* Task Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskUpdated={() => fetchProfile()}
        onTaskDeleted={() => {
          setDrawerOpen(false);
          fetchProfile();
        }}
        onEditClick={() => {
          setDrawerOpen(false);
        }}
      />
    </div>
  );
};
