import express from 'express';
const router = express.Router();
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import emailVerificationRoutes from './email-verification.route.js';
import { healthCheck } from '../controllers/health.controller.js';

// Health check route with database status
router.get('/health', healthCheck);

// Mount auth routes
router.use('/auth', authRoutes);

// Mount email verification routes
router.use('/email-verification', emailVerificationRoutes);

// Mount user routes
router.use('/user', userRoutes);

export default router;
