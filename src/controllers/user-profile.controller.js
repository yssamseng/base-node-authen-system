import { genResponseObj, responseError, response } from '../core/handler.js';
import * as userProfileService from '../services/user-profile.service.js';

const getProfile = async (req, res) => {
  try {
    const result = await userProfileService.getProfile(req);
    return response(req, res, genResponseObj(req, '20000', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const result = await userProfileService.updateProfile(req);
    return response(req, res, genResponseObj(req, '20004', result));
  } catch (error) {
    return responseError(req, res, error);
  }
};

export {
  getProfile,
  updateProfile
};