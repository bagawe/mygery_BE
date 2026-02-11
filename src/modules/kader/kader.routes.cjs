const express = require('express');
const router = express.Router();
const kaderController = require('./kader.controller.cjs');
const authMiddleware = require('../../middlewares/authMiddleware');
const authorizeRole = require('../../middlewares/authorizeRole');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorizeRole('admin'));

// Get pending confirmations
router.get('/pending/point1', kaderController.getPendingPoint1.bind(kaderController));
router.get('/pending/point2', kaderController.getPendingPoint2.bind(kaderController));

// Confirm users
router.post('/confirm/point1/:userId', kaderController.confirmPoint1.bind(kaderController));
router.post('/confirm/point2/:userId', kaderController.confirmPoint2.bind(kaderController));

// Reject confirmations
router.post('/reject/point1/:userId', kaderController.rejectPoint1.bind(kaderController));
router.post('/reject/point2/:userId', kaderController.rejectPoint2.bind(kaderController));

// Statistics and confirmed users
router.get('/stats', kaderController.getStats.bind(kaderController));
router.get('/confirmed', kaderController.getConfirmedUsers.bind(kaderController));

module.exports = router;
