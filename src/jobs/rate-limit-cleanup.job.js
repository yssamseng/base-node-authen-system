import cron from 'node-cron';
import RateLimit from '../models/rate-limit.model.js';
import { appLogger } from '../utils/app-logger.util.js';

/**
 * Schedule periodic cleanup of old rate limit records
 * Runs every hour to delete records older than 1 hour
 */
const scheduleRateLimitCleanup = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const deletedCount = await RateLimit.cleanupOldRecords(1);

      if (deletedCount > 0) {
        appLogger.logDebug(`RateLimit cleanup: Removed ${deletedCount} old records`);
      }
    } catch (error) {
      appLogger.logError('RateLimit cleanup error', error);
    }
  });

  appLogger.logDebug('RateLimit cleanup job scheduled (runs every hour)');
};

/**
 * Manual cleanup function (can be called on startup)
 */
const runRateLimitCleanup = async () => {
  try {
    const deletedCount = await RateLimit.cleanupOldRecords(1);
    if (deletedCount > 0) {
      appLogger.logDebug(`RateLimit cleanup: Removed ${deletedCount} old records on startup`);
    }
    return deletedCount;
  } catch (error) {
    appLogger.logError('RateLimit cleanup error', error);
    return 0;
  }
};

export { scheduleRateLimitCleanup, runRateLimitCleanup };
