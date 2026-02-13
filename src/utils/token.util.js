import crypto from 'crypto';
import { isFuture, formatDateTime } from './date.util.js';
import {
  EMAIL_VERIFY_EXPIRATION_MS,
  EMAIL_VERIFY_EXPIRATION_SEC,
  PASSWORD_RESET_EXPIRATION_MS,
  PASSWORD_RESET_EXPIRATION_SEC
} from '../config/time.constants.js';

/**
 * Generate random token
 * @param {number} length - Number of bytes to generate (default: 32)
 * @returns {string} Hex-encoded random token
 */
export const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate email verification token with expiry
 * @returns {{token: string, expiresAt: Date, expiresIn: number}} Token and expiry info
 */
export const generateEmailVerificationToken = () => {
  const token = generateRandomToken(32);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRATION_MS);

  return {
    token,
    expiresAt,
    expiresIn: EMAIL_VERIFY_EXPIRATION_SEC
  };
};

/**
 * Generate password reset token with expiry
 * @returns {{token: string, expiresAt: Date, expiresIn: number}} Token and expiry info
 */
export const generatePasswordResetToken = () => {
  const token = generateRandomToken(32);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MS);

  return {
    token,
    expiresAt,
    expiresIn: PASSWORD_RESET_EXPIRATION_SEC
  };
};

/**
 * Check if token has expired
 * @param {Date|string} expiresAt - Expiration date
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return !isFuture(expiresAt);
};

/**
 * Get remaining time until token expires
 * @param {Date|string} expiresAt - Expiration date
 * @returns {number} Seconds remaining (0 if expired)
 */
export const getTokenTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  const now = Date.now();
  const expiryTime = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  return Math.max(0, Math.floor((expiryTime - now) / 1000));
};

/**
 * Format expiration time for human readable format
 * @param {Date|string} expiresAt - Expiration date
 * @returns {string|null} Formatted date string or null
 */
export const formatExpirationTime = formatDateTime;