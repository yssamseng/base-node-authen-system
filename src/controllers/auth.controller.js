import { genResponseObj, responseError, response } from '../core/handler.js';
import { sequelize } from '../config/database.js';
import * as authService from '../services/auth.service.js';

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

const login = async (req, res) => {
  try {
    const result = await authService.login(req);
    return response(req, res, genResponseObj(req, '20002', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};


const logout = async (req, res) => {
  try {
    const result = await authService.logout(req);
    return response(req, res, genResponseObj(req, '20003', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

const logoutAll = async (req, res) => {
  try {
    const result = await authService.logoutAll(req);
    return response(req, res, genResponseObj(req, '20003', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req);
    return response(req, res, genResponseObj(req, '20005', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

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
