import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { createJob, getJobs, getJobById, getMyJobs, getClientStats } from '../controllers/job.controller';
import { submitBid, acceptBid } from '../controllers/bid.controller';

const router = Router();

// Get all open jobs (for freelancers browsing)
router.get('/', authenticate, getJobs);

// Get current client's own jobs
router.get('/my-jobs', authenticate, getMyJobs);

// Get client dashboard stats
router.get('/client-stats', authenticate, getClientStats);

// Create a new job (any authenticated user can post a job)
router.post('/', authenticate, createJob);

// Get a specific job by ID
router.get('/:id', authenticate, getJobById);

// Submit a bid on a job
router.post('/:id/bid', authenticate, submitBid);

// Accept a bid on a job
router.post('/:id/accept-bid', authenticate, acceptBid);

export default router;
