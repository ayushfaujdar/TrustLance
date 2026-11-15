import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { getPublicFreelancerProfile } from '../controllers/user.controller';

const router = Router();

router.get('/freelancers', optionalAuth, (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/:id/profile', optionalAuth, getPublicFreelancerProfile);

router.put('/profile', authenticate, (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
