import { genErrorResponseObj } from '../core/handler.js';
import moment from 'moment';
import models from '../models/model.js';
import { findOne, update } from '../utils/db.util.js';
const { User, UserAuth } = models;

const getProfile = async (req) => {
  const userId = req.user.id;

  const user = await findOne(User, {
    pk: userId,
    include: [{
      model: UserAuth,
      as: 'auth',
      attributes: ['lastLogin', 'isVerified', 'failedAttempts']
    }]
  });

  if (!user) {
    throw genErrorResponseObj(req, '40403', 'User not found');
  }

  return {
    user: user.toJSON(),
    lastLogin: user.auth?.lastLogin ? moment(user.auth.lastLogin).format('YYYY-MM-DD HH:mm:ss') : null,
    memberSince: moment(user.createdAt).format('YYYY-MM-DD'),
    isVerified: user.auth?.isVerified || false
  };
};

const updateProfile = async (req) => {
  const userId = req.user.id;
  const { firstName, lastName } = req.body;

  const user = await findOne(User, { pk: userId });

  if (!user) {
    throw genErrorResponseObj(req, '40403', 'User not found');
  }

  // Update user fields
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;

  await update(User, {
    data: updateData,
    criteria: { id: userId }
  });

  // Get the updated user
  const updatedUser = await findOne(User, { pk: userId });

  return {
    user: updatedUser.toJSON(),
    updatedAt: moment(updatedUser.updatedAt).format('YYYY-MM-DD HH:mm:ss')
  };
};

export {
  getProfile,
  updateProfile
};