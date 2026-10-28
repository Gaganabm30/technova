import mongoose, { Schema } from 'mongoose';

export interface ITaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface ITaskActivity {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface ITask {
  _id: string;
  organizationId: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  createdBy: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  comments: ITaskComment[];
  activity: ITaskActivity[];
  deadlineRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    projectId: { type: String, required: true, ref: 'Project', index: true },
    assignedTo: { type: String, required: true, ref: 'User', index: true },
    createdBy: { type: String, required: true, ref: 'User' },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'],
      default: 'TODO',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    dueDate: { type: String, required: true },
    estimatedHours: { type: Number, default: 8 },
    actualHours: { type: Number, default: 0 },
    tags: [{ type: String }],
    comments: [
      {
        id: { type: String, required: true },
        userId: { type: String, required: true, ref: 'User' },
        userName: { type: String, required: true },
        userAvatar: { type: String, default: '' },
        content: { type: String, required: true },
        createdAt: { type: String, required: true },
      },
    ],
    activity: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: String, required: true },
        userId: { type: String, required: true, ref: 'User' },
        userName: { type: String, required: true },
      },
    ],
    deadlineRisk: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
    },
    riskReason: { type: String },
  },
  { timestamps: true }
);

export const TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
