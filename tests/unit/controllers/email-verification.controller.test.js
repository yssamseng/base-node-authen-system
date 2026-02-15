import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as emailVerificationController from '../../../src/controllers/email-verification.controller.js';
import * as emailVerificationService from '../../../src/services/email-verification.service.js';

// Mock dependencies
jest.mock('../../../src/services/email-verification.service.js');
jest.mock('../../../src/utils/app-logger.util.js');
jest.mock('../../../src/core/handler.js');

import { response, responseError, genResponseObj } from '../../../src/core/handler.js';

describe('Email Verification Controller', () => {
  let mockReq, mockRes;

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

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock response functions
    response.mockReturnValue(mockRes);
    responseError.mockReturnValue(mockRes);
    genResponseObj.mockReturnValue({
      status: true,
      transactionId: 'test-txn-id',
      resCode: 20000,
      data: {}
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('resendVerificationEmail', () => {
    test('should resend verification email successfully', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockResult = {
        message: 'Verification email sent',
        expiresIn: 3600
      };

      emailVerificationService.resendVerificationEmail.mockResolvedValue(mockResult);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(emailVerificationService.resendVerificationEmail).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, mockResult);
    });

    test('should handle resend verification errors', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockError = new Error('User not found');
      mockError.resCode = 40402;

      emailVerificationService.resendVerificationEmail.mockRejectedValue(mockError);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(emailVerificationService.resendVerificationEmail).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle validation errors', async () => {
      mockReq.body = { email: 'invalid-email' };

      const mockError = new Error('Validation failed');
      mockError.resCode = 40001;

      emailVerificationService.resendVerificationEmail.mockRejectedValue(mockError);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle email service failures', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockError = new Error('Email service failed');
      mockError.resCode = 50001;

      emailVerificationService.resendVerificationEmail.mockRejectedValue(mockError);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });
  });

  describe('verifyEmail', () => {
    test('should confirm email verification successfully', async () => {
      mockReq.body = { token: 'valid_token' };

      const mockResult = {
        message: 'Email verified successfully',
        isVerified: true
      };

      emailVerificationService.verifyEmail.mockResolvedValue(mockResult);

      await emailVerificationController.verifyEmail(mockReq, mockRes);

      expect(emailVerificationService.verifyEmail).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, mockResult);
    });

    test('should handle invalid verification token', async () => {
      mockReq.body = { token: 'invalid_token' };

      const mockError = new Error('Invalid or expired verification token');
      mockError.resCode = 40001;

      emailVerificationService.verifyEmail.mockRejectedValue(mockError);

      await emailVerificationController.verifyEmail(mockReq, mockRes);

      expect(emailVerificationService.verifyEmail).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle missing token in request', async () => {
      mockReq.body = {};

      const mockError = new Error('Token is required');
      mockError.resCode = 40001;

      emailVerificationService.verifyEmail.mockRejectedValue(mockError);

      await emailVerificationController.verifyEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle database errors during verification', async () => {
      mockReq.body = { token: 'valid_token' };

      const mockError = new Error('Database connection failed');

      emailVerificationService.verifyEmail.mockRejectedValue(mockError);

      await emailVerificationController.verifyEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });
  });

  describe('requestPasswordReset', () => {
    test('should request password reset successfully', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockResult = {
        message: 'If an account with this email exists, a password reset link has been sent',
        expiresIn: 3600
      };

      emailVerificationService.requestPasswordReset.mockResolvedValue(mockResult);

      await emailVerificationController.requestPasswordReset(mockReq, mockRes);

      expect(emailVerificationService.requestPasswordReset).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, mockResult);
    });

    test('should handle requests for non-existent emails gracefully', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };

      const mockResult = {
        message: 'If an account with this email exists, a password reset link has been sent'
      };

      emailVerificationService.requestPasswordReset.mockResolvedValue(mockResult);

      await emailVerificationController.requestPasswordReset(mockReq, mockRes);

      expect(response).toHaveBeenCalled();
      expect(responseError).not.toHaveBeenCalled();
    });

    test('should handle invalid email format', async () => {
      mockReq.body = { email: 'invalid-email' };

      const mockError = new Error('Invalid email format');
      mockError.resCode = 40001;

      emailVerificationService.requestPasswordReset.mockRejectedValue(mockError);

      await emailVerificationController.requestPasswordReset(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle missing email in request', async () => {
      mockReq.body = {};

      const mockError = new Error('Email is required');
      mockError.resCode = 40001;

      emailVerificationService.requestPasswordReset.mockRejectedValue(mockError);

      await emailVerificationController.requestPasswordReset(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });
  });

  describe('resetPassword', () => {
    test('should confirm password reset successfully', async () => {
      mockReq.body = {
        token: 'valid_reset_token',
        newPassword: 'newPassword123'
      };

      const mockResult = {
        message: 'Password reset successfully'
      };

      emailVerificationService.resetPassword.mockResolvedValue(mockResult);

      await emailVerificationController.resetPassword(mockReq, mockRes);

      expect(emailVerificationService.resetPassword).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20014, mockResult);
    });

    test('should handle invalid reset token', async () => {
      mockReq.body = {
        token: 'invalid_token',
        newPassword: 'newPassword123'
      };

      const mockError = new Error('Invalid or expired reset token');
      mockError.resCode = 40111;

      emailVerificationService.resetPassword.mockRejectedValue(mockError);

      await emailVerificationController.resetPassword(mockReq, mockRes);

      expect(emailVerificationService.resetPassword).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle weak password validation', async () => {
      mockReq.body = {
        token: 'valid_token',
        newPassword: '123' // Too weak
      };

      const mockError = new Error('Password is too weak');
      mockError.resCode = 40001;

      emailVerificationService.resetPassword.mockRejectedValue(mockError);

      await emailVerificationController.resetPassword(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle missing token in password reset', async () => {
      mockReq.body = {
        newPassword: 'newPassword123'
      };

      const mockError = new Error('Reset token is required');
      mockError.resCode = 40001;

      emailVerificationService.resetPassword.mockRejectedValue(mockError);

      await emailVerificationController.resetPassword(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle missing password in password reset', async () => {
      mockReq.body = {
        token: 'valid_token'
      };

      const mockError = new Error('New password is required');
      mockError.resCode = 40001;

      emailVerificationService.resetPassword.mockRejectedValue(mockError);

      await emailVerificationController.resetPassword(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });
  });

  describe('checkVerificationStatus', () => {
    test('should get verification status successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockResult = {
        isVerified: true,
        email: 'test@example.com',
        verificationExpiresAt: null,
        lastLogin: '2023-12-01 12:00:00',
        memberSince: '2023-11-01'
      };

      emailVerificationService.checkVerificationStatus.mockResolvedValue(mockResult);

      await emailVerificationController.checkVerificationStatus(mockReq, mockRes);

      expect(emailVerificationService.checkVerificationStatus).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, mockResult);
    });

    test('should handle verification status retrieval errors', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockError = new Error('User not found');
      mockError.resCode = 40402;

      emailVerificationService.checkVerificationStatus.mockRejectedValue(mockError);

      await emailVerificationController.checkVerificationStatus(mockReq, mockRes);

      expect(emailVerificationService.checkVerificationStatus).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;

      const mockError = new Error('User not found');
      mockError.resCode = 40402;

      emailVerificationService.checkVerificationStatus.mockRejectedValue(mockError);

      await emailVerificationController.checkVerificationStatus(mockReq, mockRes);

      expect(emailVerificationService.checkVerificationStatus).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle database errors during status retrieval', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockError = new Error('Database connection failed');

      emailVerificationService.checkVerificationStatus.mockRejectedValue(mockError);

      await emailVerificationController.checkVerificationStatus(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });
  });

  describe('Request Processing', () => {
    test('should pass complete request object to service', async () => {
      mockReq = {
        body: {
          email: 'test@example.com'
        },
        headers: {
          'x-transaction-id': 'test-transaction-id'
        },
        get: jest.fn().mockReturnValue('test-transaction-id')
      };

      const mockResult = {
        message: 'Verification email sent',
        expiresIn: 3600
      };

      emailVerificationService.resendVerificationEmail.mockResolvedValue(mockResult);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(emailVerificationService.resendVerificationEmail).toHaveBeenCalledWith(mockReq);
    });

    test('should handle requests without transaction ID', async () => {
      mockReq = {
        body: {
          email: 'test@example.com'
        },
        headers: {},
        get: jest.fn().mockReturnValue(undefined)
      };

      const mockResult = {
        message: 'Verification email sent',
        expiresIn: 3600
      };

      emailVerificationService.resendVerificationEmail.mockResolvedValue(mockResult);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(emailVerificationService.resendVerificationEmail).toHaveBeenCalledWith(mockReq);
    });
  });

  describe('Error Edge Cases', () => {
    test('should handle null request body', async () => {
      mockReq.body = null;

      const mockError = new Error('Request body is null');

      emailVerificationService.resendVerificationEmail.mockRejectedValue(mockError);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle undefined request body', async () => {
      mockReq.body = undefined;

      const mockError = new Error('Request body is undefined');

      emailVerificationService.resendVerificationEmail.mockRejectedValue(mockError);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle service errors without resCode', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockError = new Error('Unexpected error');

      emailVerificationService.resendVerificationEmail.mockRejectedValue(mockError);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle timeout errors', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockError = new Error('Request timeout');
      mockError.code = 'TIMEOUT';

      emailVerificationService.resendVerificationEmail.mockRejectedValue(mockError);

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });
  });

  describe('Response Code Generation', () => {
    test('should generate correct response codes for each operation', async () => {
      // Test resend verification
      mockReq.body = { email: 'test@example.com' };
      emailVerificationService.resendVerificationEmail.mockResolvedValue({
        message: 'Verification email sent',
        expiresIn: 3600
      });

      await emailVerificationController.resendVerificationEmail(mockReq, mockRes);
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, expect.any(Object));

      // Test confirm verification
      mockReq.body = { token: 'valid_token' };
      emailVerificationService.verifyEmail.mockResolvedValue({
        message: 'Email verified successfully',
        isVerified: true
      });

      await emailVerificationController.verifyEmail(mockReq, mockRes);
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, expect.any(Object));

      // Test request password reset
      mockReq.body = { email: 'test@example.com' };
      emailVerificationService.requestPasswordReset.mockResolvedValue({
        message: 'If an account with this email exists, a password reset link has been sent'
      });

      await emailVerificationController.requestPasswordReset(mockReq, mockRes);
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, expect.any(Object));

      // Test confirm password reset
      mockReq.body = {
        token: 'valid_token',
        newPassword: 'newPassword123'
      };
      emailVerificationService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully'
      });

      await emailVerificationController.resetPassword(mockReq, mockRes);
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, expect.any(Object));

      // Test get verification status
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      emailVerificationService.checkVerificationStatus.mockResolvedValue({
        isVerified: true,
        email: 'test@example.com'
      });

      await emailVerificationController.checkVerificationStatus(mockReq, mockRes);
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, 20000, expect.any(Object));
    });
  });
});