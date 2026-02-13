/**
 * Date Utility Functions
 * Centralized date formatting and manipulation helpers
 * Replaces moment.js with native Date operations
 * @module utils/date
 */

/**
 * Format date to 'YYYY-MM-DD HH:mm:ss' (local time)
 * @param {Date|string|number} date - Date to format
 * @returns {string|null} Formatted date string or null if invalid
 * @example
 * formatDateTime(new Date('2023-12-25T15:30:45'))
 * // Returns: '2023-12-25 15:30:45' (local time)
 */
export const formatDateTime = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null; // Invalid date
  // Format: YYYY-MM-DD HH:mm:ss (local time)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format date to 'YYYY-MM-DD' (local time, date only)
 * @param {Date|string|number} date - Date to format
 * @returns {string|null} Formatted date string or null if invalid
 * @example
 * formatDateOnly(new Date('2023-12-25T15:30:45'))
 * // Returns: '2023-12-25'
 */
export const formatDateOnly = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null; // Invalid date
  // Format: YYYY-MM-DD (local time)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get seconds until a date expires
 * @param {Date|string|number} expirationDate - Expiration date
 * @returns {number} Seconds remaining (0 if expired or invalid)
 * @example
 * getExpiresInSec(new Date(Date.now() + 60000))
 * // Returns: 60 (approximately)
 */
export const getExpiresInSec = (expirationDate) => {
  if (!expirationDate) return 0;
  const expTime = expirationDate instanceof Date ? expirationDate.getTime() : new Date(expirationDate).getTime();
  return Math.max(0, Math.floor((expTime - Date.now()) / 1000));
};

/**
 * Add time to current date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit: 'milliseconds', 'seconds', 'minutes', 'hours', 'days'
 * @returns {Date} New date with time added
 * @example
 * addTime(24, 'hours') // Returns Date 24 hours from now
 * addTime(30, 'minutes') // Returns Date 30 minutes from now
 */
export const addTime = (amount, unit = 'milliseconds') => {
  const multipliers = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  };
  const multiplier = multipliers[unit] || 1;
  return new Date(Date.now() + amount * multiplier);
};

/**
 * Subtract time from current date
 * @param {number} amount - Amount to subtract
 * @param {string} unit - Unit: 'milliseconds', 'seconds', 'minutes', 'hours', 'days'
 * @returns {Date} New date with time subtracted
 * @example
 * subtractTime(7, 'days') // Returns Date 7 days ago
 */
export const subtractTime = (amount, unit = 'milliseconds') => {
  const multipliers = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  };
  const multiplier = multipliers[unit] || 1;
  return new Date(Date.now() - amount * multiplier);
};

/**
 * Check if date is in the past
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  return d.getTime() < Date.now();
};

/**
 * Check if date is in the future
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFuture = (date) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  return d.getTime() > Date.now();
};

/**
 * Get current date and time as ISO string
 * @returns {string} ISO string with milliseconds
 */
export const nowIsoMs = () => new Date().toISOString();

/**
 * Get current date/time
 * @returns {Date} Current date
 */
export const now = () => new Date();

// Default export for convenience
export default {
  formatDateTime,
  formatDateOnly,
  getExpiresInSec,
  addTime,
  subtractTime,
  isPast,
  isFuture,
  nowIsoMs,
  now
};
