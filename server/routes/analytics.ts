import { Router, Response } from 'express';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { calculateUserMetrics } from '../services/productivityMetrics.js';

const router = Router();

// Helper to calculate real analytics for an organization with date-range filter
function computeOrgAnalytics(orgId: string, dateRange = '30d') {
  const users = db.getUsers(orgId);
  const projects = db.getProjects(orgId);
  let tasks = db.getTasks(orgId);

  // Apply date range filter
  if (dateRange !== 'all') {
    const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    tasks = tasks.filter(t => (t.createdAt && t.createdAt >= cutoff) || (t.updatedAt && t.updatedAt >= cutoff));
  }

  const totalUsers = users.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED').length;
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && t.dueDate < todayStr).length;
  const atRiskTasks = tasks.filter(t => t.priority === 'URGENT' || t.status === 'BLOCKED' || t.deadlineRisk === 'HIGH' || (t.status !== 'COMPLETED' && t.dueDate && t.dueDate < todayStr)).length;

  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Planned vs Actual Effort metrics
  const totalPlannedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const effortVariancePercent = totalPlannedHours > 0
    ? Math.round(((totalActualHours - totalPlannedHours) / totalPlannedHours) * 100)
    : 0;

  // Real Weekly Task Completion & Overdue from Database Records
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const dayBuckets: Record<string, { completed: number; overdue: number; hours: number[] }> = {
    Mon: { completed: 0, overdue: 0, hours: [] },
    Tue: { completed: 0, overdue: 0, hours: [] },
    Wed: { completed: 0, overdue: 0, hours: [] },
    Thu: { completed: 0, overdue: 0, hours: [] },
    Fri: { completed: 0, overdue: 0, hours: [] },
  };

  // Inspect each task for real day distribution
  tasks.forEach(t => {
    if (t.status === 'COMPLETED' && t.updatedAt) {
      const d = new Date(t.updatedAt);
      const dayIndex = d.getDay(); // 0 is Sun, 1 is Mon, 5 is Fri
      if (dayIndex >= 1 && dayIndex <= 5) {
        const dayKey = dayNames[dayIndex - 1];
        if (dayBuckets[dayKey]) {
          dayBuckets[dayKey].completed++;
          if (t.actualHours) dayBuckets[dayKey].hours.push(t.actualHours);
        }
      }
    }

    if (t.status !== 'COMPLETED' && t.dueDate < todayStr) {
      const d = new Date(t.dueDate);
      const dayIndex = d.getDay();
      if (dayIndex >= 1 && dayIndex <= 5) {
        const dayKey = dayNames[dayIndex - 1];
        if (dayBuckets[dayKey]) {
          dayBuckets[dayKey].overdue++;
        }
      }
    }
  });

  const weeklyProductivity = dayNames.map(day => {
    const bucket = dayBuckets[day];
    const avgH = bucket.hours.length > 0
      ? Number((bucket.hours.reduce((a, b) => a + b, 0) / bucket.hours.length).toFixed(1))
      : 0;
    return {
      day,
      completed: bucket.completed,
      overdue: bucket.overdue,
      avgHours: avgH,
    };
  });

  // Department counts & performance
  const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'HR', 'Finance'];
  const departmentPerformance = departments.map(dept => {
    const deptUsers = users.filter(u => u.department === dept);
    const deptUserIds = deptUsers.map(u => u._id);
    const deptTasks = tasks.filter(t => deptUserIds.includes(t.assignedTo));
    const deptCompleted = deptTasks.filter(t => t.status === 'COMPLETED').length;
    const avgScore = deptUsers.length > 0
      ? Math.round(deptUsers.reduce((acc, u) => acc + (u.productivityScore || 0), 0) / deptUsers.length)
      : 0;

    return {
      department: dept,
      headcount: deptUsers.length,
      totalTasks: deptTasks.length,
      completedTasks: deptCompleted,
      completionRate: deptTasks.length > 0 ? Math.round((deptCompleted / deptTasks.length) * 100) : 0,
      avgScore,
    };
  }).filter(d => d.headcount > 0 || tasks.length > 0);

  // Workload distribution
  const workloadCounts = {
    Low: 0,
    Normal: 0,
    High: 0,
    Overloaded: 0,
  };

  users.forEach(u => {
    const m = calculateUserMetrics(u, tasks);
    workloadCounts[m.workloadCategory]++;
  });

  // Priority distribution
  const priorityDistribution = {
    LOW: tasks.filter(t => t.priority === 'LOW').length,
    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
    HIGH: tasks.filter(t => t.priority === 'HIGH').length,
    URGENT: tasks.filter(t => t.priority === 'URGENT').length,
  };

  // Status distribution
  const statusDistribution = {
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
    COMPLETED: completedTasks,
    BLOCKED: blockedTasks,
  };

  return {
    kpis: {
      activeEmployees: {
        value: totalUsers,
        change: totalUsers > 0 ? `+${totalUsers}` : '0',
        comparison: 'active in workspace',
        isPositive: true,
      },
      activeProjects: {
        value: activeProjects,
        change: activeProjects > 0 ? `+${activeProjects}` : '0',
        comparison: 'active initiatives',
        isPositive: true,
      },
      tasksCompleted: {
        value: completedTasks,
        change: `${completionPercentage}%`,
        comparison: 'completion rate',
        isPositive: true,
      },
      tasksAtRisk: {
        value: atRiskTasks,
        change: overdueTasks > 0 ? `${overdueTasks} overdue` : '0 overdue',
        comparison: 'requiring attention',
        isPositive: atRiskTasks === 0,
      },
    },
    counts: {
      totalEmployees: totalUsers,
      activeProjects,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      blockedTasks,
      completionPercentage,
    },
    weeklyProductivity,
    departmentPerformance,
    workloadDistribution: [
      { name: 'Low', count: workloadCounts.Low, percentage: totalUsers > 0 ? Math.round((workloadCounts.Low / totalUsers) * 100) : 0 },
      { name: 'Normal', count: workloadCounts.Normal, percentage: totalUsers > 0 ? Math.round((workloadCounts.Normal / totalUsers) * 100) : 0 },
      { name: 'High', count: workloadCounts.High, percentage: totalUsers > 0 ? Math.round((workloadCounts.High / totalUsers) * 100) : 0 },
      { name: 'Overloaded', count: workloadCounts.Overloaded, percentage: totalUsers > 0 ? Math.round((workloadCounts.Overloaded / totalUsers) * 100) : 0 },
    ],
    priorityDistribution,
    statusDistribution,
    effortMetrics: {
      totalPlannedHours,
      totalActualHours,
      effortVariancePercent,
      definition: 'Measures deviation between estimated hours and actual logged effort across selected timeframe.',
    },
    totalTasks: tasks.length,
    selectedTimeframe: dateRange,
  };
}

// GET /api/analytics/overview
router.get('/overview', authenticate, (req: AuthRequest, res: Response): void => {
  const dateRange = typeof req.query.dateRange === 'string' ? req.query.dateRange : '30d';
  const analytics = computeOrgAnalytics(req.user!.organizationId, dateRange);
  res.json(analytics);
});

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, (req: AuthRequest, res: Response): void => {
  const dateRange = typeof req.query.dateRange === 'string' ? req.query.dateRange : '30d';
  const analytics = computeOrgAnalytics(req.user!.organizationId, dateRange);
  res.json(analytics);
});

// GET /api/analytics/productivity
router.get('/productivity', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const users = db.getUsers(orgId);
  const tasks = db.getTasks(orgId);

  const userProductivity = users.map(u => {
    const m = calculateUserMetrics(u, tasks);
    return {
      userId: u._id,
      name: u.name,
      role: u.role,
      department: u.department,
      score: m.score,
      explanation: m.explanation,
      breakdown: m.breakdown,
      taskCounts: m.taskCounts,
    };
  });

  res.json({
    users: userProductivity,
    averageScore: users.length > 0 ? Math.round(userProductivity.reduce((acc, u) => acc + u.score, 0) / users.length) : 0,
  });
});

// GET /api/analytics/workload
router.get('/workload', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const users = db.getUsers(orgId);
  const tasks = db.getTasks(orgId);

  const teamWorkload = users.map(u => {
    const m = calculateUserMetrics(u, tasks);
    return {
      userId: u._id,
      name: u.name,
      role: u.role,
      department: u.department,
      avatar: u.avatar,
      workloadCategory: m.workloadCategory,
      riskLevel: m.riskLevel,
      totalEstimatedHours: m.totalEstimatedHours,
      totalActualHours: m.totalActualHours,
      taskCounts: m.taskCounts,
    };
  });

  res.json({ teamWorkload });
});

// GET /api/analytics/projects
router.get('/projects', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const projects = db.getProjects(orgId);
  const tasks = db.getTasks(orgId);

  const projectAnalytics = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p._id);
    const completed = pTasks.filter(t => t.status === 'COMPLETED').length;
    const progress = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;
    return {
      projectId: p._id,
      name: p.name,
      key: p.key,
      health: p.health,
      status: p.status,
      totalTasks: pTasks.length,
      completedTasks: completed,
      progress,
      deadline: p.deadline,
    };
  });

  res.json({ projects: projectAnalytics });
});

// GET /api/analytics/export-csv
router.get('/export-csv', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const tasks = db.getTasks(orgId);

  const headers = ['Task ID', 'Title', 'Project', 'Assignee', 'Status', 'Priority', 'Due Date', 'Est Hours', 'Actual Hours', 'Risk'];
  const rows = tasks.map(t => {
    const assignee = db.getUserById(t.assignedTo, orgId)?.name || 'Unassigned';
    const project = db.getProjectById(t.projectId, orgId)?.name || 'Unknown';
    return [
      `"${t._id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${project.replace(/"/g, '""')}"`,
      `"${assignee.replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${t.dueDate}"`,
      t.estimatedHours || 0,
      t.actualHours || 0,
      `"${t.deadlineRisk}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="technova-tasks-report-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);
});

export default router;
