import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Contract from '../models/Contract';
import EscrowTransaction from '../models/EscrowTransaction';
import { lockFunds } from '../services/escrow.service';
import { z } from 'zod';
import crypto from 'crypto';
import User from '../models/User';
import WalletTransaction from '../models/WalletTransaction';
import { createNotification } from '../services/notification.service';

const fundMilestoneSchema = z.object({
  contractId: z.string(),
  milestoneId: z.string(),
});

const openEscrowSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  amount: z.number().min(50000, 'Minimum escrow amount is ₹500'),
  receiverEmail: z.string().email(),
  terms: z.string().optional(),
  deadlineDays: z.number().min(1).max(90).default(7),
});

/**
 * POST /api/escrow/fund-milestone — Lock funds for a contract milestone
 */
export const fundMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = fundMilestoneSchema.parse(req.body);
    const clientId = req.user!._id.toString();

    const escrowTx = await lockFunds(
      validated.contractId,
      validated.milestoneId,
      clientId,
      undefined,
      req.ip || 'unknown'
    );

    res.status(201).json({
      message: 'Milestone funded successfully',
      escrowTransaction: {
        id: escrowTx._id,
        amount: escrowTx.amount,
        platform_fee: escrowTx.platform_fee,
        net_amount: escrowTx.net_amount,
        status: escrowTx.status,
        auto_release_at: escrowTx.auto_release_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    const msg = error instanceof Error ? error.message : 'Failed to fund milestone';
    console.error('Fund milestone error:', error);
    res.status(400).json({ message: msg });
  }
};

/**
 * POST /api/open-escrow/create — Create an open escrow (P2P, no contract)
 */
export const createOpenEscrow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = openEscrowSchema.parse(req.body);
    const senderId = req.user!._id.toString();

    // 1. Check sender balance
    const sender = await User.findById(senderId);
    if (!sender) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (sender.wallet_balance < validated.amount) {
      res.status(400).json({ message: 'Insufficient wallet balance' });
      return;
    }

    // 2. Find or create receiver by email
    let receiver = await User.findOne({ email: validated.receiverEmail });

    // 3. Generate unique escrow token
    const escrowToken = crypto.randomBytes(16).toString('hex');
    const autoReleaseAt = new Date(Date.now() + validated.deadlineDays * 24 * 60 * 60 * 1000);

    // Calculate fees
    const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '8');
    const platformFee = Math.round(validated.amount * platformFeePercent / 100);
    const netAmount = validated.amount - platformFee;

    // 4. Lock funds from sender
    sender.wallet_balance -= validated.amount;
    sender.escrow_balance += validated.amount;
    await sender.save();

    // 5. Create wallet transaction
    await WalletTransaction.create({
      user_id: senderId,
      type: 'escrow_lock',
      amount: -validated.amount,
      balance_after: sender.wallet_balance,
      reference_type: 'OpenEscrow',
      description: `Open escrow: ${validated.title}`,
    });

    // 6. Create escrow transaction
    const escrowTx = await EscrowTransaction.create({
      from_user: senderId,
      to_user: receiver?._id,
      amount: validated.amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: 'funded',
      funded_at: new Date(),
      auto_release_at: autoReleaseAt,
      escrow_token: escrowToken,
      escrow_type: 'open',
      open_escrow_details: {
        title: validated.title,
        description: validated.description,
        terms: validated.terms,
        receiver_email: validated.receiverEmail,
        deadline: autoReleaseAt,
      },
    });

    // 7. Notify receiver if they have an account
    if (receiver) {
      await createNotification(
        receiver._id.toString(),
        'escrow_funded',
        'You Have a Pending Escrow!',
        `${sender.name} has placed ₹${(validated.amount / 100).toLocaleString()} in escrow for you: "${validated.title}"`,
        `/escrow/${escrowToken}`
      );
    }

    // Note: In production, send email to receiverEmail even if they don't have an account

    res.status(201).json({
      message: 'Open escrow created successfully',
      escrowToken,
      shareUrl: `${process.env.FRONTEND_URL}/escrow/${escrowToken}`,
      escrow: {
        id: escrowTx._id,
        amount: validated.amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        auto_release_at: autoReleaseAt,
        title: validated.title,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Create open escrow error:', error);
    res.status(500).json({ message: 'Failed to create open escrow' });
  }
};

/**
 * GET /api/open-escrow/:token — View open escrow details by token
 */
export const getOpenEscrow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const escrowTx = await EscrowTransaction.findOne({ escrow_token: req.params.token })
      .populate('from_user', 'name avatar_url')
      .populate('to_user', 'name avatar_url');

    if (!escrowTx) {
      res.status(404).json({ message: 'Escrow not found' });
      return;
    }

    res.json({
      escrow: {
        id: escrowTx._id,
        from: escrowTx.from_user,
        to: escrowTx.to_user,
        amount: escrowTx.amount,
        platform_fee: escrowTx.platform_fee,
        net_amount: escrowTx.net_amount,
        status: escrowTx.status,
        auto_release_at: escrowTx.auto_release_at,
        details: escrowTx.open_escrow_details,
        funded_at: escrowTx.funded_at,
      },
    });
  } catch (error) {
    console.error('Get open escrow error:', error);
    res.status(500).json({ message: 'Failed to get escrow details' });
  }
};

/**
 * GET /api/escrow/contract/:contractId — Get all escrow transactions for a contract
 */
export const getContractEscrows = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    const userId = req.user!._id.toString();
    if (contract.client_id.toString() !== userId && contract.freelancer_id.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const escrows = await EscrowTransaction.find({
      contract_id: req.params.contractId,
    }).sort({ created_at: -1 }).lean();

    res.json({ escrows });
  } catch (error) {
    console.error('Get contract escrows error:', error);
    res.status(500).json({ message: 'Failed to get escrow transactions' });
  }
};
