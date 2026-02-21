import votingService from './voting.service.js';

class VotingController {
  /**
   * ADMIN: Create new voting
   * POST /api/voting
   */
  async createVoting(req, res) {
    try {
      const adminId = req.user.id;
      const voting = await votingService.createVoting(req.body, adminId);

      res.status(201).json({
        success: true,
        message: 'Voting created successfully',
        data: voting
      });
    } catch (error) {
      console.error('Create voting error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create voting'
      });
    }
  }

  /**
   * ADMIN: Get all votings
   * GET /api/voting
   */
  async getAllVotings(req, res) {
    try {
      const filters = {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        isActive: req.query.isActive,
        search: req.query.search
      };

      const result = await votingService.getAllVotings(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all votings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch votings'
      });
    }
  }

  /**
   * ADMIN: Get voting by ID
   * GET /api/voting/:id
   */
  async getVotingById(req, res) {
    try {
      const voting = await votingService.getVotingById(req.params.id);

      res.status(200).json({
        success: true,
        data: voting
      });
    } catch (error) {
      console.error('Get voting by ID error:', error);
      const statusCode = error.message === 'Voting not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch voting'
      });
    }
  }

  /**
   * ADMIN: Update voting
   * PUT /api/voting/:id
   */
  async updateVoting(req, res) {
    try {
      const adminId = req.user.id;
      const voting = await votingService.updateVoting(req.params.id, req.body, adminId);

      res.status(200).json({
        success: true,
        message: 'Voting updated successfully',
        data: voting
      });
    } catch (error) {
      console.error('Update voting error:', error);
      const statusCode = error.message === 'Voting not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update voting'
      });
    }
  }

  /**
   * ADMIN: Extend voting deadline
   * PATCH /api/voting/:id/extend
   */
  async extendDeadline(req, res) {
    try {
      const adminId = req.user.id;
      const { deadline } = req.body;

      if (!deadline) {
        return res.status(400).json({
          success: false,
          message: 'New deadline is required'
        });
      }

      const voting = await votingService.extendDeadline(req.params.id, deadline, adminId);

      res.status(200).json({
        success: true,
        message: 'Voting deadline extended successfully',
        data: voting
      });
    } catch (error) {
      console.error('Extend deadline error:', error);
      const statusCode = error.message === 'Voting not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to extend deadline'
      });
    }
  }

  /**
   * ADMIN: Delete voting
   * DELETE /api/voting/:id
   */
  async deleteVoting(req, res) {
    try {
      await votingService.deleteVoting(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Voting deleted successfully'
      });
    } catch (error) {
      console.error('Delete voting error:', error);
      const statusCode = error.message === 'Voting not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete voting'
      });
    }
  }

  /**
   * ADMIN: Get voting results
   * GET /api/voting/:id/results
   */
  async getVotingResults(req, res) {
    try {
      const results = await votingService.getVotingResults(req.params.id);

      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Get voting results error:', error);
      const statusCode = error.message === 'Voting not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch voting results'
      });
    }
  }

  /**
   * ADMIN: Get voting statistics
   * GET /api/voting/stats
   */
  async getVotingStats(req, res) {
    try {
      const stats = await votingService.getVotingStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get voting stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch voting statistics'
      });
    }
  }

  /**
   * MOBILE: Get active votings for kader
   * GET /api/voting/active
   */
  async getActiveVotings(req, res) {
    try {
      const userId = req.user.id;
      const votings = await votingService.getActiveVotings(userId);

      res.status(200).json({
        success: true,
        data: votings,
        count: votings.length
      });
    } catch (error) {
      console.error('Get active votings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch active votings'
      });
    }
  }

  /**
   * MOBILE: Get voting detail
   * GET /api/voting/:id/detail
   */
  async getVotingDetail(req, res) {
    try {
      const userId = req.user.id;
      const voting = await votingService.getVotingDetail(req.params.id, userId);

      res.status(200).json({
        success: true,
        data: voting
      });
    } catch (error) {
      console.error('Get voting detail error:', error);
      const statusCode = error.message === 'Voting not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch voting detail'
      });
    }
  }

  /**
   * MOBILE: Submit vote (kader only)
   * POST /api/voting/:id/vote
   */
  async submitVote(req, res) {
    try {
      const userId = req.user.id;
      const votingId = req.params.id;
      const { selectedOptions } = req.body;

      if (!selectedOptions || !Array.isArray(selectedOptions)) {
        return res.status(400).json({
          success: false,
          message: 'selectedOptions must be an array'
        });
      }

      const response = await votingService.submitVote(votingId, userId, selectedOptions);

      res.status(201).json({
        success: true,
        message: 'Vote submitted successfully',
        data: response
      });
    } catch (error) {
      console.error('Submit vote error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit vote'
      });
    }
  }

  /**
   * MOBILE: Get user's voting history
   * GET /api/voting/my-votes
   */
  async getUserVotingHistory(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        page: req.query.page || 1,
        limit: req.query.limit || 20
      };

      const result = await votingService.getUserVotingHistory(userId, filters);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get user voting history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch voting history'
      });
    }
  }
}

export default new VotingController();
