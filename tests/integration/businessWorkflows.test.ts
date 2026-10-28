import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, TestContext } from '../testHelper.js';

describe('Complete Business Workflows Lifecycle', () => {
  let ctx: TestContext;
  let adminToken = '';
  let employeeToken = '';
  let invitedEmployeeEmail = 'newhire.john@technova.io';
  let invitationToken = '';
  let acceptedEmployeeToken = '';
  let acceptedUserId = '';
  let createdTaskId = '';
  let createdProjectId = '';

  before(async () => {
    ctx = await setupTestEnvironment();

    // Login as Admin
    const adminRes = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ananya.sharma@technova.io', password: 'password123' }),
    });
    adminToken = adminRes.body.token;

    // Login as existing Employee
    const empRes = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rahul.kumar@technova.io', password: 'password123' }),
    });
    employeeToken = empRes.body.token;
  });

  after(async () => {
    await ctx.close();
  });

  describe('1. Employee Onboarding Workflow', () => {
    it('1. Owner invites an employee', async () => {
      const res = await ctx.request('/api/invitations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'John Doe',
          email: invitedEmployeeEmail,
          role: 'employee',
          department: 'Engineering',
        }),
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.invitation);
      assert.equal(res.body.invitation.status, 'pending');
      invitationToken = res.body.invitation.token;
      assert.ok(invitationToken);
    });

    it('2. The invitation is persisted and visible in pending list', async () => {
      const res = await ctx.request('/api/invitations', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const found = res.body.invitations.find((i: any) => i.email === invitedEmployeeEmail);
      assert.ok(found, 'Pending invitation must be in list');
      assert.equal(found.status, 'pending');
    });

    it('3. The employee verifies and accepts a valid invitation', async () => {
      // Step A: Verify invitation
      const verifyRes = await ctx.request(`/api/invitations/verify/${invitationToken}`);
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyRes.body.invitation.email, invitedEmployeeEmail);

      // Step B: Accept invitation with password
      const acceptRes = await ctx.request('/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({
          token: invitationToken,
          password: 'newhirepassword123',
          name: 'John Doe',
        }),
      });
      assert.equal(acceptRes.status, 200);
      assert.ok(acceptRes.body.token);
      assert.equal(acceptRes.body.user.status, 'active');
      acceptedEmployeeToken = acceptRes.body.token;
      acceptedUserId = acceptRes.body.user._id;
    });

    it('4. The employee reaches dashboard with authenticated credentials', async () => {
      const meRes = await ctx.request('/api/auth/me', {
        headers: { Authorization: `Bearer ${acceptedEmployeeToken}` },
      });
      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.user.email, invitedEmployeeEmail);
      assert.equal(meRes.body.user.role, 'employee');

      // Fetch dashboard analytics
      const dashRes = await ctx.request('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${acceptedEmployeeToken}` },
      });
      assert.equal(dashRes.status, 200);
      assert.ok(dashRes.body.kpis);
    });

    it('5. The owner sees the updated membership status in the team directory', async () => {
      const teamRes = await ctx.request('/api/users', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(teamRes.status, 200);
      const member = teamRes.body.users.find((u: any) => u.email === invitedEmployeeEmail);
      assert.ok(member, 'New member must appear in team list');
      assert.equal(member.status, 'active');
    });
  });

  describe('2. Task Lifecycle Workflow', () => {
    it('1. Create a task and assign it to an authorized employee', async () => {
      const res = await ctx.request('/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          title: 'Implement Payment Gateway Webhook',
          description: 'Handle idempotent Stripe webhook retries',
          projectId: 'prj_analytics',
          assignedTo: acceptedUserId,
          priority: 'HIGH',
          estimatedHours: 16,
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        }),
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.task);
      assert.equal(res.body.task.status, 'TODO');
      assert.equal(res.body.task.assignedTo, acceptedUserId);
      createdTaskId = res.body.task._id;
    });

    it('2. Edit task details and deadline', async () => {
      const newDeadline = new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0];
      const res = await ctx.request(`/api/tasks/${createdTaskId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          title: 'Implement Payment Gateway Webhook & Logs',
          dueDate: newDeadline,
          estimatedHours: 20,
        }),
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.task.title, 'Implement Payment Gateway Webhook & Logs');
      assert.equal(res.body.task.dueDate, newDeadline);
    });

    it('3. Update task status (to IN_PROGRESS and then COMPLETED)', async () => {
      // Step A: Move to IN_PROGRESS
      const inProgRes = await ctx.request(`/api/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${acceptedEmployeeToken}` },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      assert.equal(inProgRes.status, 200);
      assert.equal(inProgRes.body.task.status, 'IN_PROGRESS');

      // Step B: Move to COMPLETED
      const compRes = await ctx.request(`/api/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${acceptedEmployeeToken}` },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      assert.equal(compRes.status, 200);
      assert.equal(compRes.body.task.status, 'COMPLETED');
    });

    it('4. Add a comment to the task and verify persistence', async () => {
      const commentRes = await ctx.request(`/api/tasks/${createdTaskId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${acceptedEmployeeToken}` },
        body: JSON.stringify({ content: 'Finished webhook signature verification and test coverage.' }),
      });
      assert.equal(commentRes.status, 200);
      assert.ok(commentRes.body.comments.length > 0);
      const lastComment = commentRes.body.comments[commentRes.body.comments.length - 1];
      assert.equal(lastComment.content, 'Finished webhook signature verification and test coverage.');

      // Retrieve comments
      const getRes = await ctx.request(`/api/tasks/${createdTaskId}/comments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(getRes.status, 200);
      assert.ok(getRes.body.comments.some((c: any) => c.content.includes('Finished webhook signature')));
    });

    it('5. Reopen the task and verify dashboard statistics and activity history update', async () => {
      // Reopen to IN_REVIEW
      const reopenRes = await ctx.request(`/api/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'IN_REVIEW' }),
      });
      assert.equal(reopenRes.status, 200);
      assert.equal(reopenRes.body.task.status, 'IN_REVIEW');

      // Verify activity history logged
      const actRes = await ctx.request('/api/notifications/activities?limit=10', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(actRes.status, 200);
      assert.ok(actRes.body.activities.length > 0);
      const foundActivity = actRes.body.activities.find((a: any) => a.targetId === createdTaskId);
      assert.ok(foundActivity, 'Status change must be recorded in activity history');
    });
  });

  describe('3. Project Lifecycle Workflow', () => {
    it('1. Create a project and add authorized members', async () => {
      const res = await ctx.request('/api/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Customer Portal Modernization',
          key: 'CPM',
          description: 'Revamping customer facing account dashboard',
          department: 'Engineering',
          memberIds: [acceptedUserId, 'usr_rahul'],
          budgetHours: 120,
        }),
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.project);
      assert.equal(res.body.project.name, 'Customer Portal Modernization');
      assert.ok(res.body.project.memberIds.includes(acceptedUserId));
      createdProjectId = res.body.project._id;
    });

    it('2. Associate tasks to the new project and toggle milestone', async () => {
      // Create task in project
      const taskRes = await ctx.request('/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          title: 'Design Wireframes',
          projectId: createdProjectId,
          assignedTo: acceptedUserId,
          priority: 'MEDIUM',
          status: 'COMPLETED',
        }),
      });
      assert.equal(taskRes.status, 201);

      // Fetch project to inspect default milestones
      const projRes = await ctx.request(`/api/projects/${createdProjectId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(projRes.status, 200);
      const milestone = projRes.body.project.milestones[0];
      assert.ok(milestone);

      // Toggle milestone
      const toggleRes = await ctx.request(`/api/projects/${createdProjectId}/milestones/${milestone.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ completed: true }),
      });
      assert.equal(toggleRes.status, 200);
      const updatedMs = toggleRes.body.project.milestones.find((m: any) => m.id === milestone.id);
      assert.equal(updatedMs.completed, true);
    });

    it('3. Verify project progress and health indicators reflect real tasks', async () => {
      const res = await ctx.request(`/api/projects/${createdProjectId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.project.completedTaskCount, 1);
      assert.equal(res.body.project.progress, 100);
      assert.equal(res.body.project.health, 'Healthy');
    });
  });

  describe('4. Role Changes Workflow', () => {
    it('1. Change employee role to team_lead using authorized admin account', async () => {
      const res = await ctx.request(`/api/users/${acceptedUserId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ role: 'team_lead' }),
      });
      assert.equal(res.status, 200);

      // Verify database reflects the updated role
      const userRes = await ctx.request(`/api/users/${acceptedUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(userRes.status, 200);
      assert.equal(userRes.body.user.role, 'team_lead');
    });

    it('2. The member now has team_lead privileges on their subsequent request without stale session retention', async () => {
      // In the auth middleware, authenticate fetches user directly from db on each request.
      // So the existing acceptedEmployeeToken now immediately inherits the team_lead role!
      const meRes = await ctx.request('/api/auth/me', {
        headers: { Authorization: `Bearer ${acceptedEmployeeToken}` },
      });
      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.user.role, 'team_lead');
    });
  });
});
