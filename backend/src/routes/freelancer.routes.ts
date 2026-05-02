import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getFreelancerStats, getFreelancerContracts } from '../controllers/freelancer.controller';

const router = Router();

// Freelancer dashboard stats
router.get('/stats', authenticate, getFreelancerStats);

// Freelancer's contracts
router.get('/contracts', authenticate, getFreelancerContracts);

export default router;
