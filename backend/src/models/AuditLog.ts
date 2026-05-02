import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  target_type: string;
  target_id: string;
  details?: Record<string, unknown>;
  ip: string;
  created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    target_type: { type: String, required: true },
    target_id: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ip: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ created_at: -1 });
AuditLogSchema.index({ target_type: 1, target_id: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
