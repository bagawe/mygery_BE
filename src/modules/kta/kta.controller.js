import ktaService from './kta.service.js';

const successResponse = (res, data, message = 'Success', status = 200, meta = {}) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...meta
  });
};

const errorResponse = (res, message, status = 500) => {
  return res.status(status).json({
    success: false,
    message
  });
};

class KTAController {
  /**
   * Get my KTA status
   * GET /api/kta/my-status
   */
  async getMyStatus(req, res) {
    try {
      const userId = req.user.userId;
      const ktaData = await ktaService.getMyStatus(userId);
      
      return successResponse(res, ktaData, 'KTA status retrieved successfully');
    } catch (error) {
      console.error('Get my KTA status controller error:', error);
      
      if (error.message === 'User not found') {
        return errorResponse(res, error.message, 404);
      }
      
      return errorResponse(res, error.message);
    }
  }

  /**
   * Admin: Verify user's KTA
   * POST /api/admin/kta/verify
   */
  async verifyKTA(req, res) {
    try {
      const adminId = req.user.userId;
      const { user_id, verified, notes } = req.body;

      // Validate input
      if (!user_id || typeof verified !== 'boolean') {
        return errorResponse(res, 'user_id and verified (boolean) are required', 400);
      }

      const result = await ktaService.verifyKTA(adminId, user_id, verified, notes);
      
      const message = verified 
        ? 'User berhasil diverifikasi' 
        : 'Verifikasi user berhasil dibatalkan';
      
      return successResponse(res, result, message);
    } catch (error) {
      console.error('Verify KTA controller error:', error);
      
      if (error.message === 'User not found') {
        return errorResponse(res, error.message, 404);
      }
      
      return errorResponse(res, error.message);
    }
  }

  /**
   * Admin: Get list of users for verification
   * GET /api/admin/kta/users
   */
  async getUsersList(req, res) {
    try {
      const filters = {
        status: req.query.status || 'all',
        search: req.query.search || '',
        page: req.query.page || 1,
        limit: req.query.limit || 20
      };

      const result = await ktaService.getUsersList(filters);
      
      return successResponse(res, result, 'Users list retrieved successfully');
    } catch (error) {
      console.error('Get users list controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Verify QR code
   * POST /api/kta/verify-qr
   */
  async verifyQR(req, res) {
    try {
      const { qr_data } = req.body;

      if (!qr_data) {
        return errorResponse(res, 'qr_data is required', 400);
      }

      const result = await ktaService.verifyQR(qr_data);
      
      return successResponse(res, result, 'QR verification completed');
    } catch (error) {
      console.error('Verify QR controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Admin: Get KTA statistics
   * GET /api/admin/kta/stats
   */
  async getStats(req, res) {
    try {
      const stats = await ktaService.getStats();
      
      return successResponse(res, stats, 'KTA statistics retrieved successfully');
    } catch (error) {
      console.error('Get KTA stats controller error:', error);
      return errorResponse(res, error.message);
    }
  }
}

export default new KTAController();
