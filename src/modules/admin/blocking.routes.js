import express from 'express';
import blockingController from './blocking.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';

const router = express.Router();

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

// Get active IP addresses
router.get('/active-ips', blockingController.getActiveIPs.bind(blockingController));

export default router;
