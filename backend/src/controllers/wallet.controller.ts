import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import WalletTransaction from '../models/WalletTransaction';
import { createOrder, verifyPaymentSignature } from '../services/payment.service';
import { z } from 'zod';

const createOrderSchema = z.object({
  amount: z.number().min(10, 'Minimum deposit is ₹10').max(10000000, 'Maximum deposit is ₹1,00,000'),
});

const verifyPaymentSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
});

const withdrawSchema = z.object({
  amount: z.number().min(50000, 'Minimum withdrawal is ₹500'),
  bankAccountId: z.string().optional(),
});

/**
 * POST /api/wallet/create-order — Create a Razorpay order to add funds
 */
export const createWalletOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createOrderSchema.parse(req.body);
    const amountInPaise = Math.round(validated.amount * 100);

    const order = await createOrder(
      amountInPaise,
      `w_${Date.now()}_${req.user!._id.toString().slice(-6)}`,
      { userId: req.user!._id.toString(), purpose: 'wallet_deposit' }
    );

    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Create wallet order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

/**
 * POST /api/wallet/verify-payment — Verify Razorpay payment and credit wallet
 */
export const verifyWalletPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = verifyPaymentSchema.parse(req.body);

    // 1. Verify Razorpay signature
    const isValid = verifyPaymentSignature(
      validated.orderId,
      validated.paymentId,
      validated.signature
    );

    if (!isValid) {
      res.status(400).json({ message: 'Payment verification failed — invalid signature' });
      return;
    }

    // 2. Check for duplicate processing
    const existingTx = await WalletTransaction.findOne({ razorpay_id: validated.paymentId });
    if (existingTx) {
      res.status(409).json({ message: 'Payment already processed' });
      return;
    }

    // 3. Fetch payment details from Razorpay to get exact amount
    // For now, we'll trust the order amount since signature is verified
    const { fetchPayment } = await import('../services/payment.service');
    const payment = await fetchPayment(validated.paymentId);
    const amountInPaise = payment.amount as number;

    // 4. Credit user wallet
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.wallet_balance += amountInPaise;
    await user.save();

    // 5. Create wallet transaction record
    await WalletTransaction.create({
      user_id: req.user!._id,
      type: 'deposit',
      amount: amountInPaise,
      balance_after: user.wallet_balance,
      razorpay_id: validated.paymentId,
      reference_id: validated.orderId,
      reference_type: 'RazorpayOrder',
      description: `Wallet deposit of ₹${(amountInPaise / 100).toLocaleString()}`,
    });

    res.json({
      success: true,
      balance: user.wallet_balance,
      message: `₹${(amountInPaise / 100).toLocaleString()} added to your wallet`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
};

/**
 * POST /api/wallet/withdraw — Freelancer withdraws funds to bank
 */
export const withdrawFunds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = withdrawSchema.parse(req.body);
    const userId = req.user!._id.toString();

    // 1. Verify KYC
    if (req.user!.kyc_status !== 'verified') {
      res.status(403).json({ message: 'KYC verification required before withdrawal' });
      return;
    }

    // 2. Check balance
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.wallet_balance < validated.amount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    // 3. Deduct from wallet
    user.wallet_balance -= validated.amount;
    await user.save();

    // 4. Create wallet transaction (withdrawal queued)
    await WalletTransaction.create({
      user_id: userId,
      type: 'withdrawal',
      amount: -validated.amount,
      balance_after: user.wallet_balance,
      reference_type: 'BankPayout',
      description: `Withdrawal of ₹${(validated.amount / 100).toLocaleString()} — Processing`,
    });

    // Note: In production, create Razorpay payout here
    // For Phase 1, withdrawals are queued for manual admin processing

    res.json({
      success: true,
      balance: user.wallet_balance,
      message: `Withdrawal of ₹${(validated.amount / 100).toLocaleString()} is being processed. Expected: 2 business days.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Withdraw funds error:', error);
    res.status(500).json({ message: 'Failed to process withdrawal' });
  }
};

/**
 * GET /api/wallet/balance — Get user's wallet balance
 */
export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('wallet_balance escrow_balance role');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let pending = user.escrow_balance;
    let totalEarned = 0;

    if (user.role === 'freelancer') {
      const EscrowTransaction = (await import('../models/EscrowTransaction')).default;
      const incoming = await EscrowTransaction.aggregate([
        { $match: { to_user: user._id, status: 'funded' } },
        { $group: { _id: null, total: { $sum: '$net_amount' } } }
      ]);
      pending = incoming.length > 0 ? incoming[0].total : 0;

      const earnings = await WalletTransaction.aggregate([
        { $match: { user_id: user._id, type: 'escrow_release' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      totalEarned = earnings.length > 0 ? earnings[0].total : 0;
    }

    res.json({
      balance: user.wallet_balance,
      pending,
      totalEarned,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Failed to get balance' });
  }
};

/**
 * GET /api/wallet/transactions — Get paginated transaction history
 */
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const type = req.query.type as string;

    const filter: Record<string, unknown> = { user_id: req.user!._id };
    if (type) filter.type = type;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    res.json({
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
};
