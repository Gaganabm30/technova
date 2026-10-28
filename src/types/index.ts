export type UserRole = 'admin' | 'manager' | 'team_lead' | 'employee';

export interface Organization {
  _id: string;
  name: string;
  industry: string;
  companySize: string;
  department: string;
  ownerId: string;
  isDemo?: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'pending' | 'accepted' | 'cancelled';
  token: string;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  organizationId?: string;
  name: string;
  email: string;
  role: UserRole;
  department: 'Engineering' | 'Design' | 'Product' | 'Marketing' | 'HR' | 'Finance' | string;
  jobTitle: string;
  avatar: string;
  status: 'active' | 'away' | 'busy' | 'pending';
  bio?: string;
  phone?: string;
  skills?: string[];
  productivityScore?: number;
  scoreBreakdown?: {
    completionRate: number;
    deadlineAdherence: number;
    workloadBalance: number;
    consistency: number;
    overdueRatio?: number;
  };
  explanation?: string;
  workloadCategory?: 'Low' | 'Normal' | 'High' | 'Overloaded';
  riskLevel?: 'Low Risk' | 'Medium Risk' | 'High Risk';
  onboardingCompleted?: boolean;
  isDemo?: boolean;
  taskCounts?: {
    total: number;
    completed: number;
    inProgress: number;
    inReview: number;
    todo: number;
    blocked: number;
    overdue: number;
  };
  tasks?: Task[];
  projects?: {
    id: string;
    name: string;
    key: string;
    health: string;
    deadline: string;
  }[];
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DeadlineRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface Task {
  _id: string;
  organizationId?: string;
  title: string;
  description: string;
  projectId: string;
  projectName?: string;
  projectKey?: string;
  assignedTo: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  assigneeJobTitle?: string;
  createdBy: string;
  creatorName?: string;
  ownerId?: string;
  ownerName?: string;
  startDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  dependencies?: string[];
  blockedBy?: string[];
  attachments?: TaskAttachment[];
  comments: TaskComment[];
  activity: TaskActivity[];
  deadlineRisk: DeadlineRisk;
  riskReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectHealth = 'Healthy' | 'At Risk' | 'Delayed';

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface ProjectMember {
  id: string;
  name: string;
  avatar: string;
  jobTitle?: string;
  role?: string;
  department?: string;
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold';
  health: ProjectHealth;
  leadId: string;
  leadName?: string;
  leadAvatar?: string;
  leadJobTitle?: string;
  department: string;
  memberIds: string[];
  members?: ProjectMember[];
  budgetHours: number;
  startDate: string;
  deadline: string;
  milestones: ProjectMilestone[];
  taskCount?: number;
  completedTaskCount?: number;
  progress?: number;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'project' | 'ai' | 'warning' | 'system';
  link: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityItem {
  _id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  timestamp: string;
}

export interface AIInsightAction {
  id: string;
  title: string;
  actionType: 'redistribute' | 'extend_deadline' | 'reprioritize' | 'workflow_review';
  targetTaskId?: string;
  targetUserId?: string;
  targetNewUserId?: string;
  newDeadline?: string;
  applied: boolean;
}

export interface AIInsight {
  _id: string;
  title: string;
  category: 'WORKLOAD' | 'PRODUCTIVITY' | 'DEADLINE' | 'RESOURCE';
  summary: string;
  confidence: number;
  recommendedActions: AIInsightAction[];
  dismissed: boolean;
  createdAt: string;
}

export interface DailyBrief {
  headline: string;
  summary: string;
  highlights: string[];
  recommendedAction: string;
}

export interface AnalyticsOverview {
  kpis: {
    activeEmployees: { value: number; change: string; comparison: string; isPositive: boolean };
    activeProjects: { value: number; change: string; comparison: string; isPositive: boolean };
    tasksCompleted: { value: number; change: string; comparison: string; isPositive: boolean };
    tasksAtRisk: { value: number; change: string; comparison: string; isPositive: boolean };
  };
  weeklyProductivity: { day: string; completed: number; overdue: number; avgHours: number }[];
  departmentPerformance: {
    department: string;
    headcount: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    avgScore: number;
  }[];
  workloadDistribution: { name: string; count: number; percentage: number }[];
  priorityDistribution: Record<TaskPriority, number>;
  statusDistribution: Record<TaskStatus, number>;
  totalTasks: number;
}
