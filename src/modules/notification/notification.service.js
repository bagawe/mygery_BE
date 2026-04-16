import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class NotificationService {
  /**
   * Get notifications for user with pagination
   */
  async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          type: true,
          postId: true,
          commentId: true,
          fromUserName: true,
          fromUserUsername: true,
          message: true,
          createdAt: true,
          isRead: true,
        },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) return null;

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return true;
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return true;
  }

  /**
   * Delete single notification
   */
  async deleteNotification(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) return null;

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return true;
  }

  /**
   * Delete all notifications for user
   */
  async deleteAllNotifications(userId) {
    await prisma.notification.deleteMany({
      where: { userId },
    });
    return true;
  }

  /**
   * Create notification for like
   * - Skip if user likes own post
   * - fromUser = user who liked, toUser = post owner
   */
  async createLikeNotification(postId, fromUserId) {
    try {
      // Get post owner + from user info
      const [post, fromUser] = await Promise.all([
        prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true },
        }),
        prisma.user.findUnique({
          where: { id: fromUserId },
          select: { name: true, username: true },
        }),
      ]);

      if (!post || !fromUser) return null;

      // Skip if user likes own post
      if (post.userId === fromUserId) return null;

      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'like',
          postId,
          fromUserId,
          fromUserName: fromUser.name || fromUser.username,
          fromUserUsername: fromUser.username,
          isRead: false,
        },
      });

      return true;
    } catch (error) {
      console.error('Create like notification error:', error);
      // Don't throw - notification failure shouldn't break like action
    }
  }

  /**
   * Remove like notification (on unlike/toggle off)
   */
  async removeLikeNotification(postId, fromUserId) {
    try {
      await prisma.notification.deleteMany({
        where: {
          postId,
          fromUserId,
          type: 'like',
        },
      });
    } catch (error) {
      console.error('Remove like notification error:', error);
    }
  }

  /**
   * Create notification for comment
   * - Skip if user comments on own post
   * - message = truncated comment content (max 100 chars)
   */
  async createCommentNotification(postId, commentId, fromUserId, commentContent) {
    try {
      const [post, fromUser] = await Promise.all([
        prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true },
        }),
        prisma.user.findUnique({
          where: { id: fromUserId },
          select: { name: true, username: true },
        }),
      ]);

      if (!post || !fromUser) return null;

      // Skip if user comments on own post
      if (post.userId === fromUserId) return null;

      // Truncate message to 100 chars
      const message = commentContent
        ? commentContent.substring(0, 100)
        : null;

      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'comment',
          postId,
          commentId,
          fromUserId,
          fromUserName: fromUser.name || fromUser.username,
          fromUserUsername: fromUser.username,
          message,
          isRead: false,
        },
      });

      return true;
    } catch (error) {
      console.error('Create comment notification error:', error);
    }
  }
}

export default new NotificationService();
