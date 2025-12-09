import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Short-lived access token
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'replace_me_refresh';

// Generate secure random refresh token
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Calculate expiry date for refresh token
export const getRefreshTokenExpiry = () => {
  const days = parseInt(REFRESH_TOKEN_EXPIRES_IN.replace('d', '')) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
