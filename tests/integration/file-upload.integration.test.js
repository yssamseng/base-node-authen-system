/**
 * Integration tests for file upload endpoints
 * @module tests/integration/file-upload
 */

import { describe, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';

// Mock dependencies BEFORE importing app
jest.mock('../../src/config/database.js');
jest.mock('../../src/models/model.js');
jest.mock('../../src/utils/app-logger.util.js');
jest.mock('../../src/services/file-upload.service.js');

// Import mocked modules
import models from '../../src/models/model.js';
const { User, UserAuth, UserToken } = models;

// Import app AFTER mocks are set up
import app from '../../src/app.js';

import { genResponseObj, genErrorResponseObj, responseError } from '../../src/core/handler.js';
import { RES_CODE } from '../../src/config/constants.js';

describe('File Upload Integration Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Mock User.findOne to return null for registration checks (email and username)
    User.findOne = jest.fn().mockImplementation((options) => {
      // During registration, check if email or username exists - return null
      if (options && options.where) {
        if (options.where.email === 'fileupload@example.com' || options.where.username === 'fileuploaduser') {
          return Promise.resolve(null); // User doesn't exist yet
        }
      }
      // After registration, return the mock user
      const mockUser = {
        id: 1,
        username: 'fileuploaduser',
        email: 'fileupload@example.com',
        firstName: 'File',
        lastName: 'Upload',
        isActive: true,
        toJSON: () => ({
          id: 1,
          username: 'fileuploaduser',
          email: 'fileupload@example.com',
          firstName: 'File',
          lastName: 'Upload',
          isActive: true
        })
      };
      return Promise.resolve(mockUser);
    });

    // Mock User.create to return a new user
    const mockUser = {
      id: 1,
      username: 'fileuploaduser',
      email: 'fileupload@example.com',
      firstName: 'File',
      lastName: 'Upload',
      isActive: true,
      toJSON: () => ({
        id: 1,
        username: 'fileuploaduser',
        email: 'fileupload@example.com',
        firstName: 'File',
        lastName: 'Upload',
        isActive: true
      })
    };
    User.create = jest.fn().mockResolvedValue(mockUser);
    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // Mock UserAuth.create
    UserAuth.create = jest.fn().mockResolvedValue({
      userId: 1,
      isVerified: true
    });

    // Mock UserToken.create to save the token (don't override the real JWT generation)
    UserToken.create = jest.fn().mockImplementation((data) => {
      // Return the data that was passed in (the real JWT tokens)
      return Promise.resolve(data.data);
    });

    // Setup: Get auth token via registration
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'fileuploaduser',
        email: 'fileupload@example.com',
        password: 'Password@123', // Fixed: Added special character @
        firstName: 'File',
        lastName: 'Upload'
      });

    const { accessToken } = registerResponse.body.data;
    authToken = `Bearer ${accessToken}`;
    testUserId = 1;
  });

  afterAll(async () => {
    // Cleanup: Delete test user
    await request(app)
      .delete('/api/v1/auth/register')
      .set('Authorization', authToken);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mocks for auth middleware
    const mockUser = {
      id: 1,
      username: 'fileuploaduser',
      email: 'fileupload@example.com',
      firstName: 'File',
      lastName: 'Upload',
      isActive: true,
      toJSON: () => ({
        id: 1,
        username: 'fileuploaduser',
        email: 'fileupload@example.com',
        firstName: 'File',
        lastName: 'Upload',
        isActive: true
      })
    };

    // Mock User.findByPk for auth middleware
    User.findByPk = jest.fn().mockResolvedValue(mockUser);
    User.findOne = jest.fn().mockResolvedValue(mockUser);

    // Mock UserToken.findOne to return valid token for auth middleware
    UserToken.findOne = jest.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      accessToken: authToken.replace('Bearer ', ''),
      isActive: true,
      isAccessTokenExpired: jest.fn().mockReturnValue(false),
      lastUsedAt: new Date(),
      save: jest.fn().mockResolvedValue()
    });

    // Setup mocks for file-upload service functions
    const fileUploadService = require('../../src/services/file-upload.service.js');

    // Mock saveFileRecord for file upload
    fileUploadService.saveFileRecord = jest.fn().mockResolvedValue({
      id: 123,
      filename: 'test-123456.pdf',
      originalName: 'test.pdf',
      mimetype: 'application/pdf',
      size: 12345,
      userId: 1
    });

    // Mock listUserFiles for listing files
    fileUploadService.listUserFiles = jest.fn().mockResolvedValue([
      { id: 1, filename: 'file1.pdf' },
      { id: 2, filename: 'file2.jpg' }
    ]);

    // Mock getFileById for getting file metadata
    fileUploadService.getFileById = jest.fn().mockImplementation((fileId) => {
      if (fileId === '999999') {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        id: fileId,
        filename: 'test.pdf',
        userId: 1
      });
    });

    // Mock validateFileAccess for access validation
    fileUploadService.validateFileAccess = jest.fn().mockResolvedValue(true);

    // Mock getDownloadUrl for download URL generation
    fileUploadService.getDownloadUrl = jest.fn().mockReturnValue('/api/v1/files/download?path=%2Fuploads%2Fuser%2Ftest.pdf');

    // Mock deleteFileById for file deletion
    fileUploadService.deleteFileById = jest.fn().mockImplementation((fileId) => {
      if (fileId === '999999') {
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    });

    // Mock getUserStorageInfo for storage info
    fileUploadService.getUserStorageInfo = jest.fn().mockResolvedValue({
      totalSize: 1048576,
      usedSize: 524288,
      availableSize: 1073741824,
      fileCount: 5
    });
  });

  describe('POST /api/v1/files/upload', () => {
    it('should upload file successfully with valid file', async () => {
      const response = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', authToken)
        .attach('file', Buffer.from('test,content,data'), {
          filename: 'test.csv',
          contentType: 'text/csv'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        resCode: RES_CODE.FILE_UPLOAD_SUCCESS
      });
      expect(response.body.data).toBeDefined();
    });

    it('should return error when no file provided', async () => {
      const response = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body.status).toBe(false);
      expect(response.body.resCode).toBe(RES_CODE.NO_FILE_PROVIDED);
    });
  });

  describe('GET /api/v1/files', () => {
    it('should list user files successfully', async () => {
      const response = await request(app)
        .get('/api/v1/files')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data).toHaveProperty('files');
    });
  });

  describe('GET /api/v1/files/:fileId', () => {
    it('should get file metadata successfully', async () => {
      // First upload a file
      const uploadResponse = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', authToken)
        .attach('file', Buffer.from('test,file,data'), {
          filename: 'test.csv',
          contentType: 'text/csv'
        });

      const fileId = uploadResponse.body.data.id;

      // Get file metadata
      const response = await request(app)
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data).toMatchObject({
        id: fileId,
        filename: expect.any(String)
      });
    });

    it('should return 404 if file not found', async () => {
      const response = await request(app)
        .get('/api/v1/files/999999')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.status).toBe(false);
      expect(response.body.resCode).toBe(RES_CODE.FILE_NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/files/:fileId', () => {
    it('should delete file successfully', async () => {
      // First upload a file
      const uploadResponse = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', authToken)
        .attach('file', Buffer.from('test,file,data'), {
          filename: 'test.csv',
          contentType: 'text/csv'
        });

      const fileId = uploadResponse.body.data.id;

      // Delete the file
      const response = await request(app)
        .delete(`/api/v1/files/${fileId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.resCode).toBe(RES_CODE.FILE_DELETE_SUCCESS);
    });

    it('should return error if file not found', async () => {
      const response = await request(app)
        .delete('/api/v1/files/999999')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.status).toBe(false);
      expect(response.body.resCode).toBe(RES_CODE.FILE_NOT_FOUND);
    });
  });

  describe('GET /api/v1/files/storage/info', () => {
    it('should get storage info successfully', async () => {
      const response = await request(app)
        .get('/api/v1/files/storage/info')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data).toMatchObject({
        totalSize: expect.any(Number),
        usedSize: expect.any(Number),
        availableSize: expect.any(Number),
        fileCount: expect.any(Number)
      });
    });
  });
});
