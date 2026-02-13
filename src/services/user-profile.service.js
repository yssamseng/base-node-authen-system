/**
 * User profile service
 * Handles user profile retrieval and updates
 * @module services/user-profile
 */

import { genErrorResponseObj } from '../core/handler.js';
import { RES_CODE } from '../config/constants.js';
import models from '../models/model.js';
import { findOne, update } from '../utils/db.util.js';
import { formatDateTime, formatDateOnly } from '../utils/date.util.js';

const { User, UserAuth } = models;

/**
 * Get user profile
 */
const getProfile = async (req) => {
  if (!req.user) {
    throw genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, 'User not found');
  }

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
    throw genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, 'User not found');
  }

  return {
    user: user.toJSON(),
    lastLogin: user.auth?.lastLogin ? formatDateTime(user.auth.lastLogin) : null,
    memberSince: formatDateOnly(user.createdAt),
    isVerified: user.auth?.isVerified || false
  };
};

/**
 * Update user profile
 */
const updateProfile = async (req) => {
  if (!req.user) {
    throw genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, 'User not found');
  }

  const userId = req.user.id;
  const { firstName, lastName } = req.body;

  const user = await findOne(User, { pk: userId });

  if (!user) {
    throw genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, 'User not found');
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
    updatedAt: formatDateTime(updatedUser.updatedAt)
  };
};

export {
  getProfile,
  updateProfile
};