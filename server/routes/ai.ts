import { Router, Response } from 'express';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
  analyzeProductivity,
  prioritizeTasks,
  analyzeTeamWorkload,
  predictDeadlineRiskEnhanced,
  generateDailyBrief,
  generateDailyPlanner,
  chatWorkflowAssistant,
  parseMeetingNotesToTasks,
  generateProjectBrief,
} from '../services/gemini.js';

const router = Router();

// Apply AI rate limiting to all AI endpoints
router.use(aiRateLimiter);

// POST /api/ai/daily-planner
router.post('/daily-planner', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const targetUserId = req.body.userId || req.user!._id;
    const capacityHours = Number(req.body.capacityHours) || 8;

    const user = db.getUserById(targetUserId, orgId);
    if (!user) {
      res.status(404).json({ error: 'User not found in your organization.' });
      return;
    }

    const tasks = db.getTasks(orgId);
    const result = await generateDailyPlanner(user, tasks, capacityHours);

    res.json({
      success: true,
      data: result,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err: any) {
    console.error('Error generating daily planner:', err);
    res.status(500).json({ error: 'Failed to generate daily planner: ' + (err.message || 'Server error') });
  }
});

// POST /api/ai/assistant-chat
router.post('/assistant-chat', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    const orgId = req.user!.organizationId;
    const tasks = db.getTasks(orgId);
    const projects = db.getProjects(orgId);
    const team = db.getUsers(orgId);

    const result = await chatWorkflowAssistant(query.trim(), {
      user: req.user!,
      tasks,
      projects,
      team,
    });

    res.json({
      success: true,
      query: query.trim(),
      answer: result.answer,
      references: result.references,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in workflow assistant chat:', err);
    res.status(500).json({ error: 'Failed to process assistant query.' });
  }
});

// POST /api/ai/parse-meeting-notes
router.post('/parse-meeting-notes', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notes } = req.body;
    if (!notes || !notes.trim()) {
      res.status(400).json({ error: 'Meeting notes content is required.' });
      return;
    }

    const orgId = req.user!.organizationId;
    const projects = db.getProjects(orgId).map(p => ({ id: p._id, name: p.name }));
    const users = db.getUsers(orgId).map(u => ({ id: u._id, name: u.name, department: u.department }));

    const result = await parseMeetingNotesToTasks(notes, projects, users);
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error parsing meeting notes:', err);
    res.status(500).json({ error: 'Failed to parse meeting notes.' });
  }
});

// POST /api/ai/project-brief
router.post('/project-brief', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { projectId } = req.body;

    if (!projectId) {
      res.status(400).json({ error: 'Project ID is required.' });
      return;
    }

    const project = db.getProjectById(projectId, orgId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const tasks = db.getTasks(orgId).filter(t => t.projectId === project._id);
    const lead = db.getUserById(project.leadId, orgId);

    const brief = await generateProjectBrief(project, tasks, lead);
    res.json({
      success: true,
      data: brief,
    });
  } catch (err: any) {
    console.error('Error generating project brief:', err);
    res.status(500).json({ error: 'Failed to generate project brief.' });
  }
});

// POST /api/ai/productivity-analysis
router.post('/productivity-analysis', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const targetUserId = req.body.userId || req.user!._id;
    const user = db.getUserById(targetUserId, orgId);

    if (!user) {
      res.status(404).json({ error: 'User not found in your organization.' });
      return;
    }

    const tasks = db.getTasks(orgId);
    const userTasks = tasks.filter(t => t.assignedTo === user._id);

    if (userTasks.length === 0) {
      res.json({
        success: true,
        data: {
          summary: `AI insights will appear once enough workflow activity has been collected for ${user.name}. Currently, no tasks have been assigned to track velocity or completion patterns.`,
          strengths: ['Clean workspace slate initialized.', 'Ready for assignment of first sprint tasks.'],
          bottlenecks: ['Insufficient task execution history to diagnose bottlenecks.'],
          risks: ['No active workload risk detected.'],
          recommendations: ['Create and assign initial tasks in the onboarding or tasks board to begin tracking AI performance indicators.'],
          generatedAt: new Date().toISOString(),
        },
        analyzedFor: {
          id: user._id,
          name: user.name,
          role: user.role,
          department: user.department,
        },
      });
      return;
    }

    const result = await analyzeProductivity(user, tasks);

    res.json({
      success: true,
      data: result,
      analyzedFor: {
        id: user._id,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err: any) {
    console.error('Error generating productivity analysis:', err);
    res.status(500).json({ error: 'Failed to analyze productivity: ' + (err.message || 'Server error') });
  }
});

// POST /api/ai/prioritize-tasks
router.post('/prioritize-tasks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const targetUserId = req.body.userId || req.user!._id;
    const user = db.getUserById(targetUserId, orgId);
    const userTasks = db.getTasks(orgId).filter(t => t.assignedTo === targetUserId && t.status !== 'COMPLETED');

    if (userTasks.length === 0) {
      res.json({
        success: true,
        data: {
          strategicSummary: 'No pending tasks found to prioritize. Create or assign tasks to enable AI smart sequencing.',
          prioritizedTasks: [],
        },
      });
      return;
    }

    const result = await prioritizeTasks(userTasks, user);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error prioritizing tasks:', err);
    res.status(500).json({ error: 'Failed to prioritize tasks: ' + (err.message || 'Server error') });
  }
});

// POST /api/ai/apply-priorities
router.post('/apply-priorities', authenticate, (req: AuthRequest, res: Response): void => {
  const { priorities } = req.body;
  if (!Array.isArray(priorities)) {
    res.status(400).json({ error: 'Priorities array is required.' });
    return;
  }

  const orgId = req.user!.organizationId;
  let updatedCount = 0;
  priorities.forEach((p: { taskId: string; recommendedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }) => {
    if (p.taskId && p.recommendedPriority) {
      db.updateTask(p.taskId, { priority: p.recommendedPriority }, req.user!._id, orgId);
      updatedCount++;
    }
  });

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'applied AI priorities',
    targetType: 'ai',
    details: `Applied AI prioritized order to ${updatedCount} tasks`,
  });

  res.json({
    success: true,
    message: `Updated priorities for ${updatedCount} task(s).`,
  });
});

// POST /api/ai/workload-analysis
router.post('/workload-analysis', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const users = db.getUsers(orgId);
    const tasks = db.getTasks(orgId);

    if (tasks.length === 0) {
      res.json({
        success: true,
        data: {
          overallHealth: 'Balanced',
          balanceScore: 100,
          summary: 'Workspace capacity is unencumbered. No tasks currently active across team members.',
          overloadedCount: 0,
          highWorkloadCount: 0,
          balancedCount: users.length,
          underloadedCount: 0,
          teamBreakdown: users.map(u => ({
            userId: u._id,
            name: u.name,
            role: u.role,
            department: u.department,
            avatar: u.avatar,
            category: 'Normal',
            activeTasks: 0,
            estimatedHours: 0,
            overdueTasks: 0,
            completionRate: 100,
            capacityAssessment: 'Available for immediate sprint allocations.',
          })),
          recommendations: [
            'Create initial projects and assign tasks to enable predictive capacity modeling.',
          ],
        },
      });
      return;
    }

    const result = await analyzeTeamWorkload(users, tasks);
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error in workload analysis:', err);
    res.status(500).json({ error: 'Failed to analyze workload: ' + (err.message || 'Server error') });
  }
});

// POST /api/ai/deadline-risk
router.post('/deadline-risk', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { projectId } = req.body;
    const orgProjects = db.getProjects(orgId);
    const project = projectId ? db.getProjectById(projectId, orgId) : orgProjects[0];

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const tasks = db.getTasks(orgId);
    const result = await predictDeadlineRiskEnhanced(project, tasks);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error predicting deadline risk:', err);
    res.status(500).json({ error: 'Failed to predict deadline risk: ' + (err.message || 'Server error') });
  }
});

// GET /api/ai/daily-brief
router.get('/daily-brief', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const tasks = db.getTasks(orgId);
    const projects = db.getProjects(orgId);
    const users = db.getUsers(orgId);

    if (tasks.length === 0 && projects.length === 0) {
      res.json({
        brief: {
          headline: 'Welcome to your TechNova workspace!',
          summary: 'Welcome to your workspace! Getting started is simple: invite your colleagues, set up a project, and assign your first task.',
          highlights: ['Workspace initialized', 'Ready for team sprint intake', 'Zero blockers detected'],
          recommendedAction: 'Invite your team and create a project to get started.',
        },
      });
      return;
    }

    const brief = await generateDailyBrief(tasks, projects, users);
    res.json({ brief });
  } catch (err: any) {
    console.error('Error generating daily brief:', err);
    res.status(500).json({ error: 'Failed to generate daily brief.' });
  }
});

// GET /api/ai/insights
router.get('/insights', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const insights = db.getInsights(orgId);
  res.json({ insights });
});

// POST /api/ai/apply-action
router.post('/apply-action', authenticate, requireRole(['admin', 'manager', 'team_lead']), (req: AuthRequest, res: Response): void => {
  const { insightId, actionId } = req.body;

  if (!insightId || !actionId) {
    res.status(400).json({ error: 'insightId and actionId are required.' });
    return;
  }

  const result = db.applyInsightAction(insightId, actionId);

  if (result.success) {
    db.logActivity({
      organizationId: req.user!.organizationId,
      userId: req.user!._id,
      userName: req.user!.name,
      userAvatar: req.user!.avatar,
      action: 'applied AI recommendation',
      targetType: 'ai',
      details: result.message,
    });
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/ai/dismiss-insight
router.post('/dismiss-insight', authenticate, (req: AuthRequest, res: Response): void => {
  const { insightId } = req.body;
  if (!insightId) {
    res.status(400).json({ error: 'insightId is required.' });
    return;
  }

  const ok = db.dismissInsight(insightId);
  res.json({ success: ok, message: ok ? 'Insight dismissed.' : 'Insight not found.' });
});

export default router;
