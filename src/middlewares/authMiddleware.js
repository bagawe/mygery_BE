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
      include: { roles: true }
    });

    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Attach minimal user info and role names
    const roleNames = Array.isArray(user.roles) ? user.roles.map(r => r.name || r.role) : [];

    req.user = { 
      id: user.id, 
      uuid: user.uuid, 
      email: user.email,
      roles: roleNames
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
