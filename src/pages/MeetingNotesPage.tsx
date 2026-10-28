import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import { Project, TaskPriority } from '../types';
import { PriorityBadge } from '../components/common/Badge';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Plus,
  Loader2,
  ClipboardList,
  User,
  Calendar,
  FolderGit2,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

interface ProposedTask {
  title: string;
  description: string;
  suggestedAssigneeId?: string;
  suggestedAssigneeName?: string;
  suggestedPriority: TaskPriority;
  suggestedDueDate?: string;
  suggestedProjectId?: string;
  suggestedProjectName?: string;
  confidenceReason: string;
  selected: boolean;
  creating?: boolean;
  created?: boolean;
  error?: string;
}

const PLACEHOLDER_NOTES = `Weekly Engineering Standup — Oct 28

Attendees: Rahul Kumar, Priya Singh, Arjun Mehta, Ananya Sharma

Discussion:
- Rahul will fix the authentication token expiry bug by Friday. Urgent.
- Priya needs to complete the dashboard UI redesign mockups by Wednesday. 
- Arjun to write unit tests for the payment gateway module. Medium priority, end of next week.
- Ananya will review the API documentation and update it. Low priority.
- The team agreed that the database migration script needs to be tested in staging before Nov 5.
- Action: Priya to coordinate with the design team on brand color guidelines.

Next meeting: Monday 9 AM`;

export const MeetingNotesPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [notes, setNotes] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [parsing, setParsing] = useState(false);
  const [notesSummary, setNotesSummary] = useState('');
  const [tasks, setTasks] = useState<ProposedTask[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [creatingAll, setCreatingAll] = useState(false);

  useEffect(() => {
    api.getProjects().then(res => setProjects(res.projects)).catch(() => {});
  }, []);

  const handleParse = async () => {
    if (!notes.trim()) {
      showToast('Please paste your meeting notes first', 'error');
      return;
    }
    setParsing(true);
    try {
      const res = await api.parseMeetingNotes(notes);
      setNotesSummary(res.data.notesSummary);
      setTasks(
        res.data.proposedTasks.map(t => ({
          ...t,
          selected: true,
          creating: false,
          created: false,
        }))
      );
      setHasParsed(true);
      showToast(`Found ${res.data.proposedTasks.length} actionable tasks`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to parse meeting notes', 'error');
    } finally {
      setParsing(false);
    }
  };

  const createSingleTask = async (idx: number) => {
    const task = tasks[idx];
    if (!task || task.created || task.creating) return;

    setTasks(prev =>
      prev.map((t, i) => (i === idx ? { ...t, creating: true, error: undefined } : t))
    );

    try {
      await api.createTask({
        title: task.title,
        description: task.description,
        priority: task.suggestedPriority,
        dueDate: task.suggestedDueDate,
        assignedTo: task.suggestedAssigneeId || '',
        projectId: task.suggestedProjectId || '',
        status: 'TODO',
        estimatedHours: 2,
        tags: ['from-meeting-notes'],
        comments: [],
        activity: [],
      });
      setTasks(prev =>
        prev.map((t, i) => (i === idx ? { ...t, creating: false, created: true } : t))
      );
    } catch (err: any) {
      setTasks(prev =>
        prev.map((t, i) =>
          i === idx ? { ...t, creating: false, error: err.message || 'Failed to create' } : t
        )
      );
    }
  };

  const createSelectedTasks = async () => {
    setCreatingAll(true);
    const selectedIdxs = tasks.map((t, i) => (t.selected && !t.created ? i : -1)).filter(i => i >= 0);
    for (const idx of selectedIdxs) {
      await createSingleTask(idx);
    }
    setCreatingAll(false);
    const createdCount = tasks.filter(t => t.selected && !t.error).length;
    showToast(`${selectedCount} tasks queued for creation`, 'success');
  };

  const toggleTask = (idx: number) => {
    setTasks(prev =>
      prev.map((t, i) => (i === idx ? { ...t, selected: !t.selected } : t))
    );
  };

  const selectedCount = tasks.filter(t => t.selected && !t.created).length;
  const createdCount = tasks.filter(t => t.created).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            AI Meeting Parser
          </span>
          <span className="text-xs text-slate-400">· Convert notes to tasks</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Meeting Notes → Action Items
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Paste meeting notes and the AI will extract actionable tasks with assignees, priorities, and due dates.
        </p>
      </div>

      {/* Notes Input */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Meeting Notes
          </h2>
          <button
            onClick={() => setNotes(PLACEHOLDER_NOTES)}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            Load example →
          </button>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Paste your meeting notes, standup notes, or any unstructured text here..."
          className="w-full h-52 px-4 py-3 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-slate-400">{notes.length} characters</p>
          <button
            onClick={handleParse}
            disabled={!notes.trim() || parsing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {parsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Notes...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract Action Items
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasParsed && (
        <>
          {/* Summary */}
          {notesSummary && (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3" /> AI Meeting Summary
              </p>
              <p className="text-xs text-indigo-800 leading-relaxed">{notesSummary}</p>
            </div>
          )}

          {/* Proposed Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Proposed Tasks
                <span className="text-xs font-normal text-slate-500">
                  ({tasks.length} found · {selectedCount} selected)
                </span>
              </h2>
              {selectedCount > 0 && (
                <button
                  onClick={createSelectedTasks}
                  disabled={creatingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {creatingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Create {selectedCount} Tasks
                    </>
                  )}
                </button>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No actionable tasks were found in the meeting notes.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      task.created
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : task.selected
                        ? 'border-indigo-200 bg-indigo-50/30'
                        : 'border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      {!task.created ? (
                        <button
                          onClick={() => toggleTask(idx)}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-colors cursor-pointer shrink-0 ${
                            task.selected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {task.selected && <Check className="w-3 h-3" />}
                        </button>
                      ) : (
                        <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-emerald-500 text-white shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <PriorityBadge priority={task.suggestedPriority} />
                            {task.created && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                Created ✓
                              </span>
                            )}
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {task.suggestedAssigneeName && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <User className="w-3 h-3 text-slate-400" />
                              {task.suggestedAssigneeName}
                            </span>
                          )}
                          {task.suggestedProjectName && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <FolderGit2 className="w-3 h-3 text-slate-400" />
                              {task.suggestedProjectName}
                            </span>
                          )}
                          {task.suggestedDueDate && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(task.suggestedDueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 mt-1.5 flex items-start gap-1">
                          <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-indigo-300" />
                          {task.confidenceReason}
                        </p>

                        {task.error && (
                          <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            {task.error}
                          </p>
                        )}
                      </div>

                      {/* Create single button */}
                      {!task.created && task.selected && (
                        <button
                          onClick={() => createSingleTask(idx)}
                          disabled={task.creating}
                          className="px-3 py-1.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {task.creating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Create'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {createdCount > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {createdCount} task{createdCount > 1 ? 's' : ''} successfully created and added to your workspace.
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!hasParsed && !parsing && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Paste your meeting notes</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            The AI will read through them and extract all action items, assign them to team members, and suggest priorities and deadlines.
          </p>
        </div>
      )}
    </div>
  );
};
