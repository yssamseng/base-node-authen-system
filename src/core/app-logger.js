import logger from './logger.js';
import { getStore } from './trace.js';

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

export const appLogger = {
  logInfo: (req, message = '') => {
    const startTime = process.hrtime.bigint();
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    logger.info(message, {
      type: 'DEBUG',
      duration_ms: parseFloat(durationMs.toFixed(2)),
      trace: getTraceData(),
    });
  },

  // Request logging
  logRequestReceived: (req) => {
    const startTime = process.hrtime.bigint();
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    logger.info(`Request received | ${req.method} ${req.path}`, {
      http: {
        method: req.method,
        path: req.path,
        query: req?.query | undefined,
        body: req.method !== 'GET' ? req.body : undefined,
      },
      duration_ms: parseFloat(durationMs.toFixed(2)),
      trace: getTraceData(),
    });
  },

  // Response logging
  logResponse: (req, res, responseData, statusCode = 200) => {
    res.set('Content-Length', Buffer.byteLength(JSON.stringify(responseData)));
    const startTime = process.hrtime.bigint();
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    logger.info(`Request Completed | ${req.method} ${req.path}`, {
      http: {
        method: req.method,
        path: req.path,
        status_code: statusCode,
        remote_ip: req?.ip || req?.connection?.remoteAddress,
        user_agent: req?.get('User-Agent'),
        response: JSON.stringify(responseData),
        response_size_bytes: res.get('Content-Length') || 0,
      },
      duration_ms: parseFloat(durationMs.toFixed(2)),
      trace: getTraceData(),
    });
  },

  // Error logging with transaction context
  logResponseError: (req, error, statusCode = 500) => {
    const startTime = process.hrtime.bigint();
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    logger.error(`Request Failed | ${req.method} ${req.path}`, {
      error: error,
      http: {
        method: req.method,
        path: req.path,
        status_code: statusCode,
        remote_ip: req?.ip || req?.connection?.remoteAddress,
        user_agent: req?.get('User-Agent'),
      },
      duration_ms: parseFloat(durationMs.toFixed(2)),
      trace: getTraceData(),
    });
  },

  // Database operation logging
  logDatabase: (operation, tableName, details = {}) => {
    logger.debug(`Database operation: ${operation}`, {
      db: {
        operation: operation,
        table: tableName,
        ...details
        // duration_ms: 25
      },
      trace: getTraceData(),
    });
  },

  // Authentication logging
  // logAuth: (req, action, success = true, details = {}) => {
  //   const childLogger = createChildLogger(req);
  //   const level = success ? 'info' : 'warn';
  //   childLogger[level](`Authentication: ${action}`, {
  //     type: 'AUTH',
  //     action,
  //     success,
  //     ...details
  //   });
  // },

  // Service logging
  // logService: (req, serviceName, operation, details = {}) => {
  //   const childLogger = createChildLogger(req);
  //   childLogger.info(`Service: ${serviceName}.${operation}`, {
  //     type: 'SERVICE',
  //     service: serviceName,
  //     operation,
  //     ...details
  //   });
  // },

  // Performance logging
  // logPerformance: (req, operation, duration, details = {}) => {
  //   const childLogger = createChildLogger(req);
  //   const level = duration > 1000 ? 'warn' : 'info';
  //   childLogger[level](`Performance: ${operation} took ${duration}ms`, {
  //     type: 'PERFORMANCE',
  //     operation,
  //     duration,
  //     ...details
  //   });
  // }
};