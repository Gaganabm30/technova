import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/login
router.post('/login', authRateLimiter, (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  const { passwordHash, ...safeUser } = user;
  const organization = db.getOrganizationById(user.organizationId || '');

  res.json({
    token,
    user: safeUser,
    organization,
    message: `Welcome back, ${user.name}!`,
  });
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const { name, email, password, organizationName, role, department, jobTitle } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const targetOrgName = organizationName ? organizationName.trim() : `${name}'s Workspace`;

  // 1. Create Organization in MongoDB / storage
  const newOrg = db.createOrganization({
    name: targetOrgName,
    industry: 'Software / Technology',
    companySize: '11–50',
    department: department || 'Engineering',
    ownerId: 'pending',
    isDemo: false,
    onboardingCompleted: false,
  });

  const passwordHash = bcrypt.hashSync(password, 10);
  const validRole = 'admin';
  const validDept = department || 'Engineering';

  const avatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

  // 2. Create User in MongoDB / storage associated with organization
  const newUser = db.createUser({
    organizationId: newOrg._id,
    name,
    email,
    passwordHash,
    role: validRole,
    department: validDept,
    jobTitle: jobTitle || `${validDept} Director`,
    avatar,
    status: 'active',
    bio: `Workspace Administrator at ${targetOrgName}`,
    phone: '',
    skills: ['Leadership', 'Workflow Architecture'],
    productivityScore: 0,
    scoreBreakdown: {
      completionRate: 0,
      deadlineAdherence: 0,
      workloadBalance: 100,
      consistency: 100,
    },
    onboardingCompleted: false,
    isDemo: false,
  });

  // 3. Link ownerId on organization
  db.updateOrganization(newOrg._id, { ownerId: newUser._id });

  // 4. Log initial organization creation activity
  db.logActivity({
    organizationId: newOrg._id,
    userId: newUser._id,
    userName: newUser.name,
    userAvatar: newUser.avatar,
    action: 'created organization',
    targetType: 'organization',
    targetId: newOrg._id,
    details: `${newUser.name} created workspace for "${targetOrgName}"`,
  });

  const token = generateToken(newUser);
  const { passwordHash: _, ...safeUser } = newUser;

  res.status(201).json({
    token,
    user: safeUser,
    organization: newOrg,
    message: 'Account and Organization created successfully. Welcome to onboarding!',
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  const { passwordHash, ...safeUser } = req.user;
  const organization = db.getOrganizationById(req.user.organizationId);
  res.json({ user: safeUser, organization });
});

// POST /api/auth/complete-onboarding
router.post('/complete-onboarding', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  db.updateUser(req.user._id, { onboardingCompleted: true });
  db.updateOrganization(req.user.organizationId, { onboardingCompleted: true });

  db.logActivity({
    organizationId: req.user.organizationId,
    userId: req.user._id,
    userName: req.user.name,
    userAvatar: req.user.avatar,
    action: 'completed onboarding',
    targetType: 'system',
    details: `${req.user.name} completed initial workspace setup`,
  });

  const updatedUser = db.getUserById(req.user._id);
  const { passwordHash, ...safeUser } = updatedUser!;

  res.json({
    success: true,
    user: safeUser,
    message: 'Onboarding completed successfully!',
  });
});

// POST /api/auth/organization-setup (updates organization details during onboarding)
router.post('/organization-setup', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const { name, industry, companySize, department } = req.body;
  const updatedOrg = db.updateOrganization(req.user.organizationId, {
    ...(name && { name }),
    ...(industry && { industry }),
    ...(companySize && { companySize }),
    ...(department && { department }),
  });

  if (department && department !== req.user.department) {
    db.updateUser(req.user._id, { department });
  }

  res.json({
    success: true,
    organization: updatedOrg,
    message: 'Organization details updated.',
  });
});

// GET /api/auth/organizations (List accessible organizations for current user)
router.get('/organizations', authenticate, (req: AuthRequest, res: Response): void => {
  const user = req.user!;
  const allOrgs = db.getOrganizations();
  const accessibleOrgs = allOrgs.filter(org => {
    if (org._id === user.organizationId) return true;
    if (org.ownerId === user._id) return true;
    const orgUsers = db.getUsers(org._id);
    return orgUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase());
  });

  res.json({
    organizations: accessibleOrgs,
    currentOrganizationId: user.organizationId,
  });
});

// POST /api/auth/switch-organization
router.post('/switch-organization', authenticate, (req: AuthRequest, res: Response): void => {
  const { organizationId } = req.body;
  if (!organizationId) {
    res.status(400).json({ error: 'organizationId is required.' });
    return;
  }

  const currentUser = req.user!;
  const targetOrg = db.getOrganizationById(organizationId);
  if (!targetOrg) {
    res.status(404).json({ error: 'Target organization not found.' });
    return;
  }

  let targetUser = db.getUsers(organizationId).find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());

  if (!targetUser && targetOrg.ownerId === currentUser._id) {
    targetUser = db.createUser({
      organizationId,
      name: currentUser.name,
      email: currentUser.email,
      passwordHash: '',
      role: 'admin',
      department: currentUser.department || 'Executive',
      jobTitle: 'Workspace Owner',
      avatar: currentUser.avatar,
      status: 'active',
      bio: currentUser.bio || 'Workspace Administrator',
      phone: currentUser.phone || '',
      skills: currentUser.skills || [],
      productivityScore: currentUser.productivityScore || 85,
      scoreBreakdown: currentUser.scoreBreakdown || {
        completionRate: 85,
        deadlineAdherence: 85,
        workloadBalance: 85,
        consistency: 85,
      },
      onboardingCompleted: true,
      isDemo: targetOrg.isDemo || false,
    });
  }

  if (!targetUser) {
    res.status(403).json({ error: 'You do not have access to this organization.' });
    return;
  }

  const token = generateToken(targetUser);
  const { passwordHash: _, ...safeUser } = targetUser;

  res.json({
    success: true,
    token,
    user: safeUser,
    organization: targetOrg,
    message: `Switched to ${targetOrg.name}`,
  });
});

// POST /api/auth/explore-demo
router.post('/explore-demo', (req: Request, res: Response): void => {
  const demoAdmin = db.getUserByEmail('ananya.sharma@technova.io') || db.getUsers('org_demo')[0];
  if (!demoAdmin) {
    db.resetToSeed();
    const seededAdmin = db.getUserByEmail('ananya.sharma@technova.io');
    if (!seededAdmin) {
      res.status(500).json({ error: 'Failed to initialize demo workspace.' });
      return;
    }
    const token = generateToken(seededAdmin);
    const { passwordHash, ...safeUser } = seededAdmin;
    res.json({
      token,
      user: safeUser,
      organization: db.getOrganizationById(seededAdmin.organizationId || ''),
      message: 'Entered Demo Workspace as Admin (Ananya Sharma)',
    });
    return;
  }

  const token = generateToken(demoAdmin);
  const { passwordHash, ...safeUser } = demoAdmin;
  res.json({
    token,
    user: safeUser,
    organization: db.getOrganizationById(demoAdmin.organizationId || ''),
    message: 'Entered Demo Workspace as Admin (Ananya Sharma)',
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    // Prevent email enumeration
    res.json({
      success: true,
      message: 'If that email exists in our system, password reset instructions have been generated.',
    });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  db.setPasswordResetToken(user.email, resetToken, 60 * 60 * 1000); // 1 hour expiration

  res.json({
    success: true,
    message: `A secure password reset link has been created for ${email}.`,
    resetToken,
    resetLink: `/forgot-password?token=${resetToken}`,
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, (req: Request, res: Response): void => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const user = db.getUserByResetToken(token);
  if (!user) {
    res.status(400).json({ error: 'Invalid or expired password reset token.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.updateUser(user._id, { passwordHash });
  db.clearPasswordResetToken(user._id);

  db.logActivity({
    organizationId: user.organizationId || '',
    userId: user._id,
    userName: user.name,
    userAvatar: user.avatar,
    action: 'reset password',
    targetType: 'system',
    details: `${user.name} reset their account password`,
  });

  res.json({
    success: true,
    message: 'Your password has been successfully reset. You can now log in with your new password.',
  });
});

// POST /api/auth/reset-demo-data
router.post('/reset-demo-data', (req: Request, res: Response): void => {
  db.resetToSeed();
  res.json({ message: 'Demo database reset to default pristine state.' });
});

export default router;
