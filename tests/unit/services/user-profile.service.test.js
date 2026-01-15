import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as userProfileService from '../../../src/services/user-profile.service.js';
import { genErrorResponseObj } from '../../../src/core/handler.js';
import moment from 'moment';

// Mock dependencies
jest.mock('../../../src/core/handler.js');
jest.mock('../../../src/utils/db.util.js');
jest.mock('../../../src/models/model.js');

import { findOne, update } from '../../../src/utils/db.util.js';
import models from '../../../src/models/model.js';
const { User } = models;

describe('User Profile Service', () => {
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

    // Mock User model methods
    User.findByPk = jest.fn();
    User.findOne = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProfile', () => {
    test('should get user profile successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: moment('2023-11-01').toDate(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdAt: moment('2023-11-01').toDate()
        }),
        auth: {
          lastLogin: moment('2023-12-01 12:00:00').toDate(),
          isVerified: true,
          failedAttempts: 0
        }
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      const result = await userProfileService.getProfile(mockReq);

      expect(findOne).toHaveBeenCalledWith(User, {
        pk: 1,
        include: [{
          model: models.UserAuth,
          as: 'auth',
          attributes: ['lastLogin', 'isVerified', 'failedAttempts']
        }]
      });
      expect(result).toEqual({
        user: expect.any(Object),
        lastLogin: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
        memberSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        isVerified: true
      });
    });

    test('should throw error if user not found', async () => {
      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(null);

      await expect(userProfileService.getProfile(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
    });

    test('should handle user without auth data', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: moment().toDate(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdAt: moment().toDate()
        }),
        auth: null
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      const result = await userProfileService.getProfile(mockReq);

      expect(result).toEqual({
        user: expect.any(Object),
        lastLogin: null,
        memberSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        isVerified: false
      });
    });

    test('should handle database errors', async () => {
      mockReq.user = { id: 1 };
      findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(userProfileService.getProfile(mockReq)).rejects.toThrow('Database connection failed');
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;

      await expect(userProfileService.getProfile(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
    });
  });

  describe('updateProfile', () => {
    const mockExistingUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Old',
      lastName: 'Name',
      updatedAt: moment('2023-12-01 12:00:00').toDate(),
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        updatedAt: moment().toDate()
      })
    };

    test('should update user profile successfully', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      findOne
        .mockResolvedValueOnce(mockExistingUser) // Find existing user
        .mockResolvedValueOnce(mockExistingUser); // Return updated user

      update.mockResolvedValue(mockExistingUser);

      const result = await userProfileService.updateProfile(mockReq);

      expect(findOne).toHaveBeenCalledWith(User, { pk: 1 });
      expect(update).toHaveBeenCalledWith(User, {
        data: {
          firstName: 'Updated',
          lastName: 'Name'
        },
        criteria: { id: 1 }
      });
      expect(result).toEqual({
        user: expect.any(Object),
        updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      });
    });

    test('should update only provided fields', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = {
        firstName: 'Updated'
        // lastName not provided
      };

      findOne
        .mockResolvedValueOnce(mockExistingUser)
        .mockResolvedValueOnce(mockExistingUser);

      update.mockResolvedValue(mockExistingUser);

      await userProfileService.updateProfile(mockReq);

      expect(update).toHaveBeenCalledWith(User, {
        data: {
          firstName: 'Updated'
          // lastName should not be included
        },
        criteria: { id: 1 }
      });
    });

    test('should ignore restricted fields', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = {
        firstName: 'Updated',
        email: 'newemail@example.com', // Should be ignored
        username: 'newusername', // Should be ignored
        isActive: false // Should be ignored
      };

      findOne
        .mockResolvedValueOnce(mockExistingUser)
        .mockResolvedValueOnce(mockExistingUser);

      update.mockResolvedValue(mockExistingUser);

      await userProfileService.updateProfile(mockReq);

      expect(update).toHaveBeenCalledWith(User, {
        data: {
          firstName: 'Updated'
          // email, username, isActive should not be included
        },
        criteria: { id: 1 }
      });
    });

    test('should throw error if user not found', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { firstName: 'Updated' };
      findOne.mockResolvedValue(null);

      await expect(userProfileService.updateProfile(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
      expect(update).not.toHaveBeenCalled();
    });

    test('should handle database errors during update', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = { firstName: 'Updated' };
      findOne.mockResolvedValue(mockExistingUser);
      update.mockRejectedValue(new Error('Update failed'));

      await expect(userProfileService.updateProfile(mockReq)).rejects.toThrow('Update failed');
    });

    test('should handle empty body', async () => {
      mockReq.user = { id: 1 };
      mockReq.body = {};

      findOne
        .mockResolvedValueOnce(mockExistingUser)
        .mockResolvedValueOnce(mockExistingUser);

      update.mockResolvedValue(mockExistingUser);

      await userProfileService.updateProfile(mockReq);

      expect(update).toHaveBeenCalledWith(User, {
        data: {},
        criteria: { id: 1 }
      });
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;
      mockReq.body = { firstName: 'Updated' };

      await expect(userProfileService.updateProfile(mockReq)).rejects.toThrow('User not found');
      expect(genErrorResponseObj).toHaveBeenCalledWith(mockReq, '40403', 'User not found');
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    test('should format memberSince date correctly', async () => {
      const specificDate = moment('2023-06-15').toDate();
      const mockUser = {
        id: 1,
        username: 'testuser',
        createdAt: specificDate,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: 'testuser',
          createdAt: specificDate
        }),
        auth: null
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      const result = await userProfileService.getProfile(mockReq);

      expect(result.memberSince).toBe('2023-06-15');
    });

    test('should format lastLogin date correctly', async () => {
      const specificDate = moment('2023-12-25 15:30:45').toDate();
      const mockUser = {
        id: 1,
        username: 'testuser',
        createdAt: moment().toDate(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: 'testuser',
          createdAt: moment().toDate()
        }),
        auth: {
          lastLogin: specificDate,
          isVerified: true,
          failedAttempts: 0
        }
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      const result = await userProfileService.getProfile(mockReq);

      expect(result.lastLogin).toBe('2023-12-25 15:30:45');
    });

    test('should format updatedAt date correctly', async () => {
      const specificDate = moment('2023-12-30 10:15:30').toDate();
      const mockUser = {
        id: 1,
        username: 'testuser',
        updatedAt: specificDate,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: 'testuser',
          updatedAt: specificDate
        })
      };

      mockReq.user = { id: 1 };
      mockReq.body = { firstName: 'Updated' };

      findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);

      update.mockResolvedValue(mockUser);

      const result = await userProfileService.updateProfile(mockReq);

      expect(result.updatedAt).toBe('2023-12-30 10:15:30');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null values in auth data gracefully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        createdAt: moment().toDate(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: 'testuser',
          createdAt: moment().toDate()
        }),
        auth: {
          lastLogin: null,
          isVerified: false,
          failedAttempts: 0
        }
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      const result = await userProfileService.getProfile(mockReq);

      expect(result).toEqual({
        user: expect.any(Object),
        lastLogin: null,
        memberSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        isVerified: false
      });
    });

    test('should handle malformed date values gracefully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        createdAt: 'invalid-date',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: 'testuser',
          createdAt: 'invalid-date'
        }),
        auth: null
      };

      mockReq.user = { id: 1 };
      findOne.mockResolvedValue(mockUser);

      // Should handle gracefully without crashing
      const result = await userProfileService.getProfile(mockReq);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('memberSince');
    });
  });
});