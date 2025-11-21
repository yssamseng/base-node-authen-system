import crypto from 'crypto';
import moment from 'moment';

// Generate random token
export const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate email verification token with expiry
export const generateEmailVerificationToken = () => {
  const token = generateRandomToken(32);
  const expiresAt = moment().add(24, 'hours').toDate(); // 24 hours from now

  return {
    token,
    expiresAt,
    expiresIn: 24 * 60 * 60 // 24 hours in seconds
  };
};

// Generate password reset token with expiry
export const generatePasswordResetToken = () => {
  const token = generateRandomToken(32);
  const expiresAt = moment().add(1, 'hour').toDate(); // 1 hour from now

  return {
    token,
    expiresAt,
    expiresIn: 60 * 60 // 1 hour in seconds
  };
};

// Verify if token is expired
export const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return moment().isAfter(moment(expiresAt));
};

// Get token time remaining in seconds
export const getTokenTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  const now = moment();
  const expiry = moment(expiresAt);
  return Math.max(0, expiry.diff(now, 'seconds'));
};

// Format expiration time for human readable format
export const formatExpirationTime = (expiresAt) => {
  if (!expiresAt) return null;
  return moment(expiresAt).format('YYYY-MM-DD HH:mm:ss');
};