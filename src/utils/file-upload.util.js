/**
 * File upload utility functions
 * Provides helper functions for file operations
 * @module utils/file-upload
 */

import fs from 'fs/promises';
import path from 'path';
import { appLogger } from './app-logger.util.js';
import { FILE_UPLOAD_CONFIG, generateStoragePath } from '../config/file-upload.config.js';

/**
 * Delete file from filesystem
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} Success status
 */
export const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    appLogger.logDebug(`File deleted: ${filePath}`);
    return true;
  } catch (error) {
    appLogger.logError('File deletion failed', error);
    return false;
  }
};

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
export const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

/**
 * Get file stats
 * @param {string} filePath - Path to file
 * @returns {Promise<Object|null>} File stats or null
 */
export const getFileStats = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats;
  } catch (error) {
    appLogger.logError('File stat failed', error);
    return null;
  }
};

/**
 * Create directory recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<boolean>} Success status
 */
export const createDirectory = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    appLogger.logDebug(`Directory created: ${dirPath}`);
    return true;
  } catch (error) {
    appLogger.logError('Directory creation failed', error);
    return false;
  }
};

/**
 * Read file contents
 * @param {string} filePath - Path to file
 * @returns {Promise<Buffer>} File contents
 */
export const readFile = async (filePath) => {
  try {
    const contents = await fs.readFile(filePath);
    return contents;
  } catch (error) {
    appLogger.logError('File read failed', error);
    return null;
  }
};

/**
 * List files in directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<Array>} List of filenames
 */
export const listFiles = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    return files;
  } catch (error) {
    appLogger.logError('Directory listing failed', error);
    return [];
  }
};

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (B, KB, MB)
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const threshold = 1024;

  let size = bytes;
  let unitIndex = 0;

  while (size >= threshold && unitIndex < units.length - 1) {
    size /= threshold;
    unitIndex++;
  }

  // Return integer for whole numbers, fixed 2 decimals otherwise
  const formattedSize = Number.isInteger(size) ? size : size.toFixed(2);
  return `${formattedSize} ${units[unitIndex]}`;
};

/**
 * Validate file type from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string|null} Detected MIME type
 */
export const detectFileType = (buffer) => {
  if (!buffer || buffer.length < 4) return null;

  // PNG signature
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x47 && buffer[3] === 0x0D) {
    return 'image/png';
  }

  // JPEG signature
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    // Check for JPEG (SOF0 + marker variants)
    if (buffer[3] === 0xC0 || buffer[3] === 0xC2 || buffer[3] === 0xC3) {
      return 'image/jpeg';
    }
  }

  // GIF signature
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x38 && buffer[3] === 0x61) {
    return 'image/gif';
  }

  // PDF signature
  if (buffer.toString('ascii', 0, 4) === '%PDF') {
    return 'application/pdf';
  }

  return null;
};

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension
 */
export const getExtensionFromMime = (mimeType) => {
  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'text/csv': '.csv',
  };

  return mimeMap[mimeType] || '';
};

/**
 * Generate unique filename with original name preserved
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${base}-${timestamp}-${random}${ext}`;
};

/**
 * Clean up old files in directory
 * @param {string} dirPath - Directory to clean
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {Promise<number>} Number of files deleted
 */
export const cleanupOldFiles = async (dirPath, maxAge = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const files = await fs.readdir(dirPath);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile() && now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    appLogger.logInfo(`Cleaned up ${deletedCount} old files from ${dirPath}`);
    return deletedCount;
  } catch (error) {
    appLogger.logError('Cleanup failed', error);
    return 0;
  }
};
