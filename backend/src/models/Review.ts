import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  contract_id: mongoose.Types.ObjectId;
  from_user: mongoose.Types.ObjectId;
  to_user: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  is_flagged: boolean;
  flag_reason?: string;
  created_at: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    contract_id: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    from_user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to_user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, minlength: 10, maxlength: 1000 },
    is_flagged: { type: Boolean, default: false },
    flag_reason: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

ReviewSchema.index({ to_user: 1 });
ReviewSchema.index({ contract_id: 1 });
ReviewSchema.index({ from_user: 1, contract_id: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
