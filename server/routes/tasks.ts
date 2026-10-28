import { Router, Response } from 'express';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { validateAttachment } from '../middleware/security.js';

const router = Router();

// GET /api/tasks
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const userRole = req.user!.role;
  const userId = req.user!._id;
  const { projectId, assignedTo, status, priority, search } = req.query;

  let tasks = db.getTasks(orgId, {
    projectId: typeof projectId === 'string' ? projectId : undefined,
    assignedTo: typeof assignedTo === 'string' ? assignedTo : undefined,
    status: typeof status === 'string' ? status : undefined,
    priority: typeof priority === 'string' ? priority : undefined,
    search: typeof search === 'string' ? search : undefined,
  });

  // Role-based visibility: employees without specific filters see tasks relevant to them
  if (userRole === 'employee' && !assignedTo && !projectId) {
    const userProjects = db.getProjects(orgId).filter(p => p.memberIds?.includes(userId));
    const userProjectIds = new Set(userProjects.map(p => p._id));
    tasks = tasks.filter(t => t.assignedTo === userId || t.createdBy === userId || userProjectIds.has(t.projectId));
  }

  // Enrich with user and project summary
  const enriched = tasks.map(t => {
    const assignee = db.getUserById(t.assignedTo, orgId);
    const creator = db.getUserById(t.createdBy, orgId);
    const owner = t.ownerId ? db.getUserById(t.ownerId, orgId) : undefined;
    const project = db.getProjectById(t.projectId, orgId);
    return {
      ...t,
      assigneeName: assignee?.name || 'Unassigned',
      assigneeAvatar: assignee?.avatar || '',
      assigneeJobTitle: assignee?.jobTitle || '',
      creatorName: creator?.name || 'System',
      ownerName: owner?.name || assignee?.name || 'Unassigned',
      projectName: project?.name || 'Unknown Project',
      projectKey: project?.key || 'PRJ',
    };
  });

  res.json({ tasks: enriched, count: enriched.length });
});

// GET /api/tasks/export/csv
router.get('/export/csv', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const tasks = db.getTasks(orgId);

  const headers = ['ID', 'Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date', 'Est Hours', 'Actual Hours', 'Deadline Risk'];
  const rows = tasks.map(t => {
    const p = db.getProjectById(t.projectId, orgId);
    const u = db.getUserById(t.assignedTo, orgId);
    return [
      t._id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(p?.name || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${(u?.name || 'Unassigned').replace(/"/g, '""')}"`,
      t.dueDate || '',
      t.estimatedHours || 0,
      t.actualHours || 0,
      t.deadlineRisk || 'LOW',
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="tasks-report-${new Date().toISOString().split('T')[0]}.csv"`);
  res.status(200).send(csv);
});

// GET /api/tasks/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const task = db.getTaskById(req.params.id, orgId);
  if (!task) {
    res.status(404).json({ error: 'Task not found or unauthorized.' });
    return;
  }

  const assignee = db.getUserById(task.assignedTo, orgId);
  const creator = db.getUserById(task.createdBy, orgId);
  const owner = task.ownerId ? db.getUserById(task.ownerId, orgId) : undefined;
  const project = db.getProjectById(task.projectId, orgId);

  res.json({
    task: {
      ...task,
      assigneeName: assignee?.name || 'Unassigned',
      assigneeAvatar: assignee?.avatar || '',
      assigneeJobTitle: assignee?.jobTitle || '',
      creatorName: creator?.name || 'System',
      ownerName: owner?.name || assignee?.name || 'Unassigned',
      projectName: project?.name || 'Unknown Project',
      projectKey: project?.key || 'PRJ',
    },
  });
});

// POST /api/tasks
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  const {
    title,
    description,
    projectId,
    assignedTo,
    ownerId,
    startDate,
    priority,
    status,
    dueDate,
    estimatedHours,
    tags,
    dependencies,
    blockedBy,
  } = req.body;

  if (!title || !projectId) {
    res.status(400).json({ error: 'Task title and project are required.' });
    return;
  }

  const orgId = req.user!.organizationId;
  // Verify project belongs to user's organization
  const project = db.getProjectById(projectId, orgId);
  if (!project) {
    res.status(400).json({ error: 'Selected project does not exist in your organization.' });
    return;
  }

  const userId = req.user!._id;
  const targetAssignee = assignedTo || userId;

  const newTask = db.createTask({
    organizationId: orgId,
    title: title.trim(),
    description: description ? description.trim() : '',
    projectId,
    assignedTo: targetAssignee,
    ownerId: ownerId || targetAssignee,
    createdBy: userId,
    startDate: startDate || new Date().toISOString().split('T')[0],
    status: status && ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].includes(status) ? status : 'TODO',
    priority: priority || 'MEDIUM',
    dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    estimatedHours: Number(estimatedHours) || 8,
    actualHours: 0,
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    dependencies: Array.isArray(dependencies) ? dependencies : [],
    blockedBy: Array.isArray(blockedBy) ? blockedBy : [],
    deadlineRisk: 'LOW',
  });

  db.logActivity({
    organizationId: orgId,
    userId,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'created task',
    targetType: 'task',
    targetId: newTask._id,
    details: `Created task "${newTask.title}" in project "${project.name}"`,
  });

  res.status(201).json({ task: newTask, message: 'Task created successfully.' });
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const task = db.getTaskById(req.params.id, orgId);
  if (!task) {
    res.status(404).json({ error: 'Task not found or access denied.' });
    return;
  }

  // Permission check: regular employees can only edit their own assigned/created tasks
  if (req.user!.role === 'employee' && task.assignedTo !== req.user!._id && task.createdBy !== req.user!._id) {
    res.status(403).json({ error: 'You do not have permission to edit this task.' });
    return;
  }

  const {
    title,
    description,
    projectId,
    assignedTo,
    ownerId,
    startDate,
    priority,
    status,
    dueDate,
    estimatedHours,
    actualHours,
    tags,
    dependencies,
    blockedBy,
  } = req.body;

  // If changing project, ensure destination belongs to same organization
  if (projectId && projectId !== task.projectId) {
    const destProject = db.getProjectById(projectId, orgId);
    if (!destProject) {
      res.status(400).json({ error: 'Target project does not exist in your organization.' });
      return;
    }
  }

  const updated = db.updateTask(
    req.params.id,
    {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description }),
      ...(projectId !== undefined && { projectId }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(ownerId !== undefined && { ownerId }),
      ...(startDate !== undefined && { startDate }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(dueDate !== undefined && { dueDate }),
      ...(estimatedHours !== undefined && { estimatedHours: Number(estimatedHours) }),
      ...(actualHours !== undefined && { actualHours: Number(actualHours) }),
      ...(tags !== undefined && { tags }),
      ...(dependencies !== undefined && { dependencies }),
      ...(blockedBy !== undefined && { blockedBy }),
    },
    req.user!._id,
    orgId
  );

  res.json({ task: updated, message: 'Task updated successfully.' });
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', authenticate, (req: AuthRequest, res: Response): void => {
  const { status } = req.body;
  if (!status || !['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].includes(status)) {
    res.status(400).json({ error: 'Valid status is required.' });
    return;
  }

  const orgId = req.user!.organizationId;
  const prev = db.getTaskById(req.params.id, orgId);
  if (!prev) {
    res.status(404).json({ error: 'Task not found or access denied.' });
    return;
  }

  const updated = db.updateTask(req.params.id, { status }, req.user!._id, orgId);

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'status update',
    targetType: 'task',
    targetId: req.params.id,
    details: `${req.user!.name} changed "${prev.title}" from ${prev.status} to ${status}`,
  });

  if (status === 'COMPLETED' && prev.createdBy !== req.user!._id) {
    db.createNotification({
      organizationId: orgId,
      userId: prev.createdBy,
      title: 'Task Completed',
      message: `${req.user!.name} completed "${prev.title}"`,
      type: 'task',
      link: `/tasks/${prev._id}`,
      read: false,
    });
  }

  res.json({ task: updated, message: `Task moved to ${status}.` });
});

// PATCH /api/tasks/:id/priority
router.patch('/:id/priority', authenticate, (req: AuthRequest, res: Response): void => {
  const { priority } = req.body;
  if (!priority || !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
    res.status(400).json({ error: 'Valid priority is required.' });
    return;
  }

  const orgId = req.user!.organizationId;
  const prev = db.getTaskById(req.params.id, orgId);
  if (!prev) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const updated = db.updateTask(req.params.id, { priority }, req.user!._id, orgId);

  res.json({ task: updated, message: `Task priority updated to ${priority}.` });
});

// POST /api/tasks/:id/attachments
router.post('/:id/attachments', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const { name, size, url, type } = req.body;

  if (!name || !size) {
    res.status(400).json({ error: 'Attachment name and size are required.' });
    return;
  }

  const validation = validateAttachment({ name, size, type });
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const attachment = {
    id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    size: Number(size),
    url: url || `https://storage.technova.io/attachments/${name}`,
    uploadedAt: new Date().toISOString(),
  };

  const updatedTask = db.addTaskAttachment(req.params.id, attachment, req.user!._id, orgId);
  if (!updatedTask) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  res.status(201).json({
    task: updatedTask,
    attachment,
    message: `File "${name}" attached successfully.`,
  });
});

// DELETE /api/tasks/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const updatedTask = db.deleteTaskAttachment(req.params.id, req.params.attachmentId, req.user!._id, orgId);
  if (!updatedTask) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  res.json({ task: updatedTask, message: 'Attachment removed successfully.' });
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const task = db.getTaskById(req.params.id, orgId);
  if (!task) {
    res.status(404).json({ error: 'Task not found or access denied.' });
    return;
  }

  // Permissions: Admin, manager, team lead, or task creator
  const canDelete = ['admin', 'manager', 'team_lead'].includes(req.user!.role) || task.createdBy === req.user!._id;
  if (!canDelete) {
    res.status(403).json({ error: 'You do not have permission to delete this task.' });
    return;
  }

  db.deleteTask(req.params.id, orgId);

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'deleted task',
    targetType: 'task',
    targetId: req.params.id,
    details: `Deleted task "${task.title}"`,
  });

  res.json({ success: true, message: 'Task deleted successfully.' });
});

// GET /api/tasks/:id/comments
router.get('/:id/comments', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const task = db.getTaskById(req.params.id, orgId);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  const comments = db.getComments(req.params.id);
  res.json({ comments });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authenticate, (req: AuthRequest, res: Response): void => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty.' });
    return;
  }

  const orgId = req.user!.organizationId;
  const task = db.getTaskById(req.params.id, orgId);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const updatedTask = db.addTaskComment(req.params.id, {
    userId: req.user!._id,
    content: content.trim(),
  });

  // Notify assignee if someone else commented
  if (task.assignedTo && task.assignedTo !== req.user!._id) {
    db.createNotification({
      organizationId: orgId,
      userId: task.assignedTo,
      title: 'New Comment on Task',
      message: `${req.user!.name} commented on "${task.title}": "${content.slice(0, 50)}"`,
      type: 'task',
      link: `/tasks/${task._id}`,
      read: false,
    });
  }

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'commented on task',
    targetType: 'task',
    targetId: task._id,
    details: `Commented on "${task.title}"`,
  });

  res.json({
    task: updatedTask,
    comments: updatedTask?.comments || [],
    message: 'Comment added successfully.',
  });
});

// DELETE /api/tasks/:id/comments/:commentId
router.delete('/:id/comments/:commentId', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const task = db.getTaskById(req.params.id, orgId);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const success = db.deleteComment(req.params.id, req.params.commentId);
  res.json({ success, message: success ? 'Comment deleted.' : 'Comment not found.' });
});

export default router;
