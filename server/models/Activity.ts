import mongoose, { Schema } from 'mongoose';

export interface IActivity {
  _id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetType: 'task' | 'project' | 'ai' | 'system' | 'team' | 'organization';
  targetId?: string;
  details: string;
  timestamp: string;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    userId: { type: String, required: true, ref: 'User' },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    action: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['task', 'project', 'ai', 'system', 'team', 'organization'],
      default: 'system',
    },
    targetId: { type: String },
    details: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const ActivityModel = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
