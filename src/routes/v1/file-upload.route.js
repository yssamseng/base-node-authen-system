/**
 * File upload routes
 * API endpoints for file upload/download/delete
 * @module routes/v1/file-upload
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import upload from '../../middleware/file-upload.middleware.js';
import * as fileUploadController from '../../controllers/file-upload.controller.js';

const router = Router();

/**
 * File upload endpoints
 * All routes require authentication
 */

// Upload file
// POST /api/v1/files/upload
router.post('/upload',
  authenticate,
  upload.single('file'),
  fileUploadController.uploadFile
);

// List user files
// GET /api/v1/files
router.get('/',
  authenticate,
  fileUploadController.listFiles
);

// Get file metadata
// GET /api/v1/files/:fileId
router.get('/:fileId',
  authenticate,
  fileUploadController.getFile
);

// Download file
// GET /api/v1/files/download
router.get('/download',
  authenticate,
  fileUploadController.downloadFile
);

// Delete file
// DELETE /api/v1/files/:fileId
router.delete('/:fileId',
  authenticate,
  fileUploadController.deleteFile
);

// Get user storage info
// GET /api/v1/files/storage/info
router.get('/storage/info',
  authenticate,
  fileUploadController.getStorageInfo
);

export default router;
