import { describe, test, expect, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock the database and other dependencies BEFORE importing app
jest.mock('../../src/config/database.js');
jest.mock('../../src/utils/app-logger.util.js');
jest.mock('../../src/models/model.js');

// Import mocked modules
import { connectDB, sequelize } from '../../src/config/database.js';
import models from '../../src/models/model.js';
const { User, UserAuth, UserToken } = models;

// Import app AFTER mocks are set up
import app from '../../src/app.js';

// Test JWT configuration (must match tests/setup.js app-config mock)
const JWT_SECRET = 'test_jwt_secret_key_for_testing_please_change_this';
const JWT_REFRESH_SECRET = 'test_refresh_secret_please_change_this';

// Helper function to generate real JWT tokens for testing
const generateTestAccessToken = (userId) => {
  return jwt.sign({ id: userId, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
};

const generateTestRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

describe('Authentication Integration Tests', () => {
  let server;

  beforeAll(async () => {
    // Mock database connection
    connectDB.mockResolvedValue();

    // Start the server for testing
    server = app.listen(0); // Use random available port
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password@123',
      firstName: 'Test',
      lastName: 'User'
    };

    test('should register user successfully and return JWT token', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne = jest.fn().mockResolvedValue(null);

      // Mock User.create to return a new user
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        toJSON: () => ({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true
        })
      };
      User.create = jest.fn().mockResolvedValue(mockUser);

      // Mock UserAuth.create
      UserAuth.create = jest.fn().mockResolvedValue({
        userId: 1,
        isVerified: true
      });

      // Mock UserToken.create
      UserToken.create = jest.fn().mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20000',
        data: expect.objectContaining({
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com'
          })
        })
      });
    });

    test('should return validation errors for invalid data', async () => {
      const invalidData = {
        username: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(422);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '42201'
      });
      // Verify that validation errors are present
      expect(response.body.error).toBeDefined();
      expect(response.body.error.developerMessage).toBeDefined();
    });

    test('should handle duplicate email registration', async () => {
      // Mock User.findOne to return existing user
      const existingUser = {
        id: 1,
        email: 'test@example.com'
      };
      User.findOne = jest.fn().mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '40001'
      });
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login user successfully and return JWT token', async () => {
      const validLoginData = {
        email: 'test@example.com',
        password: 'Password@123'
      };

      // Mock User.findOne to return a user with auth
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        toJSON: () => ({
          id: 1,
          email: 'test@example.com',
          isActive: true
        }),
        auth: {
          userId: 1,
          password: 'Password@123',
          isVerified: true,
          isLocked: jest.fn().mockReturnValue(false),
          comparePassword: jest.fn().mockResolvedValue(true),
          resetFailedAttempts: jest.fn().mockResolvedValue(),
          lastLogin: new Date(),
          save: jest.fn().mockResolvedValue()
        }
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // Mock token creation
      UserToken.create = jest.fn().mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20002',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      });
    });

    test('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword@123'
      };

      // Mock User.findOne to return a user
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        auth: {
          password: 'Password@123',
          isVerified: true,
          isLocked: jest.fn().mockReturnValue(false),
          comparePassword: jest.fn().mockResolvedValue(false),
          incrementFailedAttempts: jest.fn().mockResolvedValue(),
          save: jest.fn().mockResolvedValue()
        }
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '40003'
      });
    });

    test('should return validation errors for missing fields', async () => {
      const invalidData = {
        email: '',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(422);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '42201'
      });
    });
  });

  describe('Protected Routes', () => {
    let authToken;
    let accessToken;

    beforeAll(() => {
      // Generate a real JWT token for testing
      accessToken = generateTestAccessToken(1);
      authToken = `Bearer ${accessToken}`;
    });

    test('should access protected route with valid token', async () => {
      // Mock User.findByPk for auth middleware
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        toJSON: () => ({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdAt: new Date()
        })
      };
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      User.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        auth: {
          lastLogin: new Date(),
          isVerified: true,
          failedAttempts: 0
        }
      });

      // Mock UserToken.findOne to return valid token
      UserToken.findOne = jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        accessToken: accessToken,
        isActive: true,
        isAccessTokenExpired: jest.fn().mockReturnValue(false),
        lastUsedAt: new Date(),
        save: jest.fn().mockResolvedValue()
      });

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true
      });
    });

    test('should reject access to protected route without token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect(400);

      expect(response.body).toMatchObject({
        status: false
      });
    });

    test('should reject access to protected route with invalid token', async () => {
      // Mock UserToken.findOne to return null (invalid token)
      UserToken.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(400);

      expect(response.body).toMatchObject({
        status: false
      });
    });

    test('should update user profile with valid token', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      // Mock User.findByPk for auth middleware
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: () => ({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Updated',
          lastName: 'Name',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        save: jest.fn().mockResolvedValue()
      };
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      User.findOne = jest.fn()
        .mockResolvedValueOnce(mockUser) // First call for update
        .mockResolvedValueOnce({         // Second call for get updated user
          ...mockUser,
          firstName: 'Updated',
          lastName: 'Name'
        });

      // Mock User.update for the update operation
      User.update = jest.fn().mockResolvedValue([1]);

      // Mock UserToken.findOne to return valid token
      UserToken.findOne = jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        accessToken: accessToken,
        isActive: true,
        isAccessTokenExpired: jest.fn().mockReturnValue(false),
        lastUsedAt: new Date(),
        save: jest.fn().mockResolvedValue()
      });

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true
      });
    });

    test('should logout successfully with valid token', async () => {
      // Mock User.findByPk for auth middleware
      const mockUser = {
        id: 1,
        username: 'testuser',
        isActive: true
      };
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // Mock UserToken.findOne to return valid token
      const mockTokenRecord = {
        id: 1,
        userId: 1,
        accessToken: accessToken,
        isActive: true,
        isAccessTokenExpired: jest.fn().mockReturnValue(false),
        lastUsedAt: new Date(),
        save: jest.fn().mockResolvedValue(),
        revoke: jest.fn().mockResolvedValue()
      };
      UserToken.findOne = jest.fn().mockResolvedValue(mockTokenRecord);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true
      });
    });
  });

  describe('GET /api/health', () => {
    test('should return health check status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20000',
        data: expect.objectContaining({
          status: 'healthy'
        })
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found'
      });
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.message).toContain('Unexpected token');
    });

    test('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .post('/api/health')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found'
      });
    });
  });

  describe('Request Headers and Metadata', () => {
    test('should include transaction ID in responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('x-transaction-id', 'test-txn-123')
        .expect(200);

      expect(response.body.transactionId).toBe('test-txn-123');
    });

    test('should handle language preferences', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Language', 'th')
        .expect(200);

      expect(response.body).toMatchObject({
        status: true
      });
    });
  });
});
