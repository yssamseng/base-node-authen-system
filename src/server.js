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
 * Graceful shutdown handler
 * Closes database connection and exits cleanly
 */
const gracefulShutdown = async (signal) => {
  appLogger.logInfo(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    const server = global.server;
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          appLogger.logInfo('HTTP server closed');
          resolve();
        });
      });
    }

    // Close database connection
    const { sequelize } = await import('./config/database.js');
    await sequelize.close();
    appLogger.logInfo('Database connection closed');

    appLogger.logInfo('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    appLogger.logFatal('Error during graceful shutdown', error);
    process.exit(1);
  }
};

/**
 * Initialize database and start the Express server
 */
const startServer = async () => {
  try {
    // Connect to database
    appLogger.logDebug('Connecting to database...');
    await connectDB();

    // Run initial rate limit cleanup
    await runRateLimitCleanup();

    // Schedule periodic rate limit cleanup (every hour)
    scheduleRateLimitCleanup();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
    });

    // Store server instance globally for graceful shutdown
    global.server = server;

    appLogger.logInfo(`Server started on port ${PORT} in ${NODE_ENV} mode`);
  } catch (error) {
    appLogger.logFatal('Failed to start server', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  appLogger.logFatal('Uncaught Exception', error, {
    message: error.message,
    stack: error.stack
  });
  // Exit immediately after logging
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  appLogger.logFatal('Unhandled Promise Rejection', reason, {
    promise: String(promise),
    reason: String(reason)
  });
  // Exit immediately after logging
  process.exit(1);
});

// Handle SIGTERM (graceful shutdown)
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

// Handle SIGINT (Ctrl+C, graceful shutdown)
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

startServer();
