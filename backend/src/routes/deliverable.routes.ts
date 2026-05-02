import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { uploadRateLimit } from '../middleware/rateLimit.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import {
  uploadDeliverable,
  getPreview,
  approveDeliverable,
  requestRevision,
  getContractDeliverables,
} from '../controllers/deliverable.controller';

const router = Router();

// Freelancer uploads deliverable
router.post(
  '/upload',
  authenticate,
  authorize('freelancer'),
  uploadRateLimit,
  uploadSingle,
  uploadDeliverable
);

// Client previews watermarked deliverable
router.get('/:id/preview', authenticate, getPreview);

// Client approves delivery (triggers escrow release)
router.post('/:id/approve', authenticate, approveDeliverable);

// Client requests revision
router.post('/:id/request-revision', authenticate, requestRevision);

// List all deliverables for a contract
router.get('/contract/:contractId', authenticate, getContractDeliverables);

export default router;
