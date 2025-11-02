// logger.js
import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

import { LOG_CONSTANT } from '../config/constants.js';

// Create a Logtail client
const logtail = new Logtail('SUH8P8D99C5TveJnEbwacZhF', {
  endpoint: 'https://s1564615.eu-nbg-2.betterstackdata.com',
});

// -----------------------------------------------------------------------------
// 1. ดึงค่า Service Context (เหมือนเดิม)
// -----------------------------------------------------------------------------
const serviceName = process.env.SERVICE_NAME || 'my-api-service';
const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
const environment = process.env.NODE_ENV || 'development';

// -----------------------------------------------------------------------------
// 2. สร้าง Custom Formatter (เปลี่ยน 1 จุด)
// -----------------------------------------------------------------------------
const buildJsonFormat = winston.format((info) => {
  const logEntry = {
    timestamp: info.timestamp,
    level: info.level,
    message: info.message,
  };

  if (info.metadata) {
    if (info.metadata.http) logEntry.http = info.metadata.http;
    if (info.metadata.db) logEntry.db = info.metadata.db;
    if (info.metadata.duration_ms) logEntry.duration_ms = info.metadata.duration_ms;
    if (info.metadata.error && info.metadata.error instanceof Error) {
      logEntry.error = {
        message: info.metadata.error.message,
        code: info.metadata.error.code,
        stack_trace: info.metadata.error.stack,
      };
    }
  }
  return logEntry;
});

// -----------------------------------------------------------------------------
// 3. กำหนด Format สำหรับ Development และ Production (เปลี่ยน 1 จุด)
// -----------------------------------------------------------------------------

// Format สำหรับ Production
const productionFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.metadata(),
  winston.format.errors({ stack: true }),
  buildJsonFormat(),
  winston.format.json()
);

// Format สำหรับ Development
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    let meta = '';
    if (info.metadata && Object.keys(info.metadata).length > 0) {
      const { error, ...otherMeta } = info.metadata;
      meta = JSON.stringify(otherMeta);
    }
    return `${info.timestamp} ${info.level}: ${info.message} ${meta}`;
  })
);

const x = () => {
  const store = getStore();
  const correlation_id = store?.correlation_id || null;
  const user_id = store?.user_id || null;

  return { correlation_id, user_id };
}

// -----------------------------------------------------------------------------
// 4. สร้าง Logger
// -----------------------------------------------------------------------------
const logger = winston.createLogger({
  level: environment === 'production' ? LOG_CONSTANT.LEVEL.INFO : LOG_CONSTANT.LEVEL.DEBUG,
  // format: environment === 'production' ? productionFormat : developmentFormat,
  format: developmentFormat,
  defaultMeta: {
    service: serviceName,
    version: serviceVersion,
    environment: environment,
    context: undefined,
  },
  transports: [
    new LogtailTransport(logtail),
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Console transport - enabled for development
    new winston.transports.Console()
  ],
  exitOnError: false,
});

// -----------------------------------------------------------------------------
// 5. Export Logger
// -----------------------------------------------------------------------------
export default logger;