/**
 * File upload middleware using Multer
 * Handles multipart/form-data with security features
 * @module middleware/file-upload
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { appLogger } from '../utils/app-logger.util.js';
import { FILE_UPLOAD_CONFIG, isValidFileType, isValidFileSize, sanitizeFilename, generateStoragePath } from '../config/file-upload.config.js';
import { RES_CODE } from '../config/constants.js';

/**
 * Configure Multer for file uploads
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Create user-specific directory
      const userId = req.user?.id || 'anonymous';
      const fileType = file.fieldname || 'other';
      const userPath = generateStoragePath(userId, fileType);

      const fullPath = path.join(userPath, file.originalname);
      const directory = path.dirname(fullPath);

      // Create directory if it doesn't exist
      try {
        fs.mkdirSync(directory, { recursive: true });
      } catch (error) {
        // Ignore errors if directory already exists
        if (error.code !== 'EEXIST') {
          appLogger.logWarn('Directory creation failed', { error: error.message });
        }
      }

      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Sanitize filename
      const sanitized = sanitizeFilename(file.originalname);

      // Add timestamp to prevent conflicts
      const timestamp = Date.now();
      const ext = path.extname(sanitized);
      const basename = path.basename(sanitized, ext);

      cb(null, `${basename}-${timestamp}${ext}`);
    }
  }),

  // File size limits
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.limits.fileSize,
    files: FILE_UPLOAD_CONFIG.limits.files
  },

  // File type filtering
  fileFilter: (req, file, cb) => {
    if (!file.originalname) {
      return cb(new Error('No filename provided'));
    }

    // Check file type
    if (!isValidFileType(file.mimetype)) {
      const error = new Error(`Invalid file type: ${file.mimetype}`);
      error.resCode = RES_CODE.INVALID_FILE_TYPE;
      return cb(error);
    }

    // Check file size
    if (!isValidFileSize(file.size)) {
      const error = new Error(`File too large: ${file.size} bytes`);
      error.resCode = RES_CODE.FILE_TOO_LARGE;
      return cb(error);
    }

    cb(null, true);
  },

  // Validate file count
  validateFilesCount: (req, res, next) => {
    if (req.files && Object.keys(req.files).length > 10) {
      return res.status(400).json({
        status: false,
        resCode: '40005',
        error: {
          developerMessage: 'Too many files uploaded',
          userMessage: 'Maximum 10 files allowed per upload'
        }
      });
    }
    next();
  },

  // Log successful uploads
  logUpload: (req, res, next) => {
    const fileCount = req.files ? Object.keys(req.files).length : 0;
    appLogger.logInfo('File upload request', {
      userId: req.user?.id,
      fileCount,
      sizes: req.files ? Object.values(req.files).map(f => f.size) : []
    });
    next();
  }
});

export default upload;
