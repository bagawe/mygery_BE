import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../../utils/password.js';

const prisma = new PrismaClient();

export const UserService = {
  // Get user by ID (for current user profile)
  async getById(id) {
    return prisma.user.findUnique({ 
      where: { id }, 
      include: { 
        roles: true
      }
    });
  },

  // Get user by UUID
  async getByUuid(uuid) {
    return prisma.user.findUnique({ 
      where: { uuid }, 
      include: { 
        roles: true
      }
    });
  },

  // Update user by ID (for current user profile)
  async updateById(id, payload) {
    const { 
      name, 
      username, 
      email,
      phone,
      bio,
      nik,
      jenisKelamin,
      statusKawin,
      tempatLahir,
      tanggalLahir,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      rt,
      rw,
      jalan,
      pekerjaan,
      pendidikan,
      underbow,
      kegiatan,
      fotoKtp,
      fotoProfil
    } = payload;
    
    // Build data object with only provided fields
    const data = {
      updatedAt: new Date()
    };
    
    // Basic fields
    if (name !== undefined) data.name = name;
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (bio !== undefined) data.bio = bio;
    
    // Identity fields
    if (nik !== undefined) data.nik = nik;
    if (jenisKelamin !== undefined) data.jenisKelamin = jenisKelamin;
    if (statusKawin !== undefined) data.statusKawin = statusKawin;
    if (tempatLahir !== undefined) data.tempatLahir = tempatLahir;
    if (tanggalLahir !== undefined) data.tanggalLahir = tanggalLahir;
    
    // Address fields
    if (provinsi !== undefined) data.provinsi = provinsi;
    if (kota !== undefined) data.kota = kota;
    if (kecamatan !== undefined) data.kecamatan = kecamatan;
    if (kelurahan !== undefined) data.kelurahan = kelurahan;
    if (rt !== undefined) data.rt = rt;
    if (rw !== undefined) data.rw = rw;
    if (jalan !== undefined) data.jalan = jalan;
    
    // Profession & Education
    if (pekerjaan !== undefined) data.pekerjaan = pekerjaan;
    if (pendidikan !== undefined) data.pendidikan = pendidikan;
    
    // Political affiliation
    if (underbow !== undefined) data.underbow = underbow;
    if (kegiatan !== undefined) data.kegiatan = kegiatan;
    
    // Photos
    if (fotoKtp !== undefined) data.fotoKtp = fotoKtp;
    if (fotoProfil !== undefined) data.fotoProfil = fotoProfil;
    
    return prisma.user.update({
      where: { id },
      data,
      include: { 
        roles: true
      }
    });
  },

  // Update user by UUID (for admin management)
  async updateByUuid(uuid, payload) {
    const { 
      name, 
      username, 
      email, 
      isActive,
      phone,
      bio,
      nik,
      jenisKelamin,
      statusKawin,
      tempatLahir,
      tanggalLahir,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      rt,
      rw,
      jalan,
      pekerjaan,
      pendidikan,
      underbow,
      kegiatan,
      fotoKtp,
      fotoProfil
    } = payload;
    
    // Build data object with only provided fields
    const data = {
      updatedAt: new Date()
    };
    
    // Basic fields
    if (name !== undefined) data.name = name;
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email;
    if (isActive !== undefined) data.isActive = isActive;
    if (phone !== undefined) data.phone = phone;
    if (bio !== undefined) data.bio = bio;
    
    // Identity fields
    if (nik !== undefined) data.nik = nik;
    if (jenisKelamin !== undefined) data.jenisKelamin = jenisKelamin;
    if (statusKawin !== undefined) data.statusKawin = statusKawin;
    if (tempatLahir !== undefined) data.tempatLahir = tempatLahir;
    if (tanggalLahir !== undefined) data.tanggalLahir = tanggalLahir;
    
    // Address fields
    if (provinsi !== undefined) data.provinsi = provinsi;
    if (kota !== undefined) data.kota = kota;
    if (kecamatan !== undefined) data.kecamatan = kecamatan;
    if (kelurahan !== undefined) data.kelurahan = kelurahan;
    if (rt !== undefined) data.rt = rt;
    if (rw !== undefined) data.rw = rw;
    if (jalan !== undefined) data.jalan = jalan;
    
    // Profession & Education
    if (pekerjaan !== undefined) data.pekerjaan = pekerjaan;
    if (pendidikan !== undefined) data.pendidikan = pendidikan;
    
    // Political affiliation
    if (underbow !== undefined) data.underbow = underbow;
    if (kegiatan !== undefined) data.kegiatan = kegiatan;
    
    // Photos
    if (fotoKtp !== undefined) data.fotoKtp = fotoKtp;
    if (fotoProfil !== undefined) data.fotoProfil = fotoProfil;
    
    return prisma.user.update({
      where: { uuid },
      data,
      include: { 
        roles: true
      }
    });
  },

  // Get users with pagination and filters (for admin)
  async getUsers(query) {
    const { page = 1, limit = 10, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};
    
    // Search filter (name, email, username)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Role filter
    if (role) {
      where.roles = {
        some: {
          role: role
        }
      };
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          username: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          roles: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total
    };
  },

  // Check if email or username already exists
  async checkExistingUser(email, username, excludeUserId = null) {
    const where = {
      OR: []
    };

    if (email) {
      where.OR.push({ email });
    }

    if (username) {
      where.OR.push({ username });
    }

    // Exclude current user from check
    if (excludeUserId) {
      where.id = {
        not: excludeUserId
      };
    }

    // If no email or username provided, return null
    if (where.OR.length === 0) {
      return null;
    }

    return prisma.user.findFirst({ where });
  },

  // Delete user by UUID
  async deleteByUuid(uuid) {
    // Use transaction to ensure data consistency
    return prisma.$transaction(async (tx) => {
      // First, delete user roles
      await tx.userRole.deleteMany({
        where: {
          user: {
            uuid
          }
        }
      });

      // Delete refresh tokens
      await tx.refreshToken.deleteMany({
        where: {
          user: {
            uuid
          }
        }
      });

      // Delete log activities (optional, you might want to keep these for audit)
      // await tx.logActivity.deleteMany({
      //   where: {
      //     userId: user.id
      //   }
      // });

      // Finally, delete the user
      return tx.user.delete({
        where: { uuid }
      });
    });
  },

  // Change password
  async changePassword(userId, oldPassword, newPassword) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error('Old password is incorrect');
    }

    // Check if new password is different from old password
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('New password must be different from old password');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Optional: Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { 
        userId: userId,
        isRevoked: false
      },
      data: { 
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    return true;
  },

  /**
   * Search users by username or name
   * Exclude blocked users and optionally exclude self
   */
  async searchUsers(currentUserId, query, limit = 20, excludeSelf = true) {
    if (!query || query.trim().length === 0) {
      throw new Error("Query parameter 'q' is required");
    }

    // Get list of blocked user IDs (both directions)
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: currentUserId },
          { blockedUserId: currentUserId }
        ]
      },
      select: {
        blockerId: true,
        blockedUserId: true
      }
    });

    const blockedUserIds = new Set();
    blockedUsers.forEach(block => {
      if (block.blockerId === currentUserId) {
        blockedUserIds.add(block.blockedUserId);
      } else {
        blockedUserIds.add(block.blockerId);
      }
    });

    // Build where clause
    const whereClause = {
      AND: [
        {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } }
          ]
        },
        {
          isActive: true
        }
      ]
    };

    // Exclude self if needed
    if (excludeSelf) {
      whereClause.AND.push({ id: { not: currentUserId } });
    }

    // Exclude blocked users
    if (blockedUserIds.size > 0) {
      whereClause.AND.push({ 
        id: { notIn: Array.from(blockedUserIds) } 
      });
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        uuid: true,
        username: true,
        name: true,
        fotoProfil: true,
        email: true,
        bio: true
      },
      take: limit
    });

    return users;
  },

  /**
   * Block a user
   */
  async blockUser(blockerId, blockedUserId) {
    if (blockerId === blockedUserId) {
      throw new Error('Cannot block yourself');
    }

    // Check if already blocked
    const existing = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId,
          blockedUserId
        }
      }
    });

    if (existing) {
      throw new Error('User already blocked');
    }

    const block = await prisma.userBlock.create({
      data: {
        blockerId,
        blockedUserId
      }
    });

    return block;
  },

  /**
   * Unblock a user
   */
  async unblockUser(blockerId, blockedUserId) {
    const result = await prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedUserId
      }
    });

    if (result.count === 0) {
      throw new Error('User is not blocked');
    }

    return true;
  },

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(blockerId) {
    const blocks = await prisma.userBlock.findMany({
      where: {
        blockerId
      },
      include: {
        blockedUser: {
          select: {
            id: true,
            uuid: true,
            username: true,
            name: true,
            fotoProfil: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return blocks.map(block => ({
      ...block.blockedUser,
      blockedAt: block.createdAt
    }));
  },

  /**
   * Check block status between two users
   */
  async checkBlockStatus(userId, otherUserId) {
    const [blockedByMe, blockingMe] = await Promise.all([
      prisma.userBlock.findFirst({
        where: {
          blockerId: userId,
          blockedUserId: otherUserId
        }
      }),
      prisma.userBlock.findFirst({
        where: {
          blockerId: otherUserId,
          blockedUserId: userId
        }
      })
    ]);

    return {
      isBlockedByMe: !!blockedByMe,
      isBlockingMe: !!blockingMe
    };
  },
};
