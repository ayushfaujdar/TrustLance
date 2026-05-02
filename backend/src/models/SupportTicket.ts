import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketMessage {
  sender: mongoose.Types.ObjectId;
  message: string;
  sent_at: Date;
}

export interface ISupportTicket extends Document {
  user_id: mongoose.Types.ObjectId;
  category: 'payment' | 'dispute' | 'account' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  attachments: string[];
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: mongoose.Types.ObjectId;
  thread: ITicketMessage[];
  resolution_note?: string;
  satisfaction_rating?: number;
  created_at: Date;
  resolved_at?: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  sent_at: { type: Date, default: Date.now },
});

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['payment', 'dispute', 'account', 'technical', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    subject: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    assigned_to: { type: Schema.Types.ObjectId, ref: 'User' },
    thread: [TicketMessageSchema],
    resolution_note: { type: String },
    satisfaction_rating: { type: Number, min: 1, max: 5 },
    resolved_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

SupportTicketSchema.index({ user_id: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ assigned_to: 1 });
SupportTicketSchema.index({ category: 1 });

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
