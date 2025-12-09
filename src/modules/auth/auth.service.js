import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { 
  JWT_SECRET, 
  JWT_EXPIRES_IN, 
  REFRESH_TOKEN_SECRET,
  generateRefreshToken,
  getRefreshTokenExpiry 
} from '../../config/jwt.js';

const prisma = new PrismaClient();

export const AuthService = {
  async register({ name, email, username, password }, { ipAddress, userAgent } = {}) {
    const existing = await prisma.user.findFirst({ 
      where: { OR: [{ email }, { username }] }
    });
    
    if (existing) {
      await prisma.logActivity.create({ 
        data: { 
          action: 'register_failed',
          details: { reason: 'email_or_username_exists', email, username },
          ipAddress,
          userAgent,
          success: false
        }
      });
      throw new Error('Email or username already used');
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, username, password: hashed }
    });

    // Default role jobseeker
    await prisma.userRole.create({
      data: { userId: user.id, role: 'jobseeker' }
    });

    await prisma.logActivity.create({ 
      data: { 
        userId: user.id, 
        action: 'register',
        details: { role: 'jobseeker' },
        ipAddress,
        userAgent
      }
    });

    return { id: user.id, uuid: user.uuid, name: user.name, email: user.email };
  },

  async login({ identifier, password }, { ipAddress, userAgent } = {}) {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [{ email: identifier }, { username: identifier }],
        isActive: true
      }
    });

    if (!user) {
      await prisma.logActivity.create({ 
        data: { 
          action: 'login_failed',
          details: { reason: 'user_not_found', identifier },
          ipAddress,
          userAgent,
          success: false
        }
      });
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      await prisma.logActivity.create({ 
        data: { 
          userId: user.id,
          action: 'login_failed',
          details: { reason: 'invalid_password' },
          ipAddress,
          userAgent,
          success: false
        }
      });
      throw new Error('Invalid credentials');
    }

    // Update lastLogin
    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshTokenString = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    // Store refresh token in database
    const refreshToken = await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: refreshTokenExpiry
      }
    });

    await prisma.logActivity.create({ 
      data: { 
        userId: user.id, 
        action: 'login',
        details: { tokenId: refreshToken.id },
        ipAddress,
        userAgent
      }
    });

    return { 
      user: { id: user.id, uuid: user.uuid, name: user.name, email: user.email },
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: JWT_EXPIRES_IN
    };
  },

  async refreshToken(refreshTokenString, { ipAddress, userAgent } = {}) {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true }
    });

    if (!refreshToken || refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
      await prisma.logActivity.create({ 
        data: { 
          action: 'refresh_token_failed',
          details: { 
            reason: !refreshToken ? 'token_not_found' : 
                   refreshToken.isRevoked ? 'token_revoked' : 'token_expired'
          },
          ipAddress,
          userAgent,
          success: false
        }
      });
      throw new Error('Invalid refresh token');
    }

    if (!refreshToken.user.isActive) {
      await prisma.logActivity.create({ 
        data: { 
          userId: refreshToken.userId,
          action: 'refresh_token_failed',
          details: { reason: 'user_inactive' },
          ipAddress,
          userAgent,
          success: false
        }
      });
      throw new Error('User account is inactive');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: refreshToken.user.id, email: refreshToken.user.email }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    await prisma.logActivity.create({ 
      data: { 
        userId: refreshToken.userId, 
        action: 'token_refreshed',
        details: { tokenId: refreshToken.id },
        ipAddress,
        userAgent
      }
    });

    return { 
      accessToken,
      expiresIn: JWT_EXPIRES_IN
    };
  },

  async logout(refreshTokenString, { ipAddress, userAgent } = {}) {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString }
    });

    if (refreshToken) {
      await prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: { 
          isRevoked: true,
          revokedAt: new Date()
        }
      });

      await prisma.logActivity.create({ 
        data: { 
          userId: refreshToken.userId, 
          action: 'logout',
          details: { tokenId: refreshToken.id },
          ipAddress,
          userAgent
        }
      });
    }

    return { message: 'Logged out successfully' };
  },

  async revokeAllSessions(userId, { ipAddress, userAgent } = {}) {
    const result = await prisma.refreshToken.updateMany({
      where: { 
        userId,
        isRevoked: false
      },
      data: { 
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    await prisma.logActivity.create({ 
      data: { 
        userId, 
        action: 'revoke_all_sessions',
        details: { revokedTokensCount: result.count },
        ipAddress,
        userAgent
      }
    });

    return { message: `Revoked ${result.count} active sessions` };
  },

  async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Cleanup revoked tokens older than 30 days
        ]
      }
    });

    return { cleanedTokens: result.count };
  }
};
