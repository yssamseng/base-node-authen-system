/**
 * Authentication routes
 * Endpoints for user registration, login, logout, and password management
 * @module routes/auth
 */

import express from 'express';
const router = express.Router();
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRegistration, validateLogin, validateRefreshToken, validateChangePassword } from '../validators/auth.validator.js';
import { rateLimitDB } from '../middleware/rate-limit-db.middleware.js';
import { AUTH_RATE_LIMIT_WINDOW_MS, AUTH_RATE_LIMIT_MAX_REQUESTS } from '../config/time.constants.js';

// Rate limiting: use configured attempts per configured window for auth endpoints
const authRateLimit = rateLimitDB({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  maxRequests: AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true // Don't count successful requests
});

// Public routes with rate limiting
router.post('/register', authRateLimit, validateRegistration, authController.register);
router.post('/login', authRateLimit, validateLogin, authController.login);
router.post('/refresh-token', authRateLimit, validateRefreshToken, authController.refreshToken);

// Protected routes (no rate limit - already have auth middleware)
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validateChangePassword, authController.changePassword);

export default router;
