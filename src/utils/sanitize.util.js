/**
 * Input sanitization utilities
 * Provides helper functions for cleaning and validating user input
 * @module utils/sanitize
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous HTML tags and attributes while preserving safe formatting
 * @param {string} input - User input that may contain HTML
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHTML = (input) => {
  if (typeof input !== 'string') return '';

  // Remove dangerous HTML tags and their content
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
  let sanitized = input;

  for (const tag of dangerousTags) {
    // Remove opening tags, closing tags, and self-closing tags
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  }

  // Remove dangerous event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove dangerous CSS expressions
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');

  return sanitized.trim();
};

/**
 * Sanitize string input to prevent injection attacks
 * Removes or escapes dangerous characters
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  if (input.length === 0) return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newline, tab, carriage return)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');

  // Normalize unicode
  sanitized = sanitized.normalize('NFC');

  return sanitized;
};

/**
 * Sanitize email address
 * Removes dangerous characters while preserving valid email format
 * @param {string} email - Email address to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';

  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();

  // Remove dangerous characters
  sanitized = sanitized.replace(/[^\w\.\-@]/g, '');

  // Remove consecutive dots
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Remove leading/trailing dots
  sanitized = sanitized.replace(/^\.+|\.+$/g, '');

  return sanitized;
};

/**
 * Sanitize username
 * Allows only alphanumeric, underscore, and hyphen
 * @param {string} username - Username to sanitize
 * @returns {string} Sanitized username
 */
export const sanitizeUsername = (username) => {
  if (typeof username !== 'string') return '';

  // Trim and convert to lowercase
  let sanitized = username.trim().toLowerCase();

  // Allow only alphanumeric, underscore, and hyphen
  sanitized = sanitized.replace(/[^\w-]/g, '');

  // Remove consecutive hyphens or underscores
  sanitized = sanitized.replace(/[-_]{2,}/g, '-');

  // Remove leading/trailing hyphens and underscores
  sanitized = sanitized.replace(/^[-_]+|[-_]+$/g, '');

  return sanitized;
};

/**
 * Sanitize file path to prevent directory traversal attacks
 * Removes ../, ..\, and absolute paths
 * @param {string} path - File path to sanitize
 * @returns {string} Sanitized path
 */
export const sanitizePath = (path) => {
  if (typeof path !== 'string') return '';

  // Remove null bytes
  let sanitized = path.replace(/\0/g, '');

  // Remove directory traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/\.\.[/\\]/g, '');

  // Remove absolute paths (keep relative only)
  sanitized = sanitized.replace(/^[\/\\]/, '');
  sanitized = sanitized.replace(/^[a-zA-Z]:[\/\\]/, '');

  return sanitized;
};

/**
 * Sanitize MongoDB/NoSQL query input
 * Escapes special characters used in NoSQL injection
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeNoSQL = (input) => {
  if (typeof input !== 'string') return '';

  // Escape NoSQL special characters
  let sanitized = input
    .replace(/\$/g, '\\$')
    .replace(/\./g, '\\.');

  return sanitized;
};

/**
 * Sanitize SQL input (additional layer on top of ORM)
 * Escapes SQL special characters as extra defense
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeSQL = (input) => {
  if (typeof input !== 'string') return '';

  // Escape SQL special characters (defense in depth)
  let sanitized = input
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '\\x00')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
    .replace(/%/g, '\\%');

  return sanitized;
};

/**
 * Sanitize object by recursively sanitizing all string values
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @param {Function} options.sanitizeFn - Custom sanitize function
 * @param {string[]} options.skipKeys - Keys to skip sanitization
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj, options = {}) => {
  const { sanitizeFn = sanitizeString, skipKeys = [] } = options;

  if (!obj) return obj;
  // Handle arrays first
  if (Array.isArray(obj)) {
    return obj.map(item => {
      // Recursively sanitize objects/arrays in array
      if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
        return sanitizeObject(item, options);
      }
      // Sanitize primitive values (strings, numbers, etc.)
      return typeof item === 'string' ? sanitizeFn(item) : item;
    });
  }

  // Handle plain objects
  if (typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip specified keys completely
    if (skipKeys.includes(key)) {
      sanitized[key] = value;
      continue;
    }

    // Recursively sanitize nested objects and arrays
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      sanitized[key] = sanitizeObject(value, options);
    }
    // Sanitize string values
    else if (typeof value === 'string') {
      sanitized[key] = sanitizeFn(value);
    }
    // Keep other types as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Deep sanitization for request bodies
 * Automatically detects and sanitizes common input types
 * @param {Object} body - Request body to sanitize
 * @returns {Object} Sanitized body
 */
export const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  return sanitizeObject(body, {
    sanitizeFn: (value) => {
      // For email fields, use sanitizeEmail which includes lowercasing
      if (typeof value === 'string' && value.includes('@')) {
        return sanitizeEmail(value);
      }
      // For other strings, use sanitizeString
      return typeof value === 'string' ? sanitizeString(value) : value;
    },
    // Skip password fields (they're hashed separately)
    skipKeys: ['password', 'newPassword', 'currentPassword', 'confirmPassword']
  });
};

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate and sanitize
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedProtocols - Allowed protocols (default: ['http', 'https'])
 * @returns {Object} { valid: boolean, sanitized: string, error: string }
 */
export const sanitizeURL = (url, options = {}) => {
  const { allowedProtocols = ['http', 'https'] } = options;

  if (typeof url !== 'string') {
    return { valid: false, sanitized: '', error: 'URL must be a string' };
  }

  let sanitized = url.trim();

  // Remove dangerous protocols
  sanitized = sanitized.replace(/^(javascript|data|vbscript|about):/gi, '');

  // Validate protocol
  try {
    const urlObj = new URL(sanitized);
    if (!allowedProtocols.includes(urlObj.protocol.replace(':', ''))) {
      return {
        valid: false,
        sanitized: '',
        error: `Protocol must be one of: ${allowedProtocols.join(', ')}`
      };
    }
    // Return the sanitized URL without trailing slash (unless it's part of the original URL)
    const sanitizedUrl = urlObj.href.endsWith('/') && !url.trim().endsWith('/')
      ? urlObj.href.slice(0, -1)
      : urlObj.href;

    return { valid: true, sanitized: sanitizedUrl, error: null };
  } catch (error) {
    return { valid: false, sanitized: '', error: 'Invalid URL format' };
  }
};

/**
 * Truncate string to maximum length
 * @param {string} input - String to truncate
 * @param {number} maxLength - Maximum allowed length
 * @param {Object} options - Truncation options
 * @param {string} options.suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
export const truncate = (input, maxLength, options = {}) => {
  const { suffix = '...' } = options;

  if (typeof input !== 'string') return '';
  if (input.length <= maxLength) return input;

  return input.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Sanitize array of strings
 * @param {Array} arr - Array to sanitize
 * @param {Function} sanitizeFn - Sanitization function (default: sanitizeString)
 * @returns {Array} Sanitized array
 */
export const sanitizeArray = (arr, sanitizeFn = sanitizeString) => {
  if (!Array.isArray(arr)) return [];

  return arr
    .filter(item => item != null) // Remove null/undefined
    .map(item => typeof item === 'string' ? sanitizeFn(item) : item);
};

/**
 * Remove all non-printable ASCII characters
 * @param {string} input - String to clean
 * @returns {string} Cleaned string
 */
export const removeNonPrintable = (input) => {
  if (typeof input !== 'string') return '';

  // Keep only printable ASCII (32-126) and common whitespace
  return input.replace(/[^\x20-\x7E\n\r\t]/g, '');
};

/**
 * Strip tags completely (no HTML allowed)
 * @param {string} input - Input with potential HTML
 * @returns {string} Plain text without tags
 */
export const stripTags = (input) => {
  if (typeof input !== 'string') return '';

  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
};
