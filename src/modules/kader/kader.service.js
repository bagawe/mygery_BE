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
   * Get pending Point 2 confirmations (New Members / Kader Baru)
   * Simpatisan who have applied to become kader
   * NOTE: "kader_baru" in FE docs = user with role 'simpatisan' + kaderPoint2Confirmed=false
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
            role: true,
            isActive: true
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
   * Get pending Simpatisan confirmations
   * ALIAS for getPendingPoint2 — FE Alur 3 = same as Point 2
   * Simpatisan pending upgrade to kader
   */
  async getPendingSimpatisan() {
    return this.getPendingPoint2();
  }

  /**
   * Confirm Point 1 (Old Member) - Admin confirms existing kader
   * Atomic transaction — tidak bisa double data
   */
  async confirmPoint1(userId, adminId) {
    const id = parseInt(userId);
    if (isNaN(id)) throw new Error('Invalid userId');

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        include: { roles: true }
      });

      if (!user) throw new Error('User not found');

      const hasKaderRole = user.roles.some(r => r.role === 'kader' && r.isActive);
      if (!hasKaderRole) throw new Error('User is not a kader');

      if (user.kaderPoint1Confirmed) throw new Error('User already confirmed for Point 1');

      return tx.user.update({
        where: { id },
        data: {
          kaderPoint1Confirmed: true,
          kaderPoint1ConfirmedAt: new Date(),
          kaderPoint1ConfirmedBy: parseInt(adminId)
        },
        include: {
          roles: { select: { role: true, isActive: true } }
        }
      });
    });

    const activeRoles = result.roles.filter(r => r.isActive).map(r => r.role);
    return {
      ...result,
      role: activeRoles.includes('kader') ? 'kader' : activeRoles[0] || 'simpatisan',
      activeRoles
    };
  }

  /**
   * Confirm Point 2 (New Member) - Admin upgrades simpatisan to kader
   * Atomic transaction — tidak bisa double data
   * Upsert role kader — jika sudah ada update isActive, jika belum baru create
   */
  async confirmPoint2(userId, adminId) {
    const id = parseInt(userId);
    if (isNaN(id)) throw new Error('Invalid userId');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek user exist
      const user = await tx.user.findUnique({
        where: { id },
        include: { roles: true }
      });

      if (!user) throw new Error('User not found');

      const hasKaderRole = user.roles.some(r => r.role === 'kader' && r.isActive);
      if (hasKaderRole) throw new Error('User is already a kader');

      if (user.kaderPoint2Confirmed) throw new Error('User already confirmed for Point 2');

      // 2. Deactivate role simpatisan
      await tx.userRole.updateMany({
        where: { userId: id, role: 'simpatisan' },
        data: { isActive: false }
      });

      // 3. Upsert role kader — @@unique([userId, role]) mencegah duplikat
      await tx.userRole.upsert({
        where: { userId_role: { userId: id, role: 'kader' } },
        update: { isActive: true },
        create: { userId: id, role: 'kader', isActive: true }
      });

      // 4. Update confirmation fields (UPDATE user, bukan CREATE baru)
      return tx.user.update({
        where: { id },
        data: {
          kaderPoint2Confirmed: true,
          kaderPoint2ConfirmedAt: new Date(),
          kaderPoint2ConfirmedBy: parseInt(adminId)
        },
        include: {
          roles: { select: { role: true, isActive: true } }
        }
      });
    });

    const activeRoles = result.roles.filter(r => r.isActive).map(r => r.role);
    const rolePriority = ['admin', 'kader', 'simpatisan'];
    const primaryRole = rolePriority.find(r => activeRoles.includes(r)) || activeRoles[0] || 'simpatisan';

    return {
      ...result,
      role: primaryRole,
      activeRoles
    };
  }

  /**
   * Confirm Simpatisan → Kader (Alur 3 - FE Web)
   * ALIAS for confirmPoint2
   */
  async confirmSimpatisan(userId, adminId) {
    return this.confirmPoint2(userId, adminId);
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

    // Keep them as simpatisan, log the rejection
    await prisma.logActivity.create({
      data: {
        userId: parseInt(userId),
        action: 'kader_point2_rejected',
        details: { reason, rejectedBy: adminId },
        success: false
      }
    });

    return {
      message: 'Point 2 upgrade rejected, user remains as simpatisan',
      userId: user.id,
      reason
    };
  }

  /**
   * Reject Simpatisan upgrade (Alur 3 - FE Web)
   * ALIAS for rejectPoint2
   */
  async rejectSimpatisan(userId, adminId, reason) {
    return this.rejectPoint2(userId, adminId, reason);
  }

  /**
   * Get confirmation statistics
   * Returns format matching FE web dashboard requirement
   */
  async getConfirmationStats() {
    const [
      totalKader,
      point1Confirmed,
      point1Pending,
      totalSimpatisan,
      point2Pending,
      point2Confirmed
    ] = await Promise.all([
      // Point 1: kader lama
      prisma.user.count({ 
        where: { roles: { some: { role: 'kader', isActive: true } } }
      }),
      prisma.user.count({ 
        where: { roles: { some: { role: 'kader', isActive: true } }, kaderPoint1Confirmed: true }
      }),
      prisma.user.count({ 
        where: { roles: { some: { role: 'kader', isActive: true } }, kaderPoint1Confirmed: false }
      }),
      // Point 2 / Simpatisan: simpatisan pending → kader
      prisma.user.count({ 
        where: { roles: { some: { role: 'simpatisan', isActive: true } } }
      }),
      prisma.user.count({ 
        where: { roles: { some: { role: 'simpatisan', isActive: true } }, kaderPoint2Confirmed: false }
      }),
      prisma.user.count({ 
        where: { kaderPoint2Confirmed: true }
      })
    ]);

    // Format sesuai FE web requirement (BACKEND_VERIFICATION_FLOW.md)
    return {
      // Point 1 - Kader Lama
      pending_point1: point1Pending,
      confirmed_point1: point1Confirmed,

      // Point 2 - Kader Baru (FE menyebut kader_baru = simpatisan pending upgrade)
      pending_point2: point2Pending,
      confirmed_point2: point2Confirmed,

      // Simpatisan (Alur 3 = sama dengan Point 2, alias)
      pending_simpatisan: point2Pending,
      confirmed_simpatisan: point2Confirmed,

      // Totals
      total_kader_verified: point1Confirmed + point2Confirmed,
      total_simpatisan: totalSimpatisan,
      total_kader: totalKader
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
