import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, TestContext } from '../testHelper.js';

describe('Auth, Roles & Permission Enforcement', () => {
  let ctx: TestContext;
  let adminToken = '';
  let managerToken = '';
  let leadToken = '';
  let employeeToken = '';

  before(async () => {
    ctx = await setupTestEnvironment();
  });

  after(async () => {
    await ctx.close();
  });

  it('authenticates Owner/Admin successfully and returns valid JWT token', async () => {
    const res = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ananya.sharma@technova.io', password: 'password123' }),
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'admin');
    assert.equal(res.body.user.organizationId, 'org_demo');
    adminToken = res.body.token;
  });

  it('authenticates Manager successfully and returns valid JWT token', async () => {
    const res = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sneha.rao@technova.io', password: 'password123' }),
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'manager');
    managerToken = res.body.token;
  });

  it('authenticates Team Lead successfully and returns valid JWT token', async () => {
    const res = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'priya.nair@technova.io', password: 'password123' }),
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'team_lead');
    leadToken = res.body.token;
  });

  it('authenticates Employee successfully and returns valid JWT token', async () => {
    const res = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rahul.kumar@technova.io', password: 'password123' }),
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'employee');
    employeeToken = res.body.token;
  });

  it('rejects login with invalid password with 401', async () => {
    const res = await ctx.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ananya.sharma@technova.io', password: 'wrongpassword' }),
    });
    assert.equal(res.status, 401);
    assert.ok(res.body.error);
  });

  it('blocks unauthenticated requests to protected endpoints with 401', async () => {
    const res = await ctx.request('/api/tasks');
    assert.equal(res.status, 401);
    assert.ok(res.body.error.includes('Authentication required'));
  });

  it('blocks requests with forged/tampered tokens with 401', async () => {
    const res = await ctx.request('/api/tasks', {
      headers: { Authorization: 'Bearer forged.invalid.token' },
    });
    assert.equal(res.status, 401);
    assert.ok(res.body.error.includes('Invalid or expired'));
  });

  it('blocks Employee from sending employee invitations with 403 Forbidden', async () => {
    const res = await ctx.request('/api/invitations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({
        name: 'Forbidden Invite',
        email: 'forbidden@example.com',
        role: 'employee',
        department: 'Engineering',
      }),
    });
    assert.equal(res.status, 403);
    assert.ok(res.body.error.includes('Access denied'));
  });

  it('blocks Employee from exporting team CSV with 403 Forbidden', async () => {
    const res = await ctx.request('/api/users/export/csv', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert.equal(res.status, 403);
    assert.ok(res.body.error.includes('Access denied'));
  });

  it('blocks Employee from deleting projects with 403 Forbidden', async () => {
    const res = await ctx.request('/api/projects/prj_analytics', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert.equal(res.status, 403);
    assert.ok(res.body.error.includes('Access denied'));
  });

  it('allows Manager and Admin to export team directory CSV', async () => {
    const res = await ctx.request('/api/users/export/csv', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/csv'));
    assert.ok(typeof res.body === 'string' && res.body.includes('Ananya Sharma'));
  });

  it('enforces multi-tenant isolation: Org B cannot access Org A data', async () => {
    // Register user in a separate organization
    const regRes = await ctx.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Org B Founder',
        email: 'founder@orgb.io',
        password: 'password123',
        organizationName: 'Acme Corp B',
        department: 'Executive',
      }),
    });
    assert.equal(regRes.status, 201);
    const orgBToken = regRes.body.token;
    assert.ok(orgBToken);

    // Fetch tasks as Org B user -> should NOT see any tasks from org_demo
    const tasksRes = await ctx.request('/api/tasks', {
      headers: { Authorization: `Bearer ${orgBToken}` },
    });
    assert.equal(tasksRes.status, 200);
    assert.equal(tasksRes.body.tasks.length, 0);

    // Attempt to access task from org_demo directly by ID
    const demoTaskId = 'tsk_ml_pipeline';
    const singleTaskRes = await ctx.request(`/api/tasks/${demoTaskId}`, {
      headers: { Authorization: `Bearer ${orgBToken}` },
    });
    assert.equal(singleTaskRes.status, 404);

    // Attempt to delete project from org_demo as Org B admin
    const deleteRes = await ctx.request('/api/projects/prj_analytics', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${orgBToken}` },
    });
    assert.equal(deleteRes.status, 404);
  });
});
