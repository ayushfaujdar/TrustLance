import mongoose, { Schema, Document } from 'mongoose';

export interface IBid extends Document {
  job_id: mongoose.Types.ObjectId;
  freelancer_id: mongoose.Types.ObjectId;
  amount: number;
  delivery_days: number;
  cover_letter: string;
  milestone_adjustments: {
    title: string;
    description: string;
    amount: number;
    deadline: Date;
  }[];
  attachments: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: Date;
}

const BidSchema = new Schema<IBid>(
  {
    job_id: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    freelancer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    delivery_days: { type: Number, required: true, min: 1 },
    cover_letter: { type: String, default: '' },
    milestone_adjustments: [
      {
        title: { type: String },
        description: { type: String },
        amount: { type: Number },
        deadline: { type: Date },
      },
    ],
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

BidSchema.index({ job_id: 1 });
BidSchema.index({ freelancer_id: 1 });
BidSchema.index({ status: 1 });
// One bid per freelancer per job
BidSchema.index({ job_id: 1, freelancer_id: 1 }, { unique: true });

export default mongoose.model<IBid>('Bid', BidSchema);
