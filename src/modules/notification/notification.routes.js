import express from 'express';
import notificationController from './notification.controller.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/notifications - List notifications
router.get('/', (req, res) => notificationController.getNotifications(req, res));

// GET /api/notifications/unread/count - Unread count
router.get('/unread/count', (req, res) => notificationController.getUnreadCount(req, res));

// PUT /api/notifications/read-all - Mark all as read (BEFORE :id routes)
router.put('/read-all', (req, res) => notificationController.markAllAsRead(req, res));

// DELETE /api/notifications/delete-all - Delete all (BEFORE :id routes)
router.delete('/delete-all', (req, res) => notificationController.deleteAllNotifications(req, res));

// PUT /api/notifications/:id/read - Mark single as read
router.put('/:id/read', (req, res) => notificationController.markAsRead(req, res));

// DELETE /api/notifications/:id - Delete single
router.delete('/:id', (req, res) => notificationController.deleteNotification(req, res));

export default router;
