import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateUserMetrics } from '../../server/services/productivityMetrics.js';
import { UserDoc, TaskDoc } from '../../server/db/seedData.js';

describe('Productivity Metrics Calculations', () => {
  const mockUser: UserDoc = {
    _id: 'usr_test_1',
    organizationId: 'org_test',
    name: 'Test Engineer',
    email: 'test@example.com',
    passwordHash: 'hash',
    role: 'employee',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    avatar: 'https://example.com/avatar.jpg',
    status: 'active',
    bio: 'Test bio',
    phone: '',
    skills: ['TypeScript'],
    productivityScore: 0,
    scoreBreakdown: {
      completionRate: 0,
      deadlineAdherence: 0,
      workloadBalance: 100,
      consistency: 100,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('calculates 0 score and default baseline for user with 0 assigned tasks', () => {
    const result = calculateUserMetrics(mockUser, []);
    assert.equal(result.score, 0);
    assert.equal(result.taskCounts.total, 0);
    assert.equal(result.workloadCategory, 'Low');
    assert.equal(result.riskLevel, 'Low Risk');
    assert.ok(result.explanation.includes('no tasks assigned yet'));
  });

  it('calculates 100% completion and high productivity score when all tasks are completed on time', () => {
    const today = new Date().toISOString().split('T')[0];
    const completedTasks: TaskDoc[] = [
      {
        _id: 'tsk_1',
        organizationId: 'org_test',
        title: 'Task 1',
        description: 'Completed task 1',
        projectId: 'prj_1',
        assignedTo: 'usr_test_1',
        createdBy: 'usr_admin',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        dueDate: today,
        estimatedHours: 8,
        actualHours: 8,
        tags: [],
        comments: [],
        activity: [],
        deadlineRisk: 'LOW',
        createdAt: new Date().toISOString(),
        updatedAt: `${today}T10:00:00.000Z`,
      },
      {
        _id: 'tsk_2',
        organizationId: 'org_test',
        title: 'Task 2',
        description: 'Completed task 2',
        projectId: 'prj_1',
        assignedTo: 'usr_test_1',
        createdBy: 'usr_admin',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: today,
        estimatedHours: 12,
        actualHours: 10,
        tags: [],
        comments: [],
        activity: [],
        deadlineRisk: 'LOW',
        createdAt: new Date().toISOString(),
        updatedAt: `${today}T12:00:00.000Z`,
      },
    ];

    const result = calculateUserMetrics(mockUser, completedTasks);
    assert.equal(result.taskCounts.total, 2);
    assert.equal(result.taskCounts.completed, 2);
    assert.equal(result.breakdown.completionRate, 100);
    assert.equal(result.breakdown.deadlineAdherence, 100);
    assert.ok(result.score >= 85, `Expected score >= 85, got ${result.score}`);
    assert.equal(result.riskLevel, 'Low Risk');
  });

  it('accurately identifies overdue tasks and degrades productivity and risk level', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const overdueTasks: TaskDoc[] = [
      {
        _id: 'tsk_overdue_1',
        organizationId: 'org_test',
        title: 'Overdue task',
        description: 'Should have been done yesterday',
        projectId: 'prj_1',
        assignedTo: 'usr_test_1',
        createdBy: 'usr_admin',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        dueDate: yesterday,
        estimatedHours: 40,
        actualHours: 35,
        tags: [],
        comments: [],
        activity: [],
        deadlineRisk: 'HIGH',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'tsk_overdue_2',
        organizationId: 'org_test',
        title: 'Another overdue task',
        description: 'Blocked and late',
        projectId: 'prj_1',
        assignedTo: 'usr_test_1',
        createdBy: 'usr_admin',
        status: 'BLOCKED',
        priority: 'HIGH',
        dueDate: yesterday,
        estimatedHours: 30,
        actualHours: 20,
        tags: [],
        comments: [],
        activity: [],
        deadlineRisk: 'HIGH',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const result = calculateUserMetrics(mockUser, overdueTasks);
    assert.equal(result.taskCounts.total, 2);
    assert.equal(result.taskCounts.overdue, 2);
    assert.equal(result.taskCounts.completed, 0);
    assert.equal(result.breakdown.completionRate, 0);
    assert.equal(result.riskLevel, 'High Risk');
    assert.ok(result.score < 50, `Expected score < 50 for all-overdue tasks, got ${result.score}`);
    assert.equal(result.workloadCategory, 'Normal'); // 2 active tasks is Normal volume
  });

  it('classifies 5 active tasks as High workload and >6 as Overloaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const generateTasks = (count: number): TaskDoc[] => {
      return Array.from({ length: count }, (_, i) => ({
        _id: `tsk_load_${i}`,
        organizationId: 'org_test',
        title: `Task ${i}`,
        description: `Load test task ${i}`,
        projectId: 'prj_1',
        assignedTo: 'usr_test_1',
        createdBy: 'usr_admin',
        status: 'IN_PROGRESS' as const,
        priority: 'MEDIUM' as const,
        dueDate: today,
        estimatedHours: 8,
        actualHours: 4,
        tags: [],
        comments: [],
        activity: [],
        deadlineRisk: 'LOW' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    };

    const highResult = calculateUserMetrics(mockUser, generateTasks(5));
    assert.equal(highResult.workloadCategory, 'High');

    const overloadedResult = calculateUserMetrics(mockUser, generateTasks(8));
    assert.equal(overloadedResult.workloadCategory, 'Overloaded');
  });
});
