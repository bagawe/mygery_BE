import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class AnnouncementService {
  /**
   * Create new announcement
   */
  async createAnnouncement(data) {
    const { title, content, imageUrl, type, createdBy } = data;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        imageUrl,
        type: type || 'pengumuman',
        isActive: true,
        createdBy
      }
    });

    return announcement;
  }

  /**
   * Get all announcements with filters (Admin)
   */
  async getAnnouncements(filters = {}) {
    const { page = 1, limit = 20, type, isActive, adminId } = filters;
    const skip = (page - 1) * limit;

    const where = {};

    if (type && type !== 'all') {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (adminId) {
      where.createdBy = parseInt(adminId);
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.announcement.count({ where })
    ]);

    return {
      announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: skip + announcements.length < total
      }
    };
  }

  /**
   * Get public announcements for mobile (only active)
   */
  async getPublicAnnouncements(type = null) {
    const where = {
      isActive: true
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for mobile
    });

    return announcements;
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id) {
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    return announcement;
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(id, data) {
    const { title, content, imageUrl, type, isActive } = data;

    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    const updated = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true })
      }
    });

    return updated;
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id) {
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    await prisma.announcement.delete({
      where: { id: parseInt(id) }
    });

    return { message: 'Announcement deleted successfully' };
  }

  /**
   * Toggle announcement active status
   */
  async toggleActive(id) {
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    const updated = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: {
        isActive: !announcement.isActive
      }
    });

    return updated;
  }

  /**
   * Get announcement statistics
   */
  async getAnnouncementStats() {
    const [total, active, byType] = await Promise.all([
      prisma.announcement.count(),
      prisma.announcement.count({ where: { isActive: true } }),
      prisma.announcement.groupBy({
        by: ['type'],
        _count: {
          id: true
        }
      })
    ]);

    const typeStats = byType.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {});

    return {
      total,
      active,
      inactive: total - active,
      byType: typeStats
    };
  }
}

export default new AnnouncementService();
