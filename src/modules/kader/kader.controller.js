import kaderService from './kader.service.js';

class KaderConfirmationController {
  /**
   * Get pending Point 1 confirmations (Old Members)
   * GET /api/kader/pending/point1
   */
  async getPendingPoint1(req, res) {
    try {
      const pending = await kaderService.getPendingPoint1();

      res.json({
        success: true,
        data: pending,
        count: pending.length
      });
    } catch (error) {
      console.error('Error fetching pending Point 1:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending confirmations',
        error: error.message
      });
    }
  }

  /**
   * Get pending Point 2 confirmations (New Members)
   * GET /api/kader/pending/point2
   */
  async getPendingPoint2(req, res) {
    try {
      const pending = await kaderService.getPendingPoint2();

      res.json({
        success: true,
        data: pending,
        count: pending.length
      });
    } catch (error) {
      console.error('Error fetching pending Point 2:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending upgrades',
        error: error.message
      });
    }
  }

  /**
   * Get pending Simpatisan confirmations (Alur 3 - FE Web)
   * Alias for getPendingPoint2
   * GET /api/kader/pending/simpatisan
   */
  async getPendingSimpatisan(req, res) {
    try {
      const pending = await kaderService.getPendingSimpatisan();

      res.json({
        success: true,
        data: pending,
        count: pending.length
      });
    } catch (error) {
      console.error('Error fetching pending simpatisan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending simpatisan',
        error: error.message
      });
    }
  }

  /**
   * Confirm Point 1 (Old Member)
   * POST /api/kader/confirm/point1/:userId
   */
  async confirmPoint1(req, res) {
    try {
      const { userId } = req.params;
      const adminId = req.user.userId;

      const user = await kaderService.confirmPoint1(userId, adminId);

      res.json({
        success: true,
        message: 'Point 1 confirmation successful',
        data: user
      });
    } catch (error) {
      console.error('Error confirming Point 1:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'User is not a kader' || error.message === 'User already confirmed for Point 1') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to confirm Point 1',
        error: error.message
      });
    }
  }

  /**
   * Confirm Point 2 (New Member - Upgrade to Kader)
   * POST /api/kader/confirm/point2/:userId
   */
  async confirmPoint2(req, res) {
    try {
      const { userId } = req.params;
      const adminId = req.user.userId;

      const user = await kaderService.confirmPoint2(userId, adminId);

      res.json({
        success: true,
        message: 'Kader baru berhasil diverifikasi dan menjadi Kader',
        data: user
      });
    } catch (error) {
      console.error('Error confirming Point 2:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === 'User is already a kader' || error.message === 'User already confirmed for Point 2') {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to confirm Point 2',
        error: error.message
      });
    }
  }

  /**
   * Confirm Simpatisan → Kader (Alur 3 - FE Web)
   * Alias for confirmPoint2
   * POST /api/kader/confirm/simpatisan/:userId
   */
  async confirmSimpatisan(req, res) {
    try {
      const { userId } = req.params;
      const adminId = req.user.userId;

      const user = await kaderService.confirmSimpatisan(userId, adminId);

      res.json({
        success: true,
        message: 'Simpatisan berhasil diverifikasi dan menjadi Kader',
        data: user
      });
    } catch (error) {
      console.error('Error confirming simpatisan:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === 'User is already a kader' || error.message === 'User already confirmed for Point 2') {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to confirm simpatisan',
        error: error.message
      });
    }
  }

  /**
   * Reject Point 1 confirmation
   * POST /api/kader/reject/point1/:userId
   */
  async rejectPoint1(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.userId;

      const result = await kaderService.rejectPoint1(userId, adminId, reason);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error rejecting Point 1:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to reject Point 1',
        error: error.message
      });
    }
  }

  /**
   * Reject Point 2 confirmation
   * POST /api/kader/reject/point2/:userId
   */
  async rejectPoint2(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.userId;

      const result = await kaderService.rejectPoint2(userId, adminId, reason);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error rejecting Point 2:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to reject Point 2',
        error: error.message
      });
    }
  }

  /**
   * Reject Simpatisan upgrade (Alur 3 - FE Web)
   * Alias for rejectPoint2
   * POST /api/kader/reject/simpatisan/:userId
   */
  async rejectSimpatisan(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.userId;

      const result = await kaderService.rejectSimpatisan(userId, adminId, reason);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error rejecting simpatisan:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to reject simpatisan',
        error: error.message
      });
    }
  }

  /**
   * Get confirmation statistics
   * GET /api/kader/stats
   */
  async getStats(req, res) {
    try {
      const stats = await kaderService.getConfirmationStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching confirmation statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  /**
   * Get confirmed users
   * GET /api/kader/confirmed
   */
  async getConfirmedUsers(req, res) {
    try {
      const { type = 'all' } = req.query;

      const users = await kaderService.getConfirmedUsers(type);

      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('Error fetching confirmed users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch confirmed users',
        error: error.message
      });
    }
  }
}

export default new KaderConfirmationController();
