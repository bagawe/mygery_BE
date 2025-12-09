import { PrismaClient } from '@prisma/client';
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
    const { name, username, email } = payload;
    return prisma.user.update({
      where: { id },
      data: { 
        name, 
        username, 
        email,
        updatedAt: new Date()
      },
      include: { 
        roles: true
      }
    });
  },

  // Update user by UUID (for admin management)
  async updateByUuid(uuid, payload) {
    const { name, username, email, isActive } = payload;
    return prisma.user.update({
      where: { uuid },
      data: { 
        name, 
        username, 
        email, 
        isActive,
        updatedAt: new Date()
      },
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
  }
};
