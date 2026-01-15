import { genResponseObj, responseError, response } from '../core/handler.js';
import { sequelize } from '../config/database.js';
import * as authService from '../services/auth.service.js';

/**
 * Register a new user account
 * @param {Object} req - Express request object with body containing username, email, password
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const register = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await authService.register(req, transaction );
    await transaction.commit();
    return response(req, res, genResponseObj(req, '20000', result));
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return responseError(req, res, error);
  }
};

/**
 * Authenticate user and generate tokens
 * @param {Object} req - Express request object with body containing email, password, deviceInfo
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const login = async (req, res) => {
  try {
    const result = await authService.login(req);
    return response(req, res, genResponseObj(req, '20002', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

/**
 * Logout user from current session
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const logout = async (req, res) => {
  try {
    const result = await authService.logout(req);
    return response(req, res, genResponseObj(req, '20003', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

/**
 * Logout user from all sessions
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const logoutAll = async (req, res) => {
  try {
    const result = await authService.logoutAll(req);
    return response(req, res, genResponseObj(req, '20003', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

/**
 * Refresh access token using refresh token
 * @param {Object} req - Express request object with body containing refreshToken
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req);
    return response(req, res, genResponseObj(req, '20005', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object with body containing oldPassword, newPassword
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(req);
    return response(req, res, genResponseObj(req, '20004', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

export {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  changePassword
};
