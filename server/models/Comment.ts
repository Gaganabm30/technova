import mongoose, { Schema } from 'mongoose';

export interface IComment {
  _id: string;
  organizationId: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    taskId: { type: String, required: true, ref: 'Task', index: true },
    userId: { type: String, required: true, ref: 'User' },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const CommentModel = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
