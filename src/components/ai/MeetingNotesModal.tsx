import React, { useState } from 'react';
import { api } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';
import { Sparkles, FileText, CheckCircle2, Plus, Calendar, User, Folder, Trash2 } from 'lucide-react';
import { Project, User as UserType, TaskPriority } from '../../types';

interface MeetingNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  users: UserType[];
  onTasksCreated: () => void;
}

interface DraftTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  projectId: string;
  assignedTo: string;
  dueDate: string;
  selected: boolean;
  confidenceReason?: string;
}

export const MeetingNotesModal: React.FC<MeetingNotesModalProps> = ({
  isOpen,
  onClose,
  projects,
  users,
  onTasksCreated,
}) => {
  const { showToast } = useNotifications();
  const [notes, setNotes] = useState('');
  const [parsing, setParsing] = useState(false);
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [saving, setSaving] = useState(false);

  const sampleNotes = `Meeting: Sprint 44 Architecture & Launch Readiness
Date: Today
Attendees: Ananya, Rahul, Vikram

1. Rahul needs to finish the multi-tenant organization isolation testing for the audit by Friday.
2. Ananya will review the enterprise SLA security headers and CSRF configurations.
3. We need a task for Vikram to prepare the Kubernetes deployment manifest before next Monday.
4. Blocked: Payment gateway webhook requires updated credentials from the vendor team.`;

  const handleParse = async () => {
    if (!notes.trim()) {
      showToast('Please paste meeting notes first.', 'error');
      return;
    }

    setParsing(true);
    try {
      const res = await api.parseMeetingNotes(notes);
      const generatedDrafts: DraftTask[] = (res.data?.proposedTasks || []).map((t, idx) => {
        // Resolve project ID or default to first project
        const matchedProj = projects.find(p => p._id === t.suggestedProjectId || p.name.toLowerCase() === t.suggestedProjectName?.toLowerCase());
        const matchedUser = users.find(u => u._id === t.suggestedAssigneeId || u.name.toLowerCase() === t.suggestedAssigneeName?.toLowerCase());

        return {
          id: 'draft_' + Date.now() + '_' + idx,
          title: t.title,
          description: t.description,
          priority: (t.suggestedPriority as TaskPriority) || 'MEDIUM',
          projectId: matchedProj?._id || projects[0]?._id || '',
          assignedTo: matchedUser?._id || users[0]?._id || '',
          dueDate: t.suggestedDueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          selected: true,
          confidenceReason: t.confidenceReason,
        };
      });

      setDrafts(generatedDrafts);
      showToast(`Generated ${generatedDrafts.length} proposed draft task(s)`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to parse meeting notes', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleCreateTasks = async () => {
    const selected = drafts.filter(d => d.selected);
    if (selected.length === 0) {
      showToast('Please select at least one task to create.', 'warning');
      return;
    }

    setSaving(true);
    try {
      let createdCount = 0;
      for (const d of selected) {
        if (!d.title.trim() || !d.projectId) continue;
        await api.createTask({
          title: d.title,
          description: d.description,
          projectId: d.projectId,
          assignedTo: d.assignedTo,
          priority: d.priority,
          dueDate: d.dueDate,
          estimatedHours: 6,
        });
        createdCount++;
      }

      showToast(`Successfully created ${createdCount} task(s) from meeting notes!`, 'success');
      onTasksCreated();
      onClose();
      setDrafts([]);
      setNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create tasks', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (id: string, updates: Partial<DraftTask>) => {
    setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Meeting Notes to Tasks" maxWidth="xl">
      <div className="space-y-6">
        {/* Step 1: Input Notes */}
        {drafts.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Paste Raw Meeting Notes, Transcript, or Sprint Minutes
              </label>
              <button
                type="button"
                onClick={() => setNotes(sampleNotes)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Insert Sample Notes
              </button>
            </div>

            <textarea
              rows={8}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Paste notes from Zoom, Google Meet, or Slack discussions..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                AI analyzes action items, matches project names, identifies assignees, and infers priorities. All tasks are created as <strong>drafts</strong> for your review before saving.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={parsing || !notes.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
              >
                {parsing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Extracting Action Items...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Draft Tasks
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Review and Edit Drafts */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  Review & Approve Extracted Tasks ({drafts.filter(d => d.selected).length}/{drafts.length} selected)
                </h4>
                <p className="text-[11px] text-slate-400">Verify assignees, deadlines, and project associations before saving.</p>
              </div>

              <button
                type="button"
                onClick={() => setDrafts([])}
                className="text-xs text-indigo-400 hover:underline"
              >
                Re-paste Notes
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {drafts.map(draft => (
                <div
                  key={draft.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    draft.selected
                      ? 'bg-slate-800/90 border-indigo-500/50'
                      : 'bg-slate-850/50 border-slate-700/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={draft.selected}
                      onChange={e => updateDraft(draft.id, { selected: e.target.checked })}
                      className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />

                    <div className="flex-1 space-y-3">
                      <div>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={e => updateDraft(draft.id, { title: e.target.value })}
                          className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                        />
                        {draft.confidenceReason && (
                          <p className="text-[11px] text-indigo-400/80 mt-1">{draft.confidenceReason}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        {/* Project selector */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Project</label>
                          <select
                            value={draft.projectId}
                            onChange={e => updateDraft(draft.id, { projectId: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            {projects.map(p => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Assignee selector */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Assignee</label>
                          <select
                            value={draft.assignedTo}
                            onChange={e => updateDraft(draft.id, { assignedTo: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            {users.map(u => (
                              <option key={u._id} value={u._id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Priority selector */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Priority</label>
                          <select
                            value={draft.priority}
                            onChange={e => updateDraft(draft.id, { priority: e.target.value as TaskPriority })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Due Date</label>
                          <input
                            type="date"
                            value={draft.dueDate}
                            onChange={e => updateDraft(draft.id, { dueDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDraft(draft.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Discard draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTasks}
                disabled={saving || drafts.filter(d => d.selected).length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Tasks...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create {drafts.filter(d => d.selected).length} Approved Task(s)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
