import { responseError, genErrorResponseObj } from '../core/handler.js';

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

      const result = genErrorResponseObj(req, '42201', {
        message: 'Validation failed',
        validationErrors: errors,
      });
      return responseError(req, res, result);
    }

    req.body = value;
    next();
  };
};

// Body validation middleware
const validateBody = (schema) => validateRequest(schema, 'body');
// Query validation middleware
const validateQuery = (schema) => validateRequest(schema, 'query');
// Params validation middleware
const validateParams = (schema) => validateRequest(schema, 'params');

export { validateBody, validateQuery, validateParams };