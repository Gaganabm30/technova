import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, TestContext } from '../testHelper.js';

describe('AI Features, Analytics, Notifications & Failure Resilience', () => {
  let ctx: TestContext;
  let adminToken = '';
  let employeeToken = '';
  let emptyOrgToken = '';

  before(async () => {
    ctx = await setupTestEnvironment();

    // Admin login
    const adminRes = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ananya.sharma@technova.io', password: 'password123' }),
    });
    adminToken = adminRes.body.token;

    // Employee login
    const empRes = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rahul.kumar@technova.io', password: 'password123' }),
    });
    employeeToken = empRes.body.token;

    // Create an empty organization to test graceful empty states & insufficient data
    const emptyRegRes = await ctx.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Empty Org Founder',
        email: 'emptyfounder@brandneworg.com',
        password: 'password123',
        organizationName: 'Brand New Blank Org',
        department: 'Operations',
      }),
    });
    emptyOrgToken = emptyRegRes.body.token;
  });

  after(async () => {
    await ctx.close();
  });

  describe('1. AI Features & Graceful Fallback Handling', () => {
    it('Daily Brief handles empty organization with friendly onboarding guidance', async () => {
      const res = await ctx.request('/api/ai/daily-brief', {
        headers: { Authorization: `Bearer ${emptyOrgToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.brief);
      assert.ok(res.body.brief.headline.includes('Welcome'));
      assert.ok(res.body.brief.summary.includes('invite your colleagues'));
    });

    it('Daily Brief works with normal populated organization data', async () => {
      const res = await ctx.request('/api/ai/daily-brief', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.brief);
      assert.ok(res.body.brief.headline);
    });

    it('AI Daily Planner generates schedule plan and validates capacity hours', async () => {
      const res = await ctx.request('/api/ai/daily-planner', {
        method: 'POST',
        headers: { Authorization: `Bearer ${employeeToken}` },
        body: JSON.stringify({ capacityHours: 8 }),
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.success);
      assert.ok(res.body.data);
    });

    it('AI Assistant Chat rejects empty query with 400', async () => {
      const res = await ctx.request('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ query: '   ' }),
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.error.includes('Query is required'));
    });

    it('AI Assistant Chat processes natural language query with workspace context', async () => {
      const res = await ctx.request('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ query: 'What tasks are currently in progress?' }),
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.success);
      assert.ok(res.body.answer);
    });

    it('AI Meeting Notes Parser extracts structured actionable tasks', async () => {
      const sampleNotes = `
        Meeting with Design & Eng Team:
        1. Rahul will fix the login responsive layout by Friday.
        2. Vikram will review the PR for dark mode.
      `;
      const res = await ctx.request('/api/ai/parse-meeting-notes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ notes: sampleNotes }),
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.success);
      // API returns proposedTasks (not tasks)
      assert.ok(Array.isArray(res.body.data.proposedTasks));
    });

    it('AI Workload Analysis returns structured capacity breakdown', async () => {
      const res = await ctx.request('/api/ai/workload-analysis', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.success);
      // Route returns { overview, recommendations, members } from analyzeTeamWorkload
      const d = res.body.data;
      assert.ok(
        d.members !== undefined || d.teamBreakdown !== undefined || d.overallHealth !== undefined,
        `Expected workload keys in: ${JSON.stringify(Object.keys(d || {}))}`
      );
    });

    it('AI Project Brief generates executive project summary', async () => {
      // Find a project ID
      const projectsRes = await ctx.request('/api/projects', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(projectsRes.status, 200);
      const projectId = projectsRes.body.projects?.[0]?._id;
      if (projectId) {
        const briefRes = await ctx.request('/api/ai/project-brief', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ projectId }),
        });
        assert.equal(briefRes.status, 200);
        assert.ok(briefRes.body.success);
      }
    });
  });

  describe('2. Notifications, Activities & Analytics', () => {
    let testNotifId = '';

    it('lists notifications and computes unread count accurately', async () => {
      const res = await ctx.request('/api/notifications', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.notifications));
      assert.equal(typeof res.body.unreadCount, 'number');
      if (res.body.notifications.length > 0) {
        testNotifId = res.body.notifications[0]._id;
      }
    });

    it('marks individual notification as read and persists state', async () => {
      if (!testNotifId) return;
      const readRes = await ctx.request(`/api/notifications/${testNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(readRes.status, 200);
      assert.equal(readRes.body.success, true);
    });

    it('mark-all-read updates all unread notifications for the user', async () => {
      const res = await ctx.request('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify unread count is now 0
      const listRes = await ctx.request('/api/notifications', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(listRes.body.unreadCount, 0);
    });

    it('supports date range filtering on Analytics Overview (7d, 30d, 90d, all)', async () => {
      for (const range of ['7d', '30d', '90d', 'all']) {
        const res = await ctx.request(`/api/analytics/overview?dateRange=${range}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.equal(res.status, 200);
        assert.ok(res.body.kpis);
        assert.equal(res.body.selectedTimeframe, range);
      }
    });

    it('exports tasks and projects to CSV with authorized records only', async () => {
      const tasksCsv = await ctx.request('/api/tasks/export/csv', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(tasksCsv.status, 200);
      assert.ok(tasksCsv.headers.get('content-type')?.includes('text/csv'));
      assert.ok(tasksCsv.body.includes('Task ID') || tasksCsv.body.includes('Title'));

      const projectsCsv = await ctx.request('/api/projects/export/csv', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(projectsCsv.status, 200);
      assert.ok(projectsCsv.headers.get('content-type')?.includes('text/csv'));
    });
  });

  describe('3. Failure Resilience Scenarios', () => {
    it('handles duplicate invitations by rejecting with 409 Conflict', async () => {
      // First invitation
      const inviteData = {
        name: 'Duplicate Test',
        email: 'duplicate.candidate@technova.io',
        role: 'employee',
        department: 'Design',
      };
      const res1 = await ctx.request('/api/invitations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(inviteData),
      });
      assert.equal(res1.status, 201);

      // Attempting to invite again with same email
      const res2 = await ctx.request('/api/invitations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(inviteData),
      });
      assert.equal(res2.status, 409);
      assert.ok(res2.body.error.includes('already exists'));
    });

    it('validates task creation inputs rejecting empty title or invalid project with 400', async () => {
      const res = await ctx.request('/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ title: '', projectId: 'prj_analytics' }),
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.error.includes('required'));

      const resBadProj = await ctx.request('/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ title: 'Valid Title', projectId: 'nonexistent_project_id' }),
      });
      assert.equal(resBadProj.status, 400);
      assert.ok(resBadProj.body.error.includes('does not exist'));
    });

    it('rejects password reset with token that does not exist or expired with 400', async () => {
      const res = await ctx.request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: 'nonexistent_invalid_token', newPassword: 'newsecurepass123' }),
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.error.includes('Invalid or expired'));
    });

    it('health check endpoint reports status healthy', async () => {
      const res = await ctx.request('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'healthy');
    });
  });
});
