import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar_url?: string;
  role: ('client' | 'freelancer' | 'escrow_user' | 'support' | 'admin')[];
  bio?: string;
  skills: string[];
  hourly_rate?: number;
  portfolio: string[];
  wallet_balance: number;
  escrow_balance: number;
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
  kyc_documents: {
    aadhaar_url?: string;
    pan_url?: string;
  };
  rating: number;
  review_count: number;
  completion_rate: number;
  badge: 'none' | 'rising_talent' | 'top_rated' | 'elite';
  availability: boolean;
  response_time_hours: number;
  is_banned: boolean;
  ban_reason?: string;
  two_factor_enabled: boolean;
  google_id?: string;
  refresh_tokens: string[];
  email_verified: boolean;
  email_otp?: string;
  email_otp_expires?: Date;
  reset_password_token?: string;
  reset_password_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, trim: true },
    avatar_url: { type: String },
    role: {
      type: [{ type: String, enum: ['client', 'freelancer', 'escrow_user', 'support', 'admin'] }],
      default: ['client'],
      validate: [(val: string[]) => val.length > 0, 'At least one role is required'],
    },
    bio: { type: String, maxlength: 1000 },
    skills: [{ type: String, trim: true }],
    hourly_rate: { type: Number, min: 0 },
    portfolio: [{ type: String }],
    wallet_balance: { type: Number, default: 0, min: 0 },
    escrow_balance: { type: Number, default: 0, min: 0 },
    kyc_status: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending',
    },
    kyc_documents: {
      aadhaar_url: { type: String },
      pan_url: { type: String },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    review_count: { type: Number, default: 0 },
    completion_rate: { type: Number, default: 100 },
    badge: {
      type: String,
      enum: ['none', 'rising_talent', 'top_rated', 'elite'],
      default: 'none',
    },
    availability: { type: Boolean, default: true },
    response_time_hours: { type: Number, default: 24 },
    is_banned: { type: Boolean, default: false },
    ban_reason: { type: String },
    two_factor_enabled: { type: Boolean, default: false },
    google_id: { type: String },
    refresh_tokens: [{ type: String }],
    email_verified: { type: Boolean, default: false },
    email_otp: { type: String },
    email_otp_expires: { type: Date },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ skills: 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ badge: 1 });

export default mongoose.model<IUser>('User', UserSchema);
