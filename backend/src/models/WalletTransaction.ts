import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletTransaction extends Document {
  user_id: mongoose.Types.ObjectId;
  type: 'deposit' | 'escrow_lock' | 'escrow_release' | 'withdrawal' | 'refund' | 'platform_fee';
  amount: number;
  balance_after: number;
  reference_id?: string;
  reference_type?: string;
  razorpay_id?: string;
  description: string;
  created_at: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['deposit', 'escrow_lock', 'escrow_release', 'withdrawal', 'refund', 'platform_fee'],
      required: true,
    },
    amount: { type: Number, required: true },
    balance_after: { type: Number, required: true },
    reference_id: { type: String },
    reference_type: { type: String },
    razorpay_id: { type: String },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

WalletTransactionSchema.index({ user_id: 1, created_at: -1 });
WalletTransactionSchema.index({ type: 1 });

export default mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
