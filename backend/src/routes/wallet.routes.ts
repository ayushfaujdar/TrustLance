import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createWalletOrder,
  verifyWalletPayment,
  withdrawFunds,
  getBalance,
  getTransactions,
} from '../controllers/wallet.controller';

const router = Router();

// Create Razorpay order for deposit
router.post('/create-order', authenticate, createWalletOrder);

// Verify payment and credit wallet
router.post('/verify-payment', authenticate, verifyWalletPayment);

// Withdraw funds
router.post('/withdraw', authenticate, withdrawFunds);

// Get balance
router.get('/balance', authenticate, getBalance);

// Transaction history
router.get('/transactions', authenticate, getTransactions);

export default router;
