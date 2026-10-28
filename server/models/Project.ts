import mongoose, { Schema } from 'mongoose';

export interface IProject {
  _id: string;
  organizationId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold'],
      default: 'In Progress',
    },
    health: {
      type: String,
      enum: ['Healthy', 'At Risk', 'Delayed'],
      default: 'Healthy',
    },
    leadId: { type: String, required: true, ref: 'User' },
    department: { type: String, default: 'Engineering' },
    memberIds: [{ type: String, ref: 'User' }],
    budgetHours: { type: Number, default: 120 },
    startDate: { type: String, required: true },
    deadline: { type: String, required: true },
    milestones: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        dueDate: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
