import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Bid from '../models/Bid';
import Job from '../models/Job';
import { z } from 'zod';

const submitBidSchema = z.object({
  amount: z.number().min(1),
  message: z.string().optional().default(''),
  delivery_days: z.number().optional().default(7),
});

/**
 * POST /api/jobs/:id/bid — Submit a bid on a job
 */
export const submitBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.params.id as string;
    const validated = submitBidSchema.parse(req.body);

    // Check job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    if (job.status !== 'open') {
      res.status(400).json({ message: 'This job is no longer accepting bids' });
      return;
    }

    // Check freelancer hasn't already bid
    const existingBid = await Bid.findOne({ job_id: jobId, freelancer_id: req.user!._id });
    if (existingBid) {
      res.status(409).json({ message: 'You have already placed a bid on this job' });
      return;
    }

    // Create the bid
    const bid = await Bid.create({
      job_id: jobId,
      freelancer_id: req.user!._id,
      amount: validated.amount,
      cover_letter: validated.message || 'Interested in this project.',
      delivery_days: validated.delivery_days,
    });

    // Add bid reference to job
    await Job.findByIdAndUpdate(jobId, { $push: { bids: bid._id } });

    res.status(201).json({ success: true, bid });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Submit bid error:', error);
    res.status(500).json({ message: 'Failed to submit bid' });
  }
};

/**
 * POST /api/jobs/:id/accept-bid
 */
export const acceptBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.params.id as string;
    const { bidId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    // Check if user owns job
    if (job.client_id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const bid = await Bid.findById(bidId);
    if (!bid || bid.job_id.toString() !== jobId) {
      res.status(404).json({ message: 'Bid not found for this job' });
      return;
    }

    // Update job and bid status
    job.status = 'in_progress';
    job.accepted_bid = bid._id as any;
    await job.save();

    bid.status = 'accepted';
    await bid.save();

    // Copy milestones from job to contract if they exist, otherwise create a default one
    const contractMilestones = job.milestones && job.milestones.length > 0 
      ? job.milestones.map(m => ({
          title: m.title,
          description: m.description,
          amount: m.amount,
          deadline: m.deadline,
          status: 'pending' as const
        }))
      : [{
          title: 'Project Delivery',
          description: 'Complete project delivery',
          amount: bid.amount,
          deadline: new Date(Date.now() + bid.delivery_days * 24 * 60 * 60 * 1000),
          status: 'pending' as const
        }];

    // Create contract
    const contract = await (await import('../models/Contract')).default.create({
      job_id: job._id,
      client_id: job.client_id,
      freelancer_id: bid.freelancer_id,
      agreed_price: bid.amount,
      agreed_deadline: new Date(Date.now() + bid.delivery_days * 24 * 60 * 60 * 1000),
      scope_description: job.description,
      milestones: contractMilestones
    });

    res.json({ message: 'Bid accepted', contract });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ message: 'Failed to accept bid' });
  }
};
