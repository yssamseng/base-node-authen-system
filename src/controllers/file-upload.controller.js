/**
 * File upload controller
 * Handles HTTP requests for file upload/download/delete
 * @module controllers/file-upload
 */

import * as fileUploadService from '../services/file-upload.service.js';
import { response, genResponseObj, genErrorResponseObj, responseError } from '../core/handler.js';
import { appLogger } from '../utils/app-logger.util.js';
import { formatFileSize } from '../utils/file-upload.util.js';
import { RES_CODE } from '../config/constants.js';

/**
 * Upload file endpoint
 * POST /api/v2/files/upload
 */
export const uploadFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      const error = genErrorResponseObj(req, RES_CODE.NO_FILE_PROVIDED, 'No file uploaded');
      return responseError(req, res, error);
    }

    // File validation is done in middleware
    // Save file record and get metadata
    const fileData = {
      userId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path
    };

    const fileRecord = await fileUploadService.saveFileRecord(fileData);

    appLogger.logInfo('File uploaded successfully', {
      userId,
      filename: fileData.filename,
      size: formatFileSize(file.size)
    });

    return response(req, res, genResponseObj(req, RES_CODE.FILE_UPLOAD_SUCCESS, fileRecord));
  } catch (error) {
    appLogger.logError('File upload failed', error);
    return responseError(req, res, error);
  }
};

/**
 * List user files endpoint
 * GET /api/v2/files
 */
export const listFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const files = await fileUploadService.listUserFiles(userId, { page, limit });

    appLogger.logInfo('Listed files for user', { userId, count: files.length });

    return response(req, res, genResponseObj(req, RES_CODE.SUCCESS, {
      files,
      pagination: {
        page,
        limit,
        total: files.length
      }
    }));
  } catch (error) {
    appLogger.logError('File listing failed', error);
    return responseError(req, res, error);
  }
};

/**
 * Get file metadata endpoint
 * GET /api/v2/files/:fileId
 */
export const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const fileRecord = await fileUploadService.getFileById(fileId, userId);

    if (!fileRecord) {
      const error = genErrorResponseObj(req, RES_CODE.FILE_NOT_FOUND, 'File not found');
      error.developerMessage = `File not found: ${fileId}`;
      error.userMessage = 'ไม่พบไฟล์ที่คุณค้นหา';
      return responseError(req, res, error);
    }

    appLogger.logInfo('File retrieved', { fileId, filename: fileRecord.filename });

    // Check download permission
    const hasAccess = await fileUploadService.validateFileAccess(fileId, userId);

    if (!hasAccess) {
      const error = genErrorResponseObj(req, RES_CODE.ACCESS_DENIED, 'No permission to access this file');
      error.developerMessage = 'No permission to access this file';
      error.userMessage = 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้';
      return responseError(req, res, error);
    }

    return response(req, res, genResponseObj(req, RES_CODE.FILE_DOWNLOAD_READY, {
      file: fileRecord,
      downloadUrl: fileUploadService.getDownloadUrl(fileRecord.path)
    }));
  } catch (error) {
    appLogger.logError('Get file failed', error);
    return responseError(req, res, error);
  }
};

/**
 * Download file endpoint
 * GET /api/v2/files/download
 */
export const downloadFile = async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const userId = req.user.id;

    if (!filePath) {
      const error = genErrorResponseObj(req, RES_CODE.INVALID_REQUEST, 'File path is required');
      error.developerMessage = 'File path is required';
      error.userMessage = 'กรุณาระบุพาธสำหรับดาวน์โหลดไฟล์';
      return responseError(req, res, error);
    }

    // Security: Prevent path traversal
    const sanitizedPath = filePath.replace(/\.\.\.//g, '').replace(/\.\.\//g, '').replace(/\.\./g, '');

    appLogger.logInfo('File download request', { userId, path: sanitizedPath });

    // TODO: Implement actual file streaming
    return response(req, res, genResponseObj(req, RES_CODE.FILE_DOWNLOAD_READY, {
      message: 'File download ready',
      path: sanitizedPath
    }));
  } catch (error) {
    appLogger.logError('File download failed', error);
    return responseError(req, res, error);
  }
};

/**
 * Delete file endpoint
 * DELETE /api/v2/files/:fileId
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const success = await fileUploadService.deleteFileById(fileId, userId, userId);

    if (!success) {
      const error = genErrorResponseObj(req, RES_CODE.INTERNAL_ERROR, 'Failed to delete file');
      error.developerMessage = 'Failed to delete file';
      error.userMessage = 'ลบไฟล์ไม่สำเร็จ';
      return responseError(req, res, error);
    }

    appLogger.logInfo('File deleted successfully', { fileId });

    return response(req, res, genResponseObj(req, RES_CODE.FILE_DELETE_SUCCESS));
  } catch (error) {
    appLogger.logError('File deletion failed', error);
    return responseError(req, res, error);
  }
};

/**
 * Get user storage info endpoint
 * GET /api/v1/files/storage/info
 */
export async function getStorageInfo(req, res) {
  try {
    const userId = req.user.id;

    const storageInfo = await fileUploadService.getUserStorageInfo(userId);

    return response(req, res, genResponseObj(req, RES_CODE.SUCCESS, storageInfo));
  } catch (error) {
    appLogger.logError('Storage info failed', error);
    return responseError(req, res, error);
  }
};
