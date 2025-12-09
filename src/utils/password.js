import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
