import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  googleLogin,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/verify-email', authRateLimit, verifyEmail);
router.post('/login', authRateLimit, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);
router.get('/me', authenticate, getMe);

// Google OAuth
router.post('/google', authRateLimit, googleLogin);

export default router;
