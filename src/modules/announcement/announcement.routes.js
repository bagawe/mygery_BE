import express from 'express';
import announcementController from './announcement.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';

const router = express.Router();

// Public route for mobile app (unauthenticated)
router.get('/public', announcementController.getPublicAnnouncements.bind(announcementController));

// Kader route (authenticated, kader role)
router.get(
  '/',
  authMiddleware,
  authorizeRole('kader', 'admin'),
  announcementController.getAnnouncements.bind(announcementController)
);

// Admin routes - require authentication and admin role
router.post('/', authMiddleware, authorizeRole('admin'), announcementController.createAnnouncement.bind(announcementController));
router.get('/stats', authMiddleware, authorizeRole('admin'), announcementController.getStats.bind(announcementController));
router.get('/:id', authMiddleware, authorizeRole('admin'), announcementController.getAnnouncementById.bind(announcementController));
router.put('/:id', authMiddleware, authorizeRole('admin'), announcementController.updateAnnouncement.bind(announcementController));
router.patch('/:id/toggle', authMiddleware, authorizeRole('admin'), announcementController.toggleActive.bind(announcementController));
router.delete('/:id', authMiddleware, authorizeRole('admin'), announcementController.deleteAnnouncement.bind(announcementController));

export default router;
