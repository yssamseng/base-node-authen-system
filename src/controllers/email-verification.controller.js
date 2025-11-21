import { response, responseError } from '../core/handler.js';
import {
  resendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  checkVerificationStatus
} from '../services/email-verification.service.js';

const resendVerification = async (req, res, next) => {
  try {
    const result = await resendVerificationEmail(req);
    response(req, res, result, 'VE001');
  } catch (error) {
    responseError(req, res, error);
  }
};

const confirmVerification = async (req, res, next) => {
  try {
    const result = await verifyEmail(req);
    response(req, res, result, 'VE002');
  } catch (error) {
    responseError(req, res, error);
  }
};

const requestPasswordResetLink = async (req, res, next) => {
  try {
    const result = await requestPasswordReset(req);
    response(req, res, result, 'VE003');
  } catch (error) {
    responseError(req, res, error);
  }
};

const confirmPasswordReset = async (req, res, next) => {
  try {
    const result = await resetPassword(req);
    response(req, res, result, 'VE004');
  } catch (error) {
    responseError(req, res, error);
  }
};

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