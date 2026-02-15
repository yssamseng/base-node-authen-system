/**
 * Integration tests for file upload endpoints
 * @module tests/integration/file-upload
 */

import { describe, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { genResponseObj, genErrorResponseObj, responseError } from '../../src/core/handler.js';
import { RES_CODE } from '../../src/config/constants.js';

// Mock dependencies
jest.mock('../../src/config/database.js');
jest.mock('../../src/models/model.js');
jest.mock('../../src/utils/app-logger.util.js');
jest.mock('../../src/services/file-upload.service.js');

describe('File Upload Integration Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Setup: Get auth token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'fileuploaduser',
        email: 'fileupload@example.com',
        password: 'Password123',
        firstName: 'File',
        lastName: 'Upload'
      });

    const { accessToken } = registerResponse.body.data;
    authToken = `Bearer ${accessToken}`;

    // Get user ID from token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .set('Authorization', authToken)
      .send({
        username: 'fileuploaduser',
        password: 'Password123'
      });

    testUserId = loginResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test user
    await request(app)
      .delete('/api/v1/auth/register')
      .set('Authorization', authToken);
  });

  describe('POST /api/v1/files/upload', () => {
    it('should upload file successfully with valid file', async () => {
      const response = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', authToken)
        .attach('file', Buffer.from('test content'))
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
      expect(response.body.resCode).toBe(RES_CODE.FILE_UPLOAD_ERROR.NO_FILE_PROVIDED);
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
        .attach('file', Buffer.from('test file'));

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
      expect(response.body.resCode).toBe(RES_CODE.FILE_UPLOAD_ERROR.FILE_NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/files/:fileId', () => {
    it('should delete file successfully', async () => {
      // First upload a file
      const uploadResponse = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', authToken)
        .attach('file', Buffer.from('test file'));

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
      expect(response.body.resCode).toBe(RES_CODE.FILE_UPLOAD_ERROR.FILE_NOT_FOUND);
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
