import { Router, Response } from 'express';
import { db } from '../db/storage.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;

  // Run automated rules evaluation (overdue tasks, blocked alerts)
  db.evaluateAutomations(orgId);

  const notifs = db.getNotifications(req.user!._id, orgId);
  const unreadCount = notifs.filter(n => !n.read).length;
  res.json({ notifications: notifs, unreadCount });
});

// POST /api/notifications/run-automations
router.post('/run-automations', authenticate, (req: AuthRequest, res: Response): void => {
  const orgId = req.user!.organizationId;
  const result = db.evaluateAutomations(orgId);
  res.json({
    success: true,
    message: `Automations evaluated. ${result.notificationsCreated} new alerts generated.`,
    ...result,
  });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, (req: AuthRequest, res: Response): void => {
  const success = db.markNotificationAsRead(req.params.id, req.user!._id, req.user!.organizationId);
  res.json({ success });
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', authenticate, (req: AuthRequest, res: Response): void => {
  const count = db.markAllNotificationsAsRead(req.user!._id, req.user!.organizationId);
  res.json({ success: true, updatedCount: count });
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const success = db.deleteNotification(req.params.id, req.user!._id, req.user!.organizationId);
  res.json({ success, message: success ? 'Notification removed.' : 'Notification not found.' });
});

// GET /api/notifications/activities
router.get('/activities', authenticate, (req: AuthRequest, res: Response): void => {
  const limit = Number(req.query.limit) || 30;
  const activities = db.getActivities(req.user!.organizationId, limit);
  res.json({ activities });
});

export default router;
