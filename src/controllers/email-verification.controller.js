import { response, responseError, genResponseObj } from '../core/handler.js';
import { RES_CODE } from '../config/constants.js';
import {
  resendVerificationEmail as serviceResendVerificationEmail,
  verifyEmail as serviceVerifyEmail,
  requestPasswordReset as serviceRequestPasswordReset,
  resetPassword as serviceResetPassword,
  checkVerificationStatus as serviceCheckVerificationStatus
} from '../services/email-verification.service.js';

/**
 * Resend email verification link
 * @param {Object} req - Express request object with body containing email
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    const result = await serviceResendVerificationEmail(req);
    response(req, res, genResponseObj(req, RES_CODE.SUCCESS, result));
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
const verifyEmail = async (req, res, next) => {
  try {
    const result = await serviceVerifyEmail(req);
    response(req, res, genResponseObj(req, RES_CODE.SUCCESS, result));
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
const requestPasswordReset = async (req, res, next) => {
  try {
    const result = await serviceRequestPasswordReset(req);
    response(req, res, genResponseObj(req, RES_CODE.SUCCESS, result));
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
const resetPassword = async (req, res, next) => {
  try {
    const result = await serviceResetPassword(req);
    response(req, res, genResponseObj(req, RES_CODE.PASSWORD_RESET_SUCCESS, result));
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
const checkVerificationStatus = async (req, res, next) => {
  try {
    const result = await serviceCheckVerificationStatus(req);
    response(req, res, genResponseObj(req, RES_CODE.SUCCESS, result));
  } catch (error) {
    responseError(req, res, error);
  }
};

export {
  resendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  checkVerificationStatus
};