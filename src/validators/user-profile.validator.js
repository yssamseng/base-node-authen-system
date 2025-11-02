import Joi from 'joi';
import {validateRequest} from './index.js'

const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'First name must not exceed 50 characters'
    }),
  lastName: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Last name must not exceed 50 characters'
    })
});

const validateUpdateProfile = validateRequest(updateProfileSchema);

export {
  validateUpdateProfile
}