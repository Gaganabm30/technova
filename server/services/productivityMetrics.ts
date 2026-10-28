import { TaskDoc, UserDoc } from '../db/seedData.js';

export interface UserMetricsResult {
  score: number;
  explanation: string;
  breakdown: {
    completionRate: number;     // 0-100: percentage of assigned tasks completed
    deadlineAdherence: number;  // 0-100: percentage of tasks completed before or on dueDate
    overdueRatio: number;       // 0-100: percentage of active tasks currently past dueDate
    workloadBalance: number;    // 0-100: workload balance
    consistency: number;        // 0-100: variance and progress activity consistency
  };
  taskCounts: {
    total: number;
    completed: number;
    inProgress: number;
    inReview: number;
    todo: number;
    blocked: number;
    overdue: number;
  };
  totalEstimatedHours: number;
  totalActualHours: number;
  workloadCategory: 'Low' | 'Normal' | 'High' | 'Overloaded';
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
}

/**
 * Enterprise Workflow & Productivity Score Calculation
 * 
 * Formal Weighted Formula:
 * - 40% Task Completion Rate
 * - 25% Deadline Adherence
 * - 20% Workload Balance
 * - 15% Consistency
 * 
 * Score = (Completion Rate * 0.40) + 
 *         (Deadline Adherence * 0.25) + 
 *         (Workload Balance * 0.20) + 
 *         (Consistency * 0.15)
 */
export function calculateUserMetrics(user: UserDoc, tasks: TaskDoc[]): UserMetricsResult {
  const userTasks = tasks.filter(t => t.assignedTo === user._id);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const total = userTasks.length;
  const completedTasks = userTasks.filter(t => t.status === 'COMPLETED');
  const inProgressTasks = userTasks.filter(t => t.status === 'IN_PROGRESS');
  const inReviewTasks = userTasks.filter(t => t.status === 'IN_REVIEW');
  const todoTasks = userTasks.filter(t => t.status === 'TODO');
  const blockedTasks = userTasks.filter(t => t.status === 'BLOCKED');

  const overdueTasks = userTasks.filter(t => {
    return t.status !== 'COMPLETED' && t.dueDate < todayStr;
  });

  const completed = completedTasks.length;
  const activeTasks = total - completed;

  // If no tasks assigned yet
  if (total === 0) {
    return {
      score: 0,
      explanation: `${user.name} has no tasks assigned yet. Productivity score will be calculated once tasks are assigned and worked on.`,
      breakdown: {
        completionRate: 0,
        deadlineAdherence: 0,
        overdueRatio: 0,
        workloadBalance: 100,
        consistency: 100,
      },
      taskCounts: {
        total: 0,
        completed: 0,
        inProgress: 0,
        inReview: 0,
        todo: 0,
        blocked: 0,
        overdue: 0,
      },
      totalEstimatedHours: 0,
      totalActualHours: 0,
      workloadCategory: 'Low',
      riskLevel: 'Low Risk',
    };
  }

  // 1. Completion Rate: (completed / total) * 100 (40% weight)
  const completionRate = Math.round((completed / total) * 100);

  // 2. Deadline Adherence: Tasks completed on or before due date (25% weight)
  const onTimeCompleted = completedTasks.filter(t => {
    const completedDate = (t.updatedAt || '').split('T')[0];
    return completedDate <= t.dueDate;
  }).length;
  const deadlineAdherence = completed > 0 
    ? Math.round((onTimeCompleted / completed) * 100) 
    : (overdueTasks.length === 0 ? 100 : Math.max(0, 100 - overdueTasks.length * 20));

  // 3. Overdue Ratio: (overdue / active) * 100
  const overdueRatio = activeTasks > 0 
    ? Math.min(100, Math.round((overdueTasks.length / activeTasks) * 100)) 
    : 0;

  // 4. Workload Balance: (20% weight)
  let workloadBalance = 90;
  let workloadCategory: 'Low' | 'Normal' | 'High' | 'Overloaded' = 'Normal';

  if (activeTasks === 0) {
    workloadBalance = 80;
    workloadCategory = 'Low';
  } else if (activeTasks <= 3) {
    workloadBalance = 95;
    workloadCategory = 'Normal';
  } else if (activeTasks <= 6) {
    workloadBalance = 85;
    workloadCategory = 'High';
  } else {
    workloadBalance = Math.max(30, 100 - (activeTasks - 6) * 12);
    workloadCategory = 'Overloaded';
  }

  // 5. Consistency: (15% weight) based on hours variance & unblocked flow
  let totalEst = 0;
  let totalAct = 0;
  userTasks.forEach(t => {
    totalEst += t.estimatedHours || 0;
    totalAct += t.actualHours || 0;
  });

  let hourRatio = totalEst > 0 ? (totalAct / totalEst) : 1;
  let baseConsistency = 100 - Math.abs(1 - Math.min(2, hourRatio)) * 30;
  if (blockedTasks.length > 0) baseConsistency -= (blockedTasks.length * 10);
  const consistency = Math.max(40, Math.min(100, Math.round(baseConsistency)));

  // Calculate final weighted score:
  // 40% task completion + 25% deadline adherence + 20% workload balance + 15% consistency
  const rawScore = 
    (completionRate * 0.40) +
    (deadlineAdherence * 0.25) +
    (workloadBalance * 0.20) +
    (consistency * 0.15);

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Risk Level
  let riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk' = 'Low Risk';
  if (overdueTasks.length >= 2 || (activeTasks >= 7 && overdueTasks.length >= 1) || blockedTasks.length >= 2) {
    riskLevel = 'High Risk';
  } else if (overdueTasks.length === 1 || activeTasks >= 5 || blockedTasks.length === 1) {
    riskLevel = 'Medium Risk';
  }

  const explanation = `Productivity score is ${finalScore}/100 based on weighted metrics: Completion Rate: ${completionRate}% (40% weight), Deadline Adherence: ${deadlineAdherence}% (25% weight), Workload Balance: ${workloadBalance}% (20% weight), and Consistency: ${consistency}% (15% weight). Workload status is currently ${workloadCategory} with ${activeTasks} active task(s).`;

  return {
    score: finalScore,
    explanation,
    breakdown: {
      completionRate,
      deadlineAdherence,
      workloadBalance,
      consistency,
      overdueRatio,
    },
    taskCounts: {
      total,
      completed,
      inProgress: inProgressTasks.length,
      inReview: inReviewTasks.length,
      todo: todoTasks.length,
      blocked: blockedTasks.length,
      overdue: overdueTasks.length,
    },
    totalEstimatedHours: totalEst,
    totalActualHours: totalAct,
    workloadCategory,
    riskLevel,
  };
}
