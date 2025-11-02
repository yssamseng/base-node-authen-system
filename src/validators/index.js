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

export { validateRequest };