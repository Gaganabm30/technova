import mongoose, { Schema } from 'mongoose';

export interface IOrganization {
  _id: string;
  name: string;
  industry: string;
  companySize: string;
  department: string;
  ownerId: string;
  isDemo?: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    industry: { type: String, default: 'Software / Technology' },
    companySize: { type: String, default: '11-50' },
    department: { type: String, default: 'Engineering' },
    ownerId: { type: String, required: true },
    isDemo: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const OrganizationModel = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
