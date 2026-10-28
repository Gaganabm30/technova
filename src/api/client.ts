import {
  User,
  Task,
  Project,
  NotificationItem,
  ActivityItem,
  DailyBrief,
  AnalyticsOverview,
  TaskStatus,
  TaskPriority,
  Organization,
  Invitation,
} from '../types';

const TOKEN_KEY = 'technova_auth_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
  const url = `${baseUrl}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User; organization?: Organization; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    role?: string;
    department?: string;
    jobTitle?: string;
  }) =>
    request<{ token: string; user: User; organization: Organization; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: User; organization?: Organization }>('/auth/me'),

  completeOnboarding: () =>
    request<{ success: boolean; user: User; message: string }>('/auth/complete-onboarding', {
      method: 'POST',
    }),

  setupOrganization: (data: { name?: string; industry?: string; companySize?: string; department?: string }) =>
    request<{ success: boolean; organization: Organization; message: string }>('/auth/organization-setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrganizations: () =>
    request<{ organizations: Organization[]; currentOrganizationId?: string }>('/auth/organizations'),

  switchOrganization: (organizationId: string) =>
    request<{ success: boolean; token: string; user: User; organization: Organization; message: string }>('/auth/switch-organization', {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    }),

  exploreDemo: () =>
    request<{ token: string; user: User; organization?: Organization; message: string }>('/auth/explore-demo', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; demoNotice?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetDemoData: () =>
    request<{ message: string }>('/auth/reset-demo-data', {
      method: 'POST',
    }),

  // Invitations
  getInvitations: () => request<{ invitations: Invitation[] }>('/invitations'),

  createInvitation: (data: { name: string; email: string; role: string; department: string }) =>
    request<{ invitation: Invitation; inviteLink: string; emailNotice?: string; message: string }>('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendInvitation: (id: string) =>
    request<{ invitation: Invitation; inviteLink: string; message: string }>(`/invitations/${id}/resend`, {
      method: 'POST',
    }),

  deleteInvitation: (id: string) =>
    request<{ success: boolean; message: string }>(`/invitations/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: (params: { projectId?: string; assignedTo?: string; status?: string; priority?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.projectId) query.append('projectId', params.projectId);
    if (params.assignedTo) query.append('assignedTo', params.assignedTo);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request<{ tasks: Task[]; count: number }>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  getTask: (id: string) => request<{ task: Task }>(`/tasks/${id}`),

  createTask: (data: Partial<Task>) =>
    request<{ task: Task; message: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (id: string, data: Partial<Task>) =>
    request<{ task: Task; message: string }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateTaskStatus: (id: string, status: TaskStatus) =>
    request<{ task: Task; message: string }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateTaskPriority: (id: string, priority: TaskPriority) =>
    request<{ task: Task; message: string }>(`/tasks/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    }),

  addTaskComment: (id: string, content: string) =>
    request<{ task: Task; comments: any[]; message: string }>(`/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getComments: (taskId: string) =>
    request<{ comments: any[] }>(`/tasks/${taskId}/comments`),

  deleteComment: (taskId: string, commentId: string) =>
    request<{ success: boolean; message: string }>(`/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  deleteTask: (id: string) =>
    request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Projects
  getProjects: () => request<{ projects: Project[] }>('/projects'),

  getProject: (id: string) => request<{ project: Project }>(`/projects/${id}`),

  createProject: (data: Partial<Project>) =>
    request<{ project: Project; message: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, data: Partial<Project>) =>
    request<{ project: Project; message: string }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // Users
  getUsers: () => request<{ users: User[] }>('/users'),

  getUser: (id: string) => request<{ user: User }>(`/users/${id}`),

  addEmployee: (data: { name: string; email: string; role: string; department: string; jobTitle?: string }) =>
    request<{ user: User; invitation?: Invitation; inviteLink: string; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (id: string, data: Partial<User>) =>
    request<{ user: User; message: string }>(`/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivateEmployee: (id: string) =>
    request<{ user: User; message: string }>(`/users/${id}/deactivate`, {
      method: 'PATCH',
    }),

  deleteEmployee: (id: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  changeEmployeeRole: (id: string, role: string) =>
    request<{ user: User; message: string }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  // AI Intelligence
  getDailyBrief: () => request<{ brief: DailyBrief }>('/ai/daily-brief'),

  analyzeProductivity: (userId?: string) =>
    request<{
      success: boolean;
      data: {
        summary: string;
        strengths: string[];
        bottlenecks: string[];
        risks: string[];
        recommendations: string[];
        generatedAt: string;
      };
      analyzedFor: { id: string; name: string; role: string; department: string };
    }>('/ai/productivity-analysis', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  prioritizeTasks: (userId?: string) =>
    request<{
      success: boolean;
      data: {
        strategicSummary: string;
        prioritizedTasks: {
          taskId: string;
          title: string;
          currentPriority: TaskPriority;
          recommendedPriority: TaskPriority;
          order: number;
          reason: string;
        }[];
      };
    }>('/ai/prioritize-tasks', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  applyPriorities: (priorities: { taskId: string; recommendedPriority: TaskPriority }[]) =>
    request<{ success: boolean; message: string }>('/ai/apply-priorities', {
      method: 'POST',
      body: JSON.stringify({ priorities }),
    }),

  analyzeWorkload: () =>
    request<{
      success: boolean;
      data: {
        overview?: string;
        summary?: string;
        recommendations: string[];
        members?: any[];
        teamBreakdown?: any[];
      };
    }>('/ai/workload-analysis', {
      method: 'POST',
    }),

  predictDeadlineRisk: (projectId?: string) =>
    request<{
      success: boolean;
      data: {
        projectId: string;
        projectName: string;
        deadline: string;
        daysRemaining: number;
        totalTasks: number;
        completedTasks: number;
        remainingTasks: number;
        overdueTasks: number;
        blockedTasks: number;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        evidenceFactors: { factor: string; impact: string; detail: string }[];
        mainContributingFactors: string[];
        recommendedMitigation: string[];
        ruleBasedSummary: string;
        lastCalculatedAt: string;
      };
    }>('/ai/deadline-risk', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),

  getDailyPlanner: (capacityHours = 8, userId?: string) =>
    request<{
      success: boolean;
      data: {
        workingCapacityHours: number;
        plannedHoursTotal: number;
        capacityUtilizationPercent: number;
        strategicSummary: string;
        recommendedTasks: {
          taskId: string;
          title: string;
          suggestedOrder: number;
          estimatedHours: number;
          urgencyReason: string;
          status: string;
          priority: string;
          dueDate: string;
        }[];
        generatedAt: string;
      };
      user: { id: string; name: string; role: string; department: string };
    }>('/ai/daily-planner', {
      method: 'POST',
      body: JSON.stringify({ capacityHours, userId }),
    }),

  askAssistant: (query: string) =>
    request<{
      success: boolean;
      query: string;
      answer: string;
      references: { type: 'task' | 'project'; id: string; name: string }[];
      timestamp: string;
    }>('/ai/assistant-chat', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  parseMeetingNotes: (notes: string) =>
    request<{
      success: boolean;
      data: {
        notesSummary: string;
        proposedTasks: {
          title: string;
          description: string;
          suggestedAssigneeId?: string;
          suggestedAssigneeName?: string;
          suggestedPriority: TaskPriority;
          suggestedDueDate?: string;
          suggestedProjectId?: string;
          suggestedProjectName?: string;
          confidenceReason: string;
        }[];
      };
    }>('/ai/parse-meeting-notes', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  getProjectBrief: (projectId: string) =>
    request<{
      success: boolean;
      data: {
        projectName: string;
        projectKey: string;
        status: string;
        progress: number;
        completedWorkSummary: string;
        openAndBlockedSummary: string;
        upcomingMilestones: { title: string; dueDate: string; completed: boolean }[];
        deadlineAssessment: string;
        recommendedNextSteps: string[];
        generatedAt: string;
      };
    }>('/ai/project-brief', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),

  // Task Attachments
  addTaskAttachment: (taskId: string, data: { name: string; size: number; url?: string; type?: string }) =>
    request<{ task: Task; attachment: any; message: string }>(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTaskAttachment: (taskId: string, attachmentId: string) =>
    request<{ task: Task; message: string }>(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),

  // Project Milestones
  toggleMilestone: (projectId: string, milestoneId: string, completed?: boolean) =>
    request<{ project: Project; message: string }>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),

  // Password Reset
  resetPassword: (data: { token: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Accept Invitation
  acceptInvitation: (data: { token: string; password: string; name?: string }) =>
    request<{ success: boolean; token: string; user: User; organization: Organization; message: string }>('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyInvitation: (token: string) =>
    request<{ invitation: Invitation; organizationName: string }>(`/invitations/verify/${token}`),

  // Analytics
  getAnalyticsOverview: (dateRange = '30d') =>
    request<AnalyticsOverview>(`/analytics/overview?dateRange=${dateRange}`),

  // Notifications & Activity
  getNotifications: () => request<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),

  runAutomations: () =>
    request<{ success: boolean; message: string; triggeredCount: number; notificationsCreated: number }>('/notifications/run-automations', {
      method: 'POST',
    }),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; updatedCount: number }>('/notifications/mark-all-read', {
      method: 'POST',
    }),

  deleteNotification: (id: string) =>
    request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),

  getActivities: (limit = 30) => request<{ activities: ActivityItem[] }>(`/notifications/activities?limit=${limit}`),
};

