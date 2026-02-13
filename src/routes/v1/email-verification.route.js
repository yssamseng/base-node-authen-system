/**
 * Email verification routes
 * Endpoints for email verification and password reset functionality
 * @module routes/email-verification
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as emailVerification from '../../controllers/email-verification.controller.js';
import {
  resendVerificationSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} from '../../validators/email-verification.validator.js';
import { validateBody } from '../../validators/validator.js';
import { rateLimitDB } from '../../middleware/rate-limit-db.middleware.js';
import { EMAIL_RATE_LIMIT_WINDOW_MS, EMAIL_RATE_LIMIT_MAX_REQUESTS } from '../../config/time.constants.js';

const router = Router();

// Rate limiting for email operations (use configured values)
const emailRateLimit = rateLimitDB({
  windowMs: EMAIL_RATE_LIMIT_WINDOW_MS,
  maxRequests: EMAIL_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many email requests, please try again later',
  skipSuccessfulRequests: false // Count all requests including successful
});

// Public routes - no authentication required
router.post('/resend-verification', emailRateLimit, validateBody(resendVerificationSchema), emailVerification.resendVerificationEmail);
router.post('/verify', validateBody(verifyEmailSchema), emailVerification.verifyEmail);
router.post('/request-password-reset', emailRateLimit, validateBody(requestPasswordResetSchema), emailVerification.requestPasswordReset);
router.post('/reset-password', validateBody(resetPasswordSchema), emailVerification.resetPassword);

// Protected routes - authentication required
router.get('/status', authenticate, emailVerification.checkVerificationStatus);

export default router;
