import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class KTAService {
  /**
   * Get user's KTA status
   */
  async getMyStatus(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          uuid: true,
          name: true,
          fotoProfil: true,
          tanggalLahir: true,
          jenisKelamin: true,
          jalan: true,
          rt: true,
          rw: true,
          kelurahan: true,
          kecamatan: true,
          kota: true,
          provinsi: true,
          phone: true,
          ktaVerified: true,
          ktaVerifiedAt: true,
          ktaVerifiedBy: true,
          createdAt: true,
          roles: {
            select: {
              role: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Format alamat lengkap
      const alamatParts = [
        user.jalan,
        user.rt ? `RT ${user.rt}` : null,
        user.rw ? `RW ${user.rw}` : null,
        user.kelurahan,
        user.kecamatan,
        user.kota,
        user.provinsi
      ].filter(Boolean);
      
      const alamatLengkap = alamatParts.length > 0 ? alamatParts.join(', ') : null;

      return {
        user: {
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          fotoProfil: user.fotoProfil,
          tanggalLahir: user.tanggalLahir,
          jenisKelamin: user.jenisKelamin,
          alamatLengkap,
          phone: user.phone,
          roles: user.roles
        },
        kta: {
          verified: user.ktaVerified,
          verifiedAt: user.ktaVerifiedAt,
          verifiedBy: user.ktaVerifiedBy,
          canPrint: user.ktaVerified, // Hanya bisa print jika sudah verified
          cardNumber: `KTA-${new Date().getFullYear()}-${String(user.id).padStart(6, '0')}`,
          issuedDate: user.createdAt,
          message: user.ktaVerified 
            ? 'KTA Anda telah diverifikasi' 
            : 'KTA Anda sedang dalam proses verifikasi admin'
        }
      };
    } catch (error) {
      console.error('Get KTA status service error:', error);
      throw error;
    }
  }

  /**
   * Admin: Verify user's KTA
   */
  async verifyKTA(adminId, userId, verified, notes = null) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, ktaVerified: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update verification status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ktaVerified: verified,
          ktaVerifiedAt: verified ? new Date() : null,
          ktaVerifiedBy: verified ? adminId : null
        },
        select: {
          id: true,
          name: true,
          ktaVerified: true,
          ktaVerifiedAt: true,
          ktaVerifiedBy: true
        }
      });

      // Log activity
      await prisma.logActivity.create({
        data: {
          userId: adminId,
          action: verified ? 'kta_verified' : 'kta_unverified',
          details: {
            targetUserId: userId,
            targetUserName: user.name,
            notes: notes,
            previousStatus: user.ktaVerified
          }
        }
      });

      return {
        userId: updatedUser.id,
        name: updatedUser.name,
        ktaVerified: updatedUser.ktaVerified,
        verifiedAt: updatedUser.ktaVerifiedAt,
        verifiedBy: updatedUser.ktaVerifiedBy
      };
    } catch (error) {
      console.error('Verify KTA service error:', error);
      throw error;
    }
  }

  /**
   * Admin: Get list of users for KTA verification
   */
  async getUsersList(filters = {}) {
    try {
      const { 
        status = 'all', 
        search = '', 
        page = 1, 
        limit = 20 
      } = filters;

      // Build where clause
      const whereClause = {};

      // Filter by verification status
      if (status === 'verified') {
        whereClause.ktaVerified = true;
      } else if (status === 'unverified') {
        whereClause.ktaVerified = false;
      }

      // Search by name
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const take = parseInt(limit);

      // Get users
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            uuid: true,
            name: true,
            email: true,
            fotoProfil: true,
            phone: true,
            ktaVerified: true,
            ktaVerifiedAt: true,
            ktaVerifiedBy: true,
            createdAt: true,
            roles: {
              select: {
                role: true
              }
            }
          },
          skip,
          take,
          orderBy: [
            { ktaVerified: 'asc' }, // Unverified first
            { createdAt: 'desc' }
          ]
        }),
        prisma.user.count({ where: whereClause })
      ]);

      // Get verifier names for verified users
      const verifierIds = users
        .filter(u => u.ktaVerifiedBy)
        .map(u => u.ktaVerifiedBy);

      const verifiers = verifierIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: verifierIds } },
        select: { id: true, name: true }
      }) : [];

      const verifierMap = Object.fromEntries(
        verifiers.map(v => [v.id, v.name])
      );

      // Format response
      const formattedUsers = users.map(user => ({
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        fotoProfil: user.fotoProfil,
        phone: user.phone,
        roles: user.roles,
        ktaVerified: user.ktaVerified,
        ktaVerifiedAt: user.ktaVerifiedAt,
        verifiedByName: user.ktaVerifiedBy ? verifierMap[user.ktaVerifiedBy] : null,
        memberSince: user.createdAt
      }));

      return {
        users: formattedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          totalItems: total,
          itemsPerPage: take
        }
      };
    } catch (error) {
      console.error('Get users list service error:', error);
      throw error;
    }
  }

  /**
   * Verify QR code from KTA
   */
  async verifyQR(qrData) {
    try {
      // QR data could be user ID or UUID
      const userId = parseInt(qrData);
      
      let user;
      if (!isNaN(userId)) {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            uuid: true,
            name: true,
            fotoProfil: true,
            ktaVerified: true,
            ktaVerifiedAt: true,
            isActive: true,
            createdAt: true,
            roles: {
              select: {
                role: true
              }
            }
          }
        });
      } else {
        // Try UUID
        user = await prisma.user.findUnique({
          where: { uuid: qrData },
          select: {
            id: true,
            uuid: true,
            name: true,
            fotoProfil: true,
            ktaVerified: true,
            ktaVerifiedAt: true,
            isActive: true,
            createdAt: true,
            roles: {
              select: {
                role: true
              }
            }
          }
        });
      }

      if (!user || !user.isActive) {
        return {
          valid: false,
          message: 'User tidak ditemukan atau tidak aktif'
        };
      }

      return {
        valid: true,
        verified: user.ktaVerified,
        user: {
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          fotoProfil: user.fotoProfil,
          roles: user.roles,
          memberSince: user.createdAt
        },
        kta: {
          verifiedAt: user.ktaVerifiedAt,
          status: user.isActive ? 'active' : 'inactive',
          message: user.ktaVerified 
            ? 'KTA valid dan terverifikasi' 
            : 'KTA valid tapi belum diverifikasi admin'
        }
      };
    } catch (error) {
      console.error('Verify QR service error:', error);
      throw error;
    }
  }

  /**
   * Get KTA statistics (admin only)
   */
  async getStats() {
    try {
      const [totalUsers, verifiedUsers, unverifiedUsers, verifiedToday] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { ktaVerified: true } }),
        prisma.user.count({ where: { ktaVerified: false } }),
        prisma.user.count({
          where: {
            ktaVerified: true,
            ktaVerifiedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      // Get verification by role
      const usersByRole = await prisma.user.groupBy({
        by: ['ktaVerified'],
        _count: true
      });

      return {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        verifiedToday,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0,
        pendingVerification: unverifiedUsers
      };
    } catch (error) {
      console.error('Get KTA stats service error:', error);
      throw error;
    }
  }
}

export default new KTAService();
