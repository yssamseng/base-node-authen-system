import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { connectDB } from './config/database.js';
import { appLogger } from './utils/app-logger.util.js';
import APP_CONFIG from './config/app-config.js';
import { scheduleRateLimitCleanup, runRateLimitCleanup } from './jobs/rate-limit-cleanup.job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { port: PORT, env: NODE_ENV } = APP_CONFIG.server;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('Created logs directory');
}

/**
 * Initialize database and start the Express server
 */
const startServer = async () => {
  try {
    // Connect to database
    appLogger.logInfo('Connecting to database...');
    await connectDB();

    // Run initial rate limit cleanup
    await runRateLimitCleanup();

    // Schedule periodic rate limit cleanup (every hour)
    scheduleRateLimitCleanup();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
