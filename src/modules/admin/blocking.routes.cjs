const express = require('express');
const router = express.Router();
const blockingController = require('./blocking.controller.cjs');
const authMiddleware = require('../../middlewares/authMiddleware');
const authorizeRole = require('../../middlewares/authorizeRole');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorizeRole('admin'));

// Block/Unblock users
router.post('/block/:userId', blockingController.blockUser.bind(blockingController));
router.post('/unblock/:userId', blockingController.unblockUser.bind(blockingController));

// Get blocked users list
router.get('/blocked', blockingController.getBlockedUsers.bind(blockingController));

// Check if user/IP is blocked
router.post('/check-blocked', blockingController.checkBlocked.bind(blockingController));

// Statistics
router.get('/blocking-stats', blockingController.getStats.bind(blockingController));

module.exports = router;
