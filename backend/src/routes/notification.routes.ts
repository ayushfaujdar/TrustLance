import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { getUserNotifications, markAsRead, markAllAsRead } from '../services/notification.service';

const router = Router();

// Get user's notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await getUserNotifications(req.user!._id.toString(), limit);
    res.json({ data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

// Mark one notification as read
router.post('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const success = await markAsRead(req.params.id as string, req.user!._id.toString());
    if (!success) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification' });
  }
});

// Mark all notifications as read
router.post('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await markAllAsRead(req.user!._id.toString());
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Failed to mark notifications' });
  }
});

export default router;
