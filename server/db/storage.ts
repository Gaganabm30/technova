import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import {
  DatabaseState,
  getSeedData,
  OrganizationDoc,
  UserDoc,
  InvitationDoc,
  ProjectDoc,
  TaskDoc,
  TaskAttachment,
  CommentDoc,
  NotificationDoc,
  ActivityDoc,
  AIInsightDoc,
} from './seedData.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = process.env.DB_FILE 
  ? path.resolve(process.cwd(), process.env.DB_FILE)
  : path.join(DATA_DIR, 'db.json');

class Storage {
  private state: DatabaseState;
  private initialized = false;
  private isMongoConnected = false;

  constructor() {
    this.state = this.loadOrInit();
    this.connectMongoIfConfigured();
  }

  private async connectMongoIfConfigured() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri || mongoUri.trim() === '' || mongoUri.includes('<') || mongoUri.includes('>')) {
      console.log('📦 Using persistent document storage engine (data/db.json)');
      return;
    }

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      this.isMongoConnected = true;
      console.log('🍃 Successfully connected to external MongoDB instance');
    } catch (err: any) {
      console.warn('⚠️ MongoDB connection could not be established; defaulting to persistent document store:', err.message);
    }
  }

  private loadOrInit(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.tasks && parsed.projects) {
          // Perform schema migration if organizations or invitations missing
          if (!parsed.organizations || parsed.organizations.length === 0) {
            const seed = getSeedData();
            parsed.organizations = seed.organizations;
            parsed.organization = seed.organization;
          }
          if (!parsed.invitations) parsed.invitations = [];
          if (!parsed.comments) parsed.comments = [];
          if (!parsed.insights) parsed.insights = [];
          if (!parsed.activities) parsed.activities = [];
          if (!parsed.notifications) parsed.notifications = [];

          // Ensure organizationId exists on demo items
          parsed.users.forEach((u: UserDoc) => {
            if (!u.organizationId) u.organizationId = 'org_demo';
          });
          parsed.projects.forEach((p: ProjectDoc) => {
            if (!p.organizationId) p.organizationId = 'org_demo';
          });
          parsed.tasks.forEach((t: TaskDoc) => {
            if (!t.organizationId) t.organizationId = 'org_demo';
          });

          this.initialized = true;
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading db.json, reinitializing seed data:', err);
    }

    const seed = getSeedData();
    this.saveState(seed);
    this.initialized = true;
    return seed;
  }

  private saveState(data?: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const toSave = data || this.state;
      fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save db.json:', err);
    }
  }

  public resetToSeed(): DatabaseState {
    this.state = getSeedData();
    this.saveState();
    return this.state;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // --- ORGANIZATIONS ---
  public getOrganizations(): OrganizationDoc[] {
    return this.state.organizations || [];
  }

  public getOrganizationById(id: string): OrganizationDoc | undefined {
    return this.getOrganizations().find(o => o._id === id);
  }

  public createOrganization(org: Omit<OrganizationDoc, '_id' | 'createdAt' | 'updatedAt'>): OrganizationDoc {
    const newOrg: OrganizationDoc = {
      ...org,
      _id: 'org_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!this.state.organizations) {
      this.state.organizations = [];
    }
    this.state.organizations.push(newOrg);
    this.saveState();
    return newOrg;
  }

  public updateOrganization(id: string, updates: Partial<OrganizationDoc>): OrganizationDoc | undefined {
    const index = this.state.organizations.findIndex(o => o._id === id);
    if (index === -1) return undefined;
    this.state.organizations[index] = {
      ...this.state.organizations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveState();
    return this.state.organizations[index];
  }

  // --- USERS ---
  public getUsers(organizationId?: string): UserDoc[] {
    if (!organizationId) return this.state.users;
    return this.state.users.filter(u => u.organizationId === organizationId);
  }

  public getUserById(id: string, organizationId?: string): UserDoc | undefined {
    return this.state.users.find(u => u._id === id && (!organizationId || u.organizationId === organizationId));
  }

  public getUserByEmail(email: string): UserDoc | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  /** Check if a user with this email already exists WITHIN a specific organization */
  public getUserByEmailInOrg(email: string, organizationId: string): UserDoc | undefined {
    return this.state.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.organizationId === organizationId
    );
  }

  /** Check if there is already a pending invitation for this email+org combination */
  public getPendingInvitationByEmail(email: string, organizationId: string): InvitationDoc | undefined {
    if (!this.state.invitations) return undefined;
    return this.state.invitations.find(
      i =>
        i.email.toLowerCase() === email.toLowerCase() &&
        i.organizationId === organizationId &&
        i.status === 'pending'
    );
  }

  public createUser(user: Omit<UserDoc, '_id' | 'createdAt' | 'updatedAt'>): UserDoc {
    const newUser: UserDoc = {
      ...user,
      _id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    this.saveState();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserDoc>, organizationId?: string): UserDoc | undefined {
    const index = this.state.users.findIndex(u => u._id === id && (!organizationId || u.organizationId === organizationId));
    if (index === -1) return undefined;
    this.state.users[index] = {
      ...this.state.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveState();
    return this.state.users[index];
  }

  public deleteUser(id: string, organizationId?: string): boolean {
    const prevCount = this.state.users.length;
    this.state.users = this.state.users.filter(u => !(u._id === id && (!organizationId || u.organizationId === organizationId)));
    this.saveState();
    return this.state.users.length < prevCount;
  }

  // Password reset methods
  public setPasswordResetToken(email: string, token: string, expiresMs = 3600000): boolean {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + expiresMs).toISOString();
    this.saveState();
    return true;
  }

  public getUserByResetToken(token: string): UserDoc | undefined {
    const now = new Date().toISOString();
    return this.state.users.find(u => u.resetPasswordToken === token && u.resetPasswordExpires && u.resetPasswordExpires > now);
  }

  public clearPasswordResetToken(userId: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    this.saveState();
    return true;
  }

  // --- INVITATIONS ---
  public getInvitations(organizationId: string): InvitationDoc[] {
    if (!this.state.invitations) this.state.invitations = [];
    return this.state.invitations.filter(i => i.organizationId === organizationId);
  }

  public getInvitationById(id: string, organizationId?: string): InvitationDoc | undefined {
    return (this.state.invitations || []).find(i => i._id === id && (!organizationId || i.organizationId === organizationId));
  }

  public getInvitationByToken(token: string, checkExpiry = true): InvitationDoc | undefined {
    const inv = (this.state.invitations || []).find(i => i.token === token);
    if (!inv) return undefined;
    if (checkExpiry && inv.expiresAt) {
      if (new Date(inv.expiresAt).getTime() < Date.now()) {
        return undefined; // Expired
      }
    }
    return inv;
  }

  public createInvitation(inv: Omit<InvitationDoc, '_id' | 'createdAt' | 'updatedAt'>): InvitationDoc {
    if (!this.state.invitations) this.state.invitations = [];
    const now = Date.now();
    const newInv: InvitationDoc = {
      ...inv,
      _id: 'inv_' + now.toString(36) + Math.random().toString(36).substring(2, 6),
      expiresAt: inv.expiresAt || new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiration
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    this.state.invitations.unshift(newInv);
    this.saveState();
    return newInv;
  }

  public acceptInvitation(token: string): InvitationDoc | undefined {
    const inv = this.getInvitationByToken(token, true);
    if (!inv || inv.status === 'accepted') return undefined;
    inv.status = 'accepted';
    inv.acceptedAt = new Date().toISOString();
    inv.updatedAt = new Date().toISOString();
    this.saveState();
    return inv;
  }

  public updateInvitation(id: string, updates: Partial<InvitationDoc>, organizationId?: string): InvitationDoc | undefined {
    if (!this.state.invitations) return undefined;
    const index = this.state.invitations.findIndex(i => i._id === id && (!organizationId || i.organizationId === organizationId));
    if (index === -1) return undefined;
    this.state.invitations[index] = {
      ...this.state.invitations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveState();
    return this.state.invitations[index];
  }

  public deleteInvitation(id: string, organizationId?: string): boolean {
    if (!this.state.invitations) return false;
    const prevCount = this.state.invitations.length;
    this.state.invitations = this.state.invitations.filter(i => !(i._id === id && (!organizationId || i.organizationId === organizationId)));
    this.saveState();
    return this.state.invitations.length < prevCount;
  }

  // --- PROJECTS ---
  public getProjects(organizationId?: string): ProjectDoc[] {
    if (!organizationId) return this.state.projects;
    return this.state.projects.filter(p => p.organizationId === organizationId);
  }

  public getProjectById(id: string, organizationId?: string): ProjectDoc | undefined {
    return this.state.projects.find(p => p._id === id && (!organizationId || p.organizationId === organizationId));
  }

  public createProject(project: Omit<ProjectDoc, '_id' | 'createdAt' | 'updatedAt'>): ProjectDoc {
    const newProject: ProjectDoc = {
      ...project,
      _id: 'prj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      milestones: project.milestones || [],
      memberIds: project.memberIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.projects.push(newProject);
    this.saveState();
    return newProject;
  }

  public updateProject(id: string, updates: Partial<ProjectDoc>, organizationId?: string): ProjectDoc | undefined {
    const index = this.state.projects.findIndex(p => p._id === id && (!organizationId || p.organizationId === organizationId));
    if (index === -1) return undefined;
    this.state.projects[index] = {
      ...this.state.projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveState();
    return this.state.projects[index];
  }

  public deleteProject(id: string, organizationId?: string): boolean {
    const prevCount = this.state.projects.length;
    this.state.projects = this.state.projects.filter(p => !(p._id === id && (!organizationId || p.organizationId === organizationId)));
    // Also delete tasks associated with this project
    this.state.tasks = this.state.tasks.filter(t => t.projectId !== id);
    this.saveState();
    return this.state.projects.length < prevCount;
  }

  // --- TASKS ---
  public getTasks(organizationId?: string, filters?: {
    projectId?: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    search?: string;
  }): TaskDoc[] {
    let list = this.state.tasks;
    if (organizationId) {
      list = list.filter(t => t.organizationId === organizationId);
    }
    if (filters) {
      if (filters.projectId) list = list.filter(t => t.projectId === filters.projectId);
      if (filters.assignedTo) list = list.filter(t => t.assignedTo === filters.assignedTo);
      if (filters.status) list = list.filter(t => t.status === filters.status);
      if (filters.priority) list = list.filter(t => t.priority === filters.priority);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(t =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
        );
      }
    }
    return list;
  }

  public getTaskById(id: string, organizationId?: string): TaskDoc | undefined {
    return this.state.tasks.find(t => t._id === id && (!organizationId || t.organizationId === organizationId));
  }

  public createTask(task: Omit<TaskDoc, '_id' | 'createdAt' | 'updatedAt' | 'comments' | 'activity'>): TaskDoc {
    const nowIso = new Date().toISOString();
    const newTask: TaskDoc = {
      ...task,
      _id: 'tsk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      dependencies: task.dependencies || [],
      blockedBy: task.blockedBy || [],
      attachments: task.attachments || [],
      comments: [],
      activity: [
        {
          id: 'act_' + Date.now().toString(36),
          text: `Created task "${task.title}"`,
          timestamp: nowIso,
          userId: task.createdBy,
          userName: this.getUserById(task.createdBy)?.name || 'System',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.state.tasks.unshift(newTask);

    // If assigned to someone, notify them
    if (newTask.assignedTo && newTask.assignedTo !== newTask.createdBy) {
      this.createNotification({
        organizationId: newTask.organizationId || '',
        userId: newTask.assignedTo,
        title: 'New Task Assigned',
        message: `You were assigned task "${newTask.title}"`,
        type: 'task',
        link: `/tasks/${newTask._id}`,
        read: false,
      });
    }

    this.saveState();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<TaskDoc>, actorId?: string, organizationId?: string): TaskDoc | undefined {
    const index = this.state.tasks.findIndex(t => t._id === id && (!organizationId || t.organizationId === organizationId));
    if (index === -1) return undefined;
    const prev = this.state.tasks[index];
    const nowIso = new Date().toISOString();

    const activity = [...(prev.activity || [])];
    const actorName = actorId ? (this.getUserById(actorId)?.name || 'User') : 'User';

    if (updates.status && updates.status !== prev.status) {
      activity.unshift({
        id: 'act_' + Date.now().toString(36),
        text: `Changed status from ${prev.status} to ${updates.status}`,
        timestamp: nowIso,
        userId: actorId || 'system',
        userName: actorName,
      });

      // If marked blocked, alert project lead
      if (updates.status === 'BLOCKED') {
        const project = this.getProjectById(prev.projectId);
        if (project && project.leadId && project.leadId !== actorId) {
          this.createNotification({
            organizationId: prev.organizationId || '',
            userId: project.leadId,
            title: 'Task Blocked Alert',
            message: `Task "${prev.title}" in project "${project.name}" is now blocked.`,
            type: 'warning',
            link: `/tasks/${prev._id}`,
            read: false,
          });
        }
      }
    }

    if (updates.assignedTo && updates.assignedTo !== prev.assignedTo) {
      const newAssignee = this.getUserById(updates.assignedTo)?.name || 'someone';
      activity.unshift({
        id: 'act_' + Date.now().toString(36),
        text: `Reassigned task to ${newAssignee}`,
        timestamp: nowIso,
        userId: actorId || 'system',
        userName: actorName,
      });

      // Notify newly assigned user
      if (updates.assignedTo !== actorId) {
        this.createNotification({
          organizationId: prev.organizationId || '',
          userId: updates.assignedTo,
          title: 'Task Reassigned to You',
          message: `You were assigned task "${prev.title}" by ${actorName}`,
          type: 'task',
          link: `/tasks/${prev._id}`,
          read: false,
        });
      }
    }

    if (updates.priority && updates.priority !== prev.priority) {
      activity.unshift({
        id: 'act_' + Date.now().toString(36),
        text: `Updated priority to ${updates.priority}`,
        timestamp: nowIso,
        userId: actorId || 'system',
        userName: actorName,
      });
    }

    this.state.tasks[index] = {
      ...prev,
      ...updates,
      activity,
      updatedAt: nowIso,
    };
    this.saveState();
    return this.state.tasks[index];
  }

  public deleteTask(id: string, organizationId?: string): boolean {
    const prevCount = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter(t => !(t._id === id && (!organizationId || t.organizationId === organizationId)));
    this.saveState();
    return this.state.tasks.length < prevCount;
  }

  // --- ATTACHMENTS ---
  public addTaskAttachment(taskId: string, attachment: TaskAttachment, actorId?: string, organizationId?: string): TaskDoc | undefined {
    const task = this.getTaskById(taskId, organizationId);
    if (!task) return undefined;
    if (!task.attachments) task.attachments = [];
    task.attachments.push(attachment);

    const actor = actorId ? this.getUserById(actorId) : undefined;
    if (!task.activity) task.activity = [];
    task.activity.unshift({
      id: 'act_' + Date.now().toString(36),
      text: `Attached file: "${attachment.name}"`,
      timestamp: new Date().toISOString(),
      userId: actorId || 'system',
      userName: actor?.name || 'User',
    });
    task.updatedAt = new Date().toISOString();
    this.saveState();
    return task;
  }

  public deleteTaskAttachment(taskId: string, attachmentId: string, actorId?: string, organizationId?: string): TaskDoc | undefined {
    const task = this.getTaskById(taskId, organizationId);
    if (!task || !task.attachments) return undefined;
    const removed = task.attachments.find(a => a.id === attachmentId);
    task.attachments = task.attachments.filter(a => a.id !== attachmentId);

    const actor = actorId ? this.getUserById(actorId) : undefined;
    if (!task.activity) task.activity = [];
    task.activity.unshift({
      id: 'act_' + Date.now().toString(36),
      text: `Removed attachment: "${removed?.name || attachmentId}"`,
      timestamp: new Date().toISOString(),
      userId: actorId || 'system',
      userName: actor?.name || 'User',
    });
    task.updatedAt = new Date().toISOString();
    this.saveState();
    return task;
  }

  public addTaskComment(taskId: string, comment: { userId: string; content: string }): TaskDoc | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const user = this.getUserById(comment.userId);
    const newComment = {
      id: 'cmt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: comment.userId,
      userName: user?.name || 'User',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      content: comment.content,
      createdAt: new Date().toISOString(),
    };

    if (!task.comments) task.comments = [];
    task.comments.push(newComment);

    if (!task.activity) task.activity = [];
    task.activity.unshift({
      id: 'act_' + Date.now().toString(36),
      text: `Added comment: "${comment.content.slice(0, 40)}${comment.content.length > 40 ? '...' : ''}"`,
      timestamp: new Date().toISOString(),
      userId: comment.userId,
      userName: user?.name || 'User',
    });
    task.updatedAt = new Date().toISOString();

    // Also persist in global comments collection
    if (!this.state.comments) this.state.comments = [];
    this.state.comments.push({
      _id: newComment.id,
      organizationId: task.organizationId || '',
      taskId: task._id,
      userId: newComment.userId,
      userName: newComment.userName,
      userAvatar: newComment.userAvatar,
      content: newComment.content,
      createdAt: newComment.createdAt,
    });

    this.saveState();
    return task;
  }

  // --- COMMENTS ---
  public getComments(taskId: string): CommentDoc[] {
    const task = this.getTaskById(taskId);
    if (task && task.comments) {
      return task.comments.map(c => ({
        _id: c.id,
        organizationId: task.organizationId || '',
        taskId: task._id,
        userId: c.userId,
        userName: c.userName,
        userAvatar: c.userAvatar,
        content: c.content,
        createdAt: c.createdAt,
      }));
    }
    return (this.state.comments || []).filter(c => c.taskId === taskId);
  }

  public deleteComment(taskId: string, commentId: string): boolean {
    const task = this.getTaskById(taskId);
    if (!task) return false;
    if (task.comments) {
      task.comments = task.comments.filter(c => c.id !== commentId);
    }
    if (this.state.comments) {
      this.state.comments = this.state.comments.filter(c => c._id !== commentId);
    }
    this.saveState();
    return true;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId?: string, organizationId?: string): NotificationDoc[] {
    let list = this.state.notifications || [];
    if (organizationId) {
      list = list.filter(n => n.organizationId === organizationId);
    }
    if (userId) {
      list = list.filter(n => n.userId === userId || n.userId === 'all');
    }
    return list;
  }

  public createNotification(notif: Omit<NotificationDoc, '_id' | 'createdAt'>): NotificationDoc {
    if (!this.state.notifications) this.state.notifications = [];
    const newNotif: NotificationDoc = {
      ...notif,
      _id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.unshift(newNotif);
    this.saveState();
    return newNotif;
  }

  public markNotificationAsRead(id: string, userId?: string, organizationId?: string): boolean {
    if (!this.state.notifications) return false;
    const notif = this.state.notifications.find(n => 
      n._id === id && 
      (!userId || n.userId === userId || n.userId === 'all') && 
      (!organizationId || n.organizationId === organizationId)
    );
    if (!notif) return false;
    notif.read = true;
    this.saveState();
    return true;
  }

  public markAllNotificationsAsRead(userId: string, organizationId?: string): number {
    if (!this.state.notifications) return 0;
    let count = 0;
    this.state.notifications.forEach(n => {
      if ((n.userId === userId || n.userId === 'all') && (!organizationId || n.organizationId === organizationId) && !n.read) {
        n.read = true;
        count++;
      }
    });
    this.saveState();
    return count;
  }

  public deleteNotification(id: string, userId?: string, organizationId?: string): boolean {
    if (!this.state.notifications) return false;
    const prevCount = this.state.notifications.length;
    this.state.notifications = this.state.notifications.filter(n => !(
      n._id === id && 
      (!userId || n.userId === userId || n.userId === 'all') && 
      (!organizationId || n.organizationId === organizationId)
    ));
    this.saveState();
    return this.state.notifications.length < prevCount;
  }

  // --- ACTIVITIES ---
  public getActivities(organizationId?: string, limit = 25): ActivityDoc[] {
    let list = this.state.activities || [];
    if (organizationId) {
      list = list.filter(a => a.organizationId === organizationId);
    }
    return list.slice(0, limit);
  }

  public logActivity(activity: Omit<ActivityDoc, '_id' | 'timestamp'>): ActivityDoc {
    if (!this.state.activities) this.state.activities = [];
    const newAct: ActivityDoc = {
      ...activity,
      _id: 'act_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    this.state.activities.unshift(newAct);
    if (this.state.activities.length > 200) {
      this.state.activities = this.state.activities.slice(0, 200);
    }
    this.saveState();
    return newAct;
  }

  // --- AI INSIGHTS ---
  public getInsights(organizationId?: string): AIInsightDoc[] {
    let list = this.state.insights || [];
    if (organizationId) {
      list = list.filter(i => i.organizationId === organizationId);
    }
    return list.filter(i => !i.dismissed);
  }

  public getAllInsights(organizationId?: string): AIInsightDoc[] {
    let list = this.state.insights || [];
    if (organizationId) {
      list = list.filter(i => i.organizationId === organizationId);
    }
    return list;
  }

  public addInsight(insight: Omit<AIInsightDoc, '_id' | 'createdAt'>): AIInsightDoc {
    if (!this.state.insights) this.state.insights = [];
    const newInsight: AIInsightDoc = {
      ...insight,
      _id: 'ins_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    this.state.insights.unshift(newInsight);
    this.saveState();
    return newInsight;
  }

  public dismissInsight(id: string): boolean {
    if (!this.state.insights) return false;
    const ins = this.state.insights.find(i => i._id === id);
    if (!ins) return false;
    ins.dismissed = true;
    this.saveState();
    return true;
  }

  public applyInsightAction(insightId: string, actionId: string): { success: boolean; message: string } {
    const ins = (this.state.insights || []).find(i => i._id === insightId);
    if (!ins) return { success: false, message: 'Insight not found' };

    const action = ins.recommendedActions.find(a => a.id === actionId);
    if (!action) return { success: false, message: 'Action not found' };

    if (action.applied) return { success: true, message: 'Action already applied' };

    let msg = 'Action executed successfully';

    if (action.actionType === 'redistribute' && action.targetTaskId && action.targetNewUserId) {
      const task = this.updateTask(action.targetTaskId, { assignedTo: action.targetNewUserId });
      const newU = this.getUserById(action.targetNewUserId);
      msg = `Task "${task?.title}" redistributed to ${newU?.name}`;
    } else if (action.actionType === 'extend_deadline' && action.targetTaskId && action.newDeadline) {
      const task = this.updateTask(action.targetTaskId, { dueDate: action.newDeadline, deadlineRisk: 'LOW' });
      msg = `Task "${task?.title}" deadline extended to ${action.newDeadline}`;
    } else if (action.actionType === 'reprioritize' && action.targetTaskId) {
      const task = this.updateTask(action.targetTaskId, { priority: 'LOW' });
      msg = `Task "${task?.title}" set to LOW priority`;
    }

    action.applied = true;
    this.saveState();
    return { success: true, message: msg };
  }

  // --- AUTOMATIONS & RULE EVALUATOR ---
  public evaluateAutomations(organizationId: string): { triggeredCount: number; notificationsCreated: number } {
    const todayStr = new Date().toISOString().split('T')[0];
    const tasks = this.getTasks(organizationId);
    const projects = this.getProjects(organizationId);
    let notificationsCreated = 0;
    const existingNotifs = this.getNotifications(undefined, organizationId);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Rule: Notify assignee and project lead when a task becomes overdue
    tasks.forEach(t => {
      if (t.status !== 'COMPLETED' && t.dueDate && t.dueDate < todayStr) {
        // Check if an overdue notification for this task was already sent in the past 24h
        const recentNotif = existingNotifs.find(
          n => n.link === `/tasks/${t._id}` && n.type === 'warning' && n.createdAt > oneDayAgo
        );

        if (!recentNotif) {
          // Notify assignee
          if (t.assignedTo) {
            this.createNotification({
              organizationId,
              userId: t.assignedTo,
              title: 'Task Overdue Notice',
              message: `Task "${t.title}" is overdue (due date: ${t.dueDate}). Please update the status or timeline.`,
              type: 'warning',
              link: `/tasks/${t._id}`,
              read: false,
            });
            notificationsCreated++;
          }

          // Notify project lead
          const proj = projects.find(p => p._id === t.projectId);
          if (proj && proj.leadId && proj.leadId !== t.assignedTo) {
            this.createNotification({
              organizationId,
              userId: proj.leadId,
              title: 'Overdue Project Task',
              message: `Task "${t.title}" in project "${proj.name}" is overdue.`,
              type: 'warning',
              link: `/tasks/${t._id}`,
              read: false,
            });
            notificationsCreated++;
          }
        }
      }
    });

    // 2. Rule: Alert project lead when a project has 2 or more blocked tasks
    projects.forEach(p => {
      const pTasks = tasks.filter(t => t.projectId === p._id);
      const blocked = pTasks.filter(t => t.status === 'BLOCKED');
      if (blocked.length >= 2 && p.leadId) {
        const recentAlert = existingNotifs.find(
          n => n.userId === p.leadId && n.type === 'warning' && n.title === 'Multiple Blocked Tasks Alert' && n.createdAt > oneDayAgo
        );
        if (!recentAlert) {
          this.createNotification({
            organizationId,
            userId: p.leadId,
            title: 'Multiple Blocked Tasks Alert',
            message: `Project "${p.name}" has ${blocked.length} blocked tasks requiring team intervention.`,
            type: 'warning',
            link: `/projects/${p._id}`,
            read: false,
          });
          notificationsCreated++;
        }
      }
    });

    return { triggeredCount: notificationsCreated > 0 ? 1 : 0, notificationsCreated };
  }
}

export const db = new Storage();
