import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { optionalAuth } from '../middleware/auth.middleware';
import {
  createOpenEscrow,
  getOpenEscrow,
} from '../controllers/escrow.controller';

const router = Router();

// Create open escrow (P2P)
router.post('/create', authenticate, createOpenEscrow);

// View open escrow by token (optionally authenticated)
router.get('/:token', optionalAuth, getOpenEscrow);

export default router;
