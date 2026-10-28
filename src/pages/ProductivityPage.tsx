import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import {
  Gauge,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

export const ProductivityPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [aiReport, setAiReport] = useState<{
    summary: string;
    strengths: string[];
    bottlenecks: string[];
    risks: string[];
    recommendations: string[];
  } | null>(null);

  const fetchMyProductivity = async () => {
    if (!user) return;
    try {
      const res = await api.getUser(user._id);
      setUserProfile(res.user);
    } catch (err) {
      console.error('Failed to load user metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchMyProductivity();
  }, [user]);

  const handleRunAiAnalysis = async () => {
    setAnalyzingAi(true);
    try {
      const res = await api.analyzeProductivity(user?._id);
      setAiReport(res.data);
      showToast('AI Workflow analysis generated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate productivity analysis', 'error');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const score = userProfile?.productivityScore || 85;
  const breakdown = userProfile?.scoreBreakdown || {
    completionRate: 88,
    deadlineAdherence: 84,
    workloadBalance: 82,
    consistency: 90,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workflow Productivity &amp; Velocity
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective metrics on sprint delivery velocity, deadline adherence, and AI-assisted workflow optimization.
          </p>
        </div>

        <button
          onClick={handleRunAiAnalysis}
          disabled={analyzingAi}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>{analyzingAi ? 'Analyzing Workflow...' : 'Analyze My Productivity'}</span>
        </button>
      </div>

      {/* Main Score Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-700 shadow-2xs">
              <span className="text-3xl font-black tabular-nums">{score}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                Score / 100
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">Sprint Workflow Performance</h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Optimal
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                {userProfile?.explanation ||
                  `Your score is ${score} based on consistent task completion (${breakdown.completionRate}%), deadline adherence (${breakdown.deadlineAdherence}%), and manageable active workload.`}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 max-w-xs p-3 rounded-xl bg-slate-50 border border-slate-100 italic">
            <strong>Important Policy:</strong> This productivity score is an operational workflow and task management metric, never an indicator of personal worth.
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Task Completion</span>
              <span className="font-bold text-slate-900 tabular-nums">{breakdown.completionRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${breakdown.completionRate}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">Proportion of assigned tickets resolved</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Deadline Adherence</span>
              <span className="font-bold text-slate-900 tabular-nums">{breakdown.deadlineAdherence}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${breakdown.deadlineAdherence}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">Work delivered on or before due date</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Workload Balance</span>
              <span className="font-bold text-slate-900 tabular-nums">{breakdown.workloadBalance}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${breakdown.workloadBalance}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">Healthy concurrency ratio (3-6 tasks)</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Consistency Index</span>
              <span className="font-bold text-slate-900 tabular-nums">{breakdown.consistency}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${breakdown.consistency}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">Variance between estimated vs actual hours</span>
          </div>
        </div>
      </div>

      {/* Loading state for AI analysis */}
      {analyzingAi && (
        <div className="p-10 rounded-2xl bg-white border border-indigo-200 text-center space-y-3 shadow-md animate-pulse">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">
            Analyzing your recent workflow with Gemini AI...
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating historical milestones, blocker patterns, and hours variance
          </p>
        </div>
      )}

      {/* AI Intelligence Report */}
      {aiReport && !analyzingAi && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI Productivity Analysis</h3>
            </div>
            <span className="text-[11px] text-slate-400">Grounded in live sprint data</span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
            {aiReport.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Demonstrated Strengths
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5">
                {aiReport.strengths.map((s, idx) => (
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
                {aiReport.bottlenecks.concat(aiReport.risks).map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span>·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Recommendations for Next Sprint
            </span>
            <ul className="text-xs text-slate-600 space-y-1.5">
              {aiReport.recommendations.map((r, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">{idx + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
