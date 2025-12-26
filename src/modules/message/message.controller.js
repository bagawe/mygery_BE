import messageService from './message.service.js';
import { z } from 'zod';

// Validation schemas
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long (max 5000 characters)')
});

const messagesQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  before: z.string().optional()
});

class MessageController {
  /**
   * Get messages in a conversation
   * GET /api/conversations/:conversationId/messages
   */
  async getMessages(req, res, next) {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const query = messagesQuerySchema.parse(req.query);
      const currentUserId = req.user.id;

      const result = await messageService.getMessages(
        conversationId,
        currentUserId,
        query.page,
        query.limit,
        query.before
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      next(error);
    }
  }

  /**
   * Send a message
   * POST /api/conversations/:conversationId/messages
   */
  async sendMessage(req, res, next) {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const body = sendMessageSchema.parse(req.body);
      const currentUserId = req.user.id;

      const message = await messageService.sendMessage(
        conversationId,
        currentUserId,
        body.content
      );

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      next(error);
    }
  }

  /**
   * Mark messages as read
   * PUT /api/conversations/:conversationId/read
   */
  async markAsRead(req, res, next) {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const currentUserId = req.user.id;

      const updatedCount = await messageService.markAsRead(conversationId, currentUserId);

      res.json({
        success: true,
        message: 'Messages marked as read',
        data: {
          updatedCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();
