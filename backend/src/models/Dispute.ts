import mongoose, { Schema, Document } from 'mongoose';

export interface IEvidence {
  uploaded_by: mongoose.Types.ObjectId;
  file_url: string;
  description: string;
  uploaded_at: Date;
}

export interface IDisputeMessage {
  sender: mongoose.Types.ObjectId;
  message: string;
  sent_at: Date;
}

export interface IDispute extends Document {
  contract_id: mongoose.Types.ObjectId;
  opened_by: mongoose.Types.ObjectId;
  against: mongoose.Types.ObjectId;
  reason: string;
  description: string;
  evidence: IEvidence[];
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  assigned_to?: mongoose.Types.ObjectId;
  resolution?: {
    decision: string;
    client_refund_amount: number;
    freelancer_release_amount: number;
    resolved_by: mongoose.Types.ObjectId;
    resolved_at: Date;
  };
  thread: IDisputeMessage[];
  created_at: Date;
}

const EvidenceSchema = new Schema<IEvidence>({
  uploaded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  file_url: { type: String, required: true },
  description: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now },
});

const DisputeMessageSchema = new Schema<IDisputeMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  sent_at: { type: Date, default: Date.now },
});

const DisputeSchema = new Schema<IDispute>(
  {
    contract_id: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    opened_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    against: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    evidence: [EvidenceSchema],
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'escalated'],
      default: 'open',
    },
    assigned_to: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: {
      decision: { type: String },
      client_refund_amount: { type: Number },
      freelancer_release_amount: { type: Number },
      resolved_by: { type: Schema.Types.ObjectId, ref: 'User' },
      resolved_at: { type: Date },
    },
    thread: [DisputeMessageSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

DisputeSchema.index({ contract_id: 1 });
DisputeSchema.index({ status: 1 });
DisputeSchema.index({ opened_by: 1 });
DisputeSchema.index({ assigned_to: 1 });

export default mongoose.model<IDispute>('Dispute', DisputeSchema);
