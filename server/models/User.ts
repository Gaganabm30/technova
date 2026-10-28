import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'team_lead' | 'employee';
  department: string;
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
  onboardingCompleted: boolean;
  isDemo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'team_lead', 'employee'],
      default: 'employee',
    },
    department: { type: String, default: 'Engineering' },
    jobTitle: { type: String, default: '' },
    avatar: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'away', 'busy', 'pending'],
      default: 'active',
    },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' },
    skills: [{ type: String }],
    productivityScore: { type: Number, default: 0 },
    scoreBreakdown: {
      completionRate: { type: Number, default: 0 },
      deadlineAdherence: { type: Number, default: 0 },
      workloadBalance: { type: Number, default: 0 },
      consistency: { type: Number, default: 0 },
    },
    onboardingCompleted: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
