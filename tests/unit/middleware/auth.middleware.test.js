import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { authenticate } from '../../../src/middleware/auth.middleware.js';
import { verifyAccessToken } from '../../../src/utils/jwt.util.js';

// Mock dependencies
jest.mock('../../../src/utils/jwt.util.js');
jest.mock('../../../src/models/model.js');
jest.mock('../../../src/core/handler.js');
jest.mock('../../../src/utils/trace.util.js');

import models from '../../../src/models/model.js';
import { responseError, genErrorResponseObj } from '../../../src/core/handler.js';
import { runWithTrace } from '../../../src/utils/trace.util.js';

const { User, UserToken } = models;

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      header: jest.fn(),
      get: jest.fn(),
      headers: {}
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock next function
    mockNext = jest.fn();

    // Mock User model
    User.findByPk = jest.fn();
    UserToken.findOne = jest.fn();

    // Mock response functions
    responseError.mockReturnValue(mockRes);
    genErrorResponseObj.mockReturnValue({
      resCode: 'TEST_CODE',
      message: 'Test error message'
    });

    // Mock runWithTrace to call the next function
    runWithTrace.mockImplementation((store, callback) => {
      callback();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Extraction', () => {
    test('should extract token from Authorization header with Bearer prefix', async () => {
      const token = 'valid_jwt_token';
      const mockUser = { id: 1, isActive: true };
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      // Mock successful token verification
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });

      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.header).toHaveBeenCalledWith('Authorization');
      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(UserToken.findOne).toHaveBeenCalledWith({
        where: {
          accessToken: token,
          isActive: true,
          userId: 1
        }
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle missing Authorization header with error code 40006', async () => {
      mockReq.header.mockReturnValue(undefined);

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 40100, 'No authentication token, access denied');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle Authorization header without Bearer prefix', async () => {
      mockReq.header.mockReturnValue('InvalidToken');

      await authenticate(mockReq, mockRes, mockNext);

      expect(verifyAccessToken).toHaveBeenCalledWith('InvalidToken');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Token Verification', () => {
    test('should proceed with valid token', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, isActive: true };
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.token).toBe(mockTokenRecord);
    });

    test('should reject expired token with error code 40103', async () => {
      const token = 'expired_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: false,
        error: 'TokenExpiredError'
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 40112, 'Token has expired');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid JWT token with error code 40007', async () => {
      const token = 'invalid_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: false,
        error: 'JsonWebTokenError'
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 40111, 'Token is not valid');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject token that is not in database', async () => {
      const token = 'valid_but_not_in_db_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(null);

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 40111, 'Token is not valid or has been revoked');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('User Validation', () => {
    test('should proceed with existing active user', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, isActive: true };
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockReq.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject non-existent user with error code 40403', async () => {
      const token = 'valid_token';
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(null);

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 40402, 'User not found');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject inactive user with error code 40004', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, isActive: false };
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 40310, 'User account is inactive');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    test('should update token last used timestamp', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, isActive: true };
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        revoke: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockTokenRecord.lastUsedAt).toBeDefined();
      expect(mockTokenRecord.save).toHaveBeenCalled();
      expect(mockReq.token).toBe(mockTokenRecord);
    });

    test('should handle expired access token in database', async () => {
      const token = 'expired_but_valid_jwt_token';
      const mockTokenRecord = {
        revoke: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(true)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockTokenRecord.revoke).toHaveBeenCalled();
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 40112, 'Access token has expired');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors during token lookup', async () => {
      const token = 'valid_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockRejectedValue(new Error('Database error'));

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 50000, 'Server error during authentication');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle errors during user lookup', async () => {
      const token = 'valid_token';
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockRejectedValue(new Error('Database error'));

      await authenticate(mockReq, mockRes, mockNext);

      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 50000, 'Server error during authentication');
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle errors during token save', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, isActive: true };
      const mockTokenRecord = {
        save: jest.fn().mockRejectedValue(new Error('Save error')),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      // Should not throw error if save fails, middleware should continue
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, 50000, 'Server error during authentication');
    });
  });

  describe('Request Tracing', () => {
    test('should call runWithTrace with user context', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, isActive: true };
      const mockTokenRecord = {
        save: jest.fn().mockResolvedValue(),
        isAccessTokenExpired: jest.fn().mockReturnValue(false)
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyAccessToken.mockReturnValue({
        valid: true,
        decoded: { id: 1 }
      });
      UserToken.findOne.mockResolvedValue(mockTokenRecord);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(runWithTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          correlation_id: expect.any(String),
          user_id: 1
        }),
        expect.any(Function)
      );
    });
  });
});