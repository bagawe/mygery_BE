import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class HistoryService {
  /**
   * Get user history with pagination
   */
  async getUserHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [history, total] = await Promise.all([
        prisma.userHistory.findMany({
          where: {
            userId
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            type: true,
            description: true,
            postId: true, // Include postId for clickable mentions
            metadata: true,
            createdAt: true
          }
        }),
        prisma.userHistory.count({
          where: {
            userId
          }
        })
      ]);

      return {
        data: history,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get user history service error:', error);
      throw error;
    }
  }

  /**
   * Create history entry
   */
  async createHistory(userId, type, description, postId = null, metadata = null) {
    try {
      const history = await prisma.userHistory.create({
        data: {
          userId,
          type,
          description,
          postId,
          metadata
        }
      });

      return history;
    } catch (error) {
      console.error('Create history service error:', error);
      throw error;
    }
  }

  /**
   * Delete history entry
   */
  async deleteHistory(historyId, userId) {
    try {
      // Check if history belongs to user
      const history = await prisma.userHistory.findFirst({
        where: {
          id: historyId,
          userId
        }
      });

      if (!history) {
        throw new Error('History not found or unauthorized');
      }

      await prisma.userHistory.delete({
        where: {
          id: historyId
        }
      });
    } catch (error) {
      console.error('Delete history service error:', error);
      throw error;
    }
  }

  /**
   * Clear all user history
   */
  async clearUserHistory(userId) {
    try {
      await prisma.userHistory.deleteMany({
        where: {
          userId
        }
      });
    } catch (error) {
      console.error('Clear user history service error:', error);
      throw error;
    }
  }

  /**
   * Get history by type
   */
  async getHistoryByType(userId, type, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [history, total] = await Promise.all([
        prisma.userHistory.findMany({
          where: {
            userId,
            type
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            type: true,
            description: true,
            postId: true,
            metadata: true,
            createdAt: true
          }
        }),
        prisma.userHistory.count({
          where: {
            userId,
            type
          }
        })
      ]);

      return {
        data: history,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get history by type service error:', error);
      throw error;
    }
  }
}

export default new HistoryService();
