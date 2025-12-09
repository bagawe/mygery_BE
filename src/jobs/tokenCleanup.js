import { AuthService } from '../modules/auth/auth.service.js';
import logger from '../utils/logger.js';

// Cleanup job for expired refresh tokens
export const cleanupExpiredTokens = async () => {
  try {
    logger.info('Starting cleanup of expired refresh tokens...');
    
    const result = await AuthService.cleanupExpiredTokens();
    
    logger.info(`Cleanup completed. Removed ${result.cleanedTokens} expired/revoked tokens`);
    
    return result;
  } catch (error) {
    logger.error('Error during token cleanup:', error);
    throw error;
  }
};

// Schedule cleanup job to run every hour
export const scheduleTokenCleanup = () => {
  const intervalMs = 60 * 60 * 1000; // 1 hour
  
  setInterval(async () => {
    try {
      await cleanupExpiredTokens();
    } catch (error) {
      logger.error('Scheduled token cleanup failed:', error);
    }
  }, intervalMs);
  
  logger.info('Token cleanup job scheduled to run every hour');
};

// Run cleanup immediately on startup
export const runInitialCleanup = async () => {
  try {
    logger.info('Running initial token cleanup...');
    await cleanupExpiredTokens();
  } catch (error) {
    logger.error('Initial token cleanup failed:', error);
  }
};