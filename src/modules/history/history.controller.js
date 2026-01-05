import historyService from './history.service.js';
import { successResponse, errorResponse } from '../../utils/responseFormatter.js';

class HistoryController {
  /**
   * POST /api/history
   * Catat riwayat aktivitas user
   */
  async create(req, res, next) {
    try {
      const schema = z.object({
        type: typeEnum,
        description: z.string().optional(),
        metadata: z.any().optional()
      });
      const body = schema.parse(req.body);
      const userId = req.user.id;
      const entry = await historyService.create(userId, body.type, body.description, body.metadata);
      res.status(201).json({
        success: true,
        data: entry
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: err.errors
        });
      }
      next(err);
    }
  }

  /**
   * GET /api/history
   * Ambil riwayat aktivitas user (paginasi)
   */
  async getUserHistory(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await historyService.getUserHistory(userId, page, limit);

      return successResponse(res, result.data, 'History retrieved successfully', 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Get user history controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get history by type
   */
  async getHistoryByType(req, res) {
    try {
      const userId = req.user.userId;
      const { type } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await historyService.getHistoryByType(userId, type, page, limit);

      return successResponse(res, result.data, `${type} history retrieved successfully`, 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Get history by type controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Delete history entry
   */
  async deleteHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      await historyService.deleteHistory(parseInt(id), userId);

      return successResponse(res, null, 'History deleted successfully');
    } catch (error) {
      console.error('Delete history controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Clear all user history
   */
  async clearUserHistory(req, res) {
    try {
      const userId = req.user.userId;

      await historyService.clearUserHistory(userId);

      return successResponse(res, null, 'All history cleared successfully');
    } catch (error) {
      console.error('Clear user history controller error:', error);
      return errorResponse(res, error.message);
    }
  }
}

export default new HistoryController();
