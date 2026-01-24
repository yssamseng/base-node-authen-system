/**
 * Application constants and response codes
 * @module config/constants
 */

import { resMessage } from './message.properties.js';

// Application version
export const APP_VERSION = '1.0.0';

// ========== Response Code Constants ==========
// Format: [XX][YYY] where XX is HTTP status category and YYY is specific code
// Use these named constants instead of magic strings for better code clarity
export const RES_CODE = {
  // 200 - Success
  SUCCESS: '20000',
  SUCCESS_NO_DATA: '20100',
  REGISTRATION_SUCCESS: '20001',
  LOGIN_SUCCESS: '20002',
  LOGOUT_SUCCESS: '20003',
  PROFILE_UPDATED: '20004',
  TOKEN_REFRESH_SUCCESS: '20005',
  EMAIL_VERIFICATION_RESENT: '20009',
  EMAIL_VERIFIED: '20010',
  PASSWORD_RESET_REQUESTED: '20011',
  PASSWORD_RESET_SUCCESS: '20012',
  VERIFICATION_STATUS: '20013',

  // 400 - Bad Request
  EMAIL_ALREADY_EXISTS: '40001',
  USERNAME_ALREADY_EXISTS: '40002',
  INVALID_CREDENTIALS: '40003',
  ACCOUNT_DEACTIVATED: '40004',
  ACCOUNT_LOCKED: '40005',
  AUTHENTICATION_REQUIRED: '40006',
  TOKEN_INVALID: '40007',
  AUTH_DATA_NOT_FOUND: '40008',
  EMAIL_VERIFICATION_REQUIRED: '40009',
  EMAIL_ALREADY_VERIFIED: '40010',
  EMAIL_VERIFICATION_COOLDOWN: '40011',
  VERIFICATION_TOKEN_REQUIRED: '40012',
  VERIFICATION_TOKEN_INVALID: '40013',
  VERIFICATION_TOKEN_EXPIRED: '40014',
  EMAIL_ALREADY_VERIFIED_RETRY: '40015',
  PASSWORD_RESET_REQUIRED: '40016',
  PASSWORD_RESET_TOKEN_INVALID: '40017',
  PASSWORD_RESET_TOKEN_EXPIRED: '40018',

  // 401 - Unauthorized
  LOGIN_WRONG_CREDENTIALS: '40101',
  USER_LOCKED_TIME: '40102',
  TOKEN_EXPIRED: '40103',

  // 403 - Forbidden
  SESSION_EXPIRED: '40301',
  ACCESS_TOKEN_INVALID: '40302',
  SESSION_REVOKED: '40303',
  ROLE_NOT_MATCH_SERVICE: '40304',
  FORCE_UPDATE: '40305',

  // 404 - Not Found
  URL_NOT_FOUND: '40401',
  DATA_NOT_FOUND: '40402',
  USER_NOT_FOUND: '40403',

  // 409 - Conflict
  DUPLICATE: '40901',

  // 422 - Validation Error
  INVALID_PARAMETER: '42201',
  PARAMETER_MISSING: '42202',

  // 500 - Server Error
  INTERNAL_ERROR: '50000',
  PLEASE_TRY_AGAIN: '50001',
  CONFIG_NOT_FOUND: '50002',
};

// Response code mapping to messages (used internally for lookup)
export const resCodeMessagesMapping = {
  [RES_CODE.SUCCESS]: resMessage.common.success,
  [RES_CODE.SUCCESS_NO_DATA]: resMessage.common.successNoData,
  [RES_CODE.REGISTRATION_SUCCESS]: resMessage.auth.registrationSuccess,
  [RES_CODE.LOGIN_SUCCESS]: resMessage.auth.loginSuccess,
  [RES_CODE.LOGOUT_SUCCESS]: resMessage.auth.logoutSuccess,
  [RES_CODE.PROFILE_UPDATED]: resMessage.auth.profileUpdated,
  [RES_CODE.TOKEN_REFRESH_SUCCESS]: resMessage.common.success,
  [RES_CODE.EMAIL_VERIFICATION_RESENT]: resMessage.common.success,
  [RES_CODE.EMAIL_VERIFIED]: resMessage.common.success,
  [RES_CODE.PASSWORD_RESET_REQUESTED]: resMessage.common.success,
  [RES_CODE.PASSWORD_RESET_SUCCESS]: resMessage.common.success,
  [RES_CODE.VERIFICATION_STATUS]: resMessage.common.success,

  [RES_CODE.EMAIL_ALREADY_EXISTS]: resMessage.auth.emailAlreadyExists,
  [RES_CODE.USERNAME_ALREADY_EXISTS]: resMessage.auth.usernameAlreadyExists,
  [RES_CODE.INVALID_CREDENTIALS]: resMessage.auth.invalidCredentials,
  [RES_CODE.ACCOUNT_DEACTIVATED]: resMessage.auth.accountDeactivated,
  [RES_CODE.ACCOUNT_LOCKED]: resMessage.auth.accountLocked,
  [RES_CODE.AUTHENTICATION_REQUIRED]: resMessage.auth.authenticationRequired,
  [RES_CODE.TOKEN_INVALID]: resMessage.auth.tokenInvalid,
  [RES_CODE.AUTH_DATA_NOT_FOUND]: resMessage.auth.authDataNotFound,
  [RES_CODE.EMAIL_VERIFICATION_REQUIRED]: resMessage.auth.tokenExpired,
  [RES_CODE.EMAIL_ALREADY_VERIFIED]: resMessage.common.success,
  [RES_CODE.EMAIL_VERIFICATION_COOLDOWN]: resMessage.common.pleaseTryAgain,
  [RES_CODE.VERIFICATION_TOKEN_REQUIRED]: resMessage.badRequest.parameterIsMissing,
  [RES_CODE.VERIFICATION_TOKEN_INVALID]: resMessage.auth.invalidCredentials,
  [RES_CODE.VERIFICATION_TOKEN_EXPIRED]: resMessage.auth.tokenExpired,
  [RES_CODE.EMAIL_ALREADY_VERIFIED_RETRY]: resMessage.auth.registrationSuccess,
  [RES_CODE.PASSWORD_RESET_REQUIRED]: resMessage.badRequest.parameterIsMissing,
  [RES_CODE.PASSWORD_RESET_TOKEN_INVALID]: resMessage.auth.invalidCredentials,
  [RES_CODE.PASSWORD_RESET_TOKEN_EXPIRED]: resMessage.auth.tokenExpired,

  [RES_CODE.LOGIN_WRONG_CREDENTIALS]: resMessage.unauthorized.loginWithWrongUserOrPassword,
  [RES_CODE.USER_LOCKED_TIME]: resMessage.unauthorized.userLockedTime,
  [RES_CODE.TOKEN_EXPIRED]: resMessage.auth.tokenExpired,

  [RES_CODE.SESSION_EXPIRED]: resMessage.forbidden.sessionExpired,
  [RES_CODE.ACCESS_TOKEN_INVALID]: resMessage.forbidden.accessTokenInvalid,
  [RES_CODE.SESSION_REVOKED]: resMessage.forbidden.sessionRevoked,
  [RES_CODE.ROLE_NOT_MATCH_SERVICE]: resMessage.forbidden.roleNotMatchService,
  [RES_CODE.FORCE_UPDATE]: resMessage.forbidden.forceUpdate,

  [RES_CODE.URL_NOT_FOUND]: resMessage.notFound.urlNotFound,
  [RES_CODE.DATA_NOT_FOUND]: resMessage.notFound.dataNotFound,
  [RES_CODE.USER_NOT_FOUND]: resMessage.notFound.userNotFound,

  [RES_CODE.DUPLICATE]: resMessage.badRequest.duplicate,

  [RES_CODE.INTERNAL_ERROR]: resMessage.common.error,
  [RES_CODE.PLEASE_TRY_AGAIN]: resMessage.common.pleaseTryAgain,
  [RES_CODE.CONFIG_NOT_FOUND]: resMessage.common.configNotFound,

  [RES_CODE.INVALID_PARAMETER]: resMessage.badRequest.invalidParameter,
  [RES_CODE.PARAMETER_MISSING]: resMessage.badRequest.parameterIsMissing,
};

// Configuration mapping object
export const CONFIG_MAPPING = {};

// Logging constants - Syslog severity levels (RFC 5424)
export const LOG_CONSTANT = {
  // Syslog logging levels (priority: crit=0, error=1, warning=2, notice=3, info=4, debug=5)
  LEVEL: {
    CRIT: 'crit',       // 2 - Critical system failures (logFatal)
    ERROR: 'error',     // 3 - Application errors, 5xx HTTP (logError)
    WARNING: 'warning', // 4 - Warnings, 4xx HTTP (logWarn)
    NOTICE: 'notice',   // 5 - Normal but significant (logInfo, logAuth, logService)
    INFO: 'info',       // 6 - Informational (logRequestReceived, logResponse, logEmail)
    DEBUG: 'debug',     // 7 - Debug-level messages (logDebug, logDatabase, logPerformance)
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
  //external service log type
  TYPE_SERVICE: {}
}