const express = require('express');
const router = express.Router();
const announcementController = require('./announcement.controller.cjs');
const authMiddleware = require('../../middlewares/authMiddleware');
const authorizeRole = require('../../middlewares/authorizeRole');

// Public route for mobile app
router.get('/public', announcementController.getPublicAnnouncements.bind(announcementController));

// Admin routes - require authentication and admin role
router.post('/', authMiddleware, authorizeRole('admin'), announcementController.createAnnouncement.bind(announcementController));
router.get('/stats', authMiddleware, authorizeRole('admin'), announcementController.getStats.bind(announcementController));
router.get('/', authMiddleware, authorizeRole('admin'), announcementController.getAnnouncements.bind(announcementController));
router.get('/:id', authMiddleware, authorizeRole('admin'), announcementController.getAnnouncementById.bind(announcementController));
router.put('/:id', authMiddleware, authorizeRole('admin'), announcementController.updateAnnouncement.bind(announcementController));
router.patch('/:id/toggle', authMiddleware, authorizeRole('admin'), announcementController.toggleActive.bind(announcementController));
router.delete('/:id', authMiddleware, authorizeRole('admin'), announcementController.deleteAnnouncement.bind(announcementController));

module.exports = router;
