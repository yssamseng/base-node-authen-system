/**
 * Application constants and response codes
 * @module config/constants
 */

/**
 * Application version
 */
export const APP_VERSION = '1.0.0';

/**
 * Log constants
 * Syslog logging levels (RFC 5424)
 */
export const LOG_CONSTANT = {
  // Syslog logging levels (priority: crit=0, error=1, warning=2, notice=3, info=4, debug=5)
  LEVEL: {
    CRIT: 'crit',       // 2 - Critical system failures (logFatal)
    ERROR: 'error',     // 3 - Application errors, 5xx HTTP (logError)
    WARNING: 'warning',   // 4 - Warnings, 4xx HTTP (logWarn)
    NOTICE: 'notice',    // 5 - Normal but significant (logInfo)
    INFO: 'info',       // 6 - Informational (logInfo, logAuth, logService, logEmail)
    DEBUG: 'debug',     // 7 - Debug-level messages (logDebug)
  },

  // Log types for categorizing log entries
  TYPE: {
    FATAL: 'FATAL',      // Critical system failures
    DEBUG: 'DEBUG',
    HTTP: 'HTTP',
    DB: 'DB',
    AUTH: 'AUTH',
    SERVICE: 'SERVICE',
    PERFORMANCE: 'PERFORMANCE',
    EMAIL: 'EMAIL',
  },

  // External service log types
  TYPE_SERVICE: {} // For external service calls
};

/**
 * Response code constants
 */
export const RES_CODE = {
  // ============================
  // COMMON (200)
  // ============================
  SUCCESS: 20000,
  SUCCESS_NO_DATA: 20001,

  // ============================
  // COMMON (500)
  // ============================
  INTERNAL_ERROR: 50000,
  PLEASE_TRY_AGAIN: 50001,
  CONFIG_NOT_FOUND: 50002,

  // ============================
  // BAD REQUEST (400)
  // ============================
  INVALID_REQUEST: 40000,
  INVALID_PARAMETER: 40001,
  PARAMETER_IS_MISSING: 40002,
  DUPLICATE_DATA: 40003,
  MAX_FILE_SIZE: 40004,

  // ============================
  // UNAUTHORIZED (401)
  // ============================
  AUTHENTICATION_REQUIRED: 40100,
  LOGIN_WRONG_USER_OR_PASSWORD: 40101,
  ANOTHER_SESSION_STILL_LOGON: 40102,
  USER_LOCKED_TIME: 40103,

  TOKEN_MISSING: 40110,
  TOKEN_INVALID: 40111,
  TOKEN_EXPIRED: 40112,
  SESSION_EXPIRED: 40113,

  // ============================
  // FORBIDDEN (403)
  // ============================
  FORBIDDEN: 40300,
  ACCESS_TOKEN_INVALID: 40301,
  FORCE_UPDATE: 40302,
  SESSION_REVOKED: 40303,
  ROLE_NOT_MATCH_SERVICE: 40304,

  // ============================
  // NOT FOUND (404)
  // ============================
  URL_NOT_FOUND: 40400,
  DATA_NOT_FOUND: 40401,
  USER_NOT_FOUND: 40402,
  FILE_NOT_FOUND: 40403,

  // ============================
  // AUTH BUSINESS (200 + 409)
  // ============================
  REGISTRATION_SUCCESS: 20010,
  LOGIN_SUCCESS: 20011,
  LOGOUT_SUCCESS: 20012,
  PROFILE_UPDATED: 20013,

  EMAIL_ALREADY_EXISTS: 40900,
  EMAIL_ALREADY_VERIFIED: 40901,
  USERNAME_ALREADY_EXISTS: 40902,

  INVALID_CREDENTIALS: 40120,
  ACCOUNT_DEACTIVATED: 40310,
  ACCOUNT_LOCKED: 40311,

  AUTH_DATA_NOT_FOUND: 40410,

  PASSWORD_RESET_SUCCESS: 20014,
  PASSWORD_TOO_WEAK: 40010,

  // ============================
  // FILE MODULE
  // ============================
  FILE_TYPE_INVALID: 40020,
  FILE_MISSING: 40420,

  // ============================
  // FILE UPLOAD MODULE
  // ============================
  FILE_UPLOAD_SUCCESS: 20020,
  FILE_DOWNLOAD_READY: 20021,
  FILE_DELETE_SUCCESS: 20022,

  INVALID_FILE_TYPE: 40021,
  FILE_TOO_LARGE: 40022,
  QUOTA_EXCEEDED: 40320,
  INVALID_FILENAME: 40023,
  NO_FILE_PROVIDED: 40024,
  TOO_MANY_FILES: 40025,
  ACCESS_DENIED: 40321,
};