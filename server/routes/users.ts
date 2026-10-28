import { Router, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { calculateUserMetrics } from '../services/productivityMetrics.js';

const router = Router();

// GET /api/users
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const users = db.getUsers(orgId);
  const tasks = db.getTasks(orgId);

  const enriched = users.map(u => {
    const metrics = calculateUserMetrics(u, tasks);
    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = u;
    return {
      ...safeUser,
      productivityScore: metrics.score,
      scoreBreakdown: metrics.breakdown,
      workloadCategory: metrics.workloadCategory,
      riskLevel: metrics.riskLevel,
      taskCounts: metrics.taskCounts,
    };
  });

  res.json({ users: enriched });
});

// GET /api/users/export/csv
router.get('/export/csv', authenticate, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const users = db.getUsers(orgId);
  const tasks = db.getTasks(orgId);

  const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Job Title', 'Productivity Score', 'Workload Category', 'Risk Level', 'Active Tasks', 'Overdue Tasks'];
  const rows = users.map(u => {
    const m = calculateUserMetrics(u, tasks);
    return [
      u._id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.email,
      u.role,
      `"${(u.department || '').replace(/"/g, '""')}"`,
      `"${(u.jobTitle || '').replace(/"/g, '""')}"`,
      m.score,
      m.workloadCategory,
      m.riskLevel,
      m.taskCounts.total - m.taskCounts.completed,
      m.taskCounts.overdue,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="team-directory-${new Date().toISOString().split('T')[0]}.csv"`);
  res.status(200).send(csv);
});

// GET /api/users/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const user = db.getUserById(req.params.id, orgId);
  if (!user) {
    res.status(404).json({ error: 'User not found or access denied.' });
    return;
  }

  const tasks = db.getTasks(orgId);
  const metrics = calculateUserMetrics(user, tasks);
  const userTasks = tasks.filter(t => t.assignedTo === user._id);
  const projects = db.getProjects(orgId).filter(p => (p.memberIds || []).includes(user._id) || p.leadId === user._id);

  const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

  res.json({
    user: {
      ...safeUser,
      productivityScore: metrics.score,
      scoreBreakdown: metrics.breakdown,
      explanation: metrics.explanation,
      workloadCategory: metrics.workloadCategory,
      riskLevel: metrics.riskLevel,
      taskCounts: metrics.taskCounts,
      tasks: userTasks,
      projects: projects.map(p => ({
        id: p._id,
        name: p.name,
        key: p.key,
        health: p.health,
        deadline: p.deadline,
      })),
    },
  });
});

// POST /api/users (Admin / Manager adds employee)
router.post('/', authenticate, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response): void => {
  const { name, email, role, department, jobTitle } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required to add employee.' });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const orgId = req.user!.organizationId;

  // Check for existing user within THIS organization only (not cross-org)
  const existingInOrg = db.getUserByEmailInOrg(email.trim().toLowerCase(), orgId);
  if (existingInOrg) {
    res.status(409).json({ error: 'A team member with this email already exists in your organization.' });
    return;
  }

  // Check for a pending invitation for the same email in this org
  const existingInvitation = db.getPendingInvitationByEmail(email.trim().toLowerCase(), orgId);
  if (existingInvitation) {
    res.status(409).json({ error: 'A pending invitation for this email already exists. Cancel it first or resend it.' });
    return;
  }

  const validRole = ['admin', 'manager', 'team_lead', 'employee'].includes(role) ? role : 'employee';
  const validDept = department || 'Engineering';

  // Secure random initial temporary password
  const randomTempPassword = crypto.randomBytes(16).toString('hex');
  const passwordHash = bcrypt.hashSync(randomTempPassword, 10);
  const token = 'inv_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

  const newUser = db.createUser({
    organizationId: orgId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: validRole,
    department: validDept,
    jobTitle: jobTitle || `${validDept} Specialist`,
    avatar: `https://images.unsplash.com/photo-${1500000000000 + (Math.floor(Math.random() * 900000000))}?w=150&auto=format&fit=crop&q=80`,
    status: 'active',
    bio: `Team member in ${validDept}`,
    phone: '',
    skills: ['Collaboration', 'Workflow Execution'],
    productivityScore: 0,
    scoreBreakdown: {
      completionRate: 0,
      deadlineAdherence: 0,
      workloadBalance: 100,
      consistency: 100,
    },
    onboardingCompleted: true,
    isDemo: false,
  });

  // Create Invitation record with 7 days expiration
  const invitation = db.createInvitation({
    organizationId: orgId,
    name: newUser.name,
    email: newUser.email,
    role: validRole,
    department: validDept,
    status: 'pending',
    token,
    invitedBy: req.user!._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'added employee',
    targetType: 'team',
    targetId: newUser._id,
    details: `Added ${newUser.name} (${validRole}) to ${validDept}`,
  });

  const { passwordHash: _, resetPasswordToken, resetPasswordExpires, ...safeUser } = newUser;

  res.status(201).json({
    user: safeUser,
    invitation,
    inviteLink: `/invite/${token}`,
    message: `Employee ${name} added successfully. An invitation token has been generated.`,
  });
});

// PUT /api/users/:id (Admin, Manager, or Self update)
router.put('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const isSelf = req.user!._id === req.params.id;
  const isAdminOrManager = req.user!.role === 'admin' || req.user!.role === 'manager';

  if (!isSelf && !isAdminOrManager) {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  const { name, role, department, jobTitle, bio, phone, skills, status, avatar } = req.body;

  const updated = db.updateUser(
    req.params.id,
    {
      ...(name !== undefined && { name: name.trim() }),
      ...(role !== undefined && req.user!.role === 'admin' && { role }),
      ...(department !== undefined && { department }),
      ...(jobTitle !== undefined && { jobTitle }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(skills !== undefined && { skills }),
      ...(status !== undefined && { status }),
      ...(avatar !== undefined && { avatar }),
    },
    orgId
  );

  if (!updated) {
    res.status(404).json({ error: 'User not found in your organization.' });
    return;
  }

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'updated profile',
    targetType: 'team',
    targetId: updated._id,
    details: `Updated profile for ${updated.name}`,
  });

  const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = updated;
  res.json({ user: safeUser, message: 'Employee profile updated successfully.' });
});

// PUT /api/users/:id/profile (alias for frontend updateProfile calls)
router.put('/:id/profile', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const isSelf = req.user!._id === req.params.id;
  const isAdminOrManager = req.user!.role === 'admin' || req.user!.role === 'manager';

  if (!isSelf && !isAdminOrManager) {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  const { name, department, jobTitle, bio, phone, skills, avatar } = req.body;

  const updated = db.updateUser(
    req.params.id,
    {
      ...(name !== undefined && { name: name.trim() }),
      ...(department !== undefined && { department }),
      ...(jobTitle !== undefined && { jobTitle }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(skills !== undefined && { skills }),
      ...(avatar !== undefined && { avatar }),
    },
    orgId
  );

  if (!updated) {
    res.status(404).json({ error: 'User not found in your organization.' });
    return;
  }

  const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = updated;
  res.json({ user: safeUser, message: 'Profile updated successfully.' });
});

// PATCH /api/users/:id/role (Admin-only role change)
router.patch('/:id/role', authenticate, requireRole(['admin']), (req: AuthRequest, res: Response): void => {
  const { role } = req.body;
  const validRoles = ['admin', 'manager', 'team_lead', 'employee'];

  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}.` });
    return;
  }

  const orgId = req.user!.organizationId;
  const target = db.getUserById(req.params.id, orgId);
  if (!target) {
    res.status(404).json({ error: 'User not found in your organization.' });
    return;
  }

  const updated = db.updateUser(req.params.id, { role }, orgId);
  if (!updated) {
    res.status(500).json({ error: 'Failed to update role.' });
    return;
  }

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'changed role',
    targetType: 'team',
    targetId: target._id,
    details: `Changed role of ${target.name} from ${target.role} to ${role}`,
  });

  const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = updated;
  res.json({ user: safeUser, message: `Role updated to ${role} for ${updated.name}.` });
});

// PATCH /api/users/:id/deactivate
router.patch('/:id/deactivate', authenticate, requireRole(['admin']), (req: AuthRequest, res: Response): void => {
  if (req.user!._id === req.params.id) {
    res.status(400).json({ error: 'You cannot deactivate your own admin account.' });
    return;
  }

  const orgId = req.user!.organizationId;
  const updated = db.updateUser(req.params.id, { status: 'away' }, orgId);
  if (!updated) {
    res.status(404).json({ error: 'User not found in your organization.' });
    return;
  }

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'deactivated employee',
    targetType: 'team',
    targetId: req.params.id,
    details: `Deactivated account for ${updated.name}`,
  });

  const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = updated;
  res.json({ user: safeUser, message: `Account for ${updated.name} deactivated.` });
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, requireRole(['admin']), (req: AuthRequest, res: Response): void => {
  if (req.user!._id === req.params.id) {
    res.status(400).json({ error: 'Cannot remove your own admin account.' });
    return;
  }

  const orgId = req.user!.organizationId;
  const user = db.getUserById(req.params.id, orgId);
  if (!user) {
    res.status(404).json({ error: 'User not found in your organization.' });
    return;
  }

  db.deleteUser(req.params.id, orgId);

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'removed employee',
    targetType: 'team',
    targetId: req.params.id,
    details: `Removed employee ${user.name} from workspace`,
  });

  res.json({ success: true, message: `Employee ${user.name} removed from workspace.` });
});

export default router;
