/**
 * Model aggregator and association initializer
 * Collects all Sequelize models and sets up associations
 * @module models/model
 */

import User from './user.model.js';
import UserAuth from './user-auth.model.js';
import UserToken from './user-token.model.js';
import RateLimit from './rate-limit.model.js';

// All Sequelize models with associations initialized
const models = {
  User,
  UserAuth,
  UserToken,
  RateLimit
};

// Call associate method for each model if it exists
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export default models;
