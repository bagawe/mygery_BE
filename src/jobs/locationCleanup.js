import cron from 'node-cron';
import radarService from '../modules/radar/radar.service.js';

/**
 * Schedule cleanup job for old location history
 * Runs daily at 2 AM
 */
export function scheduleLocationHistoryCleanup() {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Running location history cleanup...');
    
    try {
      const deletedCount = await radarService.cleanOldHistory();
      console.log(`✅ Deleted ${deletedCount} old location history entries`);
    } catch (error) {
      console.error('❌ Location history cleanup failed:', error);
    }
  });

  console.log('📅 Location history cleanup job scheduled (daily at 2 AM)');
}

export default {
  scheduleLocationHistoryCleanup
};