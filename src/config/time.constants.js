/**
 * Time Constants
 * Centralized time-related configuration values
 * Replaces magic numbers throughout the codebase
 * @module config/time.constants
 */

// ============================================
// ACCOUNT LOCKOUT SETTINGS
// ============================================

/**
 * Maximum failed login attempts before account lockout
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * Account lockout duration in milliseconds (30 minutes)
 */
export const LOCK_DURATION_MS = 30 * 60 * 1000;

// ============================================
// TOKEN EXPIRATION TIMES
// ============================================

/**
 * Email verification token expiration in milliseconds (24 hours)
 */
export const EMAIL_VERIFY_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Email verification token expiration in seconds (for API responses)
 */
export const EMAIL_VERIFY_EXPIRATION_SEC = 24 * 60 * 60;

/**
 * Password reset token expiration in milliseconds (1 hour)
 */
export const PASSWORD_RESET_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Password reset token expiration in seconds (for API responses)
 */
export const PASSWORD_RESET_EXPIRATION_SEC = 60 * 60;

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Maximum active sessions per user
 * When exceeded, oldest session is revoked
 */
export const MAX_ACTIVE_SESSIONS = 2;

/**
 * Token cleanup period in days
 * Inactive tokens older than this are deleted
 */
export const TOKEN_CLEANUP_DAYS = 7;

/**
 * Token cleanup period in milliseconds
 */
export const TOKEN_CLEANUP_MS = TOKEN_CLEANUP_DAYS * 24 * 60 * 60 * 1000;

// ============================================
// RATE LIMITING
// ============================================

/**
 * Auth endpoint rate limit window in milliseconds (15 minutes)
 */
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Auth endpoint max requests per window
 */
export const AUTH_RATE_LIMIT_MAX_REQUESTS = 5;

/**
 * Email endpoint rate limit window in milliseconds (1 hour)
 */
export const EMAIL_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * Email endpoint max requests per window
 */
export const EMAIL_RATE_LIMIT_MAX_REQUESTS = 10;

// ============================================
// RATE LIMIT CLEANUP
// ============================================

/**
 * Rate limit record cleanup age in hours
 * Records older than this are deleted
 */
export const RATE_LIMIT_CLEANUP_HOURS = 1;

/**
 * Rate limit record cleanup age in milliseconds
 */
export const RATE_LIMIT_CLEANUP_MS = RATE_LIMIT_CLEANUP_HOURS * 60 * 60 * 1000;

/**
 * Rate limit statistics window in milliseconds (24 hours)
 */
export const RATE_LIMIT_STATS_WINDOW_MS = 24 * 60 * 60 * 1000;

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Account lockout
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,

  // Token expiration
  EMAIL_VERIFY_EXPIRATION_MS,
  EMAIL_VERIFY_EXPIRATION_SEC,
  PASSWORD_RESET_EXPIRATION_MS,
  PASSWORD_RESET_EXPIRATION_SEC,

  // Session management
  MAX_ACTIVE_SESSIONS,
  TOKEN_CLEANUP_DAYS,
  TOKEN_CLEANUP_MS,

  // Rate limiting
  AUTH_RATE_LIMIT_WINDOW_MS,
  AUTH_RATE_LIMIT_MAX_REQUESTS,
  EMAIL_RATE_LIMIT_WINDOW_MS,
  EMAIL_RATE_LIMIT_MAX_REQUESTS,

  // Cleanup
  RATE_LIMIT_CLEANUP_HOURS,
  RATE_LIMIT_CLEANUP_MS,
  RATE_LIMIT_STATS_WINDOW_MS
};
