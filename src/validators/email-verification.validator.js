import Joi from 'joi';

// Resend verification email schema
export const resendVerificationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Verify email schema
export const verifyEmailSchema = Joi.object({
  token: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Verification token cannot be empty',
      'any.required': 'Verification token is required'
    })
});

// Request password reset schema
export const requestPasswordResetSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Reset password schema
export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Reset token cannot be empty',
      'any.required': 'Reset token is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .max(255)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 255 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

export default {
  resendVerificationSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
};