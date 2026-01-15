import { Router } from 'express';
import moment from 'moment';
import { authenticate } from '../middleware/auth.middleware.js';
import * as emailVerification from '../controllers/email-verification.controller.js';
import {
  resendVerificationSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} from '../validators/email-verification.validator.js';
import { validateBody } from '../validators/validator.js';
import { rateLimitDB } from '../middleware/rate-limit-db.middleware.js';

const router = Router();

// Rate limiting for email operations (10 per hour)
const emailRateLimit = rateLimitDB({
  windowMs: moment.duration(1, 'hour').asMilliseconds(),
  maxRequests: 10,
  message: 'Too many email requests, please try again later',
  skipSuccessfulRequests: false // Count all requests including successful
});

// Public routes - no authentication required
router.post('/resend-verification', emailRateLimit, validateBody(resendVerificationSchema), emailVerification.resendVerification);
router.post('/verify', validateBody(verifyEmailSchema), emailVerification.confirmVerification);
router.post('/request-password-reset', emailRateLimit, validateBody(requestPasswordResetSchema), emailVerification.requestPasswordResetLink);
router.post('/reset-password', validateBody(resetPasswordSchema), emailVerification.confirmPasswordReset);

// Protected routes - authentication required
router.get('/status', authenticate, emailVerification.getVerificationStatus);

export default router;
