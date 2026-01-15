import RateLimit from '../models/rate-limit.model.js';
import { appLogger } from '../utils/app-logger.util.js';
import { Op } from 'sequelize';

/**
 * Database-backed rate limiting middleware
 * For production use with persistent storage and multi-server support
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.maxRequests - Maximum requests per window (default: 5)
 * @param {string} options.message - Error message when limit exceeded
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests (default: true)
 * @param {Function} options.keyGenerator - Function to generate unique key (default: ip:path)
 * @returns {Function} Express middleware
 */
const rateLimitDB = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 5,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = true,
    keyGenerator = (req) => `${req.ip}:${req.path}`,
  } = options;

  // Store request IDs to skip successful requests
  const requestIds = new Map();

  return async (req, res, next) => {
    const key = keyGenerator(req);

    try {
      // Check rate limit
      const result = await RateLimit.checkRateLimit(key, maxRequests, windowMs);

      // Add rate limit headers to response
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(new Date(result.resetAt).getTime() / 1000));

      if (!result.allowed) {
        // Rate limit exceeded
        appLogger.logInfo(`Rate limit exceeded for ${key} (${result.count} requests)`);

        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));

        return res.status(429).json({
          success: false,
          message: message,
          retryAfter: Math.ceil(windowMs / 1000),
          resetAt: result.resetAt
        });
      }

      // Track request for successful request skipping
      if (skipSuccessfulRequests) {
        const requestId = `${key}:${Date.now()}`;
        requestIds.set(requestId, true);

        // Remove from tracking on response finish
        res.on('finish', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Successful request - remove the record
            // We need to find and remove the most recent record for this key
            RateLimit.destroy({
              where: {
                key,
                createdAt: { [Op.gte]: new Date(Date.now() - windowMs) }
              },
              order: [['createdAt', 'DESC']],
              limit: 1
            }).catch(err => {
              // Log error but don't fail the request
              console.error('Failed to remove rate limit record:', err);
            });
          }
          requestIds.delete(requestId);
        });
      }

      next();
    } catch (error) {
      // On error, allow the request but log the error
      console.error('Rate limit check error:', error);
      appLogger.logInfo(`Rate limit error for ${key}: ${error.message}`);
      next();
    }
  };
};

export { rateLimitDB };
