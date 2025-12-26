import express from 'express';
import conversationController from './conversation.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/conversations/get-or-create
router.post('/get-or-create', conversationController.getOrCreate.bind(conversationController));

// GET /api/conversations
router.get('/', conversationController.getConversations.bind(conversationController));

export default router;
