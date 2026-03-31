import express from 'express';
import kaderController from './kader.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorizeRole('admin'));

// Get pending confirmations
router.get('/pending/point1', kaderController.getPendingPoint1.bind(kaderController));
router.get('/pending/point2', kaderController.getPendingPoint2.bind(kaderController));
router.get('/pending/simpatisan', kaderController.getPendingSimpatisan.bind(kaderController)); // Alur 3 FE

// Confirm users
router.post('/confirm/point1/:userId', kaderController.confirmPoint1.bind(kaderController));
router.post('/confirm/point2/:userId', kaderController.confirmPoint2.bind(kaderController));
router.post('/confirm/simpatisan/:userId', kaderController.confirmSimpatisan.bind(kaderController)); // Alur 3 FE

// Reject confirmations
router.post('/reject/point1/:userId', kaderController.rejectPoint1.bind(kaderController));
router.post('/reject/point2/:userId', kaderController.rejectPoint2.bind(kaderController));
router.post('/reject/simpatisan/:userId', kaderController.rejectSimpatisan.bind(kaderController)); // Alur 3 FE

// Statistics and confirmed users
router.get('/stats', kaderController.getStats.bind(kaderController));
router.get('/confirmed', kaderController.getConfirmedUsers.bind(kaderController));

export default router;
