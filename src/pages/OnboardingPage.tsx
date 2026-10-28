import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../api/client';
import { User, Project, Task, Invitation, UserRole } from '../types';
import {
  Workflow,
  Building,
  Users,
  FolderGit2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  RotateCw,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Clock,
  Layers,
  Mail,
  Shield,
  Briefcase,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Welcome', icon: Sparkles },
  { id: 2, label: 'Organization', icon: Building },
  { id: 3, label: 'Team', icon: Users },
  { id: 4, label: 'First Project', icon: FolderGit2 },
  { id: 5, label: 'First Task', icon: Layers },
  { id: 6, label: 'Complete', icon: CheckCircle2 },
];

export const OnboardingPage: React.FC = () => {
  const { user, organization, completeOnboarding, refreshUser } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [currentStep, setCurrentStepState] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('technova_onboarding_step');
      const parsed = saved ? parseInt(saved, 10) : 1;
      return parsed >= 1 && parsed <= 6 ? parsed : 1;
    } catch {
      return 1;
    }
  });

  const setCurrentStep = (step: number) => {
    setCurrentStepState(step);
    try {
      sessionStorage.setItem('technova_onboarding_step', step.toString());
    } catch {
      // ignore storage failure
    }
  };

  const [loading, setLoading] = useState(false);

  // Step 2: Organization details
  const [orgName, setOrgName] = useState(organization?.name || 'TechNova Solutions');
  const [industry, setIndustry] = useState(organization?.industry || 'Software / Technology');
  const [companySize, setCompanySize] = useState(organization?.companySize || '11–50');
  const [department, setDepartment] = useState(organization?.department || 'Engineering');

  // Step 3: Team members & Invitations
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('employee');
  const [newMemberDept, setNewMemberDept] = useState('Engineering');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Step 4: First Project
  const [projectName, setProjectName] = useState('AI Employee Productivity Platform');
  const [projectDescription, setProjectDescription] = useState('Internal platform for managing employee workflows, workload distribution, and automated AI sprint insights.');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  // Step 5: First Task
  const [taskTitle, setTaskTitle] = useState('Design Dashboard UI');
  const [taskDescription, setTaskDescription] = useState('Create core responsive cards, KPI metrics widgets, and modern dark mode layout.');
  const [taskAssignee, setTaskAssignee] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [taskEstimatedHours, setTaskEstimatedHours] = useState(8);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  // Fetch initial org members and existing projects if already added
  const fetchCurrentWorkspaceState = async () => {
    try {
      const [usersRes, invRes, projectsRes] = await Promise.all([
        api.getUsers().catch(() => ({ users: [] })),
        api.getInvitations().catch(() => ({ invitations: [] })),
        api.getProjects().catch(() => ({ projects: [] })),
      ]);
      setTeamMembers(usersRes.users || []);
      setInvitations(invRes.invitations || []);

      if (projectsRes.projects && projectsRes.projects.length > 0) {
        setCreatedProject(projectsRes.projects[0]);
        setProjectName(projectsRes.projects[0].name);
        if (projectsRes.projects[0].description) {
          setProjectDescription(projectsRes.projects[0].description);
        }
      }

      if (user?._id) {
        setSelectedMembers(prev => prev.length > 0 ? prev : [user._id]);
        setTaskAssignee(prev => prev || user._id);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  useEffect(() => {
    fetchCurrentWorkspaceState();
  }, []);

  // Update selected member when team members change
  useEffect(() => {
    if (teamMembers.length > 0 && !taskAssignee) {
      // Pick first non-admin or first user
      const candidate = teamMembers.find(m => m._id !== user?._id) || teamMembers[0];
      if (candidate) {
        setTaskAssignee(candidate._id);
      }
    }
  }, [teamMembers]);

  // Handle Step 2: Save Org
  const handleSaveOrganization = async () => {
    if (!orgName.trim()) {
      showToast('Please enter an organization name', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.setupOrganization({
        name: orgName.trim(),
        industry,
        companySize,
        department,
      });
      showToast('Organization settings updated', 'success');
      setCurrentStep(3);
    } catch (err: any) {
      showToast(err.message || 'Failed to update organization', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3: Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.addEmployee({
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        role: newMemberRole,
        department: newMemberDept,
        jobTitle: newMemberTitle || `${newMemberDept} Specialist`,
      });

      showToast(`Added ${res.user.name} to team`, 'success');
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberTitle('');
      setShowAddMemberModal(false);

      // Refresh team and invitations list
      await fetchCurrentWorkspaceState();

      // Automatically select newly added member for project
      setSelectedMembers(prev => Array.from(new Set([...prev, res.user._id])));
      setTaskAssignee(res.user._id);
    } catch (err: any) {
      showToast(err.message || 'Failed to add employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend invitation
  const handleResendInvitation = async (invId: string) => {
    try {
      const res = await api.resendInvitation(invId);
      showToast(res.message, 'success');
      await fetchCurrentWorkspaceState();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend invitation', 'error');
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invId: string) => {
    try {
      await api.deleteInvitation(invId);
      showToast('Invitation cancelled', 'success');
      await fetchCurrentWorkspaceState();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel invitation', 'error');
    }
  };

  // Copy invitation link
  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    showToast('Invitation link copied to clipboard', 'success');
    setTimeout(() => setCopiedToken(null), 3000);
  };

  // Handle Step 4: Create First Project
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const memberList = selectedMembers.length > 0 ? selectedMembers : (user?._id ? [user._id] : []);
      const res = await api.createProject({
        name: projectName.trim(),
        description: projectDescription.trim(),
        startDate,
        deadline,
        memberIds: memberList,
        leadId: user?._id,
        department: department || user?.department || 'Engineering',
      });

      setCreatedProject(res.project);
      showToast(`Project "${res.project.name}" ready!`, 'success');
      setCurrentStep(5);
    } catch (err: any) {
      console.warn('Project creation error, attempting fallback lookup:', err);
      try {
        const existing = await api.getProjects();
        if (existing.projects && existing.projects.length > 0) {
          setCreatedProject(existing.projects[0]);
          showToast(`Project "${existing.projects[0].name}" linked`, 'info');
          setCurrentStep(5);
          return;
        }
      } catch {
        // ignore
      }
      showToast(err.message || 'Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 5: Create First Task
  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    setLoading(true);
    try {
      let projectId = createdProject?._id;
      if (!projectId) {
        const pRes = await api.getProjects().catch(() => ({ projects: [] }));
        if (pRes.projects && pRes.projects.length > 0) {
          projectId = pRes.projects[0]._id;
          setCreatedProject(pRes.projects[0]);
        }
      }

      if (!projectId) {
        const pFallback = await api.createProject({
          name: projectName.trim() || 'Core Workspace Project',
          description: projectDescription.trim() || 'Primary workflow project',
          department: department || user?.department || 'Engineering',
        });
        projectId = pFallback.project._id;
        setCreatedProject(pFallback.project);
      }

      const finalAssignee = taskAssignee || user?._id;
      const res = await api.createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        projectId,
        assignedTo: finalAssignee,
        priority: taskPriority,
        dueDate: taskDueDate,
        estimatedHours: Number(taskEstimatedHours) || 8,
      });

      setCreatedTask(res.task);
      showToast(`Task "${res.task.title}" created`, 'success');
      setCurrentStep(6);
    } catch (err: any) {
      console.warn('Task creation error:', err);
      showToast(err.message || 'Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 6: Complete Onboarding & Enter Dashboard
  const handleEnterDashboard = async () => {
    setLoading(true);
    try {
      sessionStorage.removeItem('technova_onboarding_step');
      await completeOnboarding();
      await refreshUser();
      showToast('Workspace setup completed! Loading your dashboard.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.warn('Complete onboarding fallback:', err);
      sessionStorage.removeItem('technova_onboarding_step');
      showToast('Workspace setup completed! Loading your dashboard.', 'success');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Workflow className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">TechNova Workspace Setup</h1>
            <p className="text-xs text-slate-400">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}</p>
          </div>
        </div>

        {/* Step Indicator Badges */}
        <div className="hidden sm:flex items-center gap-2">
          {STEPS.map(step => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : isCompleted
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-800/40 text-slate-500 border border-slate-800 hover:text-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8 relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <Sparkles className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome to TechNova Workspace
                </h2>
                <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                  Let's set up your workspace in a few steps. You'll establish your organization, invite your team, and start your first project with real task tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-xl mx-auto text-left">
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                  <Building className="w-5 h-5 text-indigo-400 mb-2" />
                  <h4 className="text-xs font-bold text-white">Your Workspace</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Starting clean with your authentic enterprise details.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                  <Users className="w-5 h-5 text-purple-400 mb-2" />
                  <h4 className="text-xs font-bold text-white">Invite Real Team</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Add colleagues with specific roles and pending invites.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                  <Layers className="w-5 h-5 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-white">Real AI Analytics</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Gemini AI analyzes actual workflows as tasks advance.</p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ORGANIZATION SETUP */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 2 of 6</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Organization Setup</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure your company workspace details. This is stored in MongoDB and anchors all team permissions.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Organization Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. TechNova Solutions"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Industry</label>
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    >
                      <option value="Software / Technology">Software / Technology</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Healthcare & Biotech">Healthcare &amp; Biotech</option>
                      <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                      <option value="Design & Creative Agency">Design &amp; Creative Agency</option>
                      <option value="Consulting & Professional Services">Consulting &amp; Professional Services</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Size</label>
                    <select
                      value={companySize}
                      onChange={e => setCompanySize(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    >
                      <option value="1–10">1–10 employees</option>
                      <option value="11–50">11–50 employees</option>
                      <option value="51–200">51–200 employees</option>
                      <option value="201–500">201–500 employees</option>
                      <option value="500+">500+ enterprise</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveOrganization}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Save &amp; Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TEAM SETUP & INVITATIONS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 3 of 6</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Who are you working with?</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Add employees to your organization. Each employee creates an active MongoDB record and pending invitation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              </div>

              {/* Members List */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Workspace Team Members ({teamMembers.length})
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {teamMembers.map(member => (
                    <div
                      key={member._id}
                      className="p-3 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={member.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white truncate">{member.name}</p>
                            {member._id === user?._id && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-medium">
                                You (Admin)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {member.email} · {member.jobTitle || member.role} ({member.department})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-semibold">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Invitations Section */}
                {invitations.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Pending Invitations ({invitations.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {invitations.map(inv => (
                        <div
                          key={inv._id}
                          className="p-3 bg-slate-900/60 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white">{inv.name}</p>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium">
                                Pending invitation
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {inv.email} · {inv.role} ({inv.department})
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyInviteLink(inv.token)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 inline-flex items-center gap-1"
                              title="Copy Direct Invitation Link"
                            >
                              {copiedToken === inv.token ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedToken === inv.token ? 'Copied' : 'Invite Link'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResendInvitation(inv._id)}
                              className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold rounded-lg border border-indigo-500/20 inline-flex items-center gap-1"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Resend</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelInvitation(inv._id)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold rounded-lg border border-rose-500/20 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to First Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FIRST PROJECT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 4 of 6</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Let's create your first project</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Projects group workflows, team members, and milestones. Stored in MongoDB with automatic progress calculation.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Project Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. AI Employee Productivity Platform"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={projectDescription}
                    onChange={e => setProjectDescription(e.target.value)}
                    placeholder="Internal platform for managing employee workflows..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Deadline</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                {/* Team Members Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assign Team Members ({selectedMembers.length} selected)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {teamMembers.map(member => {
                      const isSelected = selectedMembers.includes(member._id);
                      return (
                        <div
                          key={member._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMembers(prev => prev.filter(id => id !== member._id));
                            } else {
                              setSelectedMembers(prev => [...prev, member._id]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span className="text-xs font-bold truncate">{member.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">({member.role})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="px-3.5 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCreateProject}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{loading ? 'Creating Project…' : 'Create Project & Next'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FIRST TASK */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 5 of 6</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Now create your first task</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Assign this task to yourself or an invited teammate. This initiates the workflow lifecycle.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Task Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Design Dashboard UI"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Task Description</label>
                  <textarea
                    rows={2}
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    placeholder="Specify implementation scope..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assignee</label>
                    <select
                      value={taskAssignee}
                      onChange={e => setTaskAssignee(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    >
                      {teamMembers.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.jobTitle || m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estimated Hours</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={taskEstimatedHours}
                      onChange={e => setTaskEstimatedHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="px-3.5 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCreateTask}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{loading ? 'Creating Task…' : 'Create Task & Review'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: COMPLETE */}
          {currentStep === 6 && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Your Workspace is Ready!
                </h2>
                <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                  You've established your actual organization, invited your teammates, created your first initiative, and logged your first task.
                </p>
              </div>

              {/* Real Database Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Organization</p>
                  <p className="text-sm font-bold text-white mt-1 truncate">{orgName}</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Active Team</p>
                  <p className="text-sm font-bold text-indigo-400 mt-1">{teamMembers.length} Member(s)</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Active Projects</p>
                  <p className="text-sm font-bold text-purple-400 mt-1">1 Project</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks In Flight</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">1 Task</p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleEnterDashboard}
                  className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center text-xs text-slate-500 pb-2 relative z-10">
        Enterprise Workflow &amp; Productivity Platform · Powered by Google Gemini AI
      </div>

      {/* Add Employee Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Add Employee to Organization</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  placeholder="rahul@technova.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={newMemberDept}
                    onChange={e => setNewMemberDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={newMemberTitle}
                  onChange={e => setNewMemberTitle(e.target.value)}
                  placeholder="e.g. Software Engineer / UI Designer"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add & Create Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
