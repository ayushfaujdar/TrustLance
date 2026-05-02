import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import connectDB from './config/db';
import { initSocket } from './socket/socket.handler';
import { apiRateLimit } from './middleware/rateLimit.middleware';
import { startAutoReleaseCron } from './jobs/autoRelease.cron';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import jobRoutes from './routes/job.routes';
import bidRoutes from './routes/bid.routes';
import contractRoutes from './routes/contract.routes';
import escrowRoutes from './routes/escrow.routes';
import deliverableRoutes from './routes/deliverable.routes';
import disputeRoutes from './routes/dispute.routes';
import messageRoutes from './routes/message.routes';
import walletRoutes from './routes/wallet.routes';
import reviewRoutes from './routes/review.routes';
import supportRoutes from './routes/support.routes';
import adminRoutes from './routes/admin.routes';
import openEscrowRoutes from './routes/openEscrow.routes';
import notificationRoutes from './routes/notification.routes';
import freelancerRoutes from './routes/freelancer.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global rate limit for API
app.use('/api', apiRateLimit);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/deliverables', deliverableRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/open-escrow', openEscrowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/freelancer', freelancerRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '5000');

const startServer = async () => {
  try {
    await connectDB();
    startAutoReleaseCron();
    server.listen(PORT, () => {
      console.log(`\n🚀 TrustLance API running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
