/**
 * Authentication service
 * Handles user registration, login, logout, and token management
 * @module services/auth
 */

import { genErrorResponseObj } from '../core/handler.js';
import { generateTokenPair, getTokenExpiration } from '../utils/jwt.util.js';
import { generateEmailVerificationToken } from '../utils/token.util.js';
import { RES_CODE } from '../config/constants.js';
import models from '../models/model.js';
import { findOne, create, update } from '../utils/db.util.js';
import EmailSendingService from './email-sending.service.js';
import emailVerifyConfig from '../utils/email-verify-config.util.js';
import { formatDateTime, getExpiresInSec, now } from '../utils/date.util.js';
import { findUserWithAuth, getDisplayName } from './user.service.js';

const { User, UserAuth, UserToken } = models;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate that email and username are not already taken
 * @param {string} email - User email
 * @param {string} username - Username
 * @param {Object} req - Request object for error generation
 * @throws {Error} If email or username already exists
 */
const validateUserExists = async (email, username, req) => {
  const existingUser = await findOne(User, { criteria: { email } });
  if (existingUser) {
    throw genErrorResponseObj(req, RES_CODE.EMAIL_ALREADY_EXISTS, 'User with this email already exists');
  }

  const existingUsername = await findOne(User, { criteria: { username } });
  if (existingUsername) {
    throw genErrorResponseObj(req, RES_CODE.USERNAME_ALREADY_EXISTS, 'Username is already taken');
  }
};

/**
 * Create user authentication record
 * @param {number} userId - User ID
 * @param {string} password - Plain text password
 * @param {Object} emailVerification - Email verification token data
 * @param {Object} transaction - Database transaction
 * @returns {Promise<void>}
 */
const createUserAuthRecord = async (userId, password, emailVerification, transaction) => {
  await create(UserAuth, {
    data: {
      userId,
      password,
      isVerified: !emailVerifyConfig.isEnabled(),
      ...(emailVerification && {
        emailVerificationToken: emailVerification.token,
        emailVerificationExpiresAt: emailVerification.expiresAt
      })
    },
    transaction
  });
};

/**
 * Create user token record
 * @param {number} userId - User ID
 * @param {Object} tokenPair - JWT token pair
 * @param {string} deviceInfo - Device user agent info
 * @param {Object} transaction - Database transaction
 * @returns {Promise<void>}
 */
const createUserTokenRecord = async (userId, tokenPair, deviceInfo, transaction) => {
  await create(UserToken, {
    data: {
      userId,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: getTokenExpiration(tokenPair.accessToken),
      refreshTokenExpiresAt: getTokenExpiration(tokenPair.refreshToken),
      deviceInfo: deviceInfo ? { userAgent: deviceInfo } : null
    },
    transaction
  });
};

/**
 * Send verification email to user
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @param {string} displayName - User display name
 */
const sendVerificationEmail = async (email, token, displayName) => {
  try {
    await EmailSendingService.sendVerificationEmail(email, token, displayName);
  } catch (emailError) {
    // Email sending is handled by EmailSendingService with appLogger
    // Continue with registration even if email fails
  }
};

/**
 * Build registration response object
 * @param {Object} user - User model instance
 * @param {Object} tokenPair - JWT token pair
 * @returns {Object} Registration response
 */
const buildRegistrationResponse = (user, tokenPair) => {
  return {
    user: user.toJSON(),
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    expiresIn: getExpiresInSec(getTokenExpiration(tokenPair.accessToken)),
    isVerified: !emailVerifyConfig.isEnabled(),
    ...(emailVerifyConfig.isEnabled() && {
      message: 'Registration successful. Please check your email to verify your account.'
    })
  };
};

/**
 * Get device info from request headers
 * @param {Object} headers - Request headers
 * @returns {Object|null} Device info object or null
 */
const getDeviceInfo = (headers) => {
  const userAgent = headers?.['user-agent'];
  return userAgent ? { userAgent } : null;
};

/**
 * Register a new user
 * Creates user, auth record, and tokens. Sends verification email if enabled.
 */
const register = async (req, transaction) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Validate email and username uniqueness
  await validateUserExists(email, username, req);

  // Create new user
  const user = await create(User, {
    data: {
      username,
      email,
      firstName,
      lastName
    },
    transaction
  });

  // Generate email verification token if enabled
  const emailVerification = emailVerifyConfig.isEnabled()
    ? generateEmailVerificationToken()
    : null;

  // Create user auth record
  await createUserAuthRecord(user.id, password, emailVerification, transaction);

  // Generate token pair
  const tokenPair = generateTokenPair(user.id);

  // Create user token record
  await createUserTokenRecord(user.id, tokenPair, getDeviceInfo(req.headers), transaction);

  // Send verification email if enabled
  if (emailVerification) {
    const displayName = getDisplayName({ firstName, lastName, username });
    await sendVerificationEmail(email, emailVerification.token, displayName);
  }

  return buildRegistrationResponse(user, tokenPair);
};

/**
 * Authenticate user login
 * Validates credentials and generates token pair
 */
const login = async (req) => {
  const { email, password } = req.body;

  // Find user by email with auth data
  const user = await findUserWithAuth(User, UserAuth, { email });

  if (!user) {
    throw genErrorResponseObj(req, RES_CODE.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw genErrorResponseObj(req, RES_CODE.ACCOUNT_DEACTIVATED, 'Your account has been deactivated');
  }

  const userAuth = user.auth;

  if (!userAuth) {
    throw genErrorResponseObj(req, RES_CODE.AUTH_DATA_NOT_FOUND, 'Authentication data not found');
  }

  // Check if account is locked
  if (userAuth.isLocked()) {
    const lockedUntilFormatted = formatDateTime(userAuth.lockedUntil);
    throw genErrorResponseObj(req, RES_CODE.ACCOUNT_LOCKED, `Account is locked until ${lockedUntilFormatted}`);
  }

  // Check email verification if enabled and required
  if (emailVerifyConfig.isLoginVerificationRequired() && !userAuth.isVerified) {
    throw genErrorResponseObj(req, RES_CODE.EMAIL_VERIFICATION_REQUIRED, 'Please verify your email address before logging in');
  }

  // Verify password
  const isPasswordValid = await userAuth.comparePassword(password);

  if (!isPasswordValid) {
    // Increment failed attempts
    await userAuth.incrementFailedAttempts();
    throw genErrorResponseObj(req, RES_CODE.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  // Reset failed attempts on successful login
  await userAuth.resetFailedAttempts();

  // Update last login time
  userAuth.lastLogin = now();
  await userAuth.save();

  // Generate token pair
  const tokenPair = generateTokenPair(user.id);

  // Create user token record
  await createUserTokenRecord(user.id, tokenPair, getDeviceInfo(req.headers));

  return {
    user: user.toJSON(),
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    expiresIn: getExpiresInSec(getTokenExpiration(tokenPair.accessToken)),
    lastLogin: formatDateTime(userAuth.lastLogin),
    isVerified: userAuth.isVerified
  };
};

/**
 * Change user password
 * Verifies current password and updates to new password
 */
const changePassword = async (req) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    // Get user with auth data (using db.util)
    const user = await findOne(User, {
      pk: userId,
      include: [{
        model: UserAuth,
        as: 'auth'
      }]
    });

    if (!user) {
      throw genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.auth.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw genErrorResponseObj(req, RES_CODE.INVALID_CREDENTIALS, 'Current password is incorrect');
    }

    // Update password
    user.auth.password = newPassword;
    await user.auth.save();

    return {
      message: 'Password changed successfully'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * Generates new token pair and updates expiry
 */
const refreshToken = async (req) => {
  const { refreshToken: refreshTokenBody } = req.body;

  if (!refreshTokenBody) {
    throw genErrorResponseObj(req, RES_CODE.AUTHENTICATION_REQUIRED, 'Refresh token is required');
  }

  try {
    // Find the token record (using db.util)
    const tokenRecord = await findOne(UserToken, {
      criteria: {
        refreshToken: refreshTokenBody,
        isActive: true
      },
      include: [{
        model: User,
        as: 'user',
        include: [{
          model: UserAuth,
          as: 'auth'
        }]
      }]
    });

    if (!tokenRecord) {
      throw genErrorResponseObj(req, RES_CODE.TOKEN_INVALID, 'Invalid refresh token');
    }

    // Check if refresh token is expired
    if (tokenRecord.isRefreshTokenExpired()) {
      // Revoke the token
      await tokenRecord.revoke();
      throw genErrorResponseObj(req, RES_CODE.AUTH_DATA_NOT_FOUND, 'Refresh token expired');
    }

    // Check if user is active
    if (!tokenRecord.user.isActive) {
      throw genErrorResponseObj(req, RES_CODE.ACCOUNT_DEACTIVATED, 'User account is inactive');
    }

    // Generate new token pair
    const newTokenPair = generateTokenPair(tokenRecord.userId);

    // Update token record with new tokens
    tokenRecord.accessToken = newTokenPair.accessToken;
    tokenRecord.refreshToken = newTokenPair.refreshToken;
    tokenRecord.accessTokenExpiresAt = getTokenExpiration(newTokenPair.accessToken);
    tokenRecord.refreshTokenExpiresAt = getTokenExpiration(newTokenPair.refreshToken);
    tokenRecord.lastUsedAt = now();
    await tokenRecord.save();

    return {
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
      expiresIn: getExpiresInSec(getTokenExpiration(newTokenPair.accessToken))
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user from current session
 * Revokes the current access token
 */
const logout = async (req) => {
  if (!req.user) {
    return {
      message: 'Logged out successfully',
      logoutTime: formatDateTime(now())
    };
  }

  const userId = req.user.id;
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      // Find and revoke the specific token (using db.util)
      const tokenRecord = await findOne(UserToken, {
        criteria: {
          userId,
          accessToken: token,
          isActive: true
        }
      });

      if (tokenRecord) {
        await tokenRecord.revoke();
      }
    } catch (error) {
      // Silently handle errors during logout
    }
  }

  return {
    message: 'Logged out successfully',
    logoutTime: formatDateTime(now())
  };
};

/**
 * Logout user from all sessions
 * Revokes all active tokens for the user
 */
const logoutAll = async (req) => {
  const userId = req.user.id;

  try {
    // Revoke all active tokens for this user (using db.util)
    const revokedCount = await update(UserToken, {
      data: { isActive: false },
      criteria: {
        userId,
        isActive: true
      }
    });

    return {
      message: 'Logged out from all devices successfully',
      revokedSessions: revokedCount[0],
      logoutTime: formatDateTime(now())
    };
  } catch (error) {
    throw error;
  }
};

export {
  register,
  login,
  logout,
  logoutAll,
  changePassword,
  refreshToken
};