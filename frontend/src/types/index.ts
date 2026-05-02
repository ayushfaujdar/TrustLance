// ─── User Types ─────────────────────────────────────────
export type UserRole = 'client' | 'freelancer' | 'escrow_user' | 'support' | 'admin';
export type KYCStatus = 'pending' | 'submitted' | 'verified' | 'rejected';
export type Badge = 'none' | 'rising_talent' | 'top_rated' | 'elite';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole[];
  bio?: string;
  skills: string[];
  hourly_rate?: number;
  portfolio: string[];
  wallet_balance: number;
  escrow_balance: number;
  kyc_status: KYCStatus;
  rating: number;
  review_count: number;
  completion_rate: number;
  badge: Badge;
  availability: boolean;
  response_time_hours: number;
  created_at: string;
}

// ─── Job Types ──────────────────────────────────────────
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type MilestoneStatus = 'pending' | 'funded' | 'in_progress' | 'delivered' | 'approved' | 'disputed';
export type BudgetType = 'fixed' | 'hourly';

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  amount: number;
  deadline: string;
  status: MilestoneStatus;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  client_id: string | User;
  budget_type: BudgetType;
  budget_min: number;
  budget_max: number;
  deadline: string;
  skills_required: string[];
  milestones: Milestone[];
  attachments: string[];
  nda_required: boolean;
  bids: string[];
  accepted_bid?: string;
  status: JobStatus;
  views: number;
  created_at: string;
  updated_at: string;
}

// ─── Bid Types ──────────────────────────────────────────
export interface Bid {
  _id: string;
  job_id: string;
  freelancer_id: string | User;
  amount: number;
  delivery_days: number;
  cover_letter: string;
  milestone_adjustments?: Milestone[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
}

// ─── Contract Types ─────────────────────────────────────
export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'disputed';

export interface Contract {
  _id: string;
  job_id: string | Job;
  client_id: string | User;
  freelancer_id: string | User;
  agreed_price: number;
  agreed_deadline: string;
  milestones: Milestone[];
  max_revisions: number;
  revisions_used: number;
  file_format_expected?: string;
  scope_description: string;
  status: ContractStatus;
  client_signed: boolean;
  freelancer_signed: boolean;
  created_at: string;
}

// ─── Escrow Types ───────────────────────────────────────
export type EscrowStatus = 'pending' | 'funded' | 'released' | 'refunded' | 'disputed' | 'auto_released';

export interface EscrowTransaction {
  _id: string;
  contract_id?: string;
  milestone_id?: string;
  from_user: string | User;
  to_user: string | User;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: EscrowStatus;
  razorpay_order_id?: string;
  auto_release_at?: string;
  escrow_token?: string;
  escrow_type: 'contract' | 'open';
  created_at: string;
}

// ─── Deliverable Types ──────────────────────────────────
export type FileType = 'video' | 'image' | 'document' | 'audio' | 'other';
export type DeliverableStatus = 'submitted' | 'approved' | 'revision_requested' | 'disputed';

export interface Deliverable {
  _id: string;
  contract_id: string;
  milestone_id: string;
  freelancer_id: string | User;
  original_file_url: string;
  watermarked_file_url: string;
  file_type: FileType;
  file_size: number;
  file_name: string;
  revision_number: number;
  message_to_client?: string;
  status: DeliverableStatus;
  approved_at?: string;
  created_at: string;
}

// ─── Dispute Types ──────────────────────────────────────
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';

export interface Evidence {
  uploaded_by: string | User;
  file_url: string;
  description: string;
  uploaded_at: string;
}

export interface Dispute {
  _id: string;
  contract_id: string | Contract;
  opened_by: string | User;
  against: string | User;
  reason: string;
  description: string;
  evidence: Evidence[];
  status: DisputeStatus;
  assigned_to?: string | User;
  resolution?: {
    decision: string;
    client_refund_amount: number;
    freelancer_release_amount: number;
    resolved_by: string | User;
    resolved_at: string;
  };
  thread: { sender: string | User; message: string; sent_at: string }[];
  created_at: string;
}

// ─── Message Types ──────────────────────────────────────
export interface Message {
  _id: string;
  thread_id: string;
  sender: string | User;
  receiver: string | User;
  content: string;
  attachments: string[];
  read: boolean;
  read_at?: string;
  created_at: string;
}

// ─── Wallet Types ───────────────────────────────────────
export type WalletTxType = 'deposit' | 'escrow_lock' | 'escrow_release' | 'withdrawal' | 'refund' | 'platform_fee';

export interface WalletTransaction {
  _id: string;
  user_id: string;
  type: WalletTxType;
  amount: number;
  balance_after: number;
  reference_id?: string;
  reference_type?: string;
  razorpay_id?: string;
  description: string;
  created_at: string;
}

// ─── Notification Types ─────────────────────────────────
export type NotificationType =
  | 'bid_accepted' | 'escrow_funded' | 'delivery_submitted' | 'revision_requested'
  | 'payment_released' | 'dispute_opened' | 'auto_release_warning'
  | 'message_received' | 'ticket_updated';

export interface Notification {
  _id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// ─── Review Types ───────────────────────────────────────
export interface Review {
  _id: string;
  contract_id: string;
  from_user: string | User;
  to_user: string | User;
  rating: number;
  text: string;
  created_at: string;
}

// ─── Support Ticket Types ───────────────────────────────
export type TicketCategory = 'payment' | 'dispute' | 'account' | 'technical' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  _id: string;
  user_id: string | User;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  attachments: string[];
  status: TicketStatus;
  assigned_to?: string | User;
  thread: { sender: string | User; message: string; sent_at: string }[];
  resolution_note?: string;
  satisfaction_rating?: number;
  created_at: string;
  resolved_at?: string;
}

// ─── API Response Types ─────────────────────────────────
export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  errors?: unknown[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
