/**
 * Response Code → Message Mapping
 * @module config/res-code-message.map
 */

import { RES_CODE } from "./constants.js";
import { resMessage } from "./message.properties.js";

export const RES_CODE_MESSAGE_MAPPING = {
  // ============================
  // COMMON
  // ============================
  [RES_CODE.SUCCESS]: resMessage.common.success,
  [RES_CODE.SUCCESS_NO_DATA]: resMessage.common.successNoData,

  [RES_CODE.INTERNAL_ERROR]: resMessage.common.error,
  [RES_CODE.PLEASE_TRY_AGAIN]: resMessage.common.pleaseTryAgain,
  [RES_CODE.CONFIG_NOT_FOUND]: resMessage.common.configNotFound,

  // ============================
  // BAD REQUEST
  // ============================
  [RES_CODE.INVALID_REQUEST]: resMessage.badRequest.invalidRequest,
  [RES_CODE.INVALID_PARAMETER]: resMessage.badRequest.invalidParameter,
  [RES_CODE.PARAMETER_IS_MISSING]: resMessage.badRequest.parameterIsMissing,
  [RES_CODE.DUPLICATE_DATA]: resMessage.badRequest.duplicate,
  [RES_CODE.MAX_FILE_SIZE]: resMessage.badRequest.maxFileSize,

  // ============================
  // UNAUTHORIZED
  // ============================
  [RES_CODE.AUTHENTICATION_REQUIRED]: resMessage.unauthorized.authenticationRequired,
  [RES_CODE.LOGIN_WRONG_USER_OR_PASSWORD]:resMessage.unauthorized.loginWithWrongUserOrPassword,
  [RES_CODE.ANOTHER_SESSION_STILL_LOGON]: resMessage.unauthorized.anotherSessionStillLogon,
  [RES_CODE.USER_LOCKED_TIME]: resMessage.unauthorized.userLockedTime,
  [RES_CODE.TOKEN_MISSING]: resMessage.unauthorized.tokenMissing,
  [RES_CODE.TOKEN_INVALID]: resMessage.unauthorized.tokenInvalid,
  [RES_CODE.TOKEN_EXPIRED]: resMessage.unauthorized.tokenExpired,
  [RES_CODE.SESSION_EXPIRED]: resMessage.unauthorized.sessionExpired,

  // ============================
  // FORBIDDEN
  // ============================
  [RES_CODE.FORBIDDEN]: resMessage.forbidden.forbidden,
  [RES_CODE.ACCESS_TOKEN_INVALID]: resMessage.forbidden.accessTokenInvalid,
  [RES_CODE.FORCE_UPDATE]: resMessage.forbidden.forceUpdate,
  [RES_CODE.SESSION_REVOKED]: resMessage.forbidden.sessionRevoked,
  [RES_CODE.ROLE_NOT_MATCH_SERVICE]: resMessage.forbidden.roleNotMatchService,

  // ============================
  // NOT FOUND
  // ============================
  [RES_CODE.URL_NOT_FOUND]: resMessage.notFound.urlNotFound,
  [RES_CODE.DATA_NOT_FOUND]: resMessage.notFound.dataNotFound,
  [RES_CODE.USER_NOT_FOUND]: resMessage.notFound.userNotFound,
  [RES_CODE.FILE_NOT_FOUND]: resMessage.notFound.fileNotFound,

  // ============================
  // AUTH BUSINESS
  // ============================
  [RES_CODE.REGISTRATION_SUCCESS]: resMessage.auth.registrationSuccess,
  [RES_CODE.LOGIN_SUCCESS]: resMessage.auth.loginSuccess,
  [RES_CODE.LOGOUT_SUCCESS]: resMessage.auth.logoutSuccess,
  [RES_CODE.PROFILE_UPDATED]: resMessage.auth.profileUpdated,

  [RES_CODE.EMAIL_ALREADY_EXISTS]: resMessage.auth.emailAlreadyExists,
  [RES_CODE.EMAIL_ALREADY_VERIFIED]: resMessage.auth.emailAlreadyVerified,
  [RES_CODE.USERNAME_ALREADY_EXISTS]: resMessage.auth.usernameAlreadyExists,

  [RES_CODE.INVALID_CREDENTIALS]: resMessage.auth.invalidCredentials,
  [RES_CODE.ACCOUNT_DEACTIVATED]: resMessage.auth.accountDeactivated,
  [RES_CODE.ACCOUNT_LOCKED]: resMessage.auth.accountLocked,

  [RES_CODE.AUTH_DATA_NOT_FOUND]: resMessage.auth.authDataNotFound,

  [RES_CODE.PASSWORD_RESET_SUCCESS]: resMessage.auth.passwordResetSuccess,
  [RES_CODE.PASSWORD_TOO_WEAK]: resMessage.auth.passwordTooWeak,

  // ============================
  // FILE MODULE
  // ============================
  [RES_CODE.FILE_TYPE_INVALID]: resMessage.file.fileTypeInvalid,
  [RES_CODE.FILE_MISSING]: resMessage.file.notFound,

  // ============================
  // FILE UPLOAD MODULE
  // ============================
  [RES_CODE.FILE_UPLOAD_SUCCESS]: resMessage.fileUpload.fileUploadSuccess,
  [RES_CODE.FILE_DOWNLOAD_READY]: resMessage.fileUpload.fileDownloadReady,
  [RES_CODE.FILE_DELETE_SUCCESS]: resMessage.fileUpload.fileDeleteSuccess,
  [RES_CODE.INVALID_FILE_TYPE]: resMessage.fileUpload.invalidFileType,
  [RES_CODE.FILE_TOO_LARGE]: resMessage.fileUpload.fileTooLarge,
  [RES_CODE.QUOTA_EXCEEDED]: resMessage.fileUpload.quotaExceeded,
  [RES_CODE.INVALID_FILENAME]: resMessage.fileUpload.invalidFilename,
  [RES_CODE.NO_FILE_PROVIDED]: resMessage.fileUpload.noFileProvided,
  [RES_CODE.ACCESS_DENIED]: resMessage.fileUpload.accessDenied,
};
