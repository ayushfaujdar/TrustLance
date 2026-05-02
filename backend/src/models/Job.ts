import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  amount: number;
  deadline: Date;
  status: 'pending' | 'funded' | 'in_progress' | 'delivered' | 'approved' | 'disputed';
}

export interface IJob extends Document {
  title: string;
  description: string;
  category: string;
  client_id: mongoose.Types.ObjectId;
  budget_type: 'fixed' | 'hourly';
  budget_min: number;
  budget_max: number;
  deadline: Date;
  skills_required: string[];
  milestones: IMilestone[];
  attachments: string[];
  nda_required: boolean;
  bids: mongoose.Types.ObjectId[];
  accepted_bid?: mongoose.Types.ObjectId;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  views: number;
  created_at: Date;
  updated_at: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'funded', 'in_progress', 'delivered', 'approved', 'disputed'],
    default: 'pending',
  },
});

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, required: true, minlength: 3 },
    category: { type: String, required: true },
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    budget_type: { type: String, enum: ['fixed', 'hourly'], required: true },
    budget_min: { type: Number, required: true, min: 0 },
    budget_max: { type: Number, required: true, min: 0 },
    deadline: { type: Date },
    skills_required: [{ type: String, trim: true }],
    milestones: [MilestoneSchema],
    attachments: [{ type: String }],
    nda_required: { type: Boolean, default: false },
    bids: [{ type: Schema.Types.ObjectId, ref: 'Bid' }],
    accepted_bid: { type: Schema.Types.ObjectId, ref: 'Bid' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled', 'disputed'],
      default: 'open',
    },
    views: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

JobSchema.index({ client_id: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ skills_required: 1 });
JobSchema.index({ created_at: -1 });
JobSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IJob>('Job', JobSchema);
