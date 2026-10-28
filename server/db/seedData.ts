import bcrypt from 'bcryptjs';

export interface OrganizationDoc {
  _id: string;
  name: string;
  industry: string;
  companySize: string;
  department: string;
  ownerId: string;
  isDemo?: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationDoc {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'team_lead' | 'employee';
  department: string;
  status: 'pending' | 'accepted' | 'cancelled';
  token: string;
  invitedBy: string;
  expiresAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDoc {
  _id: string;
  organizationId?: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface UserDoc {
  _id: string;
  organizationId?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'team_lead' | 'employee';
  department: 'Engineering' | 'Design' | 'Product' | 'Marketing' | 'HR' | 'Finance' | string;
  jobTitle: string;
  avatar: string;
  status: 'active' | 'away' | 'busy' | 'pending';
  bio: string;
  phone: string;
  skills: string[];
  productivityScore: number;
  scoreBreakdown: {
    completionRate: number;
    deadlineAdherence: number;
    workloadBalance: number;
    consistency: number;
  };
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  onboardingCompleted?: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDoc {
  _id: string;
  organizationId?: string;
  name: string;
  key: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold';
  health: 'Healthy' | 'At Risk' | 'Delayed';
  leadId: string;
  department: string;
  memberIds: string[];
  budgetHours: number;
  startDate: string;
  deadline: string;
  milestones: {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface TaskDoc {
  _id: string;
  organizationId?: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  createdBy: string;
  ownerId?: string;
  startDate?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  dependencies?: string[];
  blockedBy?: string[];
  attachments?: TaskAttachment[];
  comments: TaskComment[];
  activity: TaskActivity[];
  deadlineRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDoc {
  _id: string;
  organizationId?: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'project' | 'ai' | 'warning' | 'system';
  link: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityDoc {
  _id: string;
  organizationId?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetType: 'task' | 'project' | 'ai' | 'system' | 'team' | 'organization';
  targetId?: string;
  details: string;
  timestamp: string;
}

export interface AIInsightDoc {
  _id: string;
  organizationId?: string;
  title: string;
  category: 'WORKLOAD' | 'PRODUCTIVITY' | 'DEADLINE' | 'RESOURCE';
  summary: string;
  confidence: number;
  recommendedActions: {
    id: string;
    title: string;
    actionType: 'redistribute' | 'extend_deadline' | 'reprioritize' | 'workflow_review';
    targetTaskId?: string;
    targetUserId?: string;
    targetNewUserId?: string;
    newDeadline?: string;
    applied: boolean;
  }[];
  dismissed: boolean;
  createdAt: string;
}

export interface DatabaseState {
  organizations: OrganizationDoc[];
  users: UserDoc[];
  invitations: InvitationDoc[];
  projects: ProjectDoc[];
  tasks: TaskDoc[];
  comments: CommentDoc[];
  notifications: NotificationDoc[];
  activities: ActivityDoc[];
  insights: AIInsightDoc[];
  organization: OrganizationDoc;
}

export const getSeedData = (): DatabaseState => {
  // Pre-hashed password for "password123"
  const defaultHash = bcrypt.hashSync('password123', 10);

  const now = new Date();
  const isoNow = now.toISOString();

  // Helper date offset
  const daysOffset = (days: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const users: UserDoc[] = [
    {
      _id: 'usr_ananya',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@technova.io',
      passwordHash: defaultHash,
      role: 'admin',
      department: 'Engineering',
      jobTitle: 'VP of Engineering & Systems',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Leading distributed engineering teams and architecture strategy across enterprise platforms.',
      phone: '+91 98201 44521',
      skills: ['Distributed Systems', 'System Architecture', 'Agile Leadership', 'Kubernetes'],
      productivityScore: 94,
      scoreBreakdown: {
        completionRate: 96,
        deadlineAdherence: 92,
        workloadBalance: 90,
        consistency: 98,
      },
      createdAt: '2026-01-10T09:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'usr_rahul',
      name: 'Rahul Kumar',
      email: 'rahul.kumar@technova.io',
      passwordHash: defaultHash,
      role: 'employee',
      department: 'Engineering',
      jobTitle: 'Senior Full-Stack Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'busy',
      bio: 'Specialized in microservices, React performance, and high-throughput transaction pipelines.',
      phone: '+91 98334 11029',
      skills: ['TypeScript', 'Node.js', 'React', 'MongoDB', 'PostgreSQL', 'GraphQL'],
      productivityScore: 82,
      scoreBreakdown: {
        completionRate: 85,
        deadlineAdherence: 74,
        workloadBalance: 68,
        consistency: 89,
      },
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'usr_priya',
      name: 'Priya Nair',
      email: 'priya.nair@technova.io',
      passwordHash: defaultHash,
      role: 'team_lead',
      department: 'Design',
      jobTitle: 'Product Design Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Design systems advocate, user research enthusiast, shaping enterprise UI/UX consistency.',
      phone: '+91 98450 78219',
      skills: ['Design Systems', 'Figma', 'User Research', 'Information Architecture', 'Prototyping'],
      productivityScore: 91,
      scoreBreakdown: {
        completionRate: 94,
        deadlineAdherence: 90,
        workloadBalance: 88,
        consistency: 92,
      },
      createdAt: '2026-01-20T09:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'usr_arjun',
      name: 'Arjun Mehta',
      email: 'arjun.mehta@technova.io',
      passwordHash: defaultHash,
      role: 'team_lead',
      department: 'Engineering',
      jobTitle: 'DevOps & Infrastructure Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Cloud architecture, CI/CD automation, observability pipelines, and infrastructure resilience.',
      phone: '+91 97112 34900',
      skills: ['AWS', 'GCP', 'Terraform', 'Docker', 'Prometheus', 'Security'],
      productivityScore: 89,
      scoreBreakdown: {
        completionRate: 90,
        deadlineAdherence: 88,
        workloadBalance: 84,
        consistency: 94,
      },
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'usr_sneha',
      name: 'Sneha Rao',
      email: 'sneha.rao@technova.io',
      passwordHash: defaultHash,
      role: 'manager',
      department: 'Product',
      jobTitle: 'Principal Product Manager',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Roadmap planning, customer discovery, cross-functional orchestration for core enterprise SaaS.',
      phone: '+91 98199 44321',
      skills: ['Product Strategy', 'Roadmapping', 'Metrics & Analytics', 'Stakeholder Alignment'],
      productivityScore: 95,
      scoreBreakdown: {
        completionRate: 98,
        deadlineAdherence: 95,
        workloadBalance: 92,
        consistency: 95,
      },
      createdAt: '2026-02-05T09:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'usr_vikram',
      name: 'Vikram Patel',
      email: 'vikram.patel@technova.io',
      passwordHash: defaultHash,
      role: 'employee',
      department: 'Engineering',
      jobTitle: 'Frontend Engineer',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Passionate about accessible React interfaces, performance optimization, and animations.',
      phone: '+91 98670 12398',
      skills: ['React', 'Next.js', 'Tailwind CSS', 'Web Vitals', 'Accessibility'],
      productivityScore: 86,
      scoreBreakdown: {
        completionRate: 88,
        deadlineAdherence: 84,
        workloadBalance: 82,
        consistency: 90,
      },
      createdAt: '2026-02-12T09:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'usr_neha',
      name: 'Neha Deshmukh',
      email: 'neha.deshmukh@technova.io',
      passwordHash: defaultHash,
      role: 'employee',
      department: 'Engineering',
      jobTitle: 'QA Automation & Security Specialist',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Ensuring bulletproof enterprise software through automated integration and end-to-end tests.',
      phone: '+91 99203 88124',
      skills: ['Cypress', 'Playwright', 'Penetration Testing', 'Jest', 'API Testing'],
      productivityScore: 88,
      scoreBreakdown: {
        completionRate: 91,
        deadlineAdherence: 86,
        workloadBalance: 85,
        consistency: 90,
      },
      createdAt: '2026-02-15T09:00:00.000Z',
      updatedAt: isoNow,
    },
  ];

  const projects: ProjectDoc[] = [
    {
      _id: 'prj_analytics',
      name: 'AI Analytics Platform',
      key: 'AAP',
      description: 'Next-gen enterprise telemetry, real-time workflow aggregation, and automated machine learning insights for executives.',
      status: 'In Progress',
      health: 'At Risk',
      leadId: 'usr_arjun',
      department: 'Engineering',
      memberIds: ['usr_ananya', 'usr_rahul', 'usr_arjun', 'usr_vikram', 'usr_neha'],
      budgetHours: 420,
      startDate: daysOffset(-28),
      deadline: daysOffset(14),
      milestones: [
        { id: 'm1', title: 'Data Pipeline Ingestion Engine', dueDate: daysOffset(-14), completed: true },
        { id: 'm2', title: 'Real-time WebSocket Aggregator', dueDate: daysOffset(-2), completed: true },
        { id: 'm3', title: 'Gemini LLM Synthesis Service', dueDate: daysOffset(5), completed: false },
        { id: 'm4', title: 'Executive Analytics Viewports', dueDate: daysOffset(14), completed: false },
      ],
      createdAt: daysOffset(-30) + 'T08:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'prj_design_system',
      name: 'Enterprise Design System v3.0',
      key: 'EDS',
      description: 'Unified component token architecture, WCAG 2.2 AA accessible patterns, and cross-platform Figma to React library.',
      status: 'In Progress',
      health: 'Healthy',
      leadId: 'usr_priya',
      department: 'Design',
      memberIds: ['usr_priya', 'usr_vikram', 'usr_sneha'],
      budgetHours: 280,
      startDate: daysOffset(-21),
      deadline: daysOffset(25),
      milestones: [
        { id: 'm21', title: 'Typography and Color Token Scale', dueDate: daysOffset(-10), completed: true },
        { id: 'm22', title: 'Core Form Controls & Validation States', dueDate: daysOffset(7), completed: false },
        { id: 'm23', title: 'Data Table & Virtualized Grid', dueDate: daysOffset(20), completed: false },
      ],
      createdAt: daysOffset(-22) + 'T08:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'prj_payment',
      name: 'Global Payment Gateway v2',
      key: 'GPG',
      description: 'Multi-currency settlement orchestration, automated reconciliation, and PCI-DSS compliant checkout microservice.',
      status: 'In Progress',
      health: 'Delayed',
      leadId: 'usr_rahul',
      department: 'Engineering',
      memberIds: ['usr_rahul', 'usr_arjun', 'usr_neha'],
      budgetHours: 350,
      startDate: daysOffset(-35),
      deadline: daysOffset(3),
      milestones: [
        { id: 'm31', title: 'Stripe & Razorpay Multi-routing', dueDate: daysOffset(-12), completed: true },
        { id: 'm32', title: 'Webhook Resiliency & Idempotency', dueDate: daysOffset(-4), completed: true },
        { id: 'm33', title: 'Automated Fraud & Refund Verification', dueDate: daysOffset(2), completed: false },
      ],
      createdAt: daysOffset(-36) + 'T08:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'prj_workforce',
      name: 'Workforce Onboarding Portal',
      key: 'WOP',
      description: 'Self-service provisioning for new enterprise hires, automated laptop deployment tracking, and compliance training flows.',
      status: 'Completed',
      health: 'Healthy',
      leadId: 'usr_sneha',
      department: 'HR',
      memberIds: ['usr_sneha', 'usr_vikram'],
      budgetHours: 180,
      startDate: daysOffset(-45),
      deadline: daysOffset(-5),
      milestones: [
        { id: 'm41', title: 'Document Verification API', dueDate: daysOffset(-25), completed: true },
        { id: 'm42', title: 'SSO Okta Provisioning Integration', dueDate: daysOffset(-15), completed: true },
        { id: 'm43', title: 'Automated Welcome Checklist', dueDate: daysOffset(-6), completed: true },
      ],
      createdAt: daysOffset(-46) + 'T08:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'prj_cloud',
      name: 'Zero-Trust Cloud Mesh Migration',
      key: 'ZTC',
      description: 'Mutual TLS service mesh deployment across multi-cloud regions with automated key rotation and perimeter security.',
      status: 'Planning',
      health: 'Healthy',
      leadId: 'usr_arjun',
      department: 'Engineering',
      memberIds: ['usr_arjun', 'usr_neha', 'usr_ananya'],
      budgetHours: 240,
      startDate: daysOffset(5),
      deadline: daysOffset(45),
      milestones: [
        { id: 'm51', title: 'VPC Peering & Boundary Security Audit', dueDate: daysOffset(15), completed: false },
        { id: 'm52', title: 'Istio Service Mesh Cluster Pilot', dueDate: daysOffset(30), completed: false },
      ],
      createdAt: daysOffset(-5) + 'T08:00:00.000Z',
      updatedAt: isoNow,
    },
  ];

  const tasks: TaskDoc[] = [
    {
      _id: 'tsk_101',
      title: 'Fix Payment Webhook Concurrency Race Condition',
      description: 'Under heavy test loads, duplicate webhook events for subscription renewals cause duplicate receipt records. Need Redis distributed locks and idempotency checking.',
      projectId: 'prj_payment',
      assignedTo: 'usr_rahul',
      createdBy: 'usr_arjun',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: daysOffset(1),
      estimatedHours: 12,
      actualHours: 14,
      tags: ['Backend', 'Payment', 'Redis', 'Critical'],
      comments: [
        {
          id: 'c1',
          userId: 'usr_arjun',
          userName: 'Arjun Mehta',
          userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          content: 'Observed this during staging regression test. Redlock algorithm will solve the duplicate key issue.',
          createdAt: daysOffset(-1) + 'T11:20:00.000Z',
        },
        {
          id: 'c2',
          userId: 'usr_rahul',
          userName: 'Rahul Kumar',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          content: 'Implemented idempotency key lookup table. Running stress test with 500 concurrent webhook calls.',
          createdAt: daysOffset(0) + 'T09:40:00.000Z',
        },
      ],
      activity: [
        {
          id: 'a1',
          text: 'Created task and set priority to URGENT',
          timestamp: daysOffset(-2) + 'T10:00:00.000Z',
          userId: 'usr_arjun',
          userName: 'Arjun Mehta',
        },
        {
          id: 'a2',
          text: 'Assigned to Rahul Kumar',
          timestamp: daysOffset(-2) + 'T10:05:00.000Z',
          userId: 'usr_arjun',
          userName: 'Arjun Mehta',
        },
      ],
      deadlineRisk: 'HIGH',
      riskReason: 'Due tomorrow with 14 actual hours logged vs 12 est. Rahul has 7 other active tasks.',
      createdAt: daysOffset(-2) + 'T10:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_102',
      title: 'Architect Gemini AI Workflow Insight Pipeline',
      description: 'Integrate the server-side Gemini API client to aggregate employee task completion times, estimate bottlenecks, and stream executive summaries.',
      projectId: 'prj_analytics',
      assignedTo: 'usr_rahul',
      createdBy: 'usr_ananya',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      dueDate: daysOffset(2),
      estimatedHours: 16,
      actualHours: 15,
      tags: ['AI', 'Gemini', 'Backend', 'Express'],
      comments: [
        {
          id: 'c3',
          userId: 'usr_ananya',
          userName: 'Ananya Sharma',
          userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          content: 'Code review submitted. Ensure structured JSON schemas are enforced for all insights.',
          createdAt: daysOffset(0) + 'T10:15:00.000Z',
        },
      ],
      activity: [
        {
          id: 'a3',
          text: 'Status changed from IN_PROGRESS to IN_REVIEW',
          timestamp: daysOffset(0) + 'T09:30:00.000Z',
          userId: 'usr_rahul',
          userName: 'Rahul Kumar',
        },
      ],
      deadlineRisk: 'MEDIUM',
      riskReason: 'Awaiting PR review approval before staging rollout.',
      createdAt: daysOffset(-3) + 'T09:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_103',
      title: 'Design Accessible Token System for Dark & Light Themes',
      description: 'Create semantic tokens for surfaces, text contrast ratios, border weights, and interactive states conforming to WCAG AA.',
      projectId: 'prj_design_system',
      assignedTo: 'usr_priya',
      createdBy: 'usr_sneha',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: daysOffset(-1),
      estimatedHours: 14,
      actualHours: 13,
      tags: ['Design', 'Tokens', 'Accessibility', 'Figma'],
      comments: [],
      activity: [
        {
          id: 'a4',
          text: 'Priya marked task as COMPLETED',
          timestamp: daysOffset(-1) + 'T16:00:00.000Z',
          userId: 'usr_priya',
          userName: 'Priya Nair',
        },
      ],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-6) + 'T11:00:00.000Z',
      updatedAt: daysOffset(-1) + 'T16:00:00.000Z',
    },
    {
      _id: 'tsk_104',
      title: 'Build Executive Productivity KPI Widgets',
      description: 'Implement reusable SVG line, donut, and comparative bar components for tracking team velocity, workload balance, and task variance.',
      projectId: 'prj_analytics',
      assignedTo: 'usr_vikram',
      createdBy: 'usr_priya',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: daysOffset(3),
      estimatedHours: 10,
      actualHours: 6,
      tags: ['Frontend', 'React', 'Analytics', 'Charts'],
      comments: [],
      activity: [
        {
          id: 'a5',
          text: 'Vikram started working on widget responsive states',
          timestamp: daysOffset(-1) + 'T14:20:00.000Z',
          userId: 'usr_vikram',
          userName: 'Vikram Patel',
        },
      ],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-2) + 'T09:30:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_105',
      title: 'Automated E2E Penetration Test for Auth Endpoints',
      description: 'Write Playwright tests simulating brute force attempts, token replay, expired JWT refreshes, and role privilege escalation.',
      projectId: 'prj_cloud',
      assignedTo: 'usr_neha',
      createdBy: 'usr_arjun',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: daysOffset(5),
      estimatedHours: 18,
      actualHours: 2,
      tags: ['Security', 'QA', 'Playwright', 'JWT'],
      comments: [],
      activity: [
        {
          id: 'a6',
          text: 'Created task and assigned to Neha Deshmukh',
          timestamp: daysOffset(-1) + 'T15:00:00.000Z',
          userId: 'usr_arjun',
          userName: 'Arjun Mehta',
        },
      ],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-1) + 'T15:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_106',
      title: 'Stripe Multi-Currency Settlement Reconciliation',
      description: 'Nightly batch job comparing Stripe payout ledger with internal accounts payable and generating discrepancy logs.',
      projectId: 'prj_payment',
      assignedTo: 'usr_rahul',
      createdBy: 'usr_sneha',
      status: 'BLOCKED',
      priority: 'URGENT',
      dueDate: daysOffset(2),
      estimatedHours: 16,
      actualHours: 12,
      tags: ['Backend', 'Finance', 'Cron', 'Stripe'],
      comments: [
        {
          id: 'c4',
          userId: 'usr_rahul',
          userName: 'Rahul Kumar',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          content: 'BLOCKED: Waiting for Sandbox banking credentials from the compliance department.',
          createdAt: daysOffset(-1) + 'T17:30:00.000Z',
        },
      ],
      activity: [
        {
          id: 'a7',
          text: 'Status changed to BLOCKED (waiting for external credentials)',
          timestamp: daysOffset(-1) + 'T17:30:00.000Z',
          userId: 'usr_rahul',
          userName: 'Rahul Kumar',
        },
      ],
      deadlineRisk: 'HIGH',
      riskReason: 'Blocked with external dependency and due in 2 days.',
      createdAt: daysOffset(-4) + 'T10:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_107',
      title: 'Figma UI Library Synchronizer Plugin',
      description: 'Develop automated script that parses Figma Tokens JSON export and commits directly to the Tailwind theme config.',
      projectId: 'prj_design_system',
      assignedTo: 'usr_priya',
      createdBy: 'usr_priya',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: daysOffset(6),
      estimatedHours: 8,
      actualHours: 4,
      tags: ['Tooling', 'Figma', 'TypeScript'],
      comments: [],
      activity: [],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-2) + 'T11:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_108',
      title: 'Optimize Database Indexing for Real-Time Query Workload',
      description: 'Analyze slow query logs on task and project aggregates. Add compound indexes on {projectId, status, dueDate}.',
      projectId: 'prj_analytics',
      assignedTo: 'usr_arjun',
      createdBy: 'usr_ananya',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: daysOffset(-2),
      estimatedHours: 6,
      actualHours: 5,
      tags: ['Database', 'Optimization', 'Performance'],
      comments: [],
      activity: [
        {
          id: 'a8',
          text: 'Arjun completed query profiling and index migration',
          timestamp: daysOffset(-2) + 'T18:00:00.000Z',
          userId: 'usr_arjun',
          userName: 'Arjun Mehta',
        },
      ],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-5) + 'T09:00:00.000Z',
      updatedAt: daysOffset(-2) + 'T18:00:00.000Z',
    },
    {
      _id: 'tsk_109',
      title: 'Customer Onboarding Feedback Survey Automation',
      description: 'Send automated micro-surveys at Day 7 and Day 30 to measure platform NPS and identify friction points.',
      projectId: 'prj_workforce',
      assignedTo: 'usr_sneha',
      createdBy: 'usr_sneha',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: daysOffset(-4),
      estimatedHours: 8,
      actualHours: 7,
      tags: ['Product', 'NPS', 'Feedback'],
      comments: [],
      activity: [],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-10) + 'T10:00:00.000Z',
      updatedAt: daysOffset(-4) + 'T14:00:00.000Z',
    },
    {
      _id: 'tsk_110',
      title: 'Refactor Auth Token Refresh Interceptor in Axios/Fetch',
      description: 'Ensure expired JWT access tokens trigger seamless silent refresh without user session interruption or 401 flicker.',
      projectId: 'prj_analytics',
      assignedTo: 'usr_vikram',
      createdBy: 'usr_rahul',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: daysOffset(4),
      estimatedHours: 6,
      actualHours: 0,
      tags: ['Frontend', 'Auth', 'JavaScript'],
      comments: [],
      activity: [],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-1) + 'T16:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_111',
      title: 'Microservices Health Check & Prometheus Exporters',
      description: 'Standardize /healthz and /metrics endpoints across all backend services with memory, CPU, and event-loop lag metrics.',
      projectId: 'prj_cloud',
      assignedTo: 'usr_arjun',
      createdBy: 'usr_ananya',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: daysOffset(4),
      estimatedHours: 14,
      actualHours: 8,
      tags: ['DevOps', 'Monitoring', 'Prometheus'],
      comments: [],
      activity: [],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-2) + 'T08:00:00.000Z',
      updatedAt: isoNow,
    },
    {
      _id: 'tsk_112',
      title: 'Prepare Sprint 14 Retrospective & Velocity Analysis',
      description: 'Synthesize velocity charts, carried-over story points, and team sentiment survey for executive engineering review.',
      projectId: 'prj_analytics',
      assignedTo: 'usr_sneha',
      createdBy: 'usr_ananya',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: daysOffset(5),
      estimatedHours: 5,
      actualHours: 1,
      tags: ['Agile', 'Scrum', 'Management'],
      comments: [],
      activity: [],
      deadlineRisk: 'LOW',
      createdAt: daysOffset(-1) + 'T11:00:00.000Z',
      updatedAt: isoNow,
    },
  ];

  const notifications: NotificationDoc[] = [
    {
      _id: 'notif_1',
      userId: 'usr_ananya',
      title: 'Workload Imbalance Alert',
      message: 'Rahul Kumar is currently assigned 3 high/urgent priority tasks with overlapping deadlines.',
      type: 'ai',
      link: '/ai-insights',
      read: false,
      createdAt: daysOffset(0) + 'T08:30:00.000Z',
    },
    {
      _id: 'notif_2',
      userId: 'usr_ananya',
      title: 'Task Marked Complete',
      message: 'Arjun Mehta completed "Optimize Database Indexing for Real-Time Query Workload".',
      type: 'task',
      link: '/tasks',
      read: false,
      createdAt: daysOffset(0) + 'T07:45:00.000Z',
    },
    {
      _id: 'notif_3',
      userId: 'usr_rahul',
      title: 'Task Assigned',
      message: 'Arjun Mehta assigned you "Fix Payment Webhook Concurrency Race Condition".',
      type: 'task',
      link: '/tasks',
      read: false,
      createdAt: daysOffset(-1) + 'T10:05:00.000Z',
    },
    {
      _id: 'notif_4',
      userId: 'usr_rahul',
      title: 'Dependency Blocked',
      message: 'Task "Stripe Multi-Currency Settlement" marked BLOCKED pending sandbox access.',
      type: 'warning',
      link: '/tasks',
      read: true,
      createdAt: daysOffset(-1) + 'T17:35:00.000Z',
    },
    {
      _id: 'notif_5',
      userId: 'usr_ananya',
      title: 'Project Milestone Reached',
      message: 'Enterprise Design System v3.0 completed milestone: Typography and Color Token Scale.',
      type: 'project',
      link: '/projects',
      read: true,
      createdAt: daysOffset(-2) + 'T16:00:00.000Z',
    },
  ];

  const activities: ActivityDoc[] = [
    {
      _id: 'act_1',
      userId: 'usr_rahul',
      userName: 'Rahul Kumar',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      action: 'moved task',
      targetType: 'task',
      targetId: 'tsk_102',
      details: 'Moved "Architect Gemini AI Workflow Insight Pipeline" to In Review',
      timestamp: daysOffset(0) + 'T09:30:00.000Z',
    },
    {
      _id: 'act_2',
      userId: 'usr_priya',
      userName: 'Priya Nair',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      action: 'completed task',
      targetType: 'task',
      targetId: 'tsk_103',
      details: 'Completed "Design Accessible Token System for Dark & Light Themes"',
      timestamp: daysOffset(-1) + 'T16:00:00.000Z',
    },
    {
      _id: 'act_3',
      userId: 'usr_arjun',
      userName: 'Arjun Mehta',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      action: 'completed task',
      targetType: 'task',
      targetId: 'tsk_108',
      details: 'Completed "Optimize Database Indexing for Real-Time Query Workload"',
      timestamp: daysOffset(-2) + 'T18:00:00.000Z',
    },
    {
      _id: 'act_4',
      userId: 'usr_ananya',
      userName: 'Ananya Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      action: 'created task',
      targetType: 'task',
      targetId: 'tsk_102',
      details: 'Created "Architect Gemini AI Workflow Insight Pipeline"',
      timestamp: daysOffset(-3) + 'T09:00:00.000Z',
    },
    {
      _id: 'act_5',
      userId: 'usr_sneha',
      userName: 'Sneha Rao',
      userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      action: 'created project',
      targetType: 'project',
      targetId: 'prj_workforce',
      details: 'Created project "Workforce Onboarding Portal"',
      timestamp: daysOffset(-15) + 'T10:00:00.000Z',
    },
  ];

  const insights: AIInsightDoc[] = [
    {
      _id: 'ins_1',
      title: 'Engineering Workload Bottleneck on High-Priority Tasks',
      category: 'WORKLOAD',
      summary: 'Rahul Kumar is currently carrying 3 high/urgent priority tasks with tight deadlines. Actual time spent on payment tasks has exceeded initial estimates by 28%, introducing risk to the Global Payment Gateway milestone.',
      confidence: 93,
      recommendedActions: [
        {
          id: 'rec_1',
          title: 'Redistribute "Stripe Multi-Currency Settlement" to Vikram Patel or Arjun Mehta',
          actionType: 'redistribute',
          targetTaskId: 'tsk_106',
          targetUserId: 'usr_rahul',
          targetNewUserId: 'usr_arjun',
          applied: false,
        },
        {
          id: 'rec_2',
          title: 'Extend "Fix Payment Webhook Concurrency" deadline by 2 days',
          actionType: 'extend_deadline',
          targetTaskId: 'tsk_101',
          newDeadline: daysOffset(3),
          applied: false,
        },
        {
          id: 'rec_3',
          title: 'Reprioritize "Refactor Auth Token Refresh" to LOW priority',
          actionType: 'reprioritize',
          targetTaskId: 'tsk_110',
          applied: false,
        },
      ],
      dismissed: false,
      createdAt: daysOffset(0) + 'T08:00:00.000Z',
    },
    {
      _id: 'ins_2',
      title: 'Design System Team Velocity Operating at Peak Efficiency',
      category: 'PRODUCTIVITY',
      summary: 'Design tasks under Priya Nair have a 94% on-time completion rate with zero overdue items over the last 14 days. Workload balance index is currently 88/100.',
      confidence: 96,
      recommendedActions: [
        {
          id: 'rec_4',
          title: 'Advance Phase 2 token migration timeline ahead of schedule',
          actionType: 'workflow_review',
          applied: false,
        },
      ],
      dismissed: false,
      createdAt: daysOffset(-1) + 'T09:00:00.000Z',
    },
  ];

  const demoOrg: OrganizationDoc = {
    _id: 'org_demo',
    name: 'TechNova Solutions (Demo Workspace)',
    industry: 'Software / Technology',
    companySize: '11–50',
    department: 'Engineering',
    ownerId: 'usr_ananya',
    isDemo: true,
    onboardingCompleted: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: isoNow,
  };

  const scopedUsers = users.map(u => ({
    ...u,
    organizationId: 'org_demo',
    onboardingCompleted: true,
    isDemo: true,
  }));

  const scopedProjects = projects.map(p => ({
    ...p,
    organizationId: 'org_demo',
  }));

  const scopedTasks = tasks.map(t => ({
    ...t,
    organizationId: 'org_demo',
  }));

  const scopedNotifications = notifications.map(n => ({
    ...n,
    organizationId: 'org_demo',
  }));

  const scopedActivities = activities.map(a => ({
    ...a,
    organizationId: 'org_demo',
  }));

  const scopedInsights = insights.map(i => ({
    ...i,
    organizationId: 'org_demo',
  }));

  const demoInvitations: InvitationDoc[] = [
    {
      _id: 'inv_demo_1',
      organizationId: 'org_demo',
      name: 'Kavita Sundaram',
      email: 'kavita.s@technova.io',
      role: 'employee',
      department: 'Engineering',
      status: 'pending',
      token: 'inv_token_demo_1',
      invitedBy: 'usr_ananya',
      createdAt: daysOffset(-2) + 'T10:00:00.000Z',
      updatedAt: daysOffset(-2) + 'T10:00:00.000Z',
    },
    {
      _id: 'inv_demo_2',
      organizationId: 'org_demo',
      name: 'Rohan Verma',
      email: 'rohan.v@technova.io',
      role: 'employee',
      department: 'Product',
      status: 'pending',
      token: 'inv_token_demo_2',
      invitedBy: 'usr_ananya',
      createdAt: daysOffset(-1) + 'T14:30:00.000Z',
      updatedAt: daysOffset(-1) + 'T14:30:00.000Z',
    },
  ];

  const demoComments: CommentDoc[] = [
    {
      _id: 'cmt_demo_1',
      organizationId: 'org_demo',
      taskId: 'tsk_101',
      userId: 'usr_rahul',
      userName: 'Rahul Kumar',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      content: 'Database indexing completed on user tables. Query latency dropped by 45%.',
      createdAt: daysOffset(-1) + 'T11:20:00.000Z',
    },
    {
      _id: 'cmt_demo_2',
      organizationId: 'org_demo',
      taskId: 'tsk_101',
      userId: 'usr_ananya',
      userName: 'Ananya Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      content: 'Excellent performance improvement Rahul! Proceed with canary rollout.',
      createdAt: daysOffset(0) + 'T09:15:00.000Z',
    },
  ];

  return {
    organizations: [demoOrg],
    users: scopedUsers,
    invitations: demoInvitations,
    projects: scopedProjects,
    tasks: scopedTasks,
    comments: demoComments,
    notifications: scopedNotifications,
    activities: scopedActivities,
    insights: scopedInsights,
    organization: demoOrg,
  };
};
