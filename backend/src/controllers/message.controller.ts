import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Message from '../models/Message';
import mongoose from 'mongoose';

/**
 * GET /api/messages/conversations
 * Returns all distinct conversations for the logged-in user
 */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .sort({ created_at: -1 })
      .populate('sender', 'name avatar_url')
      .populate('receiver', 'name avatar_url')
      .lean();

    // Group by thread_id, keep only the latest message per thread
    const threadMap = new Map<string, typeof messages[0]>();
    for (const msg of messages) {
      if (!threadMap.has(msg.thread_id)) {
        threadMap.set(msg.thread_id, msg);
      }
    }

    const conversations = Array.from(threadMap.values()).map((msg) => {
      const isReceiver = msg.receiver && (msg.receiver as any)._id?.toString() === userId.toString();
      const otherUser = isReceiver ? msg.sender : msg.receiver;
      return {
        thread_id: msg.thread_id,
        other_user: otherUser,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread: !msg.read && isReceiver,
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
};

/**
 * GET /api/messages/:threadId
 * Returns all messages in a thread
 */
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { threadId } = req.params;
    const userId = req.user!._id;

    const messages = await Message.find({ thread_id: threadId })
      .sort({ created_at: 1 })
      .populate('sender', 'name avatar_url')
      .lean();

    // Mark unread messages as read
    await Message.updateMany(
      { thread_id: threadId, receiver: userId, read: false },
      { $set: { read: true, read_at: new Date() } }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
};

/**
 * POST /api/messages/:threadId
 * Sends a message in a thread
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { threadId } = req.params;
    const { content, receiverId } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ message: 'Message content is required' });
      return;
    }

    // Figure out receiver from thread history or explicit receiverId
    let receiver = receiverId;
    if (!receiver) {
      const lastMsg = await Message.findOne({ thread_id: threadId }).sort({ created_at: -1 });
      if (lastMsg) {
        const senderId = req.user!._id.toString();
        receiver = lastMsg.sender.toString() === senderId
          ? lastMsg.receiver.toString()
          : lastMsg.sender.toString();
      }
    }

    if (!receiver) {
      res.status(400).json({ message: 'Receiver not found' });
      return;
    }

    const message = await Message.create({
      thread_id: threadId,
      sender: req.user!._id,
      receiver: new mongoose.Types.ObjectId(receiver),
      content: content.trim(),
    });

    const populated = await message.populate('sender', 'name avatar_url');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};
