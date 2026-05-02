import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  thread_id: string;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  attachments: string[];
  read: boolean;
  read_at?: Date;
  created_at: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    thread_id: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    read: { type: Boolean, default: false },
    read_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

MessageSchema.index({ thread_id: 1, created_at: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ receiver: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
