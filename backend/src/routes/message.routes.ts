import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getConversations, getMessages, sendMessage } from '../controllers/message.controller';

const router = Router();

// Get all conversations for current user
router.get('/conversations', authenticate, getConversations);

// Get messages in a thread
router.get('/:threadId', authenticate, getMessages);

// Send a message in a thread
router.post('/:threadId', authenticate, sendMessage);

export default router;
