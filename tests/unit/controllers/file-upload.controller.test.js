/**
 * Unit tests for file upload controller
 * @module tests/unit/controllers/file-upload.controller
 */

import {
  uploadFile,
  listFiles,
  getFile,
  downloadFile,
  deleteFile,
  getStorageInfo
} from '../../../src/controllers/file-upload.controller.js';

// Mock dependencies BEFORE importing the module
jest.mock('../../../src/core/handler.js', () => ({
  response: jest.fn(),
  genResponseObj: jest.fn(),
  genErrorResponseObj: jest.fn(),
  responseError: jest.fn()
}));

jest.mock('../../../src/utils/app-logger.util.js', () => ({
  appLogger: {
    logInfo: jest.fn(),
    logDebug: jest.fn(),
    logError: jest.fn()
  }
}));

jest.mock('../../../src/services/file-upload.service.js', () => ({
  saveFileRecord: jest.fn(),
  getFileById: jest.fn(),
  listUserFiles: jest.fn(),
  deleteFileById: jest.fn(),
  getDownloadUrl: jest.fn(),
  getUserStorageInfo: jest.fn(),
  validateFileAccess: jest.fn()
}));

import { response, genResponseObj, genErrorResponseObj, responseError } from '../../../src/core/handler.js';
import { appLogger } from '../../../src/utils/app-logger.util.js';
import { RES_CODE } from '../../../src/config/constants.js';
import * as fileUploadService from '../../../src/services/file-upload.service.js';

describe('file-upload.controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      user: { id: 1 },
      file: {
        filename: 'test-123456.pdf',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        path: '/uploads/user/test-123456.pdf'
      },
      params: {},
      query: {}
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFileRecord = { id: 123, filename: 'test-123456.pdf' };
      fileUploadService.saveFileRecord.mockResolvedValue(mockFileRecord);
      genResponseObj.mockReturnValue({ status: true, resCode: '20011', data: mockFileRecord });
      response.mockReturnValue(mockRes);

      await uploadFile(mockReq, mockRes);

      expect(fileUploadService.saveFileRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockReq.user.id,
          filename: mockReq.file.filename
        })
      );
      expect(genResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.FILE_UPLOAD_SUCCESS,
        mockFileRecord
      );
      expect(response).toHaveBeenCalled();
    });

    it('should return error when no file provided', async () => {
      mockReq.file = null;
      genErrorResponseObj.mockReturnValue({ status: false, resCode: '40001', error: {} });
      responseError.mockReturnValue(mockRes);

      await uploadFile(mockReq, mockRes);

      expect(genErrorResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.FILE_UPLOAD_ERROR.NO_FILE_PROVIDED
      );
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
    });
  });

  describe('listFiles', () => {
    it('should list files with pagination', async () => {
      const mockFiles = [
        { id: 1, filename: 'file1.pdf' },
        { id: 2, filename: 'file2.jpg' }
      ];
      fileUploadService.listUserFiles.mockResolvedValue(mockFiles);
      genResponseObj.mockReturnValue({ status: true, data: { files: mockFiles } });
      response.mockReturnValue(mockRes);

      await listFiles(mockReq, mockRes);

      expect(fileUploadService.listUserFiles).toHaveBeenCalledWith(
        mockReq.user.id,
        { page: 1, limit: 20 }
      );
      expect(response).toHaveBeenCalled();
    });

    it('should handle custom pagination parameters', async () => {
      mockReq.query = { page: 2, limit: 50 };
      fileUploadService.listUserFiles.mockResolvedValue([]);
      genResponseObj.mockReturnValue({ status: true, data: { files: [] } });
      response.mockReturnValue(mockRes);

      await listFiles(mockReq, mockRes);

      expect(fileUploadService.listUserFiles).toHaveBeenCalledWith(
        mockReq.user.id,
        { page: 2, limit: 50 }
      );
    });
  });

  describe('getFile', () => {
    it('should get file metadata with access check', async () => {
      mockReq.params = { fileId: '123' };
      const mockFileRecord = { id: 123, filename: 'test.pdf', userId: 1 };
      fileUploadService.getFileById.mockResolvedValue(mockFileRecord);
      fileUploadService.validateFileAccess.mockResolvedValue(true);
      fileUploadService.getDownloadUrl.mockReturnValue('/api/v1/files/download?path=%2Fuploads%2Fuser%2Ftest.pdf');
      genResponseObj.mockReturnValue({
        status: true,
        resCode: '20012',
        data: { file: mockFileRecord, downloadUrl: '/api/v1/files/download?path=%2Fuploads%2Fuser%2Ftest.pdf' }
      });
      response.mockReturnValue(mockRes);

      await getFile(mockReq, mockRes);

      expect(response).toHaveBeenCalled();
    });

    it('should return 404 if file not found', async () => {
      mockReq.params = { fileId: '999' };
      fileUploadService.getFileById.mockResolvedValue(null);
      genErrorResponseObj.mockReturnValue({ status: false, resCode: '40004', error: {} });
      responseError.mockReturnValue(mockRes);

      await getFile(mockReq, mockRes);

      expect(genErrorResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.FILE_UPLOAD_ERROR.FILE_NOT_FOUND
      );
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
    });

    it('should return 403 if access denied', async () => {
      mockReq.params = { fileId: '123' };
      const mockFileRecord = { id: 123, filename: 'test.pdf', userId: 1 };
      fileUploadService.getFileById.mockResolvedValue(mockFileRecord);
      fileUploadService.validateFileAccess.mockResolvedValue(false);
      genErrorResponseObj.mockReturnValue({ status: false, resCode: '40005', error: {} });
      responseError.mockReturnValue(mockRes);

      await getFile(mockReq, mockRes);

      expect(genErrorResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.FILE_UPLOAD_ERROR.ACCESS_DENIED
      );
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
    });
  });

  describe('downloadFile', () => {
    it('should return download URL', async () => {
      mockReq.query = { path: '/uploads/user/test.pdf' };
      genResponseObj.mockReturnValue({
        status: true,
        resCode: '20012',
        data: { message: 'File download ready', path: '/uploads/user/test.pdf' }
      });
      response.mockReturnValue(mockRes);

      await downloadFile(mockReq, mockRes);

      expect(genResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.FILE_DOWNLOAD_SUCCESS,
        { message: 'File download ready', path: '/uploads/user/test.pdf' }
      );
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
    });

    it('should return error when path missing', async () => {
      mockReq.query = {};
      genErrorResponseObj.mockReturnValue({ status: false, resCode: '40001', error: {} });
      responseError.mockReturnValue(mockRes);

      await downloadFile(mockReq, mockRes);

      expect(genErrorResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.BAD_REQUEST
      );
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
    });

    it('should sanitize path to prevent traversal', async () => {
      mockReq.query = { path: '../../../etc/passwd' };
      genResponseObj.mockReturnValue({
        status: true,
        resCode: '20012',
        data: { message: 'File download ready', path: 'etcpasswd' }
      });
      response.mockReturnValue(mockRes);

      await downloadFile(mockReq, mockRes);

      expect(genResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.FILE_DOWNLOAD_SUCCESS,
        { message: 'File download ready', path: 'etcpasswd' }
      );
      expect(response).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockReq.params = { fileId: '123' };
      fileUploadService.deleteFileById.mockResolvedValue(true);
      genResponseObj.mockReturnValue({ status: true, resCode: '20013' });
      response.mockReturnValue(mockRes);

      await deleteFile(mockReq, mockRes);

      expect(fileUploadService.deleteFileById).toHaveBeenCalledWith(
        '123',
        mockReq.user.id,
        mockReq.user.id
      );
      expect(response).toHaveBeenCalled();
    });

    it('should return error on delete failure', async () => {
      mockReq.params = { fileId: '123' };
      fileUploadService.deleteFileById.mockResolvedValue(false);
      genErrorResponseObj.mockReturnValue({ status: false, resCode: '50000', error: {} });
      responseError.mockReturnValue(mockRes);

      await deleteFile(mockReq, mockRes);

      expect(genErrorResponseObj).toHaveBeenCalledWith(
        mockReq,
        RES_CODE.INTERNAL_ERROR
      );
      expect(responseError).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Object));
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage info', async () => {
      const mockStorageInfo = {
        totalSize: 1048576,
        usedSize: 524288,
        availableSize: 1073741824,
        fileCount: 5
      };
      fileUploadService.getUserStorageInfo.mockResolvedValue(mockStorageInfo);
      genResponseObj.mockReturnValue({ status: true, resCode: '20000', data: mockStorageInfo });
      response.mockReturnValue(mockRes);

      await getStorageInfo(mockReq, mockRes);

      expect(response).toHaveBeenCalled();
    });

    it('should handle storage info error', async () => {
      fileUploadService.getUserStorageInfo.mockRejectedValue(
        new Error('Storage error')
      );
      genErrorResponseObj.mockReturnValue({ status: false, resCode: '50000', error: {} });
      responseError.mockReturnValue(mockRes);

      await getStorageInfo(mockReq, mockRes);

      expect(responseError).toHaveBeenCalled();
    });
  });
});
