import mongoose from 'mongoose';
import User from '../models/User';
import Contract from '../models/Contract';
import EscrowTransaction from '../models/EscrowTransaction';
import WalletTransaction from '../models/WalletTransaction';
import AuditLog from '../models/AuditLog';
import { createNotification } from './notification.service';
import { sendAutoReleaseWarning } from './email.service';
import { emitToUser } from '../socket/socket.handler';

const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT || '8');

/**
 * Lock funds from client's wallet into escrow for a specific milestone.
 * All operations are atomic using MongoDB transactions.
 */
export const lockFunds = async (
  contractId: string,
  milestoneId: string,
  clientId: string,
  razorpayPaymentId?: string,
  ip: string = 'system'
): Promise<typeof EscrowTransaction.prototype> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Load contract and validate
    const contract = await Contract.findById(contractId).session(session);
    if (!contract) throw new Error('Contract not found');
    if (contract.client_id.toString() !== clientId) throw new Error('Not the contract client');

    const milestone = contract.milestones.find(
      (m) => m._id.toString() === milestoneId
    );
    if (!milestone) throw new Error('Milestone not found');
    if (milestone.status !== 'pending') throw new Error(`Milestone status is ${milestone.status}, must be pending`);

    const amount = milestone.amount;

    // 2. Deduct from client wallet
    const client = await User.findById(clientId).session(session);
    if (!client) throw new Error('Client not found');
    if (client.wallet_balance < amount) throw new Error('Insufficient wallet balance');

    client.wallet_balance -= amount;
    client.escrow_balance += amount;
    await client.save({ session });

    // 3. Create escrow transaction
    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
    const netAmount = amount - platformFee;
    const autoReleaseAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const escrowTx = await EscrowTransaction.create(
      [{
        contract_id: contractId,
        milestone_id: milestoneId,
        from_user: clientId,
        to_user: contract.freelancer_id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'funded',
        razorpay_payment_id: razorpayPaymentId,
        funded_at: new Date(),
        auto_release_at: autoReleaseAt,
        escrow_type: 'contract',
      }],
      { session }
    );

    // 4. Create wallet transaction record
    await WalletTransaction.create(
      [{
        user_id: clientId,
        type: 'escrow_lock',
        amount: -amount,
        balance_after: client.wallet_balance,
        reference_id: escrowTx[0]._id.toString(),
        reference_type: 'EscrowTransaction',
        description: `Escrow locked for milestone: ${milestone.title}`,
      }],
      { session }
    );

    // 5. Update milestone status
    milestone.status = 'funded';
    await contract.save({ session });

    // 6. Audit log
    await AuditLog.create(
      [{
        actor: clientId,
        action: 'escrow_lock',
        target_type: 'EscrowTransaction',
        target_id: escrowTx[0]._id.toString(),
        details: { contractId, milestoneId, amount, autoReleaseAt },
        ip,
      }],
      { session }
    );

    await session.commitTransaction();

    // 7. Post-commit: notifications + socket events (non-transactional)
    const freelancerId = contract.freelancer_id.toString();
    emitToUser(freelancerId, 'escrow:funded', {
      contractId,
      milestoneId,
      amount,
      milestoneName: milestone.title,
    });

    await createNotification(
      freelancerId,
      'escrow_funded',
      'Milestone Funded!',
      `₹${(amount / 100).toLocaleString()} has been secured in escrow for "${milestone.title}". You can start working now.`,
      `/freelancer/dashboard`
    );

    return escrowTx[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Release funds from escrow to freelancer's wallet.
 * Called when client approves delivery or auto-release triggers.
 */
export const releaseFunds = async (
  escrowTransactionId: string,
  approvedBy: string,
  ip: string = 'system'
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const escrowTx = await EscrowTransaction.findById(escrowTransactionId).session(session);
    if (!escrowTx) throw new Error('Escrow transaction not found');
    if (escrowTx.status !== 'funded') throw new Error(`Cannot release — status is ${escrowTx.status}`);

    const clientId = escrowTx.from_user.toString();
    const freelancerId = escrowTx.to_user.toString();
    const { amount, platform_fee, net_amount } = escrowTx;

    // 1. Update escrow transaction
    escrowTx.status = 'released';
    escrowTx.released_at = new Date();
    await escrowTx.save({ session });

    // 2. Deduct from client's escrow_balance
    const client = await User.findById(clientId).session(session);
    if (!client) throw new Error('Client not found');
    client.escrow_balance -= amount;
    await client.save({ session });

    // 3. Credit freelancer wallet (net of platform fee)
    const freelancer = await User.findById(freelancerId).session(session);
    if (!freelancer) throw new Error('Freelancer not found');
    freelancer.wallet_balance += net_amount;
    await freelancer.save({ session });

    // 4. Create wallet transactions for both parties
    await WalletTransaction.create(
      [
        {
          user_id: freelancerId,
          type: 'escrow_release',
          amount: net_amount,
          balance_after: freelancer.wallet_balance,
          reference_id: escrowTransactionId,
          reference_type: 'EscrowTransaction',
          description: `Payment released (${PLATFORM_FEE_PERCENT}% fee deducted)`,
        },
        {
          user_id: 'platform',
          type: 'platform_fee',
          amount: platform_fee,
          balance_after: 0, // Platform balance tracked separately
          reference_id: escrowTransactionId,
          reference_type: 'EscrowTransaction',
          description: `Platform fee from escrow release`,
        },
      ],
      { session }
    );

    // 5. Update contract milestone
    if (escrowTx.contract_id && escrowTx.milestone_id) {
      const contract = await Contract.findById(escrowTx.contract_id).session(session);
      if (contract) {
        const milestone = contract.milestones.find(
          (m) => m._id.toString() === escrowTx.milestone_id
        );
        if (milestone) {
          milestone.status = 'approved';
          // Check if all milestones are approved → complete contract
          const allApproved = contract.milestones.every((m) => m.status === 'approved');
          if (allApproved) {
            contract.status = 'completed';
          }
          await contract.save({ session });
        }
      }
    }

    // 6. Audit log
    await AuditLog.create(
      [{
        actor: approvedBy,
        action: 'escrow_release',
        target_type: 'EscrowTransaction',
        target_id: escrowTransactionId,
        details: { amount, platform_fee, net_amount, approvedBy },
        ip,
      }],
      { session }
    );

    await session.commitTransaction();

    // 7. Post-commit notifications
    emitToUser(freelancerId, 'escrow:released', {
      amount: net_amount,
      escrowTransactionId,
    });

    await createNotification(
      freelancerId,
      'payment_released',
      'Payment Released!',
      `₹${(net_amount / 100).toLocaleString()} has been added to your wallet.`,
      `/freelancer/earnings`
    );

    await createNotification(
      clientId,
      'payment_released',
      'Payment Sent',
      `₹${(amount / 100).toLocaleString()} has been released to the freelancer.`,
      `/client/wallet`
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Refund full escrow amount back to client's wallet.
 */
export const refundFunds = async (
  escrowTransactionId: string,
  refundedBy: string,
  reason: string,
  ip: string = 'system'
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const escrowTx = await EscrowTransaction.findById(escrowTransactionId).session(session);
    if (!escrowTx) throw new Error('Escrow transaction not found');
    if (!['funded', 'disputed'].includes(escrowTx.status)) {
      throw new Error(`Cannot refund — status is ${escrowTx.status}`);
    }

    const clientId = escrowTx.from_user.toString();
    const freelancerId = escrowTx.to_user.toString();
    const { amount } = escrowTx;

    // 1. Update escrow transaction
    escrowTx.status = 'refunded';
    escrowTx.released_at = new Date();
    await escrowTx.save({ session });

    // 2. Move funds back to client
    const client = await User.findById(clientId).session(session);
    if (!client) throw new Error('Client not found');
    client.escrow_balance -= amount;
    client.wallet_balance += amount;
    await client.save({ session });

    // 3. Wallet transaction record
    await WalletTransaction.create(
      [{
        user_id: clientId,
        type: 'refund',
        amount: amount,
        balance_after: client.wallet_balance,
        reference_id: escrowTransactionId,
        reference_type: 'EscrowTransaction',
        description: `Escrow refunded: ${reason}`,
      }],
      { session }
    );

    // 4. Update contract milestone
    if (escrowTx.contract_id && escrowTx.milestone_id) {
      const contract = await Contract.findById(escrowTx.contract_id).session(session);
      if (contract) {
        const milestone = contract.milestones.find(
          (m) => m._id.toString() === escrowTx.milestone_id
        );
        if (milestone) milestone.status = 'disputed';
        await contract.save({ session });
      }
    }

    // 5. Audit log
    await AuditLog.create(
      [{
        actor: refundedBy,
        action: 'escrow_refund',
        target_type: 'EscrowTransaction',
        target_id: escrowTransactionId,
        details: { amount, reason, refundedBy },
        ip,
      }],
      { session }
    );

    await session.commitTransaction();

    // 6. Notifications
    await createNotification(
      clientId,
      'payment_released',
      'Escrow Refunded',
      `₹${(amount / 100).toLocaleString()} has been returned to your wallet.`,
      `/client/wallet`
    );

    await createNotification(
      freelancerId,
      'payment_released',
      'Escrow Refunded to Client',
      `The client has been refunded ₹${(amount / 100).toLocaleString()}. Reason: ${reason}`,
      `/freelancer/dashboard`
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Split escrow between freelancer and client (dispute resolution).
 */
export const partialRelease = async (
  escrowTransactionId: string,
  freelancerAmount: number,
  clientAmount: number,
  decidedBy: string,
  ip: string = 'system'
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const escrowTx = await EscrowTransaction.findById(escrowTransactionId).session(session);
    if (!escrowTx) throw new Error('Escrow transaction not found');
    if (!['funded', 'disputed'].includes(escrowTx.status)) {
      throw new Error(`Cannot split — status is ${escrowTx.status}`);
    }

    const totalAmount = escrowTx.amount;
    if (freelancerAmount + clientAmount !== totalAmount) {
      throw new Error(`Split amounts (${freelancerAmount} + ${clientAmount}) must equal total (${totalAmount})`);
    }

    const clientId = escrowTx.from_user.toString();
    const freelancerId = escrowTx.to_user.toString();

    // Platform fee on freelancer's portion
    const platformFee = Math.round(freelancerAmount * PLATFORM_FEE_PERCENT / 100);
    const freelancerNet = freelancerAmount - platformFee;

    // 1. Update escrow
    escrowTx.status = 'released';
    escrowTx.platform_fee = platformFee;
    escrowTx.net_amount = freelancerNet;
    escrowTx.released_at = new Date();
    await escrowTx.save({ session });

    // 2. Update client balances
    const client = await User.findById(clientId).session(session);
    if (!client) throw new Error('Client not found');
    client.escrow_balance -= totalAmount;
    client.wallet_balance += clientAmount;
    await client.save({ session });

    // 3. Update freelancer balance
    const freelancer = await User.findById(freelancerId).session(session);
    if (!freelancer) throw new Error('Freelancer not found');
    freelancer.wallet_balance += freelancerNet;
    await freelancer.save({ session });

    // 4. Wallet transactions
    const txDocs = [];
    if (clientAmount > 0) {
      txDocs.push({
        user_id: clientId,
        type: 'refund' as const,
        amount: clientAmount,
        balance_after: client.wallet_balance,
        reference_id: escrowTransactionId,
        reference_type: 'EscrowTransaction',
        description: `Partial refund from dispute resolution`,
      });
    }
    if (freelancerNet > 0) {
      txDocs.push({
        user_id: freelancerId,
        type: 'escrow_release' as const,
        amount: freelancerNet,
        balance_after: freelancer.wallet_balance,
        reference_id: escrowTransactionId,
        reference_type: 'EscrowTransaction',
        description: `Partial release from dispute resolution (${PLATFORM_FEE_PERCENT}% fee)`,
      });
    }
    if (platformFee > 0) {
      txDocs.push({
        user_id: 'platform',
        type: 'platform_fee' as const,
        amount: platformFee,
        balance_after: 0,
        reference_id: escrowTransactionId,
        reference_type: 'EscrowTransaction',
        description: `Platform fee from dispute resolution`,
      });
    }
    if (txDocs.length > 0) {
      await WalletTransaction.create(txDocs, { session });
    }

    // 5. Audit log
    await AuditLog.create(
      [{
        actor: decidedBy,
        action: 'escrow_partial_release',
        target_type: 'EscrowTransaction',
        target_id: escrowTransactionId,
        details: { totalAmount, freelancerAmount, freelancerNet, clientAmount, platformFee, decidedBy },
        ip,
      }],
      { session }
    );

    await session.commitTransaction();

    // 6. Notifications
    if (clientAmount > 0) {
      await createNotification(
        clientId,
        'payment_released',
        'Dispute Resolved — Partial Refund',
        `₹${(clientAmount / 100).toLocaleString()} has been returned to your wallet.`,
        `/client/wallet`
      );
    }

    if (freelancerNet > 0) {
      await createNotification(
        freelancerId,
        'payment_released',
        'Dispute Resolved — Partial Payment',
        `₹${(freelancerNet / 100).toLocaleString()} has been added to your wallet.`,
        `/freelancer/earnings`
      );
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Check for escrow transactions that need auto-release warnings or execution.
 * Called by cron job every hour.
 */
export const checkAutoRelease = async (): Promise<void> => {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Send 48h warnings
    const toWarn48 = await EscrowTransaction.find({
      status: 'funded',
      auto_release_at: { $lte: in48h, $gt: in24h },
      warning_48h_sent: { $ne: true },
    }).populate('from_user', 'name email');

    for (const tx of toWarn48) {
      const client = tx.from_user as unknown as { _id: string; name: string; email: string };
      try {
        await sendAutoReleaseWarning(client.email, client.name, 48, 'Milestone', tx.amount);
        await createNotification(
          client._id.toString(),
          'auto_release_warning',
          'Auto-Release in 48 Hours',
          `Your escrow of ₹${(tx.amount / 100).toLocaleString()} will be auto-released in 48 hours. Review the delivery now.`,
          `/client/dashboard`
        );
        emitToUser(client._id.toString(), 'auto_release:warning', { hours: 48, escrowId: tx._id });
        tx.warning_48h_sent = true;
        await tx.save();
      } catch (err) {
        console.error(`Failed 48h warning for escrow ${tx._id}:`, err);
      }
    }

    // Send 24h warnings
    const toWarn24 = await EscrowTransaction.find({
      status: 'funded',
      auto_release_at: { $lte: in24h, $gt: now },
      warning_24h_sent: { $ne: true },
    }).populate('from_user', 'name email');

    for (const tx of toWarn24) {
      const client = tx.from_user as unknown as { _id: string; name: string; email: string };
      try {
        await sendAutoReleaseWarning(client.email, client.name, 24, 'Milestone', tx.amount);
        await createNotification(
          client._id.toString(),
          'auto_release_warning',
          '⚠️ Auto-Release in 24 Hours',
          `Your escrow of ₹${(tx.amount / 100).toLocaleString()} will be auto-released tomorrow. This is your last chance to review.`,
          `/client/dashboard`
        );
        emitToUser(client._id.toString(), 'auto_release:warning', { hours: 24, escrowId: tx._id });
        tx.warning_24h_sent = true;
        await tx.save();
      } catch (err) {
        console.error(`Failed 24h warning for escrow ${tx._id}:`, err);
      }
    }

    // Execute auto-releases for expired funded escrows where milestone is delivered
    const toRelease = await EscrowTransaction.find({
      status: 'funded',
      auto_release_at: { $lte: now },
    });

    for (const tx of toRelease) {
      try {
        // Only auto-release if milestone has been delivered
        if (tx.contract_id && tx.milestone_id) {
          const contract = await Contract.findById(tx.contract_id);
          if (contract) {
            const milestone = contract.milestones.find(
              (m) => m._id.toString() === tx.milestone_id
            );
            if (milestone && milestone.status === 'delivered') {
              await releaseFunds(tx._id.toString(), 'system_auto_release', 'system');
              console.log(`✅ Auto-released escrow ${tx._id}`);
            }
          }
        }
      } catch (err) {
        console.error(`Failed auto-release for escrow ${tx._id}:`, err);
      }
    }
  } catch (error) {
    console.error('Auto-release check failed:', error);
  }
};

export default {
  lockFunds,
  releaseFunds,
  refundFunds,
  partialRelease,
  checkAutoRelease,
};
