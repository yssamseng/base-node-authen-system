import express from 'express';
import moment from 'moment';
const router = express.Router();
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRegistration, validateLogin, validateRefreshToken, validateChangePassword } from '../validators/auth.validator.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

const windowMs15Min = moment.duration(15, 'minutes').asMilliseconds(); // 15 minutes
const valRateLimit = rateLimit({ windowMs: windowMs15Min, maxAttempts: 5 }); // 5 attempts per 15 minutes
// Public routes
router.post('/register', valRateLimit, validateRegistration, authController.register);
router.post('/login', valRateLimit, validateLogin, authController.login);
router.post('/refresh-token', valRateLimit, validateRefreshToken, authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validateChangePassword, authController.changePassword);

export default router;
