import { describe, test, expect } from '@jest/globals';

import {
  sanitizeHTML,
  sanitizeString,
  sanitizeEmail,
  sanitizeUsername,
  sanitizePath,
  sanitizeNoSQL,
  sanitizeSQL,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeURL,
  truncate,
  sanitizeArray,
  removeNonPrintable,
  stripTags
} from '../../../src/utils/sanitize.util.js';

describe('Sanitization Utilities', () => {
  describe('sanitizeHTML', () => {
    test('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    test('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<iframe');
    });

    test('should remove event handlers', () => {
      const input = '<div onclick="bad()">Click</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
    });

    test('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });

    test('should preserve safe HTML', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<p>');
      expect(result).toContain('</p>');
    });

    test('should handle non-string input', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(123)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
    });
  });

  describe('sanitizeString', () => {
    test('should trim whitespace', () => {
      const input = '  test  ';
      const result = sanitizeString(input);
      expect(result).toBe('test');
    });

    test('should remove null bytes', () => {
      const input = 'test\x00string';
      const result = sanitizeString(input);
      expect(result).not.toContain('\x00');
    });

    test('should remove control characters', () => {
      const input = 'test\x00string';
      const result = sanitizeString(input);
      expect(result).not.toContain('\x00');
    });

    test('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    test('should convert to lowercase', () => {
      const input = 'TEST@EXAMPLE.COM';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    test('should remove dangerous characters', () => {
      const input = 'test$%^@example.com';
      const result = sanitizeEmail(input);
      expect(result).not.toContain('$');
      expect(result).not.toContain('%');
    });

    test('should remove consecutive dots', () => {
      const input = 'test..email@example.com';
      const result = sanitizeEmail(input);
      expect(result).not.toContain('..');
    });

    test('should handle invalid input', () => {
      expect(sanitizeEmail(null)).toBe('');
      expect(sanitizeEmail(123)).toBe('');
    });
  });

  describe('sanitizeUsername', () => {
    test('should convert to lowercase', () => {
      const input = 'TestUser';
      const result = sanitizeUsername(input);
      expect(result).toBe('testuser');
    });

    test('should remove special characters', () => {
      const input = 'test@user#name';
      const result = sanitizeUsername(input);
      expect(result).toBe('testusername');
    });

    test('should remove consecutive hyphens', () => {
      const input = 'test--user';
      const result = sanitizeUsername(input);
      expect(result).not.toContain('--');
    });

    test('should handle empty after sanitization', () => {
      const input = '---';
      const result = sanitizeUsername(input);
      expect(result).toBe('');
    });
  });

  describe('sanitizePath', () => {
    test('should remove directory traversal', () => {
      const input = '../../../etc/passwd';
      const result = sanitizePath(input);
      expect(result).not.toContain('..');
    });

    test('should remove absolute paths', () => {
      const input = '/etc/passwd';
      const result = sanitizePath(input);
      expect(result).not.toMatch(/^\/etc/);
    });

    test('should preserve relative paths', () => {
      const input = 'files/document.pdf';
      const result = sanitizePath(input);
      expect(result).toBe('files/document.pdf');
    });

    test('should handle Windows paths', () => {
      const input = '..\\..\\config';
      const result = sanitizePath(input);
      expect(result).not.toContain('..');
    });
  });

  describe('sanitizeNoSQL', () => {
    test('should escape $ characters', () => {
      const input = 'user$ne:null';
      const result = sanitizeNoSQL(input);
      expect(result).toContain('\\$');
    });

    test('should escape . characters', () => {
      const input = 'user.password';
      const result = sanitizeNoSQL(input);
      expect(result).toContain('\\.');
    });

    test('should handle non-string input', () => {
      expect(sanitizeNoSQL(null)).toBe('');
    });
  });

  describe('sanitizeSQL', () => {
    test('should escape single quotes', () => {
      const input = "test' OR '1'='1";
      const result = sanitizeSQL(input);
      expect(result).toContain("''");
    });

    test('should escape double quotes', () => {
      const input = 'test" OR "1"="1"';
      const result = sanitizeSQL(input);
      expect(result).toContain('""');
    });

    test('should escape backslashes', () => {
      const input = 'test\\ OR 1=1';
      const result = sanitizeSQL(input);
      expect(result).toContain('\\\\');
    });

    test('should escape percent signs', () => {
      const input = 'test% LIKE%';
      const result = sanitizeSQL(input);
      expect(result).toContain('\\%');
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize all string values', () => {
      const input = {
        name: '  test  ',
        email: 'TEST@EXAMPLE.COM',
        age: 25
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe('test'); // sanitizeString trims whitespace
      expect(result.email).toBe('TEST@EXAMPLE.COM'); // sanitizeString doesn't lowercase - that's correct
      expect(result.age).toBe(25);
    });

    test('should handle nested objects', () => {
      const input = {
        user: {
          name: '  Test  ',
          profile: {
            bio: '<script>alert(1)</script>'
          }
        }
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe('Test');
    });

    test('should handle arrays', () => {
      const input = {
        items: ['  a  ', '  b  ', '  c  ']
      };
      const result = sanitizeObject(input);
      // sanitizeObject trims whitespace from strings
      expect(result.items).toEqual(['a', 'b', 'c']);
    });

    test('should skip specified keys', () => {
      const input = {
        password: '  myPass  ',
        name: '  test  '
      };
      const result = sanitizeObject(input, {
        skipKeys: ['password']
      });
      expect(result.password).toBe('  myPass  ');
      expect(result.name).toBe('test');
    });

    test('should use custom sanitize function', () => {
      const input = { name: 'TEST' };
      const customFn = (str) => str.toLowerCase();
      const result = sanitizeObject(input, { sanitizeFn: customFn });
      expect(result.name).toBe('test');
    });
  });

  describe('sanitizeRequestBody', () => {
    test('should sanitize body but skip passwords', () => {
      const input = {
        username: '  TEST  ',
        password: '  PASS  ',
        email: ' TEST@EXAMPLE.COM  '
      };
      const result = sanitizeRequestBody(input);
      expect(result.username).toBe('TEST');
      expect(result.password).toBe('  PASS  '); // Not sanitized
      expect(result.email).toBe('test@example.com');
    });

    test('should handle non-object input', () => {
      expect(sanitizeRequestBody(null)).toBeNull();
      expect(sanitizeRequestBody('string')).toBe('string');
    });
  });

  describe('sanitizeURL', () => {
    test('should validate http URLs', () => {
      const result = sanitizeURL('http://example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('http://example.com');
    });

    test('should validate https URLs', () => {
      const result = sanitizeURL('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://example.com');
    });

    test('should reject javascript protocol', () => {
      const result = sanitizeURL('javascript:alert(1)');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should reject disallowed protocols', () => {
      const result = sanitizeURL('ftp://example.com', {
        allowedProtocols: ['http', 'https']
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol');
    });

    test('should handle invalid URLs', () => {
      const result = sanitizeURL('not a url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('format');
    });
  });

  describe('truncate', () => {
    test('should truncate long strings', () => {
      const input = 'This is a very long string that needs to be truncated';
      const result = truncate(input, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    test('should not truncate short strings', () => {
      const input = 'Short';
      const result = truncate(input, 20);
      expect(result).toBe('Short');
    });

    test('should use custom suffix', () => {
      const input = 'This is a very long string';
      const result = truncate(input, 15, { suffix: ' >>' });
      expect(result).toContain(' >>');
      expect(result.length).toBeLessThanOrEqual(15);
    });
  });

  describe('sanitizeArray', () => {
    test('should sanitize array of strings', () => {
      const input = ['  a  ', '  b  ', null, '  c  '];
      const result = sanitizeArray(input);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('should preserve non-string values', () => {
      const input = ['test', 123, true, { key: 'value' }];
      const result = sanitizeArray(input);
      expect(result).toEqual(['test', 123, true, { key: 'value' }]);
    });

    test('should handle non-array input', () => {
      expect(sanitizeArray(null)).toEqual([]);
      expect(sanitizeArray('string')).toEqual([]);
    });
  });

  describe('removeNonPrintable', () => {
    test('should remove control characters', () => {
      const input = 'test\x00string\x1F';
      const result = removeNonPrintable(input);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x1F');
    });

    test('should preserve printable characters', () => {
      const input = 'Hello World 123!';
      const result = removeNonPrintable(input);
      expect(result).toBe('Hello World 123!');
    });

    test('should preserve whitespace', () => {
      const input = 'test\nstring\rtab';
      const result = removeNonPrintable(input);
      expect(result).toContain('\n');
      expect(result).toContain('\r');
      expect(result).toContain('tab');
    });
  });

  describe('stripTags', () => {
    test('should remove all HTML tags', () => {
      const input = '<p>Hello</p><strong>World</strong>';
      const result = stripTags(input);
      expect(result).toBe('HelloWorld');
    });

    test('should remove self-closing tags', () => {
      const input = 'Text<br/>More text';
      const result = stripTags(input);
      expect(result).toBe('TextMore text');
    });

    test('should handle tags with attributes', () => {
      const input = '<a href="http://example.com">Link</a>';
      const result = stripTags(input);
      expect(result).toBe('Link');
    });

    test('should handle non-string input', () => {
      expect(stripTags(null)).toBe('');
      expect(stripTags(123)).toBe('');
    });
  });
});
