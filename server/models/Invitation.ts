import mongoose, { Schema } from 'mongoose';

export interface IInvitation {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'team_lead' | 'employee';
  department: string;
  status: 'pending' | 'accepted' | 'cancelled';
  token: string;
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, ref: 'Organization', index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'manager', 'team_lead', 'employee'], default: 'employee' },
    department: { type: String, default: 'Engineering' },
    status: { type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: String, required: true, ref: 'User' },
  },
  { timestamps: true }
);

export const InvitationModel = mongoose.models.Invitation || mongoose.model('Invitation', InvitationSchema);
