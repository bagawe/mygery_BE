import express from 'express';
import messageController from './message.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/conversations/:conversationId/messages
router.get('/:conversationId/messages', messageController.getMessages.bind(messageController));

// POST /api/conversations/:conversationId/messages
router.post('/:conversationId/messages', messageController.sendMessage.bind(messageController));

// PUT /api/conversations/:conversationId/read
router.put('/:conversationId/read', messageController.markAsRead.bind(messageController));

export default router;
