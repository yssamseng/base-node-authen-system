import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as authController from '../../../src/controllers/auth.controller.js';
import * as authService from '../../../src/services/auth.service.js';

// Mock dependencies
jest.mock('../../../src/services/auth.service.js');
jest.mock('../../../src/config/database.js');
jest.mock('../../../src/core/app-logger.js');
jest.mock('../../../src/core/handler.js');

import { sequelize } from '../../../src/config/database.js';
import { response, responseError, genResponseObj } from '../../../src/core/handler.js';

describe('Auth Controller', () => {
  let mockReq, mockRes, mockTransaction;

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

    // Mock Sequelize transaction
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
      finished: false
    };

    // Mock sequelize transaction method
    sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

    // Mock response functions
    response.mockReturnValue(mockRes);
    responseError.mockReturnValue(mockRes);
    genResponseObj.mockReturnValue({
      status: true,
      transactionId: 'test-txn-id',
      resCode: '20000',
      data: {}
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    test('should register user successfully', async () => {
      const mockResult = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'jwt_token_here'
      };

      mockReq.body = validUserData;
      authService.register.mockResolvedValue(mockResult);

      await authController.register(mockReq, mockRes);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(authService.register).toHaveBeenCalledWith(mockReq, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
    });

    test('should handle registration errors and rollback transaction', async () => {
      const mockError = new Error('Email already exists');
      mockError.resCode = '40001';

      mockReq.body = validUserData;
      authService.register.mockRejectedValue(mockError);

      await authController.register(mockReq, mockRes);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(authService.register).toHaveBeenCalledWith(mockReq, mockTransaction);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should not rollback if transaction is already finished', async () => {
      const mockError = new Error('Database error');
      mockTransaction.finished = true;

      mockReq.body = validUserData;
      authService.register.mockRejectedValue(mockError);

      await authController.register(mockReq, mockRes);

      expect(mockTransaction.rollback).not.toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle validation errors', async () => {
      const invalidData = { username: '', email: 'invalid' };

      mockReq.body = invalidData;
      const mockError = new Error('Validation failed');
      authService.register.mockRejectedValue(mockError);

      await authController.register(mockReq, mockRes);

      expect(responseError).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    test('should login user successfully', async () => {
      const mockResult = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'jwt_token_here',
        lastLogin: '2023-12-01 12:00:00',
        isVerified: false
      };

      mockReq.body = validLoginData;
      authService.login.mockResolvedValue(mockResult);

      await authController.login(mockReq, mockRes);

      expect(authService.login).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
    });

    test('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      mockError.resCode = '40003';

      mockReq.body = validLoginData;
      authService.login.mockRejectedValue(mockError);

      await authController.login(mockReq, mockRes);

      expect(authService.login).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle database errors during login', async () => {
      const mockError = new Error('Database connection failed');

      mockReq.body = validLoginData;
      authService.login.mockRejectedValue(mockError);

      await authController.login(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });
  });

  describe('getProfile', () => {
    test('should get user profile successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockResult = {
        user: mockUser,
        lastLogin: '2023-12-01 12:00:00',
        memberSince: '2023-11-01',
        isVerified: false
      };

      authService.getProfile.mockResolvedValue(mockResult);

      await authController.getProfile(mockReq, mockRes);

      expect(authService.getProfile).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
    });

    test('should handle profile retrieval errors', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockError = new Error('User not found');
      mockError.resCode = '40403';

      authService.getProfile.mockRejectedValue(mockError);

      await authController.getProfile(mockReq, mockRes);

      expect(authService.getProfile).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;

      await authController.getProfile(mockReq, mockRes);

      expect(authService.getProfile).toHaveBeenCalled();
      // Service should handle the null user case
    });
  });

  describe('updateProfile', () => {
    test('should update user profile successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockResult = {
        user: { ...mockUser, firstName: 'Updated', lastName: 'Name' },
        updatedAt: '2023-12-01 12:00:00'
      };

      authService.updateProfile.mockResolvedValue(mockResult);

      await authController.updateProfile(mockReq, mockRes);

      expect(authService.updateProfile).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
    });

    test('should handle partial profile updates', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = {
        firstName: 'Updated'
        // lastName is not provided
      };

      const mockResult = {
        user: { ...mockUser, firstName: 'Updated' },
        updatedAt: '2023-12-01 12:00:00'
      };

      authService.updateProfile.mockResolvedValue(mockResult);

      await authController.updateProfile(mockReq, mockRes);

      expect(authService.updateProfile).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalled();
    });

    test('should handle profile update errors', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockError = new Error('Update failed');
      mockError.resCode = '50000';

      authService.updateProfile.mockRejectedValue(mockError);

      await authController.updateProfile(mockReq, mockRes);

      expect(authService.updateProfile).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    test('should logout user successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockResult = {
        logoutTime: '2023-12-01 12:00:00'
      };

      authService.logout.mockResolvedValue(mockResult);

      await authController.logout(mockReq, mockRes);

      expect(authService.logout).toHaveBeenCalledWith();
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
    });

    test('should handle logout errors', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockError = new Error('Logout failed');
      mockError.resCode = '50000';

      authService.logout.mockRejectedValue(mockError);

      await authController.logout(mockReq, mockRes);

      expect(authService.logout).toHaveBeenCalledWith();
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle logout even without user context', async () => {
      mockReq.user = null;

      const mockResult = {
        logoutTime: '2023-12-01 12:00:00'
      };

      authService.logout.mockResolvedValue(mockResult);

      await authController.logout(mockReq, mockRes);

      expect(authService.logout).toHaveBeenCalledWith();
      expect(response).toHaveBeenCalled();
    });
  });

  describe('Response Generation', () => {
    test('should generate correct response object for successful operations', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockResult = {
        user: mockUser,
        lastLogin: '2023-12-01 12:00:00',
        memberSince: '2023-11-01',
        isVerified: false
      };

      authService.getProfile.mockResolvedValue(mockResult);

      await authController.getProfile(mockReq, mockRes);

      expect(genResponseObj).toHaveBeenCalledWith(mockReq, '20000', mockResult);
    });

    test('should generate correct response object for login', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        user: { id: 1, email: 'test@example.com' },
        token: 'jwt_token'
      };

      authService.login.mockResolvedValue(mockResult);

      await authController.login(mockReq, mockRes);

      expect(genResponseObj).toHaveBeenCalledWith(mockReq, '20002', mockResult);
    });
  });
});