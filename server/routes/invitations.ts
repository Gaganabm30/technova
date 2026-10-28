import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest, requireRole, generateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/invitations
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const invitations = db.getInvitations(orgId);
  res.json({ invitations });
});

// POST /api/invitations
router.post('/', authenticate, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response): void => {
  const { name, email, role, department } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const orgId = req.user!.organizationId;

  // Check for existing active user in this org
  const existingUser = db.getUserByEmailInOrg(email.trim().toLowerCase(), orgId);
  if (existingUser && existingUser.status !== 'pending') {
    res.status(409).json({ error: 'A team member with this email is already active in your organization.' });
    return;
  }

  // Check for duplicate pending invitation
  const existingInvitation = db.getPendingInvitationByEmail(email.trim().toLowerCase(), orgId);
  if (existingInvitation) {
    res.status(409).json({ error: 'A pending invitation for this email already exists. Cancel or resend it instead.' });
    return;
  }

  const validRole = ['admin', 'manager', 'team_lead', 'employee'].includes(role) ? role : 'employee';
  const validDept = department || 'Engineering';
  const token = 'inv_' + Date.now().toString(36) + crypto.randomBytes(8).toString('hex');

  // Create pending user record so they appear in directory with 'pending' status
  let existingOrPendingUser = db.getUserByEmail(email.trim().toLowerCase());
  if (!existingOrPendingUser) {
    // Secure random initial password hash (user will set their own password upon accepting)
    const randomTempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = bcrypt.hashSync(randomTempPassword, 10);
    existingOrPendingUser = db.createUser({
      organizationId: orgId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: validRole,
      department: validDept,
      jobTitle: `${validDept} Specialist`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      status: 'pending',
      bio: `Invited team member in ${validDept}`,
      phone: '',
      skills: ['Workflow Execution'],
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
  }

  const invitation = db.createInvitation({
    organizationId: orgId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
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
    action: 'invited employee',
    targetType: 'team',
    targetId: invitation._id,
    details: `Sent invitation to ${name} (${email}) as ${validRole}`,
  });

  res.status(201).json({
    invitation,
    inviteLink: `/invite/${token}`,
    emailNotice: 'Email delivery is currently in demo/development mode. Use the direct invitation link to join.',
    message: `Invitation created for ${name}.`,
  });
});

// POST /api/invitations/:id/resend
router.post('/:id/resend', authenticate, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const invitation = db.getInvitationById(req.params.id, orgId);
  if (!invitation) {
    res.status(404).json({ error: 'Invitation not found.' });
    return;
  }

  const newToken = 'inv_' + Date.now().toString(36) + crypto.randomBytes(8).toString('hex');
  const updated = db.updateInvitation(req.params.id, {
    token: newToken,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }, orgId);

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'resent invitation',
    targetType: 'team',
    targetId: invitation._id,
    details: `Resent invitation to ${invitation.name} (${invitation.email})`,
  });

  res.json({
    invitation: updated,
    inviteLink: `/invite/${newToken}`,
    message: `Invitation re-issued for ${invitation.name}.`,
  });
});

// DELETE /api/invitations/:id
router.delete('/:id', authenticate, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const invitation = db.getInvitationById(req.params.id, orgId);
  if (!invitation) {
    res.status(404).json({ error: 'Invitation not found.' });
    return;
  }

  db.deleteInvitation(req.params.id, orgId);

  db.logActivity({
    organizationId: orgId,
    userId: req.user!._id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    action: 'cancelled invitation',
    targetType: 'team',
    targetId: req.params.id,
    details: `Cancelled invitation for ${invitation.name}`,
  });

  res.json({ success: true, message: 'Invitation cancelled.' });
});

// GET /api/invitations/verify/:token
router.get('/verify/:token', (req: Request, res: Response): void => {
  const invitation = db.getInvitationByToken(req.params.token, true);
  if (!invitation || invitation.status !== 'pending') {
    res.status(404).json({ error: 'Invalid or expired invitation link. Please request a new invitation.' });
    return;
  }

  const organization = db.getOrganizationById(invitation.organizationId);

  res.json({
    invitation,
    organizationName: organization?.name || 'TechNova Workspace',
  });
});

// POST /api/invitations/accept
router.post('/accept', (req: Request, res: Response): void => {
  const { token, password, name } = req.body;

  if (!token || !password) {
    res.status(400).json({ error: 'Invitation token and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const invitation = db.getInvitationByToken(token, true);
  if (!invitation || invitation.status !== 'pending') {
    res.status(400).json({ error: 'This invitation is invalid or has expired.' });
    return;
  }

  const user = db.getUserByEmail(invitation.email);
  if (!user) {
    res.status(404).json({ error: 'User record not found for this invitation.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const updatedUser = db.updateUser(user._id, {
    passwordHash,
    status: 'active',
    ...(name && { name: name.trim() }),
  });

  db.acceptInvitation(token);

  const authToken = generateToken(updatedUser!);
  const { passwordHash: _, ...safeUser } = updatedUser!;
  const organization = db.getOrganizationById(user.organizationId || '');

  res.json({
    success: true,
    token: authToken,
    user: safeUser,
    organization,
    message: `Welcome to ${organization?.name || 'TechNova Workspace'}, ${updatedUser?.name}!`,
  });
});

export default router;
