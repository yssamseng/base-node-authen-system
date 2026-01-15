import Joi from 'joi';
import {validateBody} from './validator.js'

// Password complexity pattern:
// - At least 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const registrationSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)  // Only alphanumeric and underscore
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 50 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
      'any.required': 'Password is required'
    }),
  firstName: Joi.string()
    .max(50)
    .optional()
    .allow(''),
  lastName: Joi.string()
    .max(50)
    .optional()
    .allow('')
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.empty': 'Refresh token is required',
      'string.min': 'Refresh token must be at least 10 characters long',
      'any.required': 'Refresh token is required'
    })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(passwordPattern)
    .invalid(Joi.ref('currentPassword'))  // Cannot be same as current
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
      'any.invalid': 'New password must be different from current password',
      'any.required': 'New password is required'
    })
});


const validateRegistration = validateBody(registrationSchema);
const validateLogin = validateBody(loginSchema);
const validateRefreshToken = validateBody(refreshTokenSchema);
const validateChangePassword = validateBody(changePasswordSchema);

export {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateChangePassword
}
