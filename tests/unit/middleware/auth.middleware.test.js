import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { authenticate } from '../../../src/middleware/auth.middleware.js';
import { verifyToken } from '../../../src/utils/jwt.util.js';

// Mock dependencies
jest.mock('../../../src/utils/jwt.util.js');
jest.mock('../../../src/models/index.js');

import models from '../../../src/models/index.js';
const { User } = models;

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Extraction', () => {
    test('should extract token from Authorization header with Bearer prefix', async () => {
      const token = 'valid_jwt_token';
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      // Mock successful token verification and user finding
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue({ id: 1, isActive: true });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.header).toHaveBeenCalledWith('Authorization');
    });

    test('should handle missing Authorization header', async () => {
      mockReq.header.mockReturnValue(undefined);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle Authorization header without Bearer prefix', async () => {
      mockReq.header.mockReturnValue('InvalidToken');

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Token Verification', () => {
    test('should proceed with valid token', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, isActive: true };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBe(mockUser);
    });

    test('should reject invalid token', async () => {
      const token = 'invalid_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockReturnValue(null);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle token verification errors', async () => {
      const token = 'malformed_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('User Validation', () => {
    test('should proceed with existing active user', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, username: 'testuser', isActive: true };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockReq.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject non-existent user', async () => {
      const token = 'valid_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(null);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject inactive user', async () => {
      const token = 'valid_token';
      const mockUser = { id: 1, username: 'testuser', isActive: false };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle database errors when finding user', async () => {
      const token = 'valid_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockRejectedValue(new Error('Database connection failed'));

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const token = 'valid_token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      verifyToken.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    test('should use proper error response format', async () => {
      mockReq.header.mockReturnValue(undefined);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          transactionId: expect.any(String),
          resCode: expect.any(String),
          error: expect.objectContaining({
            developerMessage: expect.any(String),
            userMessage: expect.any(String)
          })
        })
      );
    });
  });

  describe('Response Format', () => {
    test('should return structured error response for missing token', async () => {
      mockReq.header.mockReturnValue(undefined);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          resCode: '40006',
          error: expect.objectContaining({
            developerMessage: 'No authentication token, access denied'
          })
        })
      );
    });

    test('should return structured error response for invalid token', async () => {
      mockReq.header.mockReturnValue('Bearer invalid_token');
      verifyToken.mockReturnValue(null);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          resCode: '40007',
          error: expect.objectContaining({
            developerMessage: 'Token is not valid'
          })
        })
      );
    });

    test('should return structured error response for user not found', async () => {
      mockReq.header.mockReturnValue('Bearer valid_token');
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(null);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          resCode: '40403',
          error: expect.objectContaining({
            developerMessage: 'User not found'
          })
        })
      );
    });

    test('should return structured error response for inactive user', async () => {
      const mockUser = { id: 1, isActive: false };

      mockReq.header.mockReturnValue('Bearer valid_token');
      verifyToken.mockReturnValue({ id: 1 });
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          resCode: '40004',
          error: expect.objectContaining({
            developerMessage: 'User account is inactive'
          })
        })
      );
    });
  });
});