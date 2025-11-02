import User from './user.model.js';
import UserAuth from './user-auth.model.js';
import UserToken from './user-token.model.js';

// Collect all models
const models = {
  User,
  UserAuth,
  UserToken
};

// Call associate method for each model if it exists
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export default models;

