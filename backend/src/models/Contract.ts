import mongoose, { Schema, Document } from 'mongoose';

export interface IContractMilestone {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  amount: number;
  deadline: Date;
  status: 'pending' | 'funded' | 'in_progress' | 'delivered' | 'approved' | 'disputed';
}

export interface IContract extends Document {
  job_id: mongoose.Types.ObjectId;
  client_id: mongoose.Types.ObjectId;
  freelancer_id: mongoose.Types.ObjectId;
  agreed_price: number;
  agreed_deadline: Date;
  milestones: IContractMilestone[];
  max_revisions: number;
  revisions_used: number;
  file_format_expected?: string;
  scope_description: string;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  client_signed: boolean;
  freelancer_signed: boolean;
  created_at: Date;
}

const ContractMilestoneSchema = new Schema<IContractMilestone>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'funded', 'in_progress', 'delivered', 'approved', 'disputed'],
    default: 'pending',
  },
});

const ContractSchema = new Schema<IContract>(
  {
    job_id: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    agreed_price: { type: Number, required: true, min: 0 },
    agreed_deadline: { type: Date, required: true },
    milestones: [ContractMilestoneSchema],
    max_revisions: { type: Number, default: 3, min: 0 },
    revisions_used: { type: Number, default: 0, min: 0 },
    file_format_expected: { type: String },
    scope_description: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'disputed'],
      default: 'active',
    },
    client_signed: { type: Boolean, default: false },
    freelancer_signed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

ContractSchema.index({ job_id: 1 });
ContractSchema.index({ client_id: 1 });
ContractSchema.index({ freelancer_id: 1 });
ContractSchema.index({ status: 1 });

export default mongoose.model<IContract>('Contract', ContractSchema);
