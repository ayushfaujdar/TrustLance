import mongoose, { Schema, Document } from 'mongoose';

export interface IEscrowTransaction extends Document {
  contract_id?: mongoose.Types.ObjectId;
  milestone_id?: string;
  from_user: mongoose.Types.ObjectId;
  to_user: mongoose.Types.ObjectId;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed' | 'auto_released';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  release_condition?: string;
  funded_at?: Date;
  released_at?: Date;
  auto_release_at?: Date;
  warning_48h_sent: boolean;
  warning_24h_sent: boolean;
  escrow_token?: string;
  escrow_type: 'contract' | 'open';
  open_escrow_details?: {
    title?: string;
    description?: string;
    terms?: string;
    receiver_email?: string;
    deadline?: Date;
  };
  created_at: Date;
}

const EscrowTransactionSchema = new Schema<IEscrowTransaction>(
  {
    contract_id: { type: Schema.Types.ObjectId, ref: 'Contract' },
    milestone_id: { type: String },
    from_user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to_user: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true, min: 0 },
    platform_fee: { type: Number, default: 0, min: 0 },
    net_amount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'funded', 'released', 'refunded', 'disputed', 'auto_released'],
      default: 'pending',
    },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    release_condition: { type: String },
    funded_at: { type: Date },
    released_at: { type: Date },
    auto_release_at: { type: Date },
    warning_48h_sent: { type: Boolean, default: false },
    warning_24h_sent: { type: Boolean, default: false },
    escrow_token: { type: String, unique: true, sparse: true },
    escrow_type: { type: String, enum: ['contract', 'open'], default: 'contract' },
    open_escrow_details: {
      title: { type: String },
      description: { type: String },
      terms: { type: String },
      receiver_email: { type: String },
      deadline: { type: Date },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

EscrowTransactionSchema.index({ contract_id: 1 });
EscrowTransactionSchema.index({ milestone_id: 1 });
EscrowTransactionSchema.index({ status: 1 });
EscrowTransactionSchema.index({ auto_release_at: 1 });
EscrowTransactionSchema.index({ escrow_token: 1 });
EscrowTransactionSchema.index({ from_user: 1 });
EscrowTransactionSchema.index({ to_user: 1 });

export default mongoose.model<IEscrowTransaction>('EscrowTransaction', EscrowTransactionSchema);
