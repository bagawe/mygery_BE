import historyService from './history.service.js';
import { z } from 'zod';

const typeEnum = z.enum(['login', 'logout', 'open_app', 'edit_profile', 'search_user']);

export class HistoryController {
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
  async getUserHistory(req, res, next) {
    try {
      const schema = z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 50)
      });
      const query = schema.parse(req.query);
      const userId = req.user.id;
      const result = await historyService.getUserHistory(userId, query.page, query.limit);
      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new HistoryController();
