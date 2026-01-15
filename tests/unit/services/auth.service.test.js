import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as authService from '../../../src/services/auth.service.js';
import { genErrorResponseObj } from '../../../src/core/handler.js';
import { generateTokenPair } from '../../../src/utils/jwt.util.js';
import moment from 'moment';

// Mock dependencies
jest.mock('../../../src/core/handler.js');
jest.mock('../../../src/utils/jwt.util.js');
jest.mock('../../../src/utils/db.util.js');
jest.mock('../../../src/models/model.js');

import { findOne, create } from '../../../src/utils/db.util.js';
import models from '../../../src/models/model.js';
const { User, UserAuth } = models;

describe('Auth Service', () => {
  let mockReq, mockTransaction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      body: {},
      user: null,
      headers: {},
      get: jest.fn(),
      header: jest.fn()
    };

    // Mock transaction object
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
      finished: false
    };

    // Mock generateTokenPair
    generateTokenPair.mockReturnValue({ accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' });

    // Mock genErrorResponseObj
    genErrorResponseObj.mockImplementation((_req, code, message) => {
      const error = new Error(message);
      error.resCode = code;
      return error;
    });

    // Mock User and UserAuth model methods
    User.findOne = jest.fn();
    User.findByPk = jest.fn();
    UserAuth.findOne = jest.fn();
    UserAuth.create = jest.fn();
    UserAuth.save = jest.fn();
    UserAuth.incrementFailedAttempts = jest.fn();
    UserAuth.resetFailedAttempts = jest.fn();
    UserAuth.isLocked = jest.fn();
    UserAuth.comparePassword = jest.fn();
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

    test('should register new user successfully', async () => {
      const mockUser = { id: 1, ...validUserData, toJSON: () => ({ id: 1, ...validUserData }) };
      const mockUserAuth = { userId: 1, password: 'hashed_password' };

      mockReq.body = validUserData;
      findOne
        .mockResolvedValueOnce(null) // No existing user with email
        .mockResolvedValueOnce(null); // No existing user with username
      create
        .mockResolvedValueOnce(mockUser) // Create user
        .mockResolvedValueOnce(mockUserAuth); // Create user auth

      const result = await authService.register(mockReq, mockTransaction);

      expect(findOne).toHaveBeenNthCalledWith(1, User, { criteria: { email: validUserData.email } });
      expect(findOne).toHaveBeenNthCalledWith(2, User, { criteria: { username: validUserData.username } });
      expect(create).toHaveBeenNthCalledWith(1, User, {
        data: {
          username: validUserData.username,
          email: validUserData.email,
          firstName: validUserData.firstName,
          lastName: validUserData.lastName
        },
        transaction: mockTransaction
      });
      expect(create).toHaveBeenNthCalledWith(2, UserAuth, {
        data: {
          userId: mockUser.id,
          password: validUserData.password,
          isVerified: true
        },
        transaction: mockTransaction
      });
      expect(generateTokenPair).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        user: mockUser.toJSON(),
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: expect.any(Number),
        isVerified: true
      });
    });

    test('should throw error if email already exists', async () => {
      const existingUser = { id: 1, email: validUserData.email };

      mockReq.body = validUserData;
      findOne.mockResolvedValueOnce(existingUser);

      await expect(authService.register(mockReq, mockTransaction)).rejects.toThrow('User with this email already exists');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40001', 'User with this email already exists');
      expect(create).not.toHaveBeenCalled();
    });

    test('should throw error if username already exists', async () => {
      const existingUser = { id: 1, username: validUserData.username };

      mockReq.body = validUserData;
      findOne
        .mockResolvedValueOnce(null) // No existing email
        .mockResolvedValueOnce(existingUser); // Existing username

      await expect(authService.register(mockReq, mockTransaction)).rejects.toThrow('Username is already taken');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40002', 'Username is already taken');
      expect(create).not.toHaveBeenCalled();
    });

    test('should handle database errors during user creation', async () => {
      const dbError = new Error('Database error');

      mockReq.body = validUserData;
      findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      create.mockRejectedValueOnce(dbError);

      await expect(authService.register(mockReq, mockTransaction)).rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    test('should login user successfully', async () => {
      const mockUser = {
        id: 1,
        email: validLoginData.email,
        isActive: true,
        toJSON: () => ({ id: 1, email: validLoginData.email, isActive: true }),
        auth: {
          lastLogin: moment().toDate(),
          isVerified: false,
          isLocked: jest.fn().mockReturnValue(false),
          comparePassword: jest.fn().mockResolvedValue(true),
          resetFailedAttempts: jest.fn().mockResolvedValue(),
          save: jest.fn().mockResolvedValue()
        }
      };

      mockReq.body = validLoginData;
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.login(mockReq);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: validLoginData.email },
        include: [{
          model: UserAuth,
          as: 'auth'
        }]
      });
      expect(mockUser.auth.isLocked).toHaveBeenCalled();
      expect(mockUser.auth.comparePassword).toHaveBeenCalledWith(validLoginData.password);
      expect(mockUser.auth.resetFailedAttempts).toHaveBeenCalled();
      expect(mockUser.auth.save).toHaveBeenCalled();
      expect(generateTokenPair).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        user: mockUser.toJSON(),
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: expect.any(Number),
        lastLogin: expect.any(String),
        isVerified: false
      });
    });

    test('should throw error if user not found', async () => {
      mockReq.body = validLoginData;
      User.findOne.mockResolvedValue(null);

      await expect(authService.login(mockReq)).rejects.toThrow('Invalid email or password');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40003', 'Invalid email or password');
    });

    test('should throw error if user is inactive', async () => {
      const mockUser = {
        id: 1,
        email: validLoginData.email,
        isActive: false,
        auth: {}
      };

      mockReq.body = validLoginData;
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.login(mockReq)).rejects.toThrow('Your account has been deactivated');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40004', 'Your account has been deactivated');
    });

    test('should throw error if user auth data not found', async () => {
      const mockUser = {
        id: 1,
        email: validLoginData.email,
        isActive: true,
        auth: null
      };

      mockReq.body = validLoginData;
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.login(mockReq)).rejects.toThrow('Authentication data not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40008', 'Authentication data not found');
    });

    test('should throw error if account is locked', async () => {
      const mockUser = {
        id: 1,
        email: validLoginData.email,
        isActive: true,
        auth: {
          isLocked: jest.fn().mockReturnValue(true),
          lockedUntil: moment().add(30, 'minutes').toDate() // 30 minutes from now
        }
      };

      mockReq.body = validLoginData;
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.login(mockReq)).rejects.toThrow('Account is locked until');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40005', expect.stringContaining('Account is locked until'));
    });

    test('should throw error if password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: validLoginData.email,
        isActive: true,
        auth: {
          isLocked: jest.fn().mockReturnValue(false),
          comparePassword: jest.fn().mockResolvedValue(false),
          incrementFailedAttempts: jest.fn().mockResolvedValue()
        }
      };

      mockReq.body = validLoginData;
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.login(mockReq)).rejects.toThrow('Invalid email or password');
      expect(mockUser.auth.comparePassword).toHaveBeenCalledWith(validLoginData.password);
      expect(mockUser.auth.incrementFailedAttempts).toHaveBeenCalled();
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40003', 'Invalid email or password');
    });
  });

  describe('logout', () => {
    test('should logout successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const result = await authService.logout(mockReq);

      expect(result).toEqual({
        message: 'Logged out successfully',
        logoutTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      });
    });

    test('should always return logout time regardless of user context', async () => {
      // Logout should work even without req.user
      mockReq.user = null;
      const result = await authService.logout(mockReq);

      expect(result).toHaveProperty('logoutTime');
      expect(typeof result.logoutTime).toBe('string');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(authService.login(mockReq)).rejects.toThrow('Database connection failed');
    });

    test('should handle unexpected errors gracefully', async () => {
      const validUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };
      mockReq.body = validUserData;
      findOne.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(authService.register(mockReq, mockTransaction)).rejects.toThrow('Unexpected error');
    });
  });
});