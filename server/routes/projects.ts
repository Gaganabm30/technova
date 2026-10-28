import { Router, Response } from 'express';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/projects
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const projects = db.getProjects(orgId);
  const tasks = db.getTasks(orgId);

  const todayStr = new Date().toISOString().split('T')[0];

  const enriched = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p._id);
    const completedTasks = pTasks.filter(t => t.status === 'COMPLETED').length;
    const progress = pTasks.length > 0 ? Math.round((completedTasks / pTasks.length) * 100) : 0;
    const lead = db.getUserById(p.leadId, orgId);

    // Compute dynamic health and effort from real task status
    const overdueCount = pTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && t.dueDate < todayStr).length;
    const blockedCount = pTasks.filter(t => t.status === 'BLOCKED').length;

    const totalEstimated = pTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = pTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    let health = p.health;
    if (overdueCount >= 2 || blockedCount >= 2) {
      health = 'Delayed';
    } else if (overdueCount === 1 || blockedCount === 1) {
      health = 'At Risk';
    } else {
      health = 'Healthy';
    }

    return {
      ...p,
      health,
      leadName: lead?.name || 'Unassigned',
      leadAvatar: lead?.avatar || '',
      leadJobTitle: lead?.jobTitle || '',
      taskCount: pTasks.length,
      completedTaskCount: completedTasks,
      overdueTaskCount: overdueCount,
      blockedTaskCount: blockedCount,
      totalEstimatedHours: totalEstimated,
      totalActualHours: totalActual,
      progress,
      members: (p.memberIds || []).map(mId => {
        const u = db.getUserById(mId, orgId);
        return {
          id: mId,
          name: u?.name || 'Member',
          avatar: u?.avatar || '',
          role: u?.role || 'employee',
        };
      }),
    };
  });

  res.json({ projects: enriched });
});

// GET /api/projects/export/csv
router.get('/export/csv', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const projects = db.getProjects(orgId);
  const tasks = db.getTasks(orgId);

  const headers = ['ID', 'Name', 'Key', 'Status', 'Health', 'Lead', 'Progress (%)', 'Tasks', 'Completed', 'Budget (Hours)', 'Start Date', 'Deadline'];
  const rows = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p._id);
    const completed = pTasks.filter(t => t.status === 'COMPLETED').length;
    const progress = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;
    const lead = db.getUserById(p.leadId, orgId);
    return [
      p._id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.key,
      p.status,
      p.health,
      `"${(lead?.name || 'Unassigned').replace(/"/g, '""')}"`,
      progress,
      pTasks.length,
      completed,
      p.budgetHours || 0,
      p.startDate || '',
      p.deadline || '',
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="projects-report-${new Date().toISOString().split('T')[0]}.csv"`);
  res.status(200).send(csv);
});

// GET /api/projects/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const project = db.getProjectById(req.params.id, orgId);
  if (!project) {
    res.status(404).json({ error: 'Project not found or access denied.' });
    return;
  }

  const tasks = db.getTasks(orgId).filter(t => t.projectId === project._id);
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const lead = db.getUserById(project.leadId, orgId);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && t.dueDate < todayStr).length;
  const blockedCount = tasks.filter(t => t.status === 'BLOCKED').length;

  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  const enrichedTasks = tasks.map(t => {
    const assignee = db.getUserById(t.assignedTo, orgId);
    return {
      ...t,
      assigneeName: assignee?.name || 'Unassigned',
      assigneeAvatar: assignee?.avatar || '',
      assigneeJobTitle: assignee?.jobTitle || '',
    };
  });

  res.json({
    project: {
      ...project,
      leadName: lead?.name || 'Unassigned',
      leadAvatar: lead?.avatar || '',
      leadJobTitle: lead?.jobTitle || '',
      taskCount: tasks.length,
      completedTaskCount: completedTasks,
      overdueTaskCount: overdueCount,
      blockedTaskCount: blockedCount,
      totalEstimatedHours: totalEstimated,
      totalActualHours: totalActual,
      progress,
      tasks: enrichedTasks,
      members: (project.memberIds || []).map(mId => {
        const u = db.getUserById(mId, orgId);
        return {
          id: mId,
          name: u?.name || 'Member',
          avatar: u?.avatar || '',
          jobTitle: u?.jobTitle || '',
          role: u?.role || 'employee',
          department: u?.department || '',
        };
      }),
    },
  });
});

// POST /api/projects
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  const { name, key, description, department, leadId, memberIds, budgetHours, startDate, deadline, milestones } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Project name is required.' });
    return;
  }

  const orgId = req.user!.organizationId;
  const projectKey = (key || name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4)).toUpperCase() || 'PRJ';
  const finalLead = leadId || req.user!._id;
  const finalMembers = Array.isArray(memberIds) && memberIds.length > 0 ? memberIds : [finalLead];

  const now = new Date();
  const defaultStart = now.toISOString().split('T')[0];
  const defaultDeadline = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];

  const newProject = db.createProject({
    organizationId: orgId,
    name: name.trim(),
    key: projectKey,
    description: description ? description.trim() : '',
    status: 'In Progress',
    health: 'Healthy',
    leadId: finalLead,
    department: department || req.user!.department || 'Engineering',
    memberIds: finalMembers,
    budgetHours: Number(budgetHours) || 80,
    startDate: startDate || defaultStart,
    deadline: deadline || defaultDeadline,
    milestones: Array.isArray(milestones) ? milestones : [
      {
        id: 'ms_1',
        title: 'Project Kickoff & Requirements',
        dueDate: startDate || defaultStart,
        completed: true,
      },
      {
        id: 'ms_2',
        title: 'Implementation Sprint Phase 1',
        dueDate: new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0],
        completed: false,
      },
      {
        id: 'ms_3',
        title: 'Review, QA & Delivery',
        dueDate: deadline || defaultDeadline,
        completed: false,
      },
    ],
  });

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'created project',
    targetType: 'project',
    targetId: newProject._id,
    details: `Created project "${newProject.name}" [${newProject.key}]`,
  });

  res.status(201).json({ project: newProject, message: 'Project created successfully.' });
});

// PUT /api/projects/:id
router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const existing = db.getProjectById(req.params.id, orgId);
  if (!existing) {
    res.status(404).json({ error: 'Project not found or access denied.' });
    return;
  }

  const { name, description, status, health, leadId, department, memberIds, budgetHours, startDate, deadline, milestones } = req.body;

  const updated = db.updateProject(
    req.params.id,
    {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(health !== undefined && { health }),
      ...(leadId !== undefined && { leadId }),
      ...(department !== undefined && { department }),
      ...(memberIds !== undefined && { memberIds }),
      ...(budgetHours !== undefined && { budgetHours: Number(budgetHours) }),
      ...(startDate !== undefined && { startDate }),
      ...(deadline !== undefined && { deadline }),
      ...(milestones !== undefined && { milestones }),
    },
    orgId
  );

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'updated project',
    targetType: 'project',
    targetId: req.params.id,
    details: `Updated project "${updated?.name || existing.name}"`,
  });

  res.json({ project: updated, message: 'Project updated successfully.' });
});

// PATCH /api/projects/:id/milestones/:milestoneId
router.patch('/:id/milestones/:milestoneId', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const project = db.getProjectById(req.params.id, orgId);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const { completed } = req.body;
  const milestones = [...(project.milestones || [])];
  const msIndex = milestones.findIndex(m => m.id === req.params.milestoneId);

  if (msIndex === -1) {
    res.status(404).json({ error: 'Milestone not found in project.' });
    return;
  }

  milestones[msIndex] = {
    ...milestones[msIndex],
    completed: typeof completed === 'boolean' ? completed : !milestones[msIndex].completed,
  };

  const updated = db.updateProject(req.params.id, { milestones }, orgId);
  res.json({ project: updated, message: 'Milestone updated.' });
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const project = db.getProjectById(req.params.id, orgId);
  if (!project) {
    res.status(404).json({ error: 'Project not found or access denied.' });
    return;
  }

  db.deleteProject(req.params.id, orgId);

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'deleted project',
    targetType: 'project',
    targetId: req.params.id,
    details: `Deleted project "${project.name}" and associated tasks`,
  });

  res.json({ success: true, message: 'Project and linked tasks deleted successfully.' });
});

export default router;
