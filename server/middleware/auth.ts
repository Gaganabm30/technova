import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/storage.js';
import { UserDoc } from '../db/seedData.js';

const JWT_SECRET = process.env.JWT_SECRET || 'technova-super-secret-key-enterprise-2026';

// Authenticated user always has organizationId set
export type AuthUser = UserDoc & { organizationId: string; onboardingCompleted: boolean };

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: UserDoc): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }
    req.user = user as AuthUser;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
    return;
  }
}

export function requireRole(allowedRoles: ('admin' | 'manager' | 'team_lead' | 'employee')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // Admins always have access
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Workspace owner always has all permissions in their own workspace
    const org = db.getOrganizationById(req.user.organizationId);
    if (org && org.ownerId === req.user._id) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role "${req.user.role}" does not have permission to perform this action.`,
      });
      return;
    }

    next();
  };
}
