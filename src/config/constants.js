/**
 * Application constants and response codes
 * @module config/constants
 */

import { resMessage } from './message.properties.js';

// Application version
export const APP_VERSION = '1.0.0';

// Response code mapping to messages
// Format: [XX][YYY] where XX is HTTP status category and YYY is specific code
export const resCode = {
  //200 - Success
  20000: resMessage.common.success,
  20100: resMessage.common.successNoData,
  20001: resMessage.auth.registrationSuccess,
  20002: resMessage.auth.loginSuccess,
  20003: resMessage.auth.logoutSuccess,
  20004: resMessage.auth.profileUpdated,

  //400 - Bad Request
  40001: resMessage.auth.emailAlreadyExists,
  40002: resMessage.auth.usernameAlreadyExists,
  40003: resMessage.auth.invalidCredentials,
  40004: resMessage.auth.accountDeactivated,
  40005: resMessage.auth.accountLocked,
  40006: resMessage.auth.authenticationRequired,
  40007: resMessage.auth.tokenInvalid,
  40008: resMessage.auth.authDataNotFound,

  //401 - Unauthorized
  40101: resMessage.unauthorized.loginWithWrongUserOrPassword,
  40102: resMessage.unauthorized.userLockedTime,
  40103: resMessage.auth.tokenExpired,

  //403 - Forbidden
  40301: resMessage.forbidden.sessionExpired,
  40302: resMessage.forbidden.accessTokenInvalid,
  40303: resMessage.forbidden.sessionRevoked,
  40304: resMessage.forbidden.roleNotMatchService,
  40305: resMessage.forbidden.forceUpdate,

  //404 - Not Found
  40401: resMessage.notFound.urlNotFound,
  40402: resMessage.notFound.dataNotFound,
  40403: resMessage.notFound.userNotFound,

  //409 - Conflict
  40901: resMessage.badRequest.duplicate,

  //500 - Server Error
  50000: resMessage.common.error,
  50001: resMessage.common.pleaseTryAgain,
  50002: resMessage.common.configNotFound,

  //422 - Validation Error
  42201: resMessage.badRequest.invalidParameter,
  42202: resMessage.badRequest.parameterIsMissing,
};

// Configuration mapping object
export const CONFIG_MAPPING = {};

// Logging constants
export const LOG_CONSTANT = {
  LEVEL: {
    FATAL: 'fatal',
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },
  LOG_TYPE_SERVICE: {}
}