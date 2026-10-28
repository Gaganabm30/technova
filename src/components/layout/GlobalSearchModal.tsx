import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Task, Project, User } from '../../types';
import { Search, CheckSquare, FolderGit2, User as UserIcon, X, ArrowRight, Sparkles, CalendarCheck2, FileText, BrainCircuit } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        api.getTasks(),
        api.getProjects(),
        api.getUsers(),
      ])
        .then(([tasksRes, projRes, usersRes]) => {
          setTasks(tasksRes.tasks);
          setProjects(projRes.projects);
          setUsers(usersRes.users);
        })
        .finally(() => setLoading(false));
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredTasks = q
    ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))).slice(0, 5)
    : tasks.slice(0, 3);

  const filteredProjects = q
    ? projects.filter(p => p.name.toLowerCase().includes(p.name.toLowerCase()) && (p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))).slice(0, 4)
    : projects.slice(0, 3);

  const filteredUsers = q
    ? users.filter(u => u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.jobTitle.toLowerCase().includes(q)).slice(0, 4)
    : users.slice(0, 3);

  const aiQuickActions = [
    { title: 'AI Assistant Chat', description: 'Interactive AI workplace assistant', url: '/ai-chat', icon: Sparkles },
    { title: 'Daily Action Planner', description: 'Sequenced task planner based on capacity', url: '/ai-daily-planner', icon: CalendarCheck2 },
    { title: 'Meeting Notes to Tasks', description: 'Extract tasks and action items from minutes', url: '/meeting-notes', icon: FileText },
    { title: 'AI Workload & Burnout Balance', description: 'Team allocation & cognitive load analysis', url: '/ai-workload', icon: BrainCircuit },
  ];

  const filteredAiActions = q
    ? aiQuickActions.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    : aiQuickActions.slice(0, 3);

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Search Palette */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, projects, people, or AI tools..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden font-normal"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading directory data...</div>
          ) : (
            <>
              {/* AI Quick Actions */}
              {filteredAiActions.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> AI Intelligence Tools
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">{filteredAiActions.length} tools</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {filteredAiActions.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.url}
                          onClick={() => handleSelect(action.url)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50/60 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-100/70 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{action.title}</p>
                              <p className="text-[11px] text-slate-400 truncate">{action.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks Category */}
              <div>
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Tasks</span>
                  <span className="text-[10px] font-normal">{filteredTasks.length} results</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {filteredTasks.length === 0 ? (
                    <p className="px-2 py-1.5 text-xs text-slate-400 italic">No tasks matching search</p>
                  ) : (
                    filteredTasks.map(t => (
                      <button
                        key={t._id}
                        onClick={() => handleSelect(`/tasks`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{t.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {t.projectName || 'Project'} · {t.priority} · {t.status}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Projects Category */}
              <div>
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Projects</span>
                  <span className="text-[10px] font-normal">{filteredProjects.length} results</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {filteredProjects.length === 0 ? (
                    <p className="px-2 py-1.5 text-xs text-slate-400 italic">No projects matching search</p>
                  ) : (
                    filteredProjects.map(p => (
                      <button
                        key={p._id}
                        onClick={() => handleSelect(`/projects/${p._id}`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FolderGit2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {p.name} <span className="text-[10px] text-slate-400">({p.key})</span>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {p.department} · {p.health} · {p.status}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Team Members Category */}
              <div>
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Team Members</span>
                  <span className="text-[10px] font-normal">{filteredUsers.length} results</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {filteredUsers.length === 0 ? (
                    <p className="px-2 py-1.5 text-xs text-slate-400 italic">No team members matching search</p>
                  ) : (
                    filteredUsers.map(u => (
                      <button
                        key={u._id}
                        onClick={() => handleSelect(`/team/${u._id}`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {u.jobTitle} · {u.department}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press ESC to close</span>
          <span>Click any result to jump to page</span>
        </div>
      </div>
    </div>
  );
};
