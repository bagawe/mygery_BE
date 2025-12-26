import conversationService from './conversation.service.js';
import { z } from 'zod';

// Validation schemas
const getOrCreateSchema = z.object({
  participantId: z.number().int().positive()
});

const conversationsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

class ConversationController {
  /**
   * Get or create conversation
   * POST /api/conversations/get-or-create
   */
  async getOrCreate(req, res, next) {
    try {
      const body = getOrCreateSchema.parse(req.body);
      const currentUserId = req.user.id;

      const result = await conversationService.getOrCreateConversation(
        currentUserId,
        body.participantId
      );

      const statusCode = result.isNew ? 201 : 200;
      
      res.status(statusCode).json({
        success: true,
        data: result.conversation,
        meta: {
          isNew: result.isNew
        }
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
   * Get all conversations for current user
   * GET /api/conversations
   */
  async getConversations(req, res, next) {
    try {
      const query = conversationsQuerySchema.parse(req.query);
      const currentUserId = req.user.id;

      const result = await conversationService.getUserConversations(
        currentUserId,
        query.page,
        query.limit
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
}

export default new ConversationController();
