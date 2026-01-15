import crypto from 'crypto';
import moment from 'moment';

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
  const expiresAt = moment().add(24, 'hours').toDate(); // 24 hours from now

  return {
    token,
    expiresAt,
    expiresIn: 24 * 60 * 60 // 24 hours in seconds
  };
};

/**
 * Generate password reset token with expiry
 * @returns {{token: string, expiresAt: Date, expiresIn: number}} Token and expiry info
 */
export const generatePasswordResetToken = () => {
  const token = generateRandomToken(32);
  const expiresAt = moment().add(1, 'hour').toDate(); // 1 hour from now

  return {
    token,
    expiresAt,
    expiresIn: 60 * 60 // 1 hour in seconds
  };
};

/**
 * Check if token has expired
 * @param {Date|string} expiresAt - Expiration date
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return moment().isAfter(moment(expiresAt));
};

/**
 * Get remaining time until token expires
 * @param {Date|string} expiresAt - Expiration date
 * @returns {number} Seconds remaining (0 if expired)
 */
export const getTokenTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  const now = moment();
  const expiry = moment(expiresAt);
  return Math.max(0, expiry.diff(now, 'seconds'));
};

/**
 * Format expiration time for human readable format
 * @param {Date|string} expiresAt - Expiration date
 * @returns {string|null} Formatted date string or null
 */
export const formatExpirationTime = (expiresAt) => {
  if (!expiresAt) return null;
  return moment(expiresAt).format('YYYY-MM-DD HH:mm:ss');
};