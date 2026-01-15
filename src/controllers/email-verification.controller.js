import { response, responseError } from '../core/handler.js';
import {
  resendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  checkVerificationStatus
} from '../services/email-verification.service.js';

/**
 * Resend email verification link
 * @param {Object} req - Express request object with body containing email
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
const resendVerification = async (req, res, next) => {
  try {
    const result = await resendVerificationEmail(req);
    response(req, res, result, 'VE001');
  } catch (error) {
    responseError(req, res, error);
  }
};

/**
 * Confirm email verification with token
 * @param {Object} req - Express request object with body containing token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
const confirmVerification = async (req, res, next) => {
  try {
    const result = await verifyEmail(req);
    response(req, res, result, 'VE002');
  } catch (error) {
    responseError(req, res, error);
  }
};

/**
 * Request password reset link via email
 * @param {Object} req - Express request object with body containing email
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
const requestPasswordResetLink = async (req, res, next) => {
  try {
    const result = await requestPasswordReset(req);
    response(req, res, result, 'VE003');
  } catch (error) {
    responseError(req, res, error);
  }
};

/**
 * Confirm password reset with token
 * @param {Object} req - Express request object with body containing token and newPassword
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
const confirmPasswordReset = async (req, res, next) => {
  try {
    const result = await resetPassword(req);
    response(req, res, result, 'VE004');
  } catch (error) {
    responseError(req, res, error);
  }
};

/**
 * Get email verification status for authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
const getVerificationStatus = async (req, res, next) => {
  try {
    const result = await checkVerificationStatus(req);
    response(req, res, result, 'VE005');
  } catch (error) {
    responseError(req, res, error);
  }
};

export {
  resendVerification,
  confirmVerification,
  requestPasswordResetLink,
  confirmPasswordReset,
  getVerificationStatus
};