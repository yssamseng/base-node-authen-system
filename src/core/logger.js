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

const transports = [
  new LogtailTransport(logtail),
];

if (environment !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// -----------------------------------------------------------------------------
// 4. สร้าง Logger
// -----------------------------------------------------------------------------
const logger = winston.createLogger({
  level: environment === 'production' ? LOG_CONSTANT.LEVEL.INFO : LOG_CONSTANT.LEVEL.DEBUG,
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
    // // Error log file
    // new winston.transports.File({
    //   filename: 'logs/error.log',
    //   level: 'error',
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 5,
    // }),
    // // Combined log file
    // new winston.transports.File({
    //   filename: 'logs/combined.log',
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 5,
    // }),
  ],
  exitOnError: false,
});

export default logger;