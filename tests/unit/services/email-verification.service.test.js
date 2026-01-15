import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import * as emailVerificationService from '../../../src/services/email-verification.service.js';
import { genErrorResponseObj } from '../../../src/core/handler.js';
import moment from 'moment';

// Mock dependencies
jest.mock('../../../src/core/handler.js');
jest.mock('../../../src/utils/db.util.js');
jest.mock('../../../src/models/model.js');

// Mock EmailSendingService as a default export
jest.mock('../../../src/services/email-sending.service.js', () => ({
  __esModule: true,
  default: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    getProviderInfo: jest.fn()
  }
}));

import { findOne, update } from '../../../src/utils/db.util.js';
import models from '../../../src/models/model.js';
import EmailSendingService from '../../../src/services/email-sending.service.js';
const { User, UserAuth } = models;

describe('Email Verification Service', () => {
  let mockReq;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      body: {},
      user: null,
      headers: {},
      get: jest.fn()
    };

    // Mock genErrorResponseObj
    genErrorResponseObj.mockImplementation((req, code, message) => {
      const error = new Error(message);
      error.resCode = code;
      return error;
    });

    // Mock User and UserAuth model methods
    User.findOne = jest.fn();
    User.findByPk = jest.fn();
    UserAuth.findOne = jest.fn();
    UserAuth.update = jest.fn();
  });

  describe('resendVerificationEmail', () => {
    test('should resend verification email successfully for unverified user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        auth: {
          userId: 1,
          isVerified: false,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
          save: jest.fn().mockResolvedValue()
        }
      };
      const mockUserAuth = {
        userId: 1,
        isVerified: false,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        save: jest.fn().mockResolvedValue()
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);
      UserAuth.findOne.mockResolvedValue(mockUserAuth);
      update.mockResolvedValue(mockUserAuth);

      const result = await emailVerificationService.resendVerificationEmail(mockReq);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{
          model: UserAuth,
          as: 'auth'
        }]
      });
      expect(mockUser.auth.save).toHaveBeenCalled();
      // Email would be sent here in real implementation
      expect(result).toEqual({
        message: 'Verification email sent successfully. Please check your inbox.',
        expiresIn: expect.any(Number)
      });
    });

    test('should throw error if user not found', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };
      User.findOne.mockResolvedValue(null);

      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
    });

    test('should throw error if user is already verified', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        auth: {
          isVerified: true
        }
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow('Email is already verified');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40010', 'Email is already verified');
    });

    test('should throw error if user is inactive', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: false
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow('Account is deactivated');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40004', 'Account is deactivated');
    });

    test('should throw error if auth record not found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        auth: null
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow('Authentication data not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40008', 'Authentication data not found');
    });

    test('should handle email sending failures', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        username: 'testuser',
        auth: {
          userId: 1,
          isVerified: false,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
          save: jest.fn().mockResolvedValue()
        }
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);
      UserAuth.findOne.mockResolvedValue(mockUser.auth);

      // Mock EmailSendingService.sendVerificationEmail to throw an error
      EmailSendingService.sendVerificationEmail.mockRejectedValue(new Error('Email service failed'));

      // The service should throw an error when email sending fails
      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow('Failed to send verification email');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '50001', 'Failed to send verification email');
    });
  });

  describe('verifyEmail', () => {
    test('should confirm email verification successfully', async () => {
      const mockUserAuth = {
        userId: 1,
        emailVerificationToken: 'valid_token',
        emailVerificationExpiresAt: moment().add(1, 'hour').toDate(),
        isVerified: false,
        isEmailVerificationExpired: jest.fn().mockReturnValue(false),
        markEmailAsVerified: jest.fn().mockResolvedValue(),
        user: { email: 'test@example.com' }
      };

      mockReq.body = { token: 'valid_token' };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);
      update.mockResolvedValue({ ...mockUserAuth, isVerified: true });

      const result = await emailVerificationService.verifyEmail(mockReq);

      expect(UserAuth.findOne).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: 'valid_token'
        },
        include: [{
          model: User,
          as: 'user'
        }]
      });
      expect(mockUserAuth.markEmailAsVerified).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Email verified successfully',
        email: 'test@example.com',
        verifiedAt: expect.any(String)
      });
    });

    test('should throw error if token is invalid', async () => {
      mockReq.body = { token: 'invalid_token' };
      UserAuth.findOne.mockResolvedValue(null);

      await expect(emailVerificationService.verifyEmail(mockReq)).rejects.toThrow('Invalid or expired verification token');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40013', 'Invalid or expired verification token');
    });

    test('should throw error if token is expired', async () => {
      const mockUserAuth = {
        userId: 1,
        emailVerificationToken: 'expired_token',
        emailVerificationExpiresAt: moment().subtract(1, 'hour').toDate(),
        isVerified: false,
        isEmailVerificationExpired: jest.fn().mockReturnValue(true)
      };

      mockReq.body = { token: 'expired_token' };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      await expect(emailVerificationService.verifyEmail(mockReq)).rejects.toThrow('Verification token has expired. Please request a new one');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40014', 'Verification token has expired. Please request a new one');
    });

    test('should throw error if user is already verified', async () => {
      const mockUserAuth = {
        userId: 1,
        emailVerificationToken: 'valid_token',
        emailVerificationExpiresAt: moment().add(1, 'hour').toDate(),
        isVerified: true,
        isEmailVerificationExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.body = { token: 'valid_token' };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      await expect(emailVerificationService.verifyEmail(mockReq)).rejects.toThrow('Email is already verified');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40015', 'Email is already verified');
    });
  });

  describe('requestPasswordReset', () => {
    test('should send password reset email successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        auth: {
          userId: 1,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          save: jest.fn().mockResolvedValue()
        }
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      const result = await emailVerificationService.requestPasswordReset(mockReq);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{
          model: UserAuth,
          as: 'auth'
        }]
      });
      expect(mockUser.auth.save).toHaveBeenCalled();
      // Email would be sent here in real implementation
      expect(result).toEqual({
        message: 'If an account with this email exists, a password reset link has been sent',
        expiresIn: expect.any(Number)
      });
    });

    test('should not reveal if email exists for security', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };
      User.findOne.mockResolvedValue(null);

      const result = await emailVerificationService.requestPasswordReset(mockReq);

      expect(result).toEqual({
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    });

    test('should handle inactive users gracefully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: false
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      const result = await emailVerificationService.requestPasswordReset(mockReq);

      expect(result).toEqual({
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    });

    test('should handle missing auth record gracefully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        auth: null
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      const result = await emailVerificationService.requestPasswordReset(mockReq);

      expect(result).toEqual({
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    });
  });

  describe('resetPassword', () => {
    test('should confirm password reset successfully', async () => {
      const mockUserAuth = {
        userId: 1,
        passwordResetToken: 'valid_reset_token',
        passwordResetExpiresAt: moment().add(1, 'hour').toDate(),
        isPasswordResetExpired: jest.fn().mockReturnValue(false),
        user: { email: 'test@example.com' },
        save: jest.fn().mockResolvedValue()
      };

      mockReq.body = {
        token: 'valid_reset_token',
        newPassword: 'newPassword123'
      };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      const result = await emailVerificationService.resetPassword(mockReq);

      expect(UserAuth.findOne).toHaveBeenCalledWith({
        where: {
          passwordResetToken: 'valid_reset_token'
        },
        include: [{
          model: User,
          as: 'user'
        }]
      });
      expect(result).toEqual({
        message: 'Password reset successfully',
        email: 'test@example.com',
        resetAt: expect.any(String)
      });
    });

    test('should throw error if reset token is invalid', async () => {
      mockReq.body = {
        token: 'invalid_token',
        newPassword: 'newPassword123'
      };
      UserAuth.findOne.mockResolvedValue(null);

      await expect(emailVerificationService.resetPassword(mockReq)).rejects.toThrow('Invalid or expired reset token');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40017', 'Invalid or expired reset token');
    });

    test('should throw error if reset token is expired', async () => {
      const mockUserAuth = {
        userId: 1,
        passwordResetToken: 'expired_token',
        passwordResetExpiresAt: moment().subtract(1, 'hour').toDate(),
        isPasswordResetExpired: jest.fn().mockReturnValue(true),
        user: { email: 'test@example.com' }
      };

      mockReq.body = {
        token: 'expired_token',
        newPassword: 'newPassword123'
      };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      await expect(emailVerificationService.resetPassword(mockReq)).rejects.toThrow('Password reset token has expired. Please request a new one');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40018', 'Password reset token has expired. Please request a new one');
    });
  });

  describe('checkVerificationStatus', () => {
    test('should get verification status successfully', async () => {
      const mockUserAuth = {
        userId: 1,
        isVerified: true,
        emailVerificationExpiresAt: null,
        user: {
          email: 'test@example.com',
          username: 'testuser'
        }
      };

      mockReq.user = { id: 1 };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      const result = await emailVerificationService.checkVerificationStatus(mockReq);

      expect(UserAuth.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: [{
          model: User,
          as: 'user',
          attributes: ['email', 'username']
        }]
      });
      expect(result).toEqual({
        email: 'test@example.com',
        isVerified: true,
        emailVerificationEnabled: false,
        loginVerificationRequired: false
      });
    });

    test('should throw error if user not found', async () => {
      mockReq.user = { id: 1 };
      UserAuth.findOne.mockResolvedValue(null);

      await expect(emailVerificationService.checkVerificationStatus(mockReq)).rejects.toThrow('Authentication data not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40008', 'Authentication data not found');
    });

    test('should handle unverified user with pending verification', async () => {
      const mockUserAuth = {
        userId: 1,
        isVerified: false,
        emailVerificationExpiresAt: moment().add(1, 'hour').toDate(),
        user: {
          email: 'test@example.com',
          username: 'testuser'
        }
      };

      mockReq.user = { id: 1 };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      const result = await emailVerificationService.checkVerificationStatus(mockReq);

      expect(result).toEqual({
        email: 'test@example.com',
        isVerified: false,
        emailVerificationEnabled: false,
        loginVerificationRequired: false,
        verificationExpiresAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      });
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;

      await expect(emailVerificationService.checkVerificationStatus(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid email format in resendVerificationEmail', async () => {
      mockReq.body = { email: 'invalid-email' };

      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow();
    });

    test('should handle missing email in request body', async () => {
      mockReq.body = {};

      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow();
    });

    test('should handle missing token in verifyEmail', async () => {
      mockReq.body = {};

      await expect(emailVerificationService.verifyEmail(mockReq)).rejects.toThrow();
    });

    test('should handle missing token and password in resetPassword', async () => {
      mockReq.body = {};

      await expect(emailVerificationService.resetPassword(mockReq)).rejects.toThrow();
    });

    test('should handle empty password in resetPassword', async () => {
      mockReq.body = {
        token: 'valid_token',
        newPassword: ''
      };

      await expect(emailVerificationService.resetPassword(mockReq)).rejects.toThrow();
    });

    test('should handle database errors gracefully', async () => {
      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(emailVerificationService.resendVerificationEmail(mockReq)).rejects.toThrow('Database connection failed');
    });
  });
});