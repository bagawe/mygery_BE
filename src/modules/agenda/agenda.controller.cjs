const agendaService = require('./agenda.service.cjs');

class AgendaController {
  /**
   * Create agenda (Admin only)
   */
  async createAgenda(req, res) {
    try {
      const { title, description, date, time, location } = req.body;
      const createdBy = req.user.id;

      if (!title || !date) {
        return res.status(400).json({
          success: false,
          message: 'Title and date are required'
        });
      }

      const agenda = await agendaService.createAgenda({
        title,
        description,
        date,
        time,
        location,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Agenda created successfully',
        data: agenda
      });
    } catch (error) {
      console.error('Error creating agenda:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create agenda'
      });
    }
  }

  /**
   * Get all agendas (Admin only)
   */
  async getAgendas(req, res) {
    try {
      const { page, limit, month, year } = req.query;

      const result = await agendaService.getAgendas({
        page,
        limit,
        month,
        year,
        adminId: req.user.id
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching agendas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch agendas'
      });
    }
  }

  /**
   * Get public agendas for mobile
   */
  async getPublicAgendas(req, res) {
    try {
      const { month } = req.query;

      if (!month) {
        return res.status(400).json({
          success: false,
          message: 'Month parameter is required (format: YYYY-MM)'
        });
      }

      const agendas = await agendaService.getPublicAgendas(month);

      res.json({
        success: true,
        data: {
          agendas,
          month
        }
      });
    } catch (error) {
      console.error('Error fetching public agendas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch agendas'
      });
    }
  }

  /**
   * Get agenda by ID (Admin only)
   */
  async getAgendaById(req, res) {
    try {
      const { id } = req.params;

      const agenda = await agendaService.getAgendaById(id);

      res.json({
        success: true,
        data: agenda
      });
    } catch (error) {
      console.error('Error fetching agenda:', error);
      const statusCode = error.message === 'Agenda not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch agenda'
      });
    }
  }

  /**
   * Update agenda (Admin only)
   */
  async updateAgenda(req, res) {
    try {
      const { id } = req.params;
      const { title, description, date, time, location } = req.body;

      const agenda = await agendaService.updateAgenda(id, {
        title,
        description,
        date,
        time,
        location
      });

      res.json({
        success: true,
        message: 'Agenda updated successfully',
        data: agenda
      });
    } catch (error) {
      console.error('Error updating agenda:', error);
      const statusCode = error.message === 'Agenda not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update agenda'
      });
    }
  }

  /**
   * Delete agenda (Admin only)
   */
  async deleteAgenda(req, res) {
    try {
      const { id } = req.params;

      await agendaService.deleteAgenda(id);

      res.json({
        success: true,
        message: 'Agenda deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting agenda:', error);
      const statusCode = error.message === 'Agenda not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete agenda'
      });
    }
  }

  /**
   * Get agenda statistics (Admin only)
   */
  async getStats(req, res) {
    try {
      const stats = await agendaService.getAgendaStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching agenda stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch agenda statistics'
      });
    }
  }
}

module.exports = new AgendaController();
