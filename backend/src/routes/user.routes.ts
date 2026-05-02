import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.get('/freelancers', optionalAuth, (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/:id/profile', optionalAuth, (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.put('/profile', authenticate, (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
