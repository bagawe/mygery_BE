import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // load user and roles
    const user = await prisma.user.findUnique({ 
      where: { id: payload.userId },
      include: { 
        roles: {
          where: { isActive: true }  // ← FIX: hanya ambil role yang aktif
        }
      }
    });

    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Attach minimal user info and role names (hanya isActive=true)
    const roleNames = Array.isArray(user.roles) ? user.roles.map(r => r.role) : [];

    // Prioritas role: admin > kader > simpatisan
    const rolePriority = ['admin', 'kader', 'simpatisan'];
    const primaryRole = rolePriority.find(r => roleNames.includes(r)) || roleNames[0] || 'simpatisan';

    req.user = { 
      id: user.id,
      userId: user.id,
      uuid: user.uuid, 
      email: user.email,
      roles: roleNames,
      role: primaryRole  // ← FIX: role prioritas tertinggi yang aktif
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export const authenticateToken = authMiddleware;