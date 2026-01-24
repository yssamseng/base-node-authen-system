import { appLogger } from '../utils/app-logger.util.js';

/**
 * In-memory rate limiting middleware
 * NOTE: For production, use rate-limit-db.middleware.js instead
 * This resets on server restart and doesn't work with multiple servers
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.maxAttempts - Maximum requests per window (default: 5)
 * @param {string} options.message - Error message when limit exceeded
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests (default: true)
 * @param {Function} options.keyGenerator - Function to generate unique key (default: ip:path)
 * @returns {Function} Express middleware
 */
const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxAttempts = 5,
    message = 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests = true,
    keyGenerator = (req) => `${req.ip}:${req.path}`,
  } = options;

  const attempts = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old attempts for this key
    if (attempts.has(key)) {
      const filtered = attempts.get(key).filter(time => time > windowStart);
      if (filtered.length === 0) {
        attempts.delete(key);
      } else {
        attempts.set(key, filtered);
      }
    }

    // Check limit
    const userAttempts = attempts.get(key) || [];
    if (userAttempts.length >= maxAttempts) {
      appLogger.logWarn(`Rate limit exceeded for ${key} (${userAttempts.length} attempts)`);

      return res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current attempt
    const attemptTime = now;
    userAttempts.push(attemptTime);
    attempts.set(key, userAttempts);

    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const currentAttempts = (attempts.get(key) || []).filter(
            t => t !== attemptTime
          );
          if (currentAttempts.length === 0) {
            attempts.delete(key);
          } else {
            attempts.set(key, currentAttempts);
          }
        }
      });
    }

    next();
  };
};

export { rateLimit };
