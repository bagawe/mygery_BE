import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class KaderConfirmationService {
  /**
   * Get pending kader confirmations (Point 1 - Old Members)
   * Users who are already kader but not yet confirmed by admin
   */
  async getPendingPoint1() {
    const pendingKader = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: 'kader',
            isActive: true
          }
        },
        kaderPoint1Confirmed: false
      },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        kaderPoint1Confirmed: true,
        kaderPoint1ConfirmedAt: true,
        roles: {
          select: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return pendingKader;
  }

  /**
   * Get pending Point 2 confirmations (New Members)
   * Simpatisan who have applied to become kader
   */
  async getPendingPoint2() {
    const pendingUpgrade = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: 'simpatisan',
            isActive: true
          }
        },
        kaderPoint2Confirmed: false
      },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        kaderPoint2Confirmed: true,
        kaderPoint2ConfirmedAt: true,
        roles: {
          select: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return pendingUpgrade;
  }

  /**
   * Confirm Point 1 (Old Member) - Admin confirms existing kader
   */
  async confirmPoint1(userId, adminId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        roles: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasKaderRole = user.roles.some(r => r.role === 'kader' && r.isActive);
    if (!hasKaderRole) {
      throw new Error('User is not a kader');
    }

    if (user.kaderPoint1Confirmed) {
      throw new Error('User already confirmed for Point 1');
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        kaderPoint1Confirmed: true,
        kaderPoint1ConfirmedAt: new Date(),
        kaderPoint1ConfirmedBy: parseInt(adminId)
      }
    });

    return updated;
  }

  /**
   * Confirm Point 2 (New Member) - Admin upgrades simpatisan to kader
   */
  async confirmPoint2(userId, adminId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        roles: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasKaderRole = user.roles.some(r => r.role === 'kader' && r.isActive);
    if (hasKaderRole) {
      throw new Error('User is already a kader');
    }

    if (user.kaderPoint2Confirmed) {
      throw new Error('User already confirmed for Point 2');
    }

    // Upgrade simpatisan to kader - Create new kader role
    await prisma.userRole.create({
      data: {
        userId: parseInt(userId),
        role: 'kader',
        isActive: true
      }
    });
    
    // Update confirmation fields
    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        kaderPoint2Confirmed: true,
        kaderPoint2ConfirmedAt: new Date(),
        kaderPoint2ConfirmedBy: parseInt(adminId)
      },
      include: {
        roles: true
      }
    });

    return updated;
  }

  /**
   * Reject Point 1 confirmation
   */
  async rejectPoint1(userId, adminId, reason) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        roles: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasKaderRole = user.roles.some(r => r.role === 'kader' && r.isActive);
    if (!hasKaderRole) {
      throw new Error('User is not a kader');
    }

    // Keep them as kader but mark as rejected for Point 1
    // In real scenario, you might want to add a rejection tracking table
    return {
      message: 'Point 1 confirmation rejected',
      userId: user.id,
      reason
    };
  }

  /**
   * Reject Point 2 confirmation (keep as simpatisan)
   */
  async rejectPoint2(userId, adminId, reason) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        roles: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasSimpatisanRole = user.roles.some(r => r.role === 'simpatisan' && r.isActive);
    if (!hasSimpatisanRole) {
      throw new Error('User is not a simpatisan');
    }

    // Keep them as simpatisan
    return {
      message: 'Point 2 upgrade rejected',
      userId: user.id,
      reason
    };
  }

  /**
   * Get confirmation statistics
   */
  async getConfirmationStats() {
    const [
      totalKader,
      point1Confirmed,
      point1Pending,
      totalSimpatisan,
      point2Applied,
      point2Confirmed
    ] = await Promise.all([
      prisma.user.count({ 
        where: { 
          roles: { some: { role: 'kader', isActive: true } }
        }
      }),
      prisma.user.count({ 
        where: { 
          roles: { some: { role: 'kader', isActive: true } },
          kaderPoint1Confirmed: true
        }
      }),
      prisma.user.count({ 
        where: { 
          roles: { some: { role: 'kader', isActive: true } },
          kaderPoint1Confirmed: false
        }
      }),
      prisma.user.count({ 
        where: { 
          roles: { some: { role: 'simpatisan', isActive: true } }
        }
      }),
      prisma.user.count({ 
        where: { 
          roles: { some: { role: 'simpatisan', isActive: true } },
          kaderPoint2Confirmed: false
        }
      }),
      prisma.user.count({ 
        where: { 
          kaderPoint2Confirmed: true
        }
      })
    ]);

    return {
      point1: {
        totalKader,
        confirmed: point1Confirmed,
        pending: point1Pending
      },
      point2: {
        totalSimpatisan,
        applied: point2Applied,
        confirmed: point2Confirmed
      }
    };
  }

  /**
   * Get confirmed users (both Point 1 and Point 2)
   */
  async getConfirmedUsers(type = 'all') {
    const where = {};

    if (type === 'point1') {
      where.kaderPoint1Confirmed = true;
    } else if (type === 'point2') {
      where.kaderPoint2Confirmed = true;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        phone: true,
        kaderPoint1Confirmed: true,
        kaderPoint1ConfirmedAt: true,
        kaderPoint2Confirmed: true,
        kaderPoint2ConfirmedAt: true,
        roles: {
          select: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users;
  }
}

export default new KaderConfirmationService();
