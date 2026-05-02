import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Contract from '../models/Contract';
import Bid from '../models/Bid';
import User from '../models/User';

export const getFreelancerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const freelancerId = req.user!._id;

    const [activeContracts, completedContracts, totalBids, user, incomingEscrows] = await Promise.all([
      Contract.countDocuments({ freelancer_id: freelancerId, status: 'active' }),
      Contract.countDocuments({ freelancer_id: freelancerId, status: 'completed' }),
      Bid.countDocuments({ freelancer_id: freelancerId }),
      User.findById(freelancerId).select('wallet_balance'),
      (await import('../models/EscrowTransaction')).default.aggregate([
        { $match: { to_user: freelancerId, status: 'funded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const pendingAmount = incomingEscrows.length > 0 ? incomingEscrows[0].total : 0;

    res.json({
      activeContracts,
      completedContracts,
      totalBids,
      earnings: user?.wallet_balance || 0,
      pending: pendingAmount,
    });
  } catch (error) {
    console.error('Freelancer stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
};

export const getFreelancerContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contracts = await Contract.find({ freelancer_id: req.user!._id })
      .populate('job_id', 'title category budget_min budget_max')
      .populate('client_id', 'name avatar_url')
      .sort({ created_at: -1 });

    res.json(contracts);
  } catch (error) {
    console.error('Freelancer contracts error:', error);
    res.status(500).json({ message: 'Failed to get contracts' });
  }
};
