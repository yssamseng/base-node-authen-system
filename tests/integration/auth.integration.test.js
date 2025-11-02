import { describe, test, expect, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

// Mock the database and other dependencies for integration tests
jest.mock('../../src/config/database.js');
jest.mock('../../src/core/app-logger.js');

import { connectDB } from '../../src/config/database.js';

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
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    test('should register user successfully and return JWT token', async () => {
      // Mock the service to simulate successful registration
      const mockAuthService = await import('../../src/services/auth.service.js');
      const mockRegister = jest.fn().mockResolvedValue({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true
        },
        token: 'mock_jwt_token_12345'
      });

      mockAuthService.default.register = mockRegister;

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20001',
        data: {
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com'
          }),
          token: 'mock_jwt_token_12345'
        }
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
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'username',
            message: expect.any(String)
          })
        ])
      });
    });

    test('should handle duplicate email registration', async () => {
      const mockAuthService = await import('../../src/services/auth.service.js');
      const mockRegister = jest.fn().mockImplementation(() => {
        const error = new Error('User with this email already exists');
        error.resCode = '40001';
        throw error;
      });

      mockAuthService.default.register = mockRegister;

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '40001',
        error: expect.objectContaining({
          developerMessage: 'User with this email already exists'
        })
      });
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    test('should login user successfully and return JWT token', async () => {
      const mockAuthService = await import('../../src/services/auth.service.js');
      const mockLogin = jest.fn().mockResolvedValue({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true
        },
        token: 'mock_jwt_token_67890',
        lastLogin: '2023-12-01 12:00:00',
        isVerified: false
      });

      mockAuthService.default.login = mockLogin;

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20002',
        data: {
          user: expect.objectContaining({
            email: 'test@example.com'
          }),
          token: 'mock_jwt_token_67890',
          lastLogin: '2023-12-01 12:00:00',
          isVerified: false
        }
      });
    });

    test('should return error for invalid credentials', async () => {
      const mockAuthService = await import('../../src/services/auth.service.js');
      const mockLogin = jest.fn().mockImplementation(() => {
        const error = new Error('Invalid email or password');
        error.resCode = '40003';
        throw error;
      });

      mockAuthService.default.login = mockLogin;

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '40003',
        error: expect.objectContaining({
          developerMessage: 'Invalid email or password'
        })
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
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String)
          }),
          expect.objectContaining({
            field: 'password',
            message: expect.any(String)
          })
        ])
      });
    });
  });

  describe('Protected Routes', () => {
    let authToken;

    beforeEach(() => {
      authToken = 'Bearer valid_jwt_token_for_test';
    });

    test('should access protected route with valid token', async () => {
      const mockAuthService = await import('../../src/services/auth.service.js');
      const mockGetProfile = jest.fn().mockResolvedValue({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        lastLogin: '2023-12-01 12:00:00',
        memberSince: '2023-11-01',
        isVerified: false
      });

      mockAuthService.default.getProfile = mockGetProfile;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20000',
        data: {
          user: expect.objectContaining({
            username: 'testuser'
          }),
          lastLogin: '2023-12-01 12:00:00',
          memberSince: '2023-11-01',
          isVerified: false
        }
      });
    });

    test('should reject access to protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '40006',
        error: expect.objectContaining({
          developerMessage: 'No authentication token, access denied'
        })
      });
    });

    test('should reject access to protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toMatchObject({
        status: false,
        resCode: '40007',
        error: expect.objectContaining({
          developerMessage: 'Token is not valid'
        })
      });
    });

    test('should update user profile with valid token', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockAuthService = await import('../../src/services/auth.service.js');
      const mockUpdateProfile = jest.fn().mockResolvedValue({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Updated',
          lastName: 'Name'
        },
        updatedAt: '2023-12-01 12:30:00'
      });

      mockAuthService.default.updateProfile = mockUpdateProfile;

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20004',
        data: {
          user: expect.objectContaining({
            firstName: 'Updated',
            lastName: 'Name'
          }),
          updatedAt: '2023-12-01 12:30:00'
        }
      });
    });

    test('should logout successfully with valid token', async () => {
      const mockAuthService = await import('../../src/services/auth.service.js');
      const mockLogout = jest.fn().mockResolvedValue({
        logoutTime: '2023-12-01 13:00:00'
      });

      mockAuthService.default.logout = mockLogout;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: '20003',
        data: {
          logoutTime: '2023-12-01 13:00:00'
        }
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
        data: {
          status: 'API is running'
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String)
      });
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String)
      });
    });

    test('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/auth/login')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String)
      });
    });
  });

  describe('Request Headers and Metadata', () => {
    test('should include transaction ID in responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Transaction-ID', 'test-transaction-123')
        .expect(200);

      expect(response.body.transactionId).toBe('test-transaction-123');
    });

    test('should handle language preferences', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Language', 'th')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      // Error message should be in Thai when language header is set to 'th'
      expect(response.body.error.userMessage).toBeDefined();
    });
  });
});