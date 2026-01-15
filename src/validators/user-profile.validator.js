/**
 * User profile validation schemas
 * Joi schemas for user profile update endpoints
 * @module validators/user-profile
 */

import Joi from 'joi';
import { validateBody } from './validator.js'

// Update profile schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .max(50)
    .trim()
    .optional()
    .allow('') //.empty('') if want transforming empty strings to null
    .messages({
      'string.max': 'First name must not exceed 50 characters'
    }),
  lastName: Joi.string()
    .max(50)
    .trim()
    .optional()
    .allow('') //.empty('')
    .messages({
      'string.max': 'Last name must not exceed 50 characters'
    })
});

const validateUpdateProfile = validateBody(updateProfileSchema);

export {
  validateUpdateProfile
}