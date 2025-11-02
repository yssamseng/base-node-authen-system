import Joi from 'joi';
import {validateRequest} from './index.js'

const registrationSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 50 characters',
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
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
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
    .min(6)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
});


const validateRegistration = validateRequest(registrationSchema);
const validateLogin = validateRequest(loginSchema);
const validateRefreshToken = validateRequest(refreshTokenSchema);
const validateChangePassword = validateRequest(changePasswordSchema);

export {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateChangePassword
}