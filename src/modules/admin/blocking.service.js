import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class AdminBlockingService {
  /**
   * Block user by device IP
   */
  async blockUser(userId, adminId, reason, deviceIp = null) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      throw new Error('Cannot block admin users');
    }

    if (user.isBlocked) {
      throw new Error('User is already blocked');
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedByAdmin: parseInt(adminId),
        blockReason: reason,
        ...(deviceIp && { deviceIp })
      }
    });

    return updated;
  }

  /**
   * Unblock user
   */
  async unblockUser(userId, adminId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isBlocked) {
      throw new Error('User is not blocked');
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedByAdmin: null,
        blockReason: null
      }
    });

    return updated;
  }

  /**
   * Get all blocked users
   */
  async getBlockedUsers() {
    const blockedUsers = await prisma.user.findMany({
      where: {
        isBlocked: true
      },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        phone: true,
        deviceIp: true,
        isBlocked: true,
        blockedAt: true,
        blockedByAdmin: true,
        blockReason: true,
        roles: {
          select: {
            role: true
          }
        }
      },
      orderBy: {
        blockedAt: 'desc'
      }
    });

    return blockedUsers;
  }

  /**
   * Check if user or device IP is blocked
   */
  async isUserBlocked(userId, deviceIp = null) {
    // Check by user ID
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });

      if (user && user.isBlocked) {
        return {
          blocked: true,
          reason: user.blockReason,
          blockedAt: user.blockedAt
        };
      }
    }

    // Check by device IP
    if (deviceIp) {
      const blockedByIp = await prisma.user.findFirst({
        where: {
          deviceIp,
          isBlocked: true
        }
      });

      if (blockedByIp) {
        return {
          blocked: true,
          reason: 'Device IP is blocked',
          blockedAt: blockedByIp.blockedAt
        };
      }
    }

    return {
      blocked: false
    };
  }

  /**
   * Update user's device IP
   */
  async updateDeviceIp(userId, deviceIp) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        deviceIp
      }
    });

    return updated;
  }

  /**
   * Get blocking statistics
   */
  async getBlockingStats() {
    const [totalBlocked, blockedByRole] = await Promise.all([
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { isBlocked: true },
        _count: {
          id: true
        }
      })
    ]);

    const roleStats = blockedByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {});

    return {
      totalBlocked,
      byRole: roleStats
    };
  }
}

export default new AdminBlockingService();
