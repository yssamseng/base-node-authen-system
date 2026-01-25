/**
 * Database configuration and connection management
 * @module config/database
 */

import { Sequelize } from 'sequelize';
import APP_CONFIG from './app-config.js';
import { appLogger } from '../utils/app-logger.util.js';

const { name, user, password, host, port, dialect, retry: retryConfig } = APP_CONFIG.database;
const isDevelopment = APP_CONFIG.server.env === 'development';

// Retry configuration from APP_CONFIG
const RETRY_CONFIG = retryConfig;

// Track reconnection state
let isReconnecting = false;
let retryCount = 0;

/**
 * Calculate delay with exponential backoff
 * @param {number} attempt - Current retry attempt
 * @returns {number} Delay in milliseconds
 */
const calculateBackoffDelay = (attempt) => {
  const delay = Math.min(
    RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelay
  );
  // Add some jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Establishes database connection with retry mechanism
 * @param {boolean} isReconnection - Whether this is a reconnection attempt
 * @returns {Promise<void>}
 */
const connectDB = async (isReconnection = false) => {
  if (isReconnecting) {
    appLogger.logDebug('Database reconnection already in progress, skipping');
    return;
  }

  if (isReconnection) {
    isReconnecting = true;
  }

  const currentRetryCount = isReconnection ? 0 : retryCount;
  let lastError = null;

  for (let attempt = currentRetryCount; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateBackoffDelay(attempt - 1);
        appLogger.logWarn(`Database connection attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries}. Retrying in ${Math.round(delay / 1000)}s...`, {
          attempt: attempt + 1,
          maxRetries: RETRY_CONFIG.maxRetries,
          delayMs: Math.round(delay)
        });
        await sleep(delay);
      }

      await sequelize.authenticate();

      // Connection successful
      if (attempt > 0 || isReconnection) {
        appLogger.logInfo('Database connection re-established', {
          attempts: attempt + 1,
          wasReconnection: isReconnection
        });
      } else {
        appLogger.logInfo('Database connection established');
      }

      // Reset retry counters on success
      retryCount = 0;
      isReconnecting = false;

      // Sync models with database
      try {
        await sequelize.sync({ alter: isDevelopment });
        appLogger.logInfo('Database synchronized');
      } catch (syncError) {
        // If sync fails but connection succeeded, log warning but don't fail
        if (RETRY_CONFIG.retrySync) {
          appLogger.logWarn('Database sync failed, retrying...', { error: syncError.message });
          await sleep(calculateBackoffDelay(0));
          await sequelize.sync({ alter: isDevelopment });
          appLogger.logInfo('Database synchronized on retry');
        } else {
          appLogger.logWarn('Database sync failed, continuing anyway', { error: syncError.message });
        }
      }

      return;

    } catch (error) {
      lastError = error;
      retryCount = attempt + 1;

      appLogger.logError('Database connection failed', error, {
        attempt: attempt + 1,
        maxRetries: RETRY_CONFIG.maxRetries,
        database: name,
        host,
        port,
        dialect,
        isReconnection
      });

      // Don't log to console on every retry in production to avoid noise
      if (attempt === RETRY_CONFIG.maxRetries - 1 || isDevelopment) {
        console.error(`Database connection attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries} failed:`, error.message);
      }
    }
  }

  // All retries exhausted
  isReconnecting = false;

  appLogger.logFatal('Database connection failed after all retry attempts', lastError, {
    totalAttempts: RETRY_CONFIG.maxRetries,
    database: name,
    host,
    port,
    dialect
  });

  console.error(`Unable to connect to the database after ${RETRY_CONFIG.maxRetries} attempts:`, lastError.message);
  console.error('Please check your database configuration and ensure the database server is running.');

  // Only exit on initial connection, not on reconnection
  if (!isReconnection) {
    process.exit(1);
  }
};

// Sequelize ORM instance configured with database connection settings
const sequelize = new Sequelize(
  name,
  user,
  password,
  {
    host,
    port,
    dialect,
    logging: isDevelopment ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 0 // Disable built-in retry, we handle it ourselves
    }
  }
);

/**
 * Check if database connection is healthy
 * @returns {Promise<boolean>} true if connection is healthy
 */
const checkConnectionHealth = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Setup database connection health monitoring
 * In Sequelize v6, connection pool handles reconnection automatically.
 * This function sets up periodic health checks.
 */
const setupConnectionListeners = () => {
  // Ensure connection pools are initialized
  sequelize.connectionManager.initPools();

  // Health check interval (every 30 seconds)
  const healthCheckInterval = 30000;

  const healthCheckLoop = async () => {
    const isHealthy = await checkConnectionHealth();

    if (!isHealthy && !isReconnecting) {
      appLogger.logWarn('Database health check failed, attempting reconnection...');
      connectDB(true).catch(err => {
        appLogger.logError('Database reconnection failed', err);
      });
    }
  };

  // Start periodic health checks
  const healthCheckTimer = setInterval(healthCheckLoop, healthCheckInterval);

  // Don't block process exit
  if (healthCheckTimer.unref) {
    healthCheckTimer.unref();
  }

  appLogger.logDebug('Database health monitoring configured', {
    checkInterval: healthCheckInterval
  });
};

export { sequelize, connectDB, setupConnectionListeners, checkConnectionHealth };
