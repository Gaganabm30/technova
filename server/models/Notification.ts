import mongoose, { Schema } from 'mongoose';

export interface INotification {
  _id: string;
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'project' | 'ai' | 'warning' | 'system';
  link: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['task', 'project', 'ai', 'warning', 'system'],
      default: 'system',
    },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
