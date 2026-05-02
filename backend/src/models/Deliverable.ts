import mongoose, { Schema, Document } from 'mongoose';

export interface IPreviewLog {
  viewed_by: mongoose.Types.ObjectId;
  ip: string;
  user_agent: string;
  viewed_at: Date;
  duration_seconds?: number;
}

export interface IDeliverable extends Document {
  contract_id: mongoose.Types.ObjectId;
  milestone_id: string;
  freelancer_id: mongoose.Types.ObjectId;
  original_file_url: string;
  watermarked_file_url: string;
  file_type: 'video' | 'image' | 'document' | 'audio' | 'other';
  file_size: number;
  file_name: string;
  cloudinary_public_id: string;
  preview_logs: IPreviewLog[];
  revision_number: number;
  message_to_client?: string;
  status: 'submitted' | 'approved' | 'revision_requested' | 'disputed';
  approved_at?: Date;
  created_at: Date;
}

const PreviewLogSchema = new Schema<IPreviewLog>({
  viewed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ip: { type: String, required: true },
  user_agent: { type: String, required: true },
  viewed_at: { type: Date, default: Date.now },
  duration_seconds: { type: Number },
});

const DeliverableSchema = new Schema<IDeliverable>(
  {
    contract_id: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    milestone_id: { type: String, required: true },
    freelancer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    original_file_url: { type: String, required: true },
    watermarked_file_url: { type: String, required: true },
    file_type: {
      type: String,
      enum: ['video', 'image', 'document', 'audio', 'other'],
      required: true,
    },
    file_size: { type: Number, required: true },
    file_name: { type: String, required: true },
    cloudinary_public_id: { type: String, required: true },
    preview_logs: [PreviewLogSchema],
    revision_number: { type: Number, default: 1 },
    message_to_client: { type: String },
    status: {
      type: String,
      enum: ['submitted', 'approved', 'revision_requested', 'disputed'],
      default: 'submitted',
    },
    approved_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

DeliverableSchema.index({ contract_id: 1 });
DeliverableSchema.index({ milestone_id: 1 });
DeliverableSchema.index({ freelancer_id: 1 });
DeliverableSchema.index({ status: 1 });

export default mongoose.model<IDeliverable>('Deliverable', DeliverableSchema);
