import { genErrorResponseObj } from '../core/handler.js';
import { generateTokenPair, getTokenExpiration } from '../utils/jwt.util.js';
import { generateEmailVerificationToken } from '../utils/token.util.js';
import moment from 'moment';
import models from '../models/model.js';
import { findOne, create } from '../utils/db.util.js';
import EmailSendingService from './email-sending.service.js';
import emailVerifyConfig from '../utils/email-verify-config.util.js';
const { User, UserAuth, UserToken } = models;

const register = async (req, transaction) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await findOne(User, { criteria: { email } });

  if (existingUser) {
    throw genErrorResponseObj(req, '40001', 'User with this email already exists');
  }

  // Check if username is taken
  const existingUsername = await findOne(User, { criteria: { username } });

  if (existingUsername) {
    throw genErrorResponseObj(req, '40002', 'Username is already taken');
  }

  try {
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

    let emailVerification = null;

    // Generate email verification token only if feature is enabled
    if (emailVerifyConfig.isEnabled()) {
      emailVerification = generateEmailVerificationToken();
    }

    // Create user auth record
    await create(UserAuth, {
      data: {
        userId: user.id,
        password,
        isVerified: !emailVerifyConfig.isEnabled(), // Auto-verify if feature is disabled
        ...(emailVerification && {
          emailVerificationToken: emailVerification.token,
          emailVerificationExpiresAt: emailVerification.expiresAt
        })
      },
      transaction
    });

    // Generate token pair
    const tokenPair = generateTokenPair(user.id);

    // Create user token record
    await create(UserToken, {
      data: {
        userId: user.id,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        accessTokenExpiresAt: getTokenExpiration(tokenPair.accessToken),
        refreshTokenExpiresAt: getTokenExpiration(tokenPair.refreshToken),
        deviceInfo: req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : null
      },
      transaction
    });

    // Send verification email only if feature is enabled
    if (emailVerification && emailVerifyConfig.isEnabled()) {
      try {
        await EmailSendingService.sendVerificationEmail(
          email,
          emailVerification.token,
          `${firstName} ${lastName}`.trim() || username
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }
    }

    return {
      user: user.toJSON(),
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: moment(getTokenExpiration(tokenPair.accessToken)).diff(moment(), 'seconds'),
      isVerified: !emailVerifyConfig.isEnabled(),
      ...(emailVerifyConfig.isEnabled() && {
        message: emailVerifyConfig.isEnabled()
          ? 'Registration successful. Please check your email to verify your account.'
          : 'Registration successful.'
      })
    };
  } catch (error) {
    throw error;
  }
};

const login = async (req) => {
  const { email, password } = req.body;

  // Find user by email with auth data
  const user = await User.findOne({
    where: { email },
    include: [{
      model: UserAuth,
      as: 'auth'
    }]
  });

  if (!user) {
    throw genErrorResponseObj(req, '40003', 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw genErrorResponseObj(req, '40004', 'Your account has been deactivated');
  }

  const userAuth = user.auth;

  if (!userAuth) {
    throw genErrorResponseObj(req, '40008', 'Authentication data not found');
  }

  // Check if account is locked
  if (userAuth.isLocked()) {
    const lockedUntilFormatted = moment(userAuth.lockedUntil).format('YYYY-MM-DD HH:mm:ss');
    throw genErrorResponseObj(req, '40005', `Account is locked until ${lockedUntilFormatted}`);
  }

  // Check email verification if enabled and required
  if (emailVerifyConfig.isLoginVerificationRequired() && !userAuth.isVerified) {
    throw genErrorResponseObj(req, '40009', 'Please verify your email address before logging in');
  }

  // Verify password
  const isPasswordValid = await userAuth.comparePassword(password);

  if (!isPasswordValid) {
    // Increment failed attempts
    await userAuth.incrementFailedAttempts();
    throw genErrorResponseObj(req, '40003', 'Invalid email or password');
  }

  // Reset failed attempts on successful login
  await userAuth.resetFailedAttempts();

  // Update last login time using moment
  userAuth.lastLogin = moment().toDate();
  await userAuth.save();

  // Generate token pair
  const tokenPair = generateTokenPair(user.id);

  // Create user token record
  await create(UserToken, {
    data: {
      userId: user.id,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: getTokenExpiration(tokenPair.accessToken),
      refreshTokenExpiresAt: getTokenExpiration(tokenPair.refreshToken),
      deviceInfo: req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : null
    }
  });

  return {
    user: user.toJSON(),
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    expiresIn: moment(getTokenExpiration(tokenPair.accessToken)).diff(moment(), 'seconds'),
    lastLogin: moment(userAuth.lastLogin).format('YYYY-MM-DD HH:mm:ss'),
    isVerified: userAuth.isVerified
  };
};



const changePassword = async (req) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    // Get user with auth data
    const user = await User.findOne({
      where: { id: userId },
      include: [{
        model: UserAuth,
        as: 'auth'
      }]
    });

    if (!user) {
      throw genErrorResponseObj(req, '40403', 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.auth.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw genErrorResponseObj(req, '40003', 'Current password is incorrect');
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

const refreshToken = async (req) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw genErrorResponseObj(req, '40006', 'Refresh token is required');
  }

  try {
    // Find the token record
    const tokenRecord = await UserToken.findOne({
      where: {
        refreshToken,
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
      throw genErrorResponseObj(req, '40007', 'Invalid refresh token');
    }

    // Check if refresh token is expired
    if (tokenRecord.isRefreshTokenExpired()) {
      // Revoke the token
      await tokenRecord.revoke();
      throw genErrorResponseObj(req, '40008', 'Refresh token expired');
    }

    // Check if user is active
    if (!tokenRecord.user.isActive) {
      throw genErrorResponseObj(req, '40004', 'User account is inactive');
    }

    // Generate new token pair
    const newTokenPair = generateTokenPair(tokenRecord.userId);

    // Update token record with new tokens
    tokenRecord.accessToken = newTokenPair.accessToken;
    tokenRecord.refreshToken = newTokenPair.refreshToken;
    tokenRecord.accessTokenExpiresAt = getTokenExpiration(newTokenPair.accessToken);
    tokenRecord.refreshTokenExpiresAt = getTokenExpiration(newTokenPair.refreshToken);
    tokenRecord.lastUsedAt = moment().toDate();
    await tokenRecord.save();

    return {
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
      expiresIn: moment(getTokenExpiration(newTokenPair.accessToken)).diff(moment(), 'seconds')
    };
  } catch (error) {
    throw error;
  }
};

const logout = async (req) => {
  const userId = req.user.id;
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      // Find and revoke the specific token
      const tokenRecord = await UserToken.findOne({
        where: {
          userId,
          accessToken: token,
          isActive: true
        }
      });

      if (tokenRecord) {
        await tokenRecord.revoke();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  return {
    message: 'Logged out successfully',
    logoutTime: moment().format('YYYY-MM-DD HH:mm:ss')
  };
};

const logoutAll = async (req) => {
  const userId = req.user.id;

  try {
    // Revoke all active tokens for this user
    const revokedCount = await UserToken.update(
      { isActive: false },
      {
        where: {
          userId,
          isActive: true
        }
      }
    );

    return {
      message: 'Logged out from all devices successfully',
      revokedSessions: revokedCount[0],
      logoutTime: moment().format('YYYY-MM-DD HH:mm:ss')
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