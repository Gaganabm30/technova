import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyBrief } from '../../types';
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface DailyBriefBannerProps {
  brief: DailyBrief | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const DailyBriefBanner: React.FC<DailyBriefBannerProps> = ({ brief, loading, onRefresh }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md animate-pulse">
        <div className="h-4 w-32 bg-slate-700 rounded mb-3" />
        <div className="h-6 w-3/4 bg-slate-700 rounded mb-2" />
        <div className="h-4 w-1/2 bg-slate-700 rounded" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">AI Strategic Brief Ready to Generate</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Create your organization's first tasks and projects to unlock real-time Gemini AI workload analysis.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          )}
          <button
            onClick={() => navigate('/tasks')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Tasks Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const generatedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white shadow-md border border-slate-800 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            AI Daily Brief
          </span>
          <span className="text-[10px] text-slate-400 font-medium">· Updated {generatedTime}</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Recalculate AI Daily Brief"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Summary Narrative */}
      <p className="text-sm font-medium text-slate-200 mb-4 max-w-3xl leading-relaxed">
        {brief.summary}
      </p>

      {/* Highlights & Recommendation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 mb-5">
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Key Highlights
          </span>
          <div className="space-y-1">
            {brief.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Recommended Leadership Action
          </span>
          <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
            {brief.recommendedAction}
          </p>
        </div>
      </div>

      {/* Interactive Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate('/ai-insights')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <span>View AI Insights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => navigate('/tasks?status=BLOCKED')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer"
        >
          <span>Review At-Risk Tasks</span>
        </button>
      </div>
    </div>
  );
};
