import express, { Express } from 'express';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import invitationRoutes from './routes/invitations.js';
import { securityHeaders, sanitizeInputs } from './middleware/security.js';

export function createApiApp(): Express {
  const app = express();

  app.use(securityHeaders);
  app.use(express.json({ limit: '5mb' }));
  app.use(sanitizeInputs);

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/invitations', invitationRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'AI-Powered Employee Workflow & Productivity Management System',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
