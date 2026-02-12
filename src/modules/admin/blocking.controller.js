import blockingService from './blocking.service.js';

class AdminBlockingController {
  /**
   * Block a user
   * POST /api/admin/block/:userId
   */
  async blockUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason, deviceIp } = req.body;
      const adminId = req.user.userId;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Block reason is required'
        });
      }

      const user = await blockingService.blockUser(userId, adminId, reason, deviceIp);

      res.json({
        success: true,
        message: 'User blocked successfully',
        data: user
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'Cannot block admin users' || error.message === 'User is already blocked') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to block user',
        error: error.message
      });
    }
  }

  /**
   * Unblock a user
   * POST /api/admin/unblock/:userId
   */
  async unblockUser(req, res) {
    try {
      const { userId } = req.params;
      const adminId = req.user.userId;

      const user = await blockingService.unblockUser(userId, adminId);

      res.json({
        success: true,
        message: 'User unblocked successfully',
        data: user
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'User is not blocked') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to unblock user',
        error: error.message
      });
    }
  }

  /**
   * Get all blocked users
   * GET /api/admin/blocked
   */
  async getBlockedUsers(req, res) {
    try {
      const blockedUsers = await blockingService.getBlockedUsers();

      res.json({
        success: true,
        data: blockedUsers,
        count: blockedUsers.length
      });
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blocked users',
        error: error.message
      });
    }
  }

  /**
   * Check if user/IP is blocked
   * POST /api/admin/check-blocked
   */
  async checkBlocked(req, res) {
    try {
      const { userId, deviceIp } = req.body;

      const result = await blockingService.isUserBlocked(userId, deviceIp);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error checking block status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check block status',
        error: error.message
      });
    }
  }

  /**
   * Get blocking statistics
   * GET /api/admin/blocking-stats
   */
  async getStats(req, res) {
    try {
      const stats = await blockingService.getBlockingStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching blocking statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  /**
   * Get active IP addresses
   * GET /api/admin/active-ips
   */
  async getActiveIPs(req, res) {
    try {
      const { q, limit, includeBlocked } = req.query;

      const ips = await blockingService.getActiveIPs(
        q || '',
        limit ? parseInt(limit) : 50,
        includeBlocked === 'true'
      );

      res.json({
        success: true,
        data: ips,
        meta: {
          total: ips.length,
          limit: limit ? parseInt(limit) : 50,
          uniqueIPs: ips.length
        }
      });
    } catch (error) {
      console.error('Error fetching active IPs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active IPs',
        error: error.message
      });
    }
  }
}

export default new AdminBlockingController();
