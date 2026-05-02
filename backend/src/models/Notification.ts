import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'bid_accepted'
  | 'escrow_funded'
  | 'delivery_submitted'
  | 'revision_requested'
  | 'payment_released'
  | 'dispute_opened'
  | 'auto_release_warning'
  | 'message_received'
  | 'ticket_updated';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'bid_accepted', 'escrow_funded', 'delivery_submitted', 'revision_requested',
        'payment_released', 'dispute_opened', 'auto_release_warning',
        'message_received', 'ticket_updated',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
