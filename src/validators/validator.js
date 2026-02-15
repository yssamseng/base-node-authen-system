import { responseError, genErrorResponseObj } from '../core/handler.js';
import { RES_CODE } from '../config/constants.js';

/**
 * Create validation middleware for request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      const result = genErrorResponseObj(req, RES_CODE.INVALID_REQUEST, {
        message: 'Validation failed',
        validationErrors: errors,
      });
      return responseError(req, res, result);
    }

    req.body = value;
    next();
  };
};

/**
 * Body validation middleware
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => validateRequest(schema, 'body');

/**
 * Query validation middleware
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => validateRequest(schema, 'query');

/**
 * Params validation middleware
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => validateRequest(schema, 'params');

export { validateBody, validateQuery, validateParams };