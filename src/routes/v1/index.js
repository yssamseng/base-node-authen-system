/**
 * API v1 routes aggregator
 * Mounts all v1 route modules
 * @module routes/v1
 */

import express from 'express';
const router = express.Router();

import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import emailVerificationRoutes from './email-verification.route.js';
import fileUploadRoutes from './file-upload.route.js';

// Mount auth routes
router.use('/auth', authRoutes);

// Mount email verification routes
router.use('/email-verification', emailVerificationRoutes);

// Mount user routes
router.use('/user', userRoutes);

// Mount file upload routes
router.use('/files', fileUploadRoutes);

export default router;
