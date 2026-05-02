import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// TODO: Implement review routes in Prompt 2/3
router.get('/', authenticate, (_req, res) => {
  res.status(501).json({ message: 'review routes — not implemented yet' });
});

export default router;
