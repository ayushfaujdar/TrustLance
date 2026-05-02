import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Job from '../models/Job';
import { z } from 'zod';

const createJobSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(3),
  category: z.string(),
  budget: z.number().min(10),
  deadline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    amount: z.number().min(10),
    description: z.string().optional().default(''),
  })).min(1),
});

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createJobSchema.parse(req.body);
    
    // Default deadline to 1 month from now if not provided
    const jobDeadline = validated.deadline ? new Date(validated.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newJob = await Job.create({
      title: validated.title,
      description: validated.description,
      category: validated.category,
      client_id: req.user!._id,
      budget_type: 'fixed',
      budget_min: validated.budget,
      budget_max: validated.budget,
      deadline: jobDeadline,
      skills_required: validated.skills || [],
      milestones: validated.milestones.map(m => ({
        title: m.title,
        description: m.description,
        amount: m.amount,
        deadline: jobDeadline, // Use job deadline for milestones for simplicity
      })),
      status: 'open',
    });

    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
};

export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ status: 'open' }).sort({ created_at: -1 }).limit(20);
    res.json({ data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Failed to get jobs' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({
        path: 'bids',
        populate: {
          path: 'freelancer_id',
          select: 'name avatar_url'
        }
      })
      .lean();
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    const contract = await (await import('../models/Contract')).default.findOne({ job_id: job._id });

    res.json({ ...job, contract });
  } catch (error) {
    console.error('Get job by id error:', error);
    res.status(500).json({ message: 'Failed to get job' });
  }
};

export const getMyJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ client_id: req.user!._id }).sort({ created_at: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Failed to get jobs' });
  }
};

export const getClientStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [active, completed] = await Promise.all([
      Job.countDocuments({ client_id: req.user!._id, status: { $in: ['open', 'in_progress'] } }),
      Job.countDocuments({ client_id: req.user!._id, status: 'completed' }),
    ]);

    const user = await (await import('../models/User')).default.findById(req.user!._id).select('wallet_balance escrow_balance');

    res.json({
      activeProjects: active,
      totalSpent: 0,
      inEscrow: user?.escrow_balance || 0,
      completed,
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
};
