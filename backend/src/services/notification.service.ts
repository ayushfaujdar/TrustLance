import Notification, { NotificationType } from '../models/Notification';
import { emitToUser } from '../socket/socket.handler';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
): Promise<void> => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      body,
      link,
      is_read: false,
    });

    // Emit real-time notification via socket
    emitToUser(userId, 'notification:new', notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const markAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
  const result = await Notification.findOneAndUpdate(
    { _id: notificationId, user_id: userId },
    { is_read: true }
  );
  return !!result;
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true }
  );
};

export const getUserNotifications = async (
  userId: string,
  limit: number = 50
) => {
  return Notification.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
};

export default {
  createNotification,
  markAsRead,
  markAllAsRead,
  getUserNotifications,
};
