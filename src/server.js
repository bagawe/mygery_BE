import app from './app.js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { scheduleTokenCleanup, runInitialCleanup } from './jobs/tokenCleanup.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    logger.info('Server closed. Exiting process.');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server is running on port ${PORT} in ${NODE_ENV} mode`);
  
  // Initialize scheduled jobs in production
  if (NODE_ENV === 'production') {
    try {
      await runInitialCleanup();
      scheduleTokenCleanup();
      logger.info('🕒 Scheduled jobs initialized');
    } catch (error) {
      logger.error('Failed to initialize scheduled jobs:', error);
    }
  }
  
  logger.info('🔒 Security middleware active');
  logger.info('📊 Audit logging enabled');
  logger.info('✅ Server ready to accept connections');
});
