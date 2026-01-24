/**
 * Winston Logger Configuration
 * Provides structured logging with console and file transports
 * Integrates with Better Stack (Logtail) for centralized logging in production
 * Uses Syslog severity levels (RFC 5424)
 * @module core/logger
 */

import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

import { LOG_CONSTANT } from '../config/constants.js';
import APP_CONFIG from '../config/app-config.js';

// Create Logtail client only if credentials are provided
let logtail = null;
const { sourceToken: logtailToken, endpoint: logtailEndpoint } = APP_CONFIG.logtail;

if (logtailToken && logtailToken.trim() !== '' && logtailEndpoint && logtailEndpoint.trim() !== '') {
  logtail = new Logtail(logtailToken, {
    endpoint: logtailEndpoint,
  });
}

const { name: serviceName, version: serviceVersion } = APP_CONFIG.service;
const environment = APP_CONFIG.server.env;

// Syslog severity levels (RFC 5424) with priorities
const syslogLevels = {
  crit: 0,      // Critical - system failures
  error: 1,     // Error - application errors
  warning: 2,   // Warning - potential issues
  notice: 3,    // Notice - normal but significant
  info: 4,      // Informational
  debug: 5,     // Debug-level messages
};

// consoleFormat สำหรับ Development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    let meta = '';
    if (info.metadata && Object.keys(info.metadata).length > 0) {
      const { error, ...otherMeta } = info.metadata;
      meta = JSON.stringify(otherMeta);
    }
    return `${info.timestamp} ${info.level}: ${info.message} ${meta}`;
  })
);

const transports = [];

if (logtail) {
  transports.push(new LogtailTransport(logtail));
}

if (environment !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Winston logger instance with Syslog levels and file/Logtail transports
const logger = winston.createLogger({
  levels: syslogLevels,
  level: environment === 'production' ? LOG_CONSTANT.LEVEL.NOTICE : LOG_CONSTANT.LEVEL.DEBUG,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: serviceName,
    version: serviceVersion,
    environment: environment,
    context: undefined,
  },
  transports: [
    ...transports,
    // Critical/Error log file (crit and above)
    new winston.transports.File({
      filename: 'logs/fatal.log',
      level: LOG_CONSTANT.LEVEL.CRIT,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
    }),
    new winston.transports.File({
      filename: 'logs/notice-error.log',
      level: LOG_CONSTANT.LEVEL.NOTICE,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
    // Combined log file (all levels)
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

export default logger;
