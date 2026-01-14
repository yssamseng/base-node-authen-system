import express from 'express';
const router = express.Router();
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import emailVerificationRoutes from './email-verification.route.js';
import { appLogger } from '../utils/app-logger.util.js';
import { response, genResponseObj } from '../core/handler.js';

// Health check route
router.get('/health', (req, res) => {
  appLogger.logInfo('API IS RUNNING');
  const result = { status: 'API is running'};
  return response(req, res, genResponseObj(req, '20000', result));
});

// Mount auth routes
router.use('/auth', authRoutes);

// Mount email verification routes
router.use('/email-verification', emailVerificationRoutes);

// Mount user routes
router.use('/user', userRoutes);

export default router;
