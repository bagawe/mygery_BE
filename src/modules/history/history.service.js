import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class HistoryService {
  /**
   * Catat riwayat aktivitas user
   */
  async create(userId, type, description, metadata) {
    const entry = await prisma.userHistory.create({
      data: {
        userId,
        type,
        description,
        metadata
      }
    });
    return entry;
  }

  /**
   * Ambil riwayat aktivitas user (paginasi)
   */
  async getUserHistory(userId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.userHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.userHistory.count({ where: { userId } })
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + data.length < total
      }
    };
  }
}

export default new HistoryService();
