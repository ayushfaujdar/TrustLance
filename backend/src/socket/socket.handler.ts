import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';
import Notification from '../models/Notification';

let io: SocketServer;

export const initSocket = (httpServer: HTTPServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId).select('_id name role');
      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as any).userId = user._id.toString();
      (socket as any).userName = user.name;
      (socket as any).userRole = user.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    console.log(`🔌 User connected: ${userId}`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join admin room if admin/support
    const userRole = (socket as any).userRole as string[];
    if (userRole.includes('admin') || userRole.includes('support')) {
      socket.join('admin');
    }

    // Handle messaging
    socket.on('message:send', async (data: { receiverId: string; content: string; attachments?: string[] }) => {
      try {
        const sortedIds = [userId, data.receiverId].sort();
        const threadId = `${sortedIds[0]}_${sortedIds[1]}`;

        const message = await Message.create({
          thread_id: threadId,
          sender: userId,
          receiver: data.receiverId,
          content: data.content,
          attachments: data.attachments || [],
        });

        const populated = await message.populate('sender', 'name avatar_url');

        io.to(`user:${data.receiverId}`).emit('message:receive', populated);
        socket.emit('message:sent', populated);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:stop', { userId });
    });

    // Notification read
    socket.on('notification:read', async (data: { notificationId: string }) => {
      try {
        await Notification.findByIdAndUpdate(data.notificationId, { is_read: true });
      } catch (error) {
        console.error('Failed to mark notification read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper to emit to a specific user
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper to emit to admin room
export const emitToAdmin = (event: string, data: any): void => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};
