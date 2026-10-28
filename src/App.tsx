import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { UserRole } from './types';

import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TeamPage } from './pages/TeamPage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { ProductivityPage } from './pages/ProductivityPage';
import { AIWorkloadPage } from './pages/AIWorkloadPage';
import { AIChatPage } from './pages/AIChatPage';
import { AIDailyPlannerPage } from './pages/AIDailyPlannerPage';
import { MeetingNotesPage } from './pages/MeetingNotesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';

// ─── Loading Spinner ──────────────────────────────────────────────────────────

const FullPageSpinner: React.FC<{ label?: string }> = ({ label = 'Initializing TechNova Workspace…' }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="font-semibold text-slate-300">{label}</span>
    </div>
  </div>
);

// ─── Access Denied Page ───────────────────────────────────────────────────────

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.74-2.97L13.74 4a2 2 0 00-3.48 0L3.26 16.03A2 2 0 005.07 19z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Access Denied</h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your role (<strong>{user?.role}</strong>) does not have permission to access this page.
            Contact your organization admin to request access.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

// ─── Protected Route (authenticated + onboarding) ────────────────────────────

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed
  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect away from onboarding if already completed
  if (user.onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check role permissions
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};

// ─── Public Route (auto-redirects authenticated users) ───────────────────────

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner label="Loading…" />;
  }

  if (user) {
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* ── Public Auth Routes ── */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

            {/* ── Accept Invitation (public — no auth required) ── */}
            <Route path="/invite/:token" element={<AcceptInvitationPage />} />

            {/* ── Onboarding (authenticated, onboarding not yet done) ── */}
            <Route
              path="/onboarding"
              element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>}
            />

            {/* ── Authenticated Workspace Routes ── */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Root → Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard — all authenticated roles */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Tasks — all roles */}
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tasks/:id" element={<TasksPage />} />

              {/* Projects — all roles */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />

              {/* Team directory — all roles can view */}
              <Route path="/team" element={<TeamPage />} />
              <Route path="/team/:id" element={<EmployeeProfilePage />} />

              {/* Productivity — all roles */}
              <Route path="/productivity" element={<ProductivityPage />} />

              {/* Analytics — admin and manager only */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* AI Insights removed — safe redirect to dashboard */}
              <Route path="/ai-insights" element={<Navigate to="/dashboard" replace />} />

              {/* AI Workload — admin, manager, team_lead */}
              <Route
                path="/ai-workload"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'team_lead']}>
                    <AIWorkloadPage />
                  </ProtectedRoute>
                }
              />

              {/* AI Chat — all roles */}
              <Route path="/ai-chat" element={<AIChatPage />} />

              {/* Daily Planner — all roles */}
              <Route path="/ai-daily-planner" element={<AIDailyPlannerPage />} />

              {/* Meeting Notes — all roles */}
              <Route path="/meeting-notes" element={<MeetingNotesPage />} />

              {/* Notifications — all roles */}
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Settings — all roles (page shows role-appropriate options) */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback: unknown routes → dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
