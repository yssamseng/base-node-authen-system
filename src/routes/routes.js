/**
 * Main API routes aggregator
 * Mounts all route modules under /api prefix with versioning
 * @module routes/routes
 */

import express from 'express';
const router = express.Router();
import v1Routes from './v1/index.js';
import { healthCheck } from '../controllers/health.controller.js';

// Health check route (no version)
router.get('/health', healthCheck);

// Mount v1 routes under /api/v1
router.use('/v1', v1Routes);

export default router;
