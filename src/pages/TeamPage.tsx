import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { User, Invitation, UserRole } from '../types';
import { WorkloadBadge } from '../components/common/Badge';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Mail,
  ArrowRight,
  Plus,
  RotateCw,
  Trash2,
  Copy,
  Check,
  UserPlus,
  AlertCircle,
  Loader2,
  Shield,
  ChevronDown,
  X,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'HR', 'Finance'];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin / VP' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin / VP',
  manager: 'Manager',
  team_lead: 'Team Lead',
  employee: 'Employee',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  team_lead: 'bg-teal-100 text-teal-700',
  employee: 'bg-slate-100 text-slate-600',
};

// ─── component ────────────────────────────────────────────────────────────────

export const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const { showToast } = useNotifications();

  const isAdmin = currentUser?.role === 'admin';
  const canManageTeam = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // ── data state ──────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // ── filter state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [workloadFilter, setWorkloadFilter] = useState('');

  // ── invite modal state ──────────────────────────────────────────────────────
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('employee');
  const [newMemberDept, setNewMemberDept] = useState('Engineering');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submittingMember, setSubmittingMember] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  // ── role-change dropdown state ───────────────────────────────────────────────
  const [roleChangingId, setRoleChangingId] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  // ── copied link state ───────────────────────────────────────────────────────
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // ── fetch ───────────────────────────────────────────────────────────────────
  const fetchTeamData = useCallback(async () => {
    try {
      const [uRes, invRes] = await Promise.all([api.getUsers(), api.getInvitations()]);
      setUsers(uRes.users);
      setInvitations(invRes.invitations);
    } catch (err) {
      console.error('Failed to load team members:', err);
      showToast('Failed to load team data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handler = () => setRoleDropdownOpen(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── modal helpers ───────────────────────────────────────────────────────────
  const resetModal = () => {
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('employee');
    setNewMemberDept('Engineering');
    setNewMemberTitle('');
    setFormErrors({});
    setSubmitError(null);
    setLastInviteLink(null);
  };

  const openModal = () => {
    resetModal();
    setAddModalOpen(true);
  };

  const closeModal = () => {
    if (submittingMember) return; // prevent closing during submission
    setAddModalOpen(false);
    resetModal();
  };

  // ── form validation ─────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const trimmedName = newMemberName.trim();
    const trimmedEmail = newMemberEmail.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!newMemberDept) {
      errors.department = 'Please select a department.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── submit invite ────────────────────────────────────────────────────────────
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;
    if (submittingMember) return; // prevent duplicate submissions

    setSubmittingMember(true);
    try {
      const res = await api.addEmployee({
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole,
        department: newMemberDept,
        jobTitle: newMemberTitle.trim() || `${newMemberDept} Specialist`,
      });

      // Show invite link if available
      if (res.inviteLink) {
        setLastInviteLink(`${window.location.origin}${res.inviteLink}`);
      }

      showToast(
        `${res.user.name} added — invitation link ready to share`,
        'success'
      );

      // Reset form fields but keep modal open briefly to show invite link
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberTitle('');
      setFormErrors({});

      await fetchTeamData();

      // Auto-close after 3 seconds if an invite link is shown, otherwise close now
      if (!res.inviteLink) {
        setAddModalOpen(false);
        resetModal();
      }
    } catch (err: any) {
      // Keep modal open so user can correct the issue
      setSubmitError(err.message || 'Failed to add employee. Please try again.');
    } finally {
      setSubmittingMember(false);
    }
  };

  // ── invitation actions ───────────────────────────────────────────────────────
  const handleResendInvitation = async (invId: string) => {
    try {
      const res = await api.resendInvitation(invId);
      showToast(res.message, 'success');
      await fetchTeamData();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend invitation', 'error');
    }
  };

  const handleCancelInvitation = async (invId: string) => {
    try {
      await api.deleteInvitation(invId);
      showToast('Invitation cancelled', 'success');
      await fetchTeamData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel invitation', 'error');
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopiedToken(token);
    showToast('Invitation link copied to clipboard', 'success');
    setTimeout(() => setCopiedToken(null), 3000);
  };

  // ── role change ──────────────────────────────────────────────────────────────
  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!isAdmin) return;
    setRoleDropdownOpen(null);
    setRoleChangingId(memberId);
    try {
      const res = await api.changeEmployeeRole(memberId, newRole);
      showToast(res.message, 'success');
      if (memberId === currentUser?._id) {
        await refreshUser();
      }
      await fetchTeamData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    } finally {
      setRoleChangingId(null);
    }
  };

  // ── filter ───────────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    if (departmentFilter && u.department !== departmentFilter) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    if (workloadFilter && u.workloadCategory !== workloadFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.department || '').toLowerCase().includes(q) &&
        !(u.jobTitle || '').toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const pendingInvitations = invitations.filter(i => i.status === 'pending');

  // ── loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Loading team directory…</p>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Organization Team Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employees, pending invitations, workload balance, and workflow productivity indicators.
          </p>
        </div>

        {canManageTeam && (
          <button
            id="invite-employee-btn"
            onClick={openModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Employee</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, department…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="employee">Employee</option>
          </select>

          <select
            value={workloadFilter}
            onChange={e => setWorkloadFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Workloads</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Overloaded">Overloaded</option>
          </select>

          {(search || departmentFilter || roleFilter || workloadFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setDepartmentFilter('');
                setRoleFilter('');
                setWorkloadFilter('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>Pending Team Invitations ({pendingInvitations.length})</span>
            </h3>
            <span className="text-[11px] text-amber-700">Share invite links to onboard new members</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingInvitations.map(inv => (
              <div
                key={inv._id}
                className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">{inv.name}</span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                      Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{inv.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {ROLE_LABELS[inv.role] || inv.role} · {inv.department}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCopyInviteLink(inv.token)}
                    className="flex-1 py-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 inline-flex items-center justify-center gap-1 transition-colors"
                  >
                    {copiedToken === inv.token ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken === inv.token ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  {canManageTeam && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleResendInvitation(inv._id)}
                        className="py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-lg border border-indigo-200 inline-flex items-center gap-1 transition-colors"
                        title="Resend invitation"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Resend</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(inv._id)}
                        className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg border border-rose-200 inline-flex items-center gap-1 transition-colors"
                        title="Cancel invitation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredUsers.length <= 1 && pendingInvitations.length === 0 && !search && !departmentFilter && canManageTeam && (
        <div className="p-8 bg-white rounded-2xl border border-dashed border-indigo-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Invite your team to start managing workflow</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add engineers, designers, and managers to allocate projects, balance team capacity, and track AI productivity.
            </p>
          </div>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite First Teammate</span>
          </button>
        </div>
      )}

      {/* Team Cards Grid */}
      {filteredUsers.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No team members match your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map(member => {
            const counts = member.taskCounts || { total: 0, completed: 0 };
            const completionPct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
            const isChangingRole = roleChangingId === member._id;

            return (
              <div
                key={member._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group space-y-4"
              >
                {/* Member Header */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 shrink-0 cursor-pointer"
                    onClick={() => navigate(`/team/${member._id}`)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3
                        className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate cursor-pointer"
                        onClick={() => navigate(`/team/${member._id}`)}
                      >
                        {member.name}
                      </h3>
                      {member.workloadCategory && (
                        <WorkloadBadge workload={member.workloadCategory} size="sm" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{member.jobTitle || ROLE_LABELS[member.role]}</p>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {member.department}
                    </span>
                  </div>
                </div>

                {/* Role Badge + Admin Role-Changer */}
                <div className="flex items-center justify-between">
                  {isAdmin && member._id !== currentUser?._id ? (
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={isChangingRole}
                        onClick={() => setRoleDropdownOpen(roleDropdownOpen === member._id ? null : member._id)}
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors ${ROLE_COLORS[member.role]} border-current/20 hover:opacity-80`}
                        title="Click to change role (admin only)"
                      >
                        <Shield className="w-3 h-3" />
                        {isChangingRole ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            {ROLE_LABELS[member.role]}
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </>
                        )}
                      </button>

                      {roleDropdownOpen === member._id && (
                        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[130px]">
                          {ROLE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleRoleChange(member._id, opt.value)}
                              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors ${member.role === opt.value ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'}`}
                            >
                              {opt.label}
                              {member.role === opt.value && ' ✓'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${ROLE_COLORS[member.role]}`}>
                      <Shield className="w-3 h-3 inline mr-1" />
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}

                  {member.status === 'pending' && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Pending Activation
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">Workflow Score</span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      {member.productivityScore || 0}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">Active Tasks</span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      {counts.total - counts.completed}{' '}
                      <span className="text-[10px] font-normal text-slate-400">({completionPct}% done)</span>
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400 cursor-pointer"
                  onClick={() => navigate(`/team/${member._id}`)}
                >
                  <span className="truncate">{member.email}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Invite Employee Modal ────────────────────────────────────────────── */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 id="invite-modal-title" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Invite Employee to Team</span>
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={submittingMember}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success invite-link banner */}
            {lastInviteLink && (
              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-emerald-800">Employee added! Share this invite link:</p>
                  <p className="text-emerald-700 break-all mt-0.5">{lastInviteLink}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(lastInviteLink);
                      showToast('Invite link copied!', 'success');
                    }}
                    className="mt-1.5 text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy link
                  </button>
                </div>
              </div>
            )}

            {/* Backend error banner */}
            {submitError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <p className="text-rose-700 font-medium">{submitError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddEmployee} className="space-y-3.5" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="invite-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="invite-name"
                  type="text"
                  autoComplete="name"
                  value={newMemberName}
                  onChange={e => {
                    setNewMemberName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                    setSubmitError(null);
                  }}
                  onBlur={() => {
                    if (!newMemberName.trim()) setFormErrors(prev => ({ ...prev, name: 'Full name is required.' }));
                  }}
                  placeholder="e.g. Priya Nair"
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${formErrors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-indigo-500'}`}
                  disabled={submittingMember}
                />
                {formErrors.name && (
                  <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="invite-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={newMemberEmail}
                  onChange={e => {
                    setNewMemberEmail(e.target.value);
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
                    setSubmitError(null);
                  }}
                  onBlur={() => {
                    const v = newMemberEmail.trim();
                    if (!v) setFormErrors(prev => ({ ...prev, email: 'Email address is required.' }));
                    else if (!EMAIL_RE.test(v)) setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
                  }}
                  placeholder="priya@company.com"
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${formErrors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-indigo-500'}`}
                  disabled={submittingMember}
                />
                {formErrors.email && (
                  <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Role + Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="invite-role" className="block text-xs font-semibold text-slate-700 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="invite-role"
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-indigo-500"
                    disabled={submittingMember}
                  >
                    <option value="employee">Employee</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="manager">Manager</option>
                    {isAdmin && <option value="admin">Admin / VP</option>}
                  </select>
                </div>

                <div>
                  <label htmlFor="invite-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="invite-dept"
                    value={newMemberDept}
                    onChange={e => {
                      setNewMemberDept(e.target.value);
                      if (formErrors.department) setFormErrors(prev => ({ ...prev, department: undefined }));
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-white font-medium focus:outline-none focus:border-indigo-500 ${formErrors.department ? 'border-rose-400' : 'border-slate-200'}`}
                    disabled={submittingMember}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {formErrors.department && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.department}</p>
                  )}
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label htmlFor="invite-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  id="invite-title"
                  type="text"
                  value={newMemberTitle}
                  onChange={e => setNewMemberTitle(e.target.value)}
                  placeholder={`e.g. Senior ${newMemberDept} Engineer`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                  disabled={submittingMember}
                />
              </div>

              {/* Notice about email delivery */}
              <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <strong>Note:</strong> Email delivery is in demo mode. After adding, copy and share the invitation link manually.
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submittingMember}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  {lastInviteLink ? 'Done' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-60 flex items-center gap-1.5 transition-colors"
                >
                  {submittingMember ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add &amp; Create Invite</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
