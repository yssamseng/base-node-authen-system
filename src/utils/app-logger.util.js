/**
 * Application logger utility with trace data support
 * Provides structured logging with correlation IDs and request tracking
 * @module utils/app-logger
 */

import logger from '../core/logger.js';
import { getStore } from './trace.util.js';
import { LOG_CONSTANT } from '../config/constants.js';

/**
 * Get trace data from async local storage
 * @private
 */
const getTraceData = () => {
  // ดึงค่า correlation_id และ user_id จาก AsyncLocalStorage
  const store = getStore();
  const correlation_id = store?.correlation_id || undefined;
  const user_id = store?.user_id || undefined;
  if (!correlation_id && !user_id){
    return undefined;
  }
  return { correlation_id, user_id };
}

/**
 * Application logger with trace data support
 */
export const appLogger = {
  /**
   * Log to console only (no file logging)
   * For startup messages and temporary debugging
   * Does NOT write to log files or Logtail
   */
  logConsole: (message = '') => {
    console.log(message);
  },

  /**
   * Log fatal/critical error message with trace data
   * For critical errors that cause service failure
   * Uses Syslog CRIT level with FATAL type
   */
  logFatal: (message = '', error = null, details = {}) => {
    logger[LOG_CONSTANT.LEVEL.CRIT](message, {
      type: LOG_CONSTANT.TYPE.FATAL,
      error: error?.message || error,
      stack: error?.stack,
      ...details,
      trace: getTraceData(),
    });
  },

  /**
   * Log debug message with trace data
   * For development/verbose debugging information
   * Uses Syslog DEBUG level
   */
  logDebug: (message = '', details = {}) => {
    logger[LOG_CONSTANT.LEVEL.DEBUG](message, {
      type: LOG_CONSTANT.TYPE.DEBUG,
      trace: getTraceData(),
      ...details,
    });
  },

  /**
   * Log info message with trace data
   * For important informational messages
   * Uses Syslog NOTICE level (normal but significant)
   */
  logInfo: (message = '') => {
    logger[LOG_CONSTANT.LEVEL.NOTICE](message, {
      type: LOG_CONSTANT.TYPE.DEBUG,
      trace: getTraceData(),
    });
  },

  /**
   * Log warning message with trace data
   * Uses Syslog WARNING level
   */
  logWarn: (message = '', details = {}) => {
    logger[LOG_CONSTANT.LEVEL.WARNING](message, {
      type: LOG_CONSTANT.TYPE.DEBUG,
      trace: getTraceData(),
      ...details,
    });
  },

  /**
   * Log error message with trace data
   * Uses Syslog ERROR level
   */
  logError: (message = '', error = null, details = {}) => {
    logger[LOG_CONSTANT.LEVEL.ERROR](message, {
      type: LOG_CONSTANT.TYPE.DEBUG,
      error: error?.message || error,
      stack: error?.stack,
      ...details,
      trace: getTraceData(),
    });
  },

  /**
   * Log incoming request with timing
   * Uses Syslog INFO level
   */
  logRequestReceived: (req) => {
    const startTime = req.startTime;
    if (startTime) {
      const endTime = process.hrtime.bigint();
      const durationNs = endTime - BigInt(startTime);
      const durationMs = Number(durationNs) / 1_000_000;

      logger[LOG_CONSTANT.LEVEL.INFO](`Request received | ${req.method} ${req.path}`, {
        type: LOG_CONSTANT.TYPE.HTTP,
        http: {
          method: req.method,
          path: req.path,
          query: req?.query || undefined,
          body: req.method !== 'GET' ? req.body : undefined,
        },
        duration_ms: parseFloat(durationMs.toFixed(2)),
        trace: getTraceData(),
      });
    }
  },

  /**
   * Log response with timing and metadata
   * Uses Syslog INFO level
   */
  logResponse: (req, res, responseData, statusCode = 200) => {
    res.set('Content-Length', Buffer.byteLength(JSON.stringify(responseData)));
    const startTime = req.startTime;

    if (startTime) {
      const endTime = process.hrtime.bigint();
      const durationNs = endTime - BigInt(startTime);
      const durationMs = Number(durationNs) / 1_000_000;

      logger[LOG_CONSTANT.LEVEL.INFO](`Request Completed | ${req.method} ${req.path}`, {
        type: LOG_CONSTANT.TYPE.HTTP,
        http: {
          method: req.method,
          path: req.path,
          status_code: statusCode,
          remote_ip: req?.ip || req?.socket?.remoteAddress,
          user_agent: req?.get('User-Agent'),
          response: JSON.stringify(responseData),
          response_size_bytes: res.get('Content-Length') || 0,
        },
        duration_ms: parseFloat(durationMs.toFixed(2)),
        trace: getTraceData(),
      });
    }
  },

  /**
   * Log error with request context
   * 4xx (client errors) → WARNING level
   * 5xx (server errors) → ERROR level
   */
  logResponseError: (req, error, statusCode = 500) => {
    const startTime = req.startTime;

    if (startTime) {
      const endTime = process.hrtime.bigint();
      const durationNs = endTime - BigInt(startTime);
      const durationMs = Number(durationNs) / 1_000_000;

      // Client errors (4xx) use WARNING, Server errors (5xx) use ERROR
      const level = statusCode >= 500
        ? LOG_CONSTANT.LEVEL.ERROR
        : LOG_CONSTANT.LEVEL.WARNING;

      logger[level](`Request Failed | ${req.method} ${req.path}`, {
        type: LOG_CONSTANT.TYPE.HTTP,
        error: error,
        http: {
          method: req.method,
          path: req.path,
          status_code: statusCode,
          remote_ip: req?.ip || req?.socket?.remoteAddress,
          user_agent: req?.get('User-Agent'),
        },
        duration_ms: parseFloat(durationMs.toFixed(2)),
        trace: getTraceData(),
      });
    }
  },

  /**
   * Log database operation
   * Uses Syslog DEBUG level
   */
  logDatabase: (operation, tableName, details = {}) => {
    const dbDetails = {
      operation: operation,
      table: tableName,
      ...details
    };
    // Include duration_ms if provided
    if (details.duration_ms !== undefined) {
      dbDetails.duration_ms = details.duration_ms;
    }
    logger[LOG_CONSTANT.LEVEL.DEBUG](`Database operation: ${operation}`, {
      type: LOG_CONSTANT.TYPE.DB,
      db: dbDetails,
      trace: getTraceData(),
    });
  },

  /**
   * Log service call
   * Uses Syslog NOTICE level
   */
  logService: (serviceName, operation, details = {}) => {
    logger[LOG_CONSTANT.LEVEL.NOTICE](`Service: ${serviceName}.${operation}`, {
      type: LOG_CONSTANT.TYPE.SERVICE,
      service: serviceName,
      operation,
      ...details,
      trace: getTraceData(),
    });
  },

  /**
   * Log performance metric
   * Slow (>1000ms) → WARNING, Normal → NOTICE
   */
  logPerformance: (operation, duration, details = {}) => {
    const level = duration > 1000 ? LOG_CONSTANT.LEVEL.WARNING : LOG_CONSTANT.LEVEL.NOTICE;
    logger[level](`Performance: ${operation} took ${duration}ms`, {
      type: LOG_CONSTANT.TYPE.PERFORMANCE,
      operation,
      duration_ms: duration,
      ...details,
      trace: getTraceData(),
    });
  },

  /**
   * Log email event
   * Success → INFO, Failed → ERROR
   */
  logEmail: (action, success = true, details = {}) => {
    const level = success ? LOG_CONSTANT.LEVEL.INFO : LOG_CONSTANT.LEVEL.ERROR;
    logger[level](`Email: ${action}`, {
      type: LOG_CONSTANT.TYPE.EMAIL,
      action,
      success,
      ...details,
      trace: getTraceData(),
    });
  },
};
