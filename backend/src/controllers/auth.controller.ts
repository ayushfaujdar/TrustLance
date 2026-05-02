import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  phone: z.string().optional(),
  role: z.enum(['client', 'freelancer', 'escrow_user']),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

const verifyEmailSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/),
});

// Helper functions
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string,
  } as jwt.SignOptions);
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
  } as jwt.SignOptions);
};

// Controllers
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    // Check phone uniqueness if provided
    if (validated.phone) {
      const phoneExists = await User.findOne({ phone: validated.phone });
      if (phoneExists) {
        res.status(409).json({ message: 'Phone number already registered' });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Log OTP in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n\n========================================');
      console.log(`🔑 DEVELOPMENT OTP for ${validated.email}: ${otp}`);
      console.log('========================================\n\n');
    }

    // Create user
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      phone: validated.phone,
      role: [validated.role],
      email_otp: otp,
      email_otp_expires: otpExpires,
      email_verified: false,
    });

    // Send verification email
    try {
      await sendVerificationEmail(validated.email, otp, validated.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't block registration if email fails in development
    }

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      email: validated.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = verifyEmailSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.email_verified) {
      res.status(400).json({ message: 'Email already verified' });
      return;
    }

    if (!user.email_otp || !user.email_otp_expires) {
      res.status(400).json({ message: 'No OTP found. Please request a new one.' });
      return;
    }

    if (new Date() > user.email_otp_expires) {
      res.status(400).json({ message: 'OTP expired. Please request a new one.' });
      return;
    }

    if (user.email_otp !== validated.otp) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    // Verify email and clear OTP
    user.email_verified = true;
    user.email_otp = undefined;
    user.email_otp_expires = undefined;

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refresh_tokens.push(refreshToken);

    await user.save();

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Email verified successfully',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        wallet_balance: user.wallet_balance,
        escrow_balance: user.escrow_balance,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.email_verified) {
      res.status(403).json({ message: 'Please verify your email first' });
      return;
    }

    if (user.is_banned) {
      res.status(403).json({ message: 'Account is banned', reason: user.ban_reason });
      return;
    }

    const isPasswordValid = await bcrypt.compare(validated.password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Limit refresh tokens to 5 (cleanup old sessions)
    if (user.refresh_tokens.length >= 5) {
      user.refresh_tokens = user.refresh_tokens.slice(-4);
    }
    user.refresh_tokens.push(refreshToken);
    await user.save();

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        wallet_balance: user.wallet_balance,
        escrow_balance: user.escrow_balance,
        badge: user.badge,
        rating: user.rating,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    } catch {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Token family check — detect reuse attack
    if (!user.refresh_tokens.includes(token)) {
      // Potential token theft — invalidate all tokens
      user.refresh_tokens = [];
      await user.save();
      res.clearCookie('refreshToken');
      res.status(401).json({ message: 'Token reuse detected. All sessions revoked.' });
      return;
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refresh_tokens = user.refresh_tokens.filter((t) => t !== token);
    user.refresh_tokens.push(newRefreshToken);
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

    if (token && req.user) {
      req.user.refresh_tokens = req.user.refresh_tokens.filter((t) => t !== token);
      await req.user.save();
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email });
    if (!user) {
      // Don't reveal if email exists
      res.json({ message: 'If the email exists, a reset link has been sent.' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.reset_password_token = hashedToken;
    user.reset_password_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    try {
      await sendPasswordResetEmail(validated.email, resetToken, user.name);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = resetPasswordSchema.parse(req.body);

    const hashedToken = crypto.createHash('sha256').update(validated.token).digest('hex');

    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    user.password = await bcrypt.hash(validated.password, 12);
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    user.refresh_tokens = []; // Invalidate all sessions
    await user.save();

    res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        avatar_url: req.user.avatar_url,
        bio: req.user.bio,
        skills: req.user.skills,
        hourly_rate: req.user.hourly_rate,
        wallet_balance: req.user.wallet_balance,
        escrow_balance: req.user.escrow_balance,
        kyc_status: req.user.kyc_status,
        rating: req.user.rating,
        review_count: req.user.review_count,
        badge: req.user.badge,
        availability: req.user.availability,
        completion_rate: req.user.completion_rate,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = googleLoginSchema.parse(req.body);

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: validated.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(401).json({ message: 'Invalid Google token payload' });
      return;
    }

    const { email, name, picture } = payload;
    const lowerEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: lowerEmail });

    if (!user) {
      // Create new user, default role to client
      // Generate a secure random password since they use Google to auth
      const randomPassword = crypto.randomBytes(32).toString('hex') + 'A1!';
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        name: name || 'Google User',
        email: lowerEmail,
        password: hashedPassword,
        role: ['client'],
        avatar_url: picture,
        email_verified: true, // Google handles email verification
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to DB
    user.refresh_tokens = user.refresh_tokens || [];
    user.refresh_tokens.push(refreshToken);
    await user.save();

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        wallet_balance: user.wallet_balance,
        escrow_balance: user.escrow_balance,
        badge: user.badge,
        rating: user.rating,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};
