import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Project } from '../types';
import { HealthBadge } from '../components/common/Badge';
import { ProjectModal } from '../components/projects/ProjectModal';
import { FolderGit2, Plus, Search, Calendar, CheckSquare, Users, ArrowRight } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.getProjects();
      setProjects(res.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    if (healthFilter && p.health !== healthFilter) return false;
    if (departmentFilter && p.department !== departmentFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchKey = p.key.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      if (!matchName && !matchKey && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Organization Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor strategic initiatives, sprint milestones, team allocation, and delivery health.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects by name, key, or scope..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Product">Product</option>
            <option value="HR">HR</option>
          </select>

          <select
            value={healthFilter}
            onChange={e => setHealthFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="">All Health Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="At Risk">At Risk</option>
            <option value="Delayed">Delayed</option>
          </select>

          {(search || healthFilter || departmentFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setHealthFilter('');
                setDepartmentFilter('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FolderGit2 className="w-7 h-7" />
          </div>
          <div className="max-w-sm">
            <h3 className="text-base font-bold text-slate-900">You haven't created any projects yet.</h3>
            <p className="text-xs text-slate-500 mt-1">
              Set up your team's initiatives and sprints to begin tracking tasks, progress, and workload.
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No projects match your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(project => {
            const progress = project.progress || 0;

            return (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
              >
                {/* Top: Key, Name, Health */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                      {project.key}
                    </span>
                    <HealthBadge health={project.health} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                    {project.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{progress}% complete</span>
                    <span className="font-medium text-slate-400 tabular-nums">
                      {project.completedTaskCount || 0} / {project.taskCount || 0} tasks
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        project.health === 'Delayed'
                          ? 'bg-rose-500'
                          : project.health === 'At Risk'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer: Deadline, Team Members, Lead */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-600 tabular-nums">Due {project.deadline}</span>
                  </div>

                  {/* Team Avatars */}
                  <div className="flex items-center -space-x-1.5">
                    {project.members && project.members.slice(0, 4).map((m, idx) => (
                      <img
                        key={idx}
                        src={m.avatar}
                        alt={m.name}
                        title={m.name}
                        className="w-5 h-5 rounded-full object-cover ring-2 ring-white"
                      />
                    ))}
                    {project.members && project.members.length > 4 && (
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 ring-2 ring-white text-[9px] font-bold flex items-center justify-center">
                        +{project.members.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => fetchProjects()}
      />
    </div>
  );
};
