import notificationService from './notification.service.js';
import { successResponse, errorResponse } from '../../utils/responseFormatter.js';

class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await notificationService.getNotifications(userId, page, limit);

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * GET /api/notifications/unread/count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const result = await notificationService.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const notificationId = parseInt(req.params.id);

      if (isNaN(notificationId)) {
        return errorResponse(res, 'Invalid notification ID', 400);
      }

      const result = await notificationService.markAsRead(notificationId, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Notifikasi tidak ditemukan',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notifikasi ditandai sudah dibaca',
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      await notificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: 'Semua notifikasi ditandai sudah dibaca',
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const userId = req.user.userId;
      const notificationId = parseInt(req.params.id);

      if (isNaN(notificationId)) {
        return errorResponse(res, 'Invalid notification ID', 400);
      }

      const result = await notificationService.deleteNotification(notificationId, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Notifikasi tidak ditemukan',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notifikasi dihapus',
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * DELETE /api/notifications/delete-all
   */
  async deleteAllNotifications(req, res) {
    try {
      const userId = req.user.userId;
      await notificationService.deleteAllNotifications(userId);

      return res.status(200).json({
        success: true,
        message: 'Semua notifikasi dihapus',
      });
    } catch (error) {
      console.error('Delete all notifications error:', error);
      return errorResponse(res, error.message);
    }
  }
}

export default new NotificationController();
