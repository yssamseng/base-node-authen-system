import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as emailVerificationService from '../../../src/services/email-verification.service.js';
import { genErrorResponseObj } from '../../../src/core/handler.js';
import moment from 'moment';

// Mock dependencies
jest.mock('../../../src/core/handler.js');
jest.mock('../../../src/utils/db.util.js');
jest.mock('../../../src/models/index.js');

import { findOne, update } from '../../../src/utils/db.util.js';
import models from '../../../src/models/index.js';
const { User, UserAuth } = models;

// Mock email utility functions
const sendVerificationEmail = jest.fn();
const sendPasswordResetEmail = jest.fn();

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

    // Mock email utility functions (simulated since they don't exist)
    const mockSendEmail = jest.fn().mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('resendVerification', () => {
    test('should resend verification email successfully for unverified user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true
      };
      const mockUserAuth = {
        userId: 1,
        isVerified: false,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);
      UserAuth.findOne.mockResolvedValue(mockUserAuth);
      update.mockResolvedValue(mockUserAuth);

      const result = await emailVerificationService.resendVerification(mockReq);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{
          model: UserAuth,
          as: 'auth'
        }]
      });
      expect(update).toHaveBeenCalled();
      // Email would be sent here in real implementation
      expect(result).toEqual({
        message: 'Verification email sent',
        expiresIn: 3600
      });
    });

    test('should throw error if user not found', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };
      User.findOne.mockResolvedValue(null);

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow('User not found');
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

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow('Email is already verified');
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

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow('User account is inactive');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40004', 'User account is inactive');
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

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow('Authentication data not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40008', 'Authentication data not found');
    });

    test('should handle email sending failures', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true
      };
      const mockUserAuth = {
        userId: 1,
        isVerified: false,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);
      UserAuth.findOne.mockResolvedValue(mockUserAuth);
      update.mockResolvedValue(mockUserAuth);
      // Mock email service failure

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow('Email service failed');
    });
  });

  describe('confirmVerification', () => {
    test('should confirm email verification successfully', async () => {
      const mockUserAuth = {
        userId: 1,
        emailVerificationToken: 'valid_token',
        emailVerificationExpiresAt: moment().add(1, 'hour').toDate(),
        isVerified: false
      };

      mockReq.body = { token: 'valid_token' };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);
      update.mockResolvedValue({ ...mockUserAuth, isVerified: true });

      const result = await emailVerificationService.confirmVerification(mockReq);

      expect(UserAuth.findOne).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: 'valid_token',
          isVerified: false
        }
      });
      expect(update).toHaveBeenCalledWith(UserAuth, {
        data: {
          isVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null
        },
        criteria: {
          emailVerificationToken: 'valid_token',
          isVerified: false
        }
      });
      expect(result).toEqual({
        message: 'Email verified successfully',
        isVerified: true
      });
    });

    test('should throw error if token is invalid', async () => {
      mockReq.body = { token: 'invalid_token' };
      UserAuth.findOne.mockResolvedValue(null);

      await expect(emailVerificationService.confirmVerification(mockReq)).rejects.toThrow('Invalid or expired verification token');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40011', 'Invalid or expired verification token');
    });

    test('should throw error if token is expired', async () => {
      const mockUserAuth = {
        userId: 1,
        emailVerificationToken: 'expired_token',
        emailVerificationExpiresAt: moment().subtract(1, 'hour').toDate(),
        isVerified: false
      };

      mockReq.body = { token: 'expired_token' };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      await expect(emailVerificationService.confirmVerification(mockReq)).rejects.toThrow('Invalid or expired verification token');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40011', 'Invalid or expired verification token');
    });

    test('should throw error if user is already verified', async () => {
      const mockUserAuth = {
        userId: 1,
        emailVerificationToken: 'valid_token',
        emailVerificationExpiresAt: moment().add(1, 'hour').toDate(),
        isVerified: true
      };

      mockReq.body = { token: 'valid_token' };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      await expect(emailVerificationService.confirmVerification(mockReq)).rejects.toThrow('Email is already verified');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40010', 'Email is already verified');
    });
  });

  describe('requestPasswordReset', () => {
    test('should send password reset email successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true
      };

      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);
      UserAuth.findOne.mockResolvedValue({ userId: 1 });
      update.mockResolvedValue({});

      const result = await emailVerificationService.requestPasswordReset(mockReq);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{
          model: UserAuth,
          as: 'auth'
        }]
      });
      expect(update).toHaveBeenCalled();
      // Email would be sent here in real implementation
      expect(result).toEqual({
        message: 'If an account with this email exists, a password reset link has been sent',
        expiresIn: 3600
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

  describe('confirmPasswordReset', () => {
    test('should confirm password reset successfully', async () => {
      const mockUserAuth = {
        userId: 1,
        passwordResetToken: 'valid_reset_token',
        passwordResetExpiresAt: moment().add(1, 'hour').toDate()
      };

      mockReq.body = {
        token: 'valid_reset_token',
        newPassword: 'newPassword123'
      };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);
      update.mockResolvedValue({});

      const result = await emailVerificationService.confirmPasswordReset(mockReq);

      expect(UserAuth.findOne).toHaveBeenCalledWith({
        where: {
          passwordResetToken: 'valid_reset_token'
        }
      });
      expect(update).toHaveBeenCalledWith(UserAuth, {
        data: {
          password: 'newPassword123',
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          failedAttempts: 0,
          lockedUntil: null
        },
        criteria: {
          passwordResetToken: 'valid_reset_token'
        }
      });
      expect(result).toEqual({
        message: 'Password reset successfully'
      });
    });

    test('should throw error if reset token is invalid', async () => {
      mockReq.body = {
        token: 'invalid_token',
        newPassword: 'newPassword123'
      };
      UserAuth.findOne.mockResolvedValue(null);

      await expect(emailVerificationService.confirmPasswordReset(mockReq)).rejects.toThrow('Invalid or expired reset token');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40012', 'Invalid or expired reset token');
    });

    test('should throw error if reset token is expired', async () => {
      const mockUserAuth = {
        userId: 1,
        passwordResetToken: 'expired_token',
        passwordResetExpiresAt: moment().subtract(1, 'hour').toDate()
      };

      mockReq.body = {
        token: 'expired_token',
        newPassword: 'newPassword123'
      };
      UserAuth.findOne.mockResolvedValue(mockUserAuth);

      await expect(emailVerificationService.confirmPasswordReset(mockReq)).rejects.toThrow('Invalid or expired reset token');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40012', 'Invalid or expired reset token');
    });
  });

  describe('getVerificationStatus', () => {
    test('should get verification status successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        createdAt: moment('2023-11-01').toDate(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          email: 'test@example.com',
          createdAt: moment('2023-11-01').toDate()
        }),
        auth: {
          isVerified: true,
          lastLogin: moment('2023-12-01 12:00:00').toDate()
        }
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      const result = await emailVerificationService.getVerificationStatus(mockReq);

      expect(findOne).toHaveBeenCalledWith(User, {
        pk: 1,
        include: [{
          model: UserAuth,
          as: 'auth',
          attributes: ['isVerified', 'lastLogin', 'emailVerificationExpiresAt']
        }]
      });
      expect(result).toEqual({
        isVerified: true,
        email: 'test@example.com',
        verificationExpiresAt: null,
        lastLogin: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
        memberSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      });
    });

    test('should throw error if user not found', async () => {
      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(null);

      await expect(emailVerificationService.getVerificationStatus(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
    });

    test('should handle unverified user with pending verification', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        createdAt: moment('2023-11-01').toDate(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          email: 'test@example.com',
          createdAt: moment('2023-11-01').toDate()
        }),
        auth: {
          isVerified: false,
          emailVerificationExpiresAt: moment().add(1, 'hour').toDate(),
          lastLogin: null
        }
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      const result = await emailVerificationService.getVerificationStatus(mockReq);

      expect(result).toEqual({
        isVerified: false,
        email: 'test@example.com',
        verificationExpiresAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
        lastLogin: null,
        memberSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      });
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;

      await expect(emailVerificationService.getVerificationStatus(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid email format in resendVerification', async () => {
      mockReq.body = { email: 'invalid-email' };

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow();
    });

    test('should handle missing email in request body', async () => {
      mockReq.body = {};

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow();
    });

    test('should handle missing token in confirmVerification', async () => {
      mockReq.body = {};

      await expect(emailVerificationService.confirmVerification(mockReq)).rejects.toThrow();
    });

    test('should handle missing token and password in confirmPasswordReset', async () => {
      mockReq.body = {};

      await expect(emailVerificationService.confirmPasswordReset(mockReq)).rejects.toThrow();
    });

    test('should handle empty password in confirmPasswordReset', async () => {
      mockReq.body = {
        token: 'valid_token',
        newPassword: ''
      };

      await expect(emailVerificationService.confirmPasswordReset(mockReq)).rejects.toThrow();
    });

    test('should handle database errors gracefully', async () => {
      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(emailVerificationService.resendVerification(mockReq)).rejects.toThrow('Database connection failed');
    });
  });
});