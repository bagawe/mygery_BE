import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  const adminEmail = 'admin@example.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin already exists. Skipping seed.');
    return;
  }

  const hashed = await bcrypt.hash('Admin123!', saltRounds);

  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      username: 'admin',
      password: hashed,
      isActive: true,
      roles: {
        create: {
          role: 'admin',
          profileData: {}
        }
      }
    },
    include: { roles: true }
  });

  await prisma.logActivity.create({
    data: {
      userId: user.id,
      action: 'seed: create admin',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script'
    }
  });

  console.log('Seeded admin:', user.email);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
