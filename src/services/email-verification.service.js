/**
 * Email verification service
 * Handles email verification and password reset functionality
 * @module services/email-verification
 */

import { genErrorResponseObj } from '../core/handler.js';
import { generateEmailVerificationToken } from '../utils/token.util.js';
import { generatePasswordResetToken } from '../utils/token.util.js';
import moment from 'moment';
import models from '../models/model.js';
import EmailSendingService from './email-sending.service.js';
import emailVerifyConfig from '../utils/email-verify-config.util.js';

const { User, UserAuth } = models;

/**
 * Resend email verification email
 */
const resendVerificationEmail = async (req) => {
  const { email } = req.body;

  // Find user with auth data
  const user = await User.findOne({
    where: { email },
    include: [{
      model: UserAuth,
      as: 'auth'
    }]
  });

  if (!user) {
    throw genErrorResponseObj(req, '40403', 'User not found');
  }

  if (!user.isActive) {
    throw genErrorResponseObj(req, '40004', 'Account is deactivated');
  }

  const userAuth = user.auth;

  if (!userAuth) {
    throw genErrorResponseObj(req, '40008', 'Authentication data not found');
  }

  if (userAuth.isVerified) {
    throw genErrorResponseObj(req, '40010', 'Email is already verified');
  }

  // Check if there's a recent verification email sent (cooldown)
  if (userAuth.emailVerificationExpiresAt) {
    const timeSinceLastSent = moment().diff(
      moment(userAuth.emailVerificationExpiresAt).subtract(emailVerifyConfig.getTokenExpirationHours(), 'hours'),
      'milliseconds'
    );

    if (timeSinceLastSent < emailVerifyConfig.getResendCooldownMs()) {
      const remainingCooldown = Math.ceil(
        (emailVerifyConfig.getResendCooldownMs() - timeSinceLastSent) / (60 * 1000)
      );
      throw genErrorResponseObj(req, '40011', `Please wait ${remainingCooldown} minutes before requesting another verification email`);
    }
  }

  // Generate new verification token
  const emailVerification = generateEmailVerificationToken();

  // Update user auth record
  userAuth.emailVerificationToken = emailVerification.token;
  userAuth.emailVerificationExpiresAt = emailVerification.expiresAt;
  await userAuth.save();

  // Send verification email
  try {
    await EmailSendingService.sendVerificationEmail(
      email,
      emailVerification.token,
      `${user.firstName} ${user.lastName}`.trim() || user.username
    );
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    throw genErrorResponseObj(req, '50001', 'Failed to send verification email');
  }

  return {
    message: 'Verification email sent successfully. Please check your inbox.',
    expiresIn: emailVerification.expiresIn
  };
};

/**
 * Verify email with token
 */
const verifyEmail = async (req) => {
  const { token } = req.body;

  if (!token) {
    throw genErrorResponseObj(req, '40012', 'Verification token is required');
  }

  // Find user by verification token
  const userAuth = await UserAuth.findOne({
    where: {
      emailVerificationToken: token
    },
    include: [{
      model: User,
      as: 'user'
    }]
  });

  if (!userAuth) {
    throw genErrorResponseObj(req, '40013', 'Invalid or expired verification token');
  }

  // Check if token is expired
  if (userAuth.isEmailVerificationExpired()) {
    throw genErrorResponseObj(req, '40014', 'Verification token has expired. Please request a new one');
  }

  // Check if user is already verified
  if (userAuth.isVerified) {
    throw genErrorResponseObj(req, '40015', 'Email is already verified');
  }

  // Mark email as verified
  await userAuth.markEmailAsVerified();

  return {
    message: 'Email verified successfully',
    email: userAuth.user.email,
    verifiedAt: moment().format('YYYY-MM-DD HH:mm:ss')
  };
};

/**
 * Request password reset email
 * Always returns success to prevent email enumeration
 */
const requestPasswordReset = async (req) => {
  const { email } = req.body;

  // Find user with auth data
  const user = await User.findOne({
    where: { email },
    include: [{
      model: UserAuth,
      as: 'auth'
    }]
  });

  // Always return success to prevent email enumeration attacks
  if (!user) {
    return {
      message: 'If an account with this email exists, a password reset link has been sent'
    };
  }

  if (!user.isActive) {
    return {
      message: 'If an account with this email exists, a password reset link has been sent'
    };
  }

  const userAuth = user.auth;

  if (!userAuth) {
    return {
      message: 'If an account with this email exists, a password reset link has been sent'
    };
  }

  // Generate password reset token
  const passwordReset = generatePasswordResetToken();

  // Update user auth record
  userAuth.passwordResetToken = passwordReset.token;
  userAuth.passwordResetExpiresAt = passwordReset.expiresAt;
  await userAuth.save();

  // Send password reset email
  try {
    await EmailSendingService.sendPasswordResetEmail(
      email,
      passwordReset.token,
      `${user.firstName} ${user.lastName}`.trim() || user.username
    );
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
    // Still return success to prevent enumeration
  }

  return {
    message: 'If an account with this email exists, a password reset link has been sent',
    expiresIn: passwordReset.expiresIn
  };
};

/**
 * Reset password with token
 */
const resetPassword = async (req) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw genErrorResponseObj(req, '40016', 'Reset token and new password are required');
  }

  // Find user by reset token
  const userAuth = await UserAuth.findOne({
    where: {
      passwordResetToken: token
    },
    include: [{
      model: User,
      as: 'user'
    }]
  });

  if (!userAuth) {
    throw genErrorResponseObj(req, '40017', 'Invalid or expired reset token');
  }

  // Check if token is expired
  if (userAuth.isPasswordResetExpired()) {
    throw genErrorResponseObj(req, '40018', 'Password reset token has expired. Please request a new one');
  }

  // Update password and clear reset token
  userAuth.password = newPassword;
  userAuth.passwordResetToken = null;
  userAuth.passwordResetExpiresAt = null;

  // Reset failed attempts on password reset
  userAuth.failedAttempts = 0;
  userAuth.lockedUntil = null;

  await userAuth.save();

  return {
    message: 'Password reset successfully',
    email: userAuth.user.email,
    resetAt: moment().format('YYYY-MM-DD HH:mm:ss')
  };
};

/**
 * Check email verification status
 */
const checkVerificationStatus = async (req) => {
  const userId = req.user.id;

  const userAuth = await UserAuth.findOne({
    where: { userId },
    include: [{
      model: User,
      as: 'user',
      attributes: ['email', 'username']
    }]
  });

  if (!userAuth) {
    throw genErrorResponseObj(req, '40008', 'Authentication data not found');
  }

  return {
    email: userAuth.user.email,
    isVerified: userAuth.isVerified,
    emailVerificationEnabled: emailVerifyConfig.isEnabled(),
    loginVerificationRequired: emailVerifyConfig.isLoginVerificationRequired(),
    ...(userAuth.emailVerificationExpiresAt && !userAuth.isVerified && {
      verificationExpiresAt: moment(userAuth.emailVerificationExpiresAt).format('YYYY-MM-DD HH:mm:ss')
    })
  };
};

export {
  resendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  checkVerificationStatus
};