import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  fundMilestone,
  getContractEscrows,
} from '../controllers/escrow.controller';

const router = Router();

// Fund a milestone (client)
router.post('/fund-milestone', authenticate, fundMilestone);

// Get all escrow transactions for a contract
router.get('/contract/:contractId', authenticate, getContractEscrows);

export default router;
