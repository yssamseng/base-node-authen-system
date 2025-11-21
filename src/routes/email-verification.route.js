import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as emailVerification from '../controllers/email-verification.controller.js';
import {
  resendVerificationSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} from '../validators/email-verification.validator.js';
import { validateBody } from '../validators/index.js';

const router = Router();

// Public routes - no authentication required
router.post('/resend-verification', validateBody(resendVerificationSchema), emailVerification.resendVerification);
router.post('/verify', validateBody(verifyEmailSchema), emailVerification.confirmVerification);
router.post('/request-password-reset', validateBody(requestPasswordResetSchema), emailVerification.requestPasswordResetLink);
router.post('/reset-password', validateBody(resetPasswordSchema), emailVerification.confirmPasswordReset);

// Protected routes - authentication required
router.get('/status', authenticate, emailVerification.getVerificationStatus);

export default router;