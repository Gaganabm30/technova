import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  CheckSquare,
  FolderGit2,
  Users,
  Gauge,
  Sparkles,
  Users2,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X,
  Workflow,
  MessageSquareText,
  CalendarCheck2,
  FileText,
  BrainCircuit,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isTeamLead = user?.role === 'team_lead';
  const canManageTeam = isAdmin || isManager;
  const canViewAnalytics = isAdmin || isManager || isTeamLead;

  const workspaceItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'My Tasks', path: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'Projects', path: '/projects', icon: FolderGit2, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'Team', path: '/team', icon: Users, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'Productivity', path: '/productivity', icon: Gauge, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager', 'team_lead', 'employee'] },
  ].filter(item => !item.roles || (user?.role && item.roles.includes(user.role)));

  const aiItems = [
    { name: 'AI Workload', path: '/ai-workload', icon: Users2, roles: ['admin', 'manager', 'team_lead'] },
    { name: 'AI Chat', path: '/ai-chat', icon: MessageSquareText, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'Daily Planner', path: '/ai-daily-planner', icon: CalendarCheck2, roles: ['admin', 'manager', 'team_lead', 'employee'] },
    { name: 'Meeting Notes', path: '/meeting-notes', icon: FileText, roles: ['admin', 'manager', 'team_lead', 'employee'] },
  ].filter(item => !item.roles || (user?.role && item.roles.includes(user.role)));


  const roleLabels: Record<string, string> = {
    admin: 'Admin / VP',
    manager: 'Manager',
    team_lead: 'Team Lead',
    employee: 'Employee',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Workflow className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                TechNova <span className="text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/50">OS</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </div>

          {workspaceItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* AI Section */}
          <div className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BrainCircuit className="w-3 h-3 text-amber-400" />
            AI Intelligence
          </div>

          {aiItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-amber-400 group-[.active]:text-white" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          {user && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                onClick={() => {
                  navigate(`/team/${user._id}`);
                  onClose();
                }}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {roleLabels[user.role]} · {user.department}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
