/**
 * File upload configuration and utilities
 * @module config/file-upload
 */

/**
 * File upload configuration
 * Defines size limits, allowed types, and storage settings
 */
export const FILE_UPLOAD_CONFIG = {
  // File size limits (in bytes)
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 files per request
  },

  // Allowed file types (MIME types)
  // Add/remove as needed for your application
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'text/csv'
  ],

  // File storage configuration
  storage: {
    // Destination directory for uploads (create if doesn't exist)
    destination: 'uploads/',
    // Generate unique filename to avoid overwrites
    // Format: fieldname-timestamp-randomstring.ext
    // Example: avatar-1741234567890.jpg
    generateUniqueFilename: true,
  },

  // Filename sanitization
  filenameSanitization: {
    // Remove path traversal attempts (../, ..\)
    removePathTraversal: true,
    // Limit filename length
    maxLength: 255,
    // Remove dangerous characters
    removeSpecialChars: /[^a-zA-Z0-9._-]/g,
    // Convert to lowercase
    toLowerCase: true,
  },
};

/**
 * Validate file type
 * Checks if file MIME type is allowed
 * @param {string} mimeType - File MIME type
 * @returns {boolean} True if allowed, false otherwise
 */
export const isValidFileType = (mimeType) => {
  if (!mimeType || typeof mimeType !== 'string') return false;
  return FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(mimeType.toLowerCase());
};

/**
 * Validate file size
 * Checks if file size is within limits
 * @param {number} fileSize - File size in bytes
 * @returns {boolean} True if within limit, false otherwise
 */
export const isValidFileSize = (fileSize) => {
  const maxSize = FILE_UPLOAD_CONFIG.limits.fileSize;
  return fileSize <= maxSize;
};

/**
 * Sanitize filename
 * Removes dangerous characters and path traversal attempts
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return '';

  let sanitized = filename;

  // Remove path traversal
  if (FILE_UPLOAD_CONFIG.filenameSanitization.removePathTraversal) {
    sanitized = sanitized.replace(/\.\./g, '')
      .replace(/\.\\\.\//g, '')
      .replace(/\.\./g, '')
      .replace(/\.\.\//g, '');
  }

  // Remove special characters
  if (FILE_UPLOAD_CONFIG.filenameSanitization.removeSpecialChars) {
    sanitized = sanitized.replace(FILE_UPLOAD_CONFIG.filenameSanitization.removeSpecialChars, '');
  }

  // Limit length
  if (FILE_UPLOAD_CONFIG.filenameSanitization.maxLength) {
    sanitized = sanitized.substring(0, FILE_UPLOAD_CONFIG.filenameSanitization.maxLength);
  }

  // Convert to lowercase
  if (FILE_UPLOAD_CONFIG.filenameSanitization.toLowerCase) {
    sanitized = sanitized.toLowerCase();
  }

  return sanitized;
};

/**
 * Generate storage path
 * Creates organized directory structure for file storage
 * @param {string} userId - User ID for organizing files
 * @param {string} fileType - Type of file (avatar, document, etc.)
 * @returns {string} Storage path
 */
export const generateStoragePath = (userId, fileType) => {
  const { destination } = FILE_UPLOAD_CONFIG.storage;
  const basePath = `${destination}${userId}/`;

  // Create file type subdirectory
  const fullPath = `${basePath}${fileType}/`;

  return fullPath;
};

/**
 * File upload error codes
 * Standardized error codes for file upload operations
 */
export const FILE_UPLOAD_ERROR = {
  // General errors (500xx)
  INVALID_FILE: '50101',        // Invalid file type
  FILE_TOO_LARGE: '50102',     // File size exceeds limit
  STORAGE_ERROR: '50103',       // Storage write failure
  INVALID_FILENAME: '50104',    // Invalid filename characters

  // User errors (400xx)
  NO_FILE_PROVIDED: '40001',   // No file in request
  FILE_UPLOAD_FAILED: '40002',   // Upload failed
  FILE_NOT_FOUND: '40003',    // File not found (for delete/download)
  ACCESS_DENIED: '40004',      // Access denied
  QUOTA_EXCEEDED: '40005',     // User quota exceeded
};
