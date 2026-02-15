/**
 * Unit tests for file upload utility functions
 * @module tests/unit/utils/file-upload.util
 */

import {
  deleteFile,
  fileExists,
  getFileStats,
  createDirectory,
  readFile,
  listFiles,
  formatFileSize,
  detectFileType,
  getExtensionFromMime,
  generateUniqueFilename,
  cleanupOldFiles
} from '../../../src/utils/file-upload.util.js';

describe('file-upload.util', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle edge cases', () => {
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });
  });

  describe('detectFileType', () => {
    it('should detect PNG from buffer', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x47, 0x0D]);
      expect(detectFileType(pngBuffer)).toBe('image/png');
    });

    it('should detect JPEG from buffer', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xC0]);
      expect(detectFileType(jpegBuffer)).toBe('image/jpeg');
    });

    it('should detect GIF from buffer', () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x38, 0x61]);
      expect(detectFileType(gifBuffer)).toBe('image/gif');
    });

    it('should detect PDF from buffer', () => {
      const pdfBuffer = Buffer.from('%PDF', 'ascii');
      expect(detectFileType(pdfBuffer)).toBe('application/pdf');
    });

    it('should return null for unknown file type', () => {
      const unknownBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(detectFileType(unknownBuffer)).toBeNull();
    });

    it('should return null for small buffer', () => {
      const smallBuffer = Buffer.from([0x89, 0x50]);
      expect(detectFileType(smallBuffer)).toBeNull();
    });
  });

  describe('getExtensionFromMime', () => {
    it('should return correct extensions for known MIME types', () => {
      expect(getExtensionFromMime('image/jpeg')).toBe('.jpg');
      expect(getExtensionFromMime('image/png')).toBe('.png');
      expect(getExtensionFromMime('image/gif')).toBe('.gif');
      expect(getExtensionFromMime('application/pdf')).toBe('.pdf');
      expect(getExtensionFromMime('text/csv')).toBe('.csv');
    });

    it('should return empty string for unknown MIME type', () => {
      expect(getExtensionFromMime('unknown/type')).toBe('');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filename with timestamp', () => {
      const filename = generateUniqueFilename('test.pdf');
      expect(filename).toMatch(/^test-\d{13}-[a-z0-9]{6}\.pdf$/);
    });

    it('should handle files without extension', () => {
      const filename = generateUniqueFilename('README');
      expect(filename).toMatch(/^README-\d{13}-[a-z0-9]{6}$/);
    });

    it('should handle files with multiple dots', () => {
      const filename = generateUniqueFilename('archive.tar.gz');
      expect(filename).toMatch(/^archive\.tar-\d{13}-[a-z0-9]{6}\.gz$/);
    });
  });
});
