/**
 * Unit tests for file upload service
 * @module tests/unit/services/file-upload.service
 */

import {
  saveFileRecord,
  getFileById,
  listUserFiles,
  deleteFileById,
  getDownloadUrl,
  getUserStorageInfo,
  validateFileAccess
} from '../../../src/services/file-upload.service.js';

import { genErrorResponseObj } from '../../../src/core/handler.js';
import { appLogger } from '../../../src/utils/app-logger.util.js';

// Mock dependencies
jest.mock('../../../src/core/handler.js');
jest.mock('../../../src/utils/app-logger.util.js');

describe('file-upload.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveFileRecord', () => {
    const mockFileData = {
      userId: 1,
      filename: 'test-123456.pdf',
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 12345,
      path: '/uploads/user/test-123456.pdf'
    };

    it('should save file record successfully', async () => {
      const result = await saveFileRecord(mockFileData);

      expect(result).toMatchObject({
        userId: mockFileData.userId,
        filename: mockFileData.filename,
        originalName: mockFileData.originalName,
        mimeType: mockFileData.mimeType,
        size: mockFileData.size,
        path: mockFileData.path
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should log debug message on save', async () => {
      await saveFileRecord(mockFileData);

      expect(appLogger.logDebug).toHaveBeenCalledWith(
        'Saving file record',
        { userId: mockFileData.userId, filename: mockFileData.filename }
      );
    });

    it('should log info on successful save', async () => {
      await saveFileRecord(mockFileData);

      expect(appLogger.logInfo).toHaveBeenCalledWith(
        'File record saved (mock):',
        expect.any(Object)
      );
    });
  });

  describe('getFileById', () => {
    const mockFileId = '123';
    const mockUserId = 1;

    it('should get file by ID with authorization check', async () => {
      const result = await getFileById(mockFileId, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockFileId);
      expect(result.userId).toBe(mockUserId);
    });

    it('should pass authorization check - matching userId', async () => {
      const result = await getFileById(mockFileId, mockUserId);

      expect(result.userId).toBe(mockUserId);
    });
  });

  describe('listUserFiles', () => {
    const mockUserId = 1;
    const mockOptions = { page: 1, limit: 20 };

    it('should list files for user with pagination', async () => {
      const result = await listUserFiles(mockUserId, mockOptions);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should log debug message', async () => {
      await listUserFiles(mockUserId, mockOptions);

      expect(appLogger.logDebug).toHaveBeenCalledWith(
        'Listing files for user:',
        { userId: mockUserId, options: mockOptions }
      );
    });
  });

  describe('deleteFileById', () => {
    const mockFileId = '123';
    const mockUserId = 1;

    it('should delete file with authorization check', async () => {
      const result = await deleteFileById(mockFileId, mockUserId, mockUserId);

      expect(result).toBe(true);
    });

    it('should pass authorization check - matching userIds', async () => {
      await deleteFileById(mockFileId, mockUserId, mockUserId);

      expect(appLogger.logInfo).toHaveBeenCalledWith(
        'File deleted (mock):',
        { fileId: mockFileId }
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('should generate download URL for file path', () => {
      const mockPath = '/uploads/user/test.pdf';
      const result = getDownloadUrl(mockPath);

      expect(result).toContain('/api/v1/files/download');
      expect(result).toContain('path=');
      expect(result).toContain(encodeURIComponent(mockPath));
    });
  });

  describe('getUserStorageInfo', () => {
    const mockUserId = 1;

    it('should return storage info for user', async () => {
      const result = await getUserStorageInfo(mockUserId);

      expect(result).toMatchObject({
        totalSize: expect.any(Number),
        usedSize: expect.any(Number),
        availableSize: expect.any(Number),
        fileCount: expect.any(Number)
      });
    });

    it('should return 10GB quota as available size', async () => {
      const result = await getUserStorageInfo(mockUserId);

      expect(result.availableSize).toBe(10 * 1024 * 1024 * 1024);
    });
  });

  describe('validateFileAccess', () => {
    const mockFileId = '123';
    const mockUserId = 1;

    it('should return true for valid file access', async () => {
      const result = await validateFileAccess(mockFileId, mockUserId);

      expect(result).toBe(true);
    });
  });
});
