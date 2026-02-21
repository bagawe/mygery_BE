const announcementService = require('./announcement.service.cjs');

class AnnouncementController {
  /**
   * Create new announcement (Admin only)
   * POST /api/announcement
   */
  async createAnnouncement(req, res) {
    try {
      const { title, content, imageUrl, type } = req.body;

      // Validation
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      // Validate type if provided
      const validTypes = ['sambutan', 'pengumuman', 'download', 'artikel'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const announcement = await announcementService.createAnnouncement({
        title,
        content,
        imageUrl,
        type,
        createdBy: req.user.userId
      });

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: announcement
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create announcement',
        error: error.message
      });
    }
  }

  /**
   * Get all announcements with filters (Admin)
   * GET /api/announcement
   */
  async getAnnouncements(req, res) {
    try {
      const { page, limit, type, isActive } = req.query;

      const result = await announcementService.getAnnouncements({
        page,
        limit,
        type,
        isActive,
        adminId: req.query.adminId
      });

      res.json({
        success: true,
        data: result.announcements,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcements',
        error: error.message
      });
    }
  }

  /**
   * Get public announcements for mobile
   * GET /api/announcement/public
   */
  async getPublicAnnouncements(req, res) {
    try {
      const { type } = req.query;

      const announcements = await announcementService.getPublicAnnouncements(type);

      res.json({
        success: true,
        data: announcements
      });
    } catch (error) {
      console.error('Error fetching public announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcements',
        error: error.message
      });
    }
  }

  /**
   * Get announcement by ID (Admin)
   * GET /api/announcement/:id
   */
  async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;

      const announcement = await announcementService.getAnnouncementById(id);

      res.json({
        success: true,
        data: announcement
      });
    } catch (error) {
      console.error('Error fetching announcement:', error);
      
      if (error.message === 'Announcement not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcement',
        error: error.message
      });
    }
  }

  /**
   * Update announcement (Admin only)
   * PUT /api/announcement/:id
   */
  async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const { title, content, imageUrl, type, isActive } = req.body;

      const announcement = await announcementService.updateAnnouncement(id, {
        title,
        content,
        imageUrl,
        type,
        isActive
      });

      res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: announcement
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      
      if (error.message === 'Announcement not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update announcement',
        error: error.message
      });
    }
  }

  /**
   * Delete announcement (Admin only)
   * DELETE /api/announcement/:id
   */
  async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;

      const result = await announcementService.deleteAnnouncement(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      
      if (error.message === 'Announcement not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete announcement',
        error: error.message
      });
    }
  }

  /**
   * Toggle announcement active status (Admin only)
   * PATCH /api/announcement/:id/toggle
   */
  async toggleActive(req, res) {
    try {
      const { id } = req.params;

      const announcement = await announcementService.toggleActive(id);

      res.json({
        success: true,
        message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
        data: announcement
      });
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      
      if (error.message === 'Announcement not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to toggle announcement status',
        error: error.message
      });
    }
  }

  /**
   * Get announcement statistics (Admin only)
   * GET /api/announcement/stats
   */
  async getStats(req, res) {
    try {
      const stats = await announcementService.getAnnouncementStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching announcement statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }
}

module.exports = new AnnouncementController();
