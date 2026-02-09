import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class AgendaService {
  /**
   * Create new agenda
   */
  async createAgenda(data) {
    const { title, description, date, time, location, createdBy } = data;

    const agenda = await prisma.agenda.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        location,
        createdBy
      }
    });

    return agenda;
  }

  /**
   * Get all agendas with filters
   */
  async getAgendas(filters = {}) {
    const { page = 1, limit = 20, month, year, adminId } = filters;
    const skip = (page - 1) * limit;

    const where = {};

    // Filter by month/year
    if (month || year) {
      const startDate = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1);
      const endDate = new Date(year || new Date().getFullYear(), month || 12, 0);

      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    // Filter by creator (admin)
    if (adminId) {
      where.createdBy = parseInt(adminId);
    }

    const [agendas, total] = await Promise.all([
      prisma.agenda.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: 'asc' }
      }),
      prisma.agenda.count({ where })
    ]);

    return {
      agendas,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: skip + agendas.length < total
      }
    };
  }

  /**
   * Get public agendas for mobile (by month)
   */
  async getPublicAgendas(month) {
    // Parse month format: YYYY-MM
    const [year, monthNum] = month.split('-').map(Number);
    
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const agendas = await prisma.agenda.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    return agendas;
  }

  /**
   * Get agenda by ID
   */
  async getAgendaById(id) {
    const agenda = await prisma.agenda.findUnique({
      where: { id: parseInt(id) }
    });

    if (!agenda) {
      throw new Error('Agenda not found');
    }

    return agenda;
  }

  /**
   * Update agenda
   */
  async updateAgenda(id, data) {
    const { title, description, date, time, location } = data;

    const agenda = await prisma.agenda.findUnique({
      where: { id: parseInt(id) }
    });

    if (!agenda) {
      throw new Error('Agenda not found');
    }

    const updated = await prisma.agenda.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(location !== undefined && { location })
      }
    });

    return updated;
  }

  /**
   * Delete agenda
   */
  async deleteAgenda(id) {
    const agenda = await prisma.agenda.findUnique({
      where: { id: parseInt(id) }
    });

    if (!agenda) {
      throw new Error('Agenda not found');
    }

    await prisma.agenda.delete({
      where: { id: parseInt(id) }
    });

    return { message: 'Agenda deleted successfully' };
  }

  /**
   * Get agenda statistics
   */
  async getAgendaStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalAgendas, thisMonthAgendas, upcomingAgendas] = await Promise.all([
      prisma.agenda.count(),
      prisma.agenda.count({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      prisma.agenda.count({
        where: {
          date: {
            gte: now
          }
        }
      })
    ]);

    return {
      total: totalAgendas,
      thisMonth: thisMonthAgendas,
      upcoming: upcomingAgendas
    };
  }
}

export default new AgendaService();
