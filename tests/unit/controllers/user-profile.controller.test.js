import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as userProfileController from '../../../src/controllers/user-profile.controller.js';
import * as userProfileService from '../../../src/services/user-profile.service.js';

// Mock dependencies
jest.mock('../../../src/services/user-profile.service.js');
jest.mock('../../../src/utils/app-logger.util.js');
jest.mock('../../../src/core/handler.js');

import { response, responseError, genResponseObj } from '../../../src/core/handler.js';

describe('User Profile Controller', () => {
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
      resCode: '20000',
      data: {}
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProfile', () => {
    test('should get user profile successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockResult = {
        user: mockUser,
        lastLogin: '2023-12-01 12:00:00',
        memberSince: '2023-11-01',
        isVerified: true
      };

      userProfileService.getProfile.mockResolvedValue(mockResult);

      await userProfileController.getProfile(mockReq, mockRes);

      expect(userProfileService.getProfile).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, '20000', mockResult);
    });

    test('should handle profile retrieval errors', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockError = new Error('User not found');
      mockError.resCode = '40403';

      userProfileService.getProfile.mockRejectedValue(mockError);

      await userProfileController.getProfile(mockReq, mockRes);

      expect(userProfileService.getProfile).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;

      const mockError = new Error('User not found');
      mockError.resCode = '40403';

      userProfileService.getProfile.mockRejectedValue(mockError);

      await userProfileController.getProfile(mockReq, mockRes);

      expect(userProfileService.getProfile).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle database errors during profile retrieval', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockError = new Error('Database connection failed');

      userProfileService.getProfile.mockRejectedValue(mockError);

      await userProfileController.getProfile(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle service errors without resCode', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockError = new Error('Unexpected error');

      userProfileService.getProfile.mockRejectedValue(mockError);

      await userProfileController.getProfile(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
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

      userProfileService.updateProfile.mockResolvedValue(mockResult);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(userProfileService.updateProfile).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
      expect(responseError).not.toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, '20004', mockResult);
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

      userProfileService.updateProfile.mockResolvedValue(mockResult);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(userProfileService.updateProfile).toHaveBeenCalledWith(mockReq);
      expect(response).toHaveBeenCalled();
      expect(genResponseObj).toHaveBeenCalledWith(mockReq, '20004', mockResult);
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

      userProfileService.updateProfile.mockRejectedValue(mockError);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(userProfileService.updateProfile).toHaveBeenCalledWith(mockReq);
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle validation errors', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = {}; // Empty body might trigger validation

      const mockError = new Error('Validation failed');
      mockError.resCode = '42201';

      userProfileService.updateProfile.mockRejectedValue(mockError);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle case where user is not attached to request', async () => {
      mockReq.user = null;
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockError = new Error('User not found');
      mockError.resCode = '40403';

      userProfileService.updateProfile.mockRejectedValue(mockError);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(userProfileService.updateProfile).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle database errors during update', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockError = new Error('Database connection failed');

      userProfileService.updateProfile.mockRejectedValue(mockError);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });

    test('should handle service errors without resCode', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockError = new Error('Unexpected error');

      userProfileService.updateProfile.mockRejectedValue(mockError);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
      expect(response).not.toHaveBeenCalled();
    });
  });

  describe('Request Processing', () => {
    test('should pass complete request object to service', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq = {
        body: {
          firstName: 'Updated',
          lastName: 'Name'
        },
        user: mockUser,
        headers: {
          'x-transaction-id': 'test-transaction-id'
        },
        get: jest.fn().mockReturnValue('test-transaction-id')
      };

      const mockResult = {
        user: { ...mockUser, firstName: 'Updated', lastName: 'Name' },
        updatedAt: '2023-12-01 12:00:00'
      };

      userProfileService.updateProfile.mockResolvedValue(mockResult);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(userProfileService.updateProfile).toHaveBeenCalledWith(mockReq);
    });

    test('should handle requests without transaction ID', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq = {
        body: { firstName: 'Updated' },
        user: mockUser,
        headers: {},
        get: jest.fn().mockReturnValue(undefined)
      };

      const mockResult = {
        user: { ...mockUser, firstName: 'Updated' },
        updatedAt: '2023-12-01 12:00:00'
      };

      userProfileService.updateProfile.mockResolvedValue(mockResult);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(userProfileService.updateProfile).toHaveBeenCalledWith(mockReq);
    });
  });

  describe('Response Generation', () => {
    test('should generate correct response object for successful profile retrieval', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;

      const mockResult = {
        user: mockUser,
        lastLogin: '2023-12-01 12:00:00',
        memberSince: '2023-11-01',
        isVerified: true
      };

      userProfileService.getProfile.mockResolvedValue(mockResult);

      await userProfileController.getProfile(mockReq, mockRes);

      expect(genResponseObj).toHaveBeenCalledWith(mockReq, '20000', mockResult);
    });

    test('should generate correct response object for successful profile update', async () => {
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

      userProfileService.updateProfile.mockResolvedValue(mockResult);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(genResponseObj).toHaveBeenCalledWith(mockReq, '20004', mockResult);
    });
  });

  describe('Error Edge Cases', () => {
    test('should handle null request body', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = null;

      const mockError = new Error('Request body is null');

      userProfileService.updateProfile.mockRejectedValue(mockError);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle undefined request body', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = undefined;

      const mockError = new Error('Request body is undefined');

      userProfileService.updateProfile.mockRejectedValue(mockError);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, mockError);
    });

    test('should handle empty request body object', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.user = mockUser;
      mockReq.body = {};

      const mockResult = {
        user: mockUser,
        updatedAt: '2023-12-01 12:00:00'
      };

      userProfileService.updateProfile.mockResolvedValue(mockResult);

      await userProfileController.updateProfile(mockReq, mockRes);

      expect(response).toHaveBeenCalled();
    });
  });
});