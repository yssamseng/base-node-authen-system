/**
 * Sanitization middleware
 * Automatically sanitizes request inputs to prevent injection attacks
 * @module middleware/sanitize
 */

import { sanitizeRequestBody, sanitizeString } from '../utils/sanitize.util.js';
import { appLogger } from '../utils/app-logger.util.js';

/**
 * Sanitize request body
 * Automatically cleans all string inputs in request body
 */
export const sanitizeBody = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeRequestBody(req.body);
    }
    next();
  } catch (error) {
    appLogger.logWarn('Body sanitization failed', { error: error.message });
    // Continue with original body on error
    next();
  }
};

/**
 * Sanitize request query parameters
 * Cleans all query string parameters
 */
export const sanitizeQuery = (req, res, next) => {
  try {
    if (req.query && typeof req.query === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(v =>
            typeof v === 'string' ? sanitizeString(v) : v
          );
        } else {
          sanitized[key] = value;
        }
      }
      req.query = sanitized;
    }
    next();
  } catch (error) {
    appLogger.logWarn('Query sanitization failed', { error: error.message });
    next();
  }
};

/**
 * Sanitize request parameters
 * Cleans URL parameters (e.g., /user/:id)
 */
export const sanitizeParams = (req, res, next) => {
  try {
    if (req.params && typeof req.params === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(req.params)) {
        sanitized[key] = typeof value === 'string'
          ? sanitizeString(value)
          : value;
      }
      req.params = sanitized;
    }
    next();
  } catch (error) {
    appLogger.logWarn('Params sanitization failed', { error: error.message });
    next();
  }
};

/**
 * Comprehensive sanitization middleware
 * Sanitizes body, query, and params
 * Use this for maximum security coverage
 */
export const sanitizeAll = [
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams
];

/**
 * Selective sanitization middleware
 * Apply only the sanitization you need
 */
export default {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll
};
