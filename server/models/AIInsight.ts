import mongoose, { Schema } from 'mongoose';

export interface IAIInsightAction {
  id: string;
  title: string;
  actionType: 'redistribute' | 'extend_deadline' | 'reprioritize' | 'workflow_review';
  targetTaskId?: string;
  targetUserId?: string;
  targetNewUserId?: string;
  newDeadline?: string;
  applied: boolean;
}

export interface IAIInsight {
  _id: string;
  organizationId: string;
  title: string;
  category: 'WORKLOAD' | 'PRODUCTIVITY' | 'DEADLINE' | 'RESOURCE';
  summary: string;
  confidence: number;
  recommendedActions: IAIInsightAction[];
  dismissed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AIInsightSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['WORKLOAD', 'PRODUCTIVITY', 'DEADLINE', 'RESOURCE'],
      default: 'PRODUCTIVITY',
    },
    summary: { type: String, required: true },
    confidence: { type: Number, default: 85 },
    recommendedActions: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        actionType: {
          type: String,
          enum: ['redistribute', 'extend_deadline', 'reprioritize', 'workflow_review'],
          required: true,
        },
        targetTaskId: { type: String },
        targetUserId: { type: String },
        targetNewUserId: { type: String },
        newDeadline: { type: String },
        applied: { type: Boolean, default: false },
      },
    ],
    dismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AIInsightModel = mongoose.models.AIInsight || mongoose.model('AIInsight', AIInsightSchema);
