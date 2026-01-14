// logger.js
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
  ],
  exitOnError: false,
});

export default logger;
