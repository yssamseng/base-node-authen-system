import { verifyAccessToken } from '../utils/jwt.util.js';
import { responseError, genErrorResponseObj } from '../core/handler.js';
import { appLogger } from '../utils/app-logger.util.js';
import models from '../models/model.js';
const { User, UserToken } = models;
import { runWithTrace } from '../utils/trace.util.js';
import crypto from 'crypto';
import { now } from '../utils/date.util.js';
import { RES_CODE } from '../config/constants.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract bearer token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} Token string or null
 */
const extractBearerToken = (req) => {
  return req.header('Authorization')?.replace('Bearer ', '') || null;
};

/**
 * Handle token verification errors
 * @param {Object} verificationResult - Token verification result
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True if error was handled (response sent), false otherwise
 */
const handleVerificationError = (verificationResult, req, res) => {
  if (verificationResult.valid) return false;

  const errorMap = {
    'TokenExpiredError': { code: RES_CODE.TOKEN_EXPIRED, message: 'Token has expired' },
    'JsonWebTokenError': { code: RES_CODE.TOKEN_INVALID, message: 'Token is not valid' }
  };

  const errorInfo = errorMap[verificationResult.error] || {
    code: RES_CODE.TOKEN_INVALID,
    message: verificationResult.error || 'Token verification failed'
  };

  const errorObj = genErrorResponseObj(req, errorInfo.code, errorInfo.message);
  responseError(req, res, errorObj);
  return true;
};

/**
 * Validate token exists in database and is active
 * @param {string} token - Access token
 * @param {number} userId - User ID from token
 * @returns {Promise<Object>} Token record
 * @throws {Error} If token not found, expired, or database error occurs
 */
const validateTokenInDatabase = async (token, userId) => {
  try {
    const tokenRecord = await UserToken.findOne({
      where: {
        accessToken: token,
        isActive: true,
        userId
      }
    });

    if (!tokenRecord) {
      throw new Error('TOKEN_NOT_FOUND');
    }

    if (tokenRecord.isAccessTokenExpired()) {
      await tokenRecord.revoke();
      throw new Error('TOKEN_EXPIRED');
    }

    return tokenRecord;
  } catch (error) {
    // Re-throw known business logic errors
    if (error.message === 'TOKEN_NOT_FOUND' || error.message === 'TOKEN_EXPIRED') {
      throw error;
    }
    // Wrap database errors as unknown errors for 500 response
    throw new Error('DATABASE_ERROR');
  }
};

/**
 * Validate user account
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User instance
 * @throws {Error} If user not found, inactive, or database error occurs
 */
const validateUser = async (userId) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new Error('USER_INACTIVE');
    }

    return user;
  } catch (error) {
    // Re-throw known business logic errors
    if (error.message === 'USER_NOT_FOUND' || error.message === 'USER_INACTIVE') {
      throw error;
    }
    // Wrap database errors as unknown errors for 500 response
    throw new Error('DATABASE_ERROR');
  }
};

/**
 * Update token last used timestamp
 * @param {Object} tokenRecord - Token model instance
 * @returns {Promise<void>}
 */
const updateTokenUsage = async (tokenRecord) => {
  tokenRecord.lastUsedAt = now();
  await tokenRecord.save();
};

/**
 * Attach user and trace context to request
 * @param {Object} req - Express request object
 * @param {Object} user - User model instance
 * @param {Object} tokenRecord - Token model instance
 * @param {Function} next - Express next function
 */
const attachUserContext = (req, user, tokenRecord, next) => {
  req.user = user;
  req.token = tokenRecord;

  const correlationId = crypto.randomUUID();
  const store = {
    correlation_id: correlationId,
    user_id: user.id
  };
  runWithTrace(store, next);
};

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractBearerToken(req);

    if (!token) {
      const errorObj = genErrorResponseObj(req, RES_CODE.AUTHENTICATION_REQUIRED, 'No authentication token, access denied');
      return responseError(req, res, errorObj);
    }

    // Verify access token
    const verificationResult = verifyAccessToken(token);
    if (handleVerificationError(verificationResult, req, res)) {
      return; // Error response already sent
    }

    const decoded = verificationResult.decoded;

    // Validate token in database
    let tokenRecord;
    try {
      tokenRecord = await validateTokenInDatabase(token, decoded.id);
    } catch (error) {
      const errorMap = {
        'TOKEN_NOT_FOUND': { code: RES_CODE.TOKEN_INVALID, message: 'Token is not valid or has been revoked' },
        'TOKEN_EXPIRED': { code: RES_CODE.TOKEN_EXPIRED, message: 'Access token has expired' },
        'DATABASE_ERROR': { code: RES_CODE.INTERNAL_ERROR, message: 'Server error during authentication' }
      };
      const errorInfo = errorMap[error.message] || { code: RES_CODE.INTERNAL_ERROR, message: 'Server error during authentication' };
      const errorObj = genErrorResponseObj(req, errorInfo.code, errorInfo.message);
      return responseError(req, res, errorObj);
    }

    // Validate user
    let user;
    try {
      user = await validateUser(decoded.id);
    } catch (error) {
      const errorMap = {
        'USER_NOT_FOUND': { code: RES_CODE.USER_NOT_FOUND, message: 'User not found' },
        'USER_INACTIVE': { code: RES_CODE.ACCOUNT_DEACTIVATED, message: 'User account is inactive' },
        'DATABASE_ERROR': { code: RES_CODE.INTERNAL_ERROR, message: 'Server error during authentication' }
      };
      const errorInfo = errorMap[error.message] || { code: RES_CODE.INTERNAL_ERROR, message: 'Server error during authentication' };
      const errorObj = genErrorResponseObj(req, errorInfo.code, errorInfo.message);
      return responseError(req, res, errorObj);
    }

    // Update token usage and attach user context
    await updateTokenUsage(tokenRecord);
    attachUserContext(req, user, tokenRecord, next);
  } catch (error) {
    appLogger.logError('Auth middleware error', error);
    const errorObj = genErrorResponseObj(req, RES_CODE.INTERNAL_ERROR, 'Server error during authentication');
    responseError(req, res, errorObj);
  }
};

export { authenticate };
