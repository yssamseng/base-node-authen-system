/**
 * Main API routes aggregator
 * Mounts all route modules under /api prefix with versioning
 * @module routes/routes
 */

import express from 'express';
const router = express.Router();
import v1Routes from './v1/index.js';
import { healthCheck } from '../controllers/health.controller.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.config.js';

// Health check route (no version)
router.get('/health', healthCheck);

// Swagger documentation UI
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Node Auth API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
  },
}));

// Swagger JSON spec
router.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Mount v1 routes under /api/v1
router.use('/v1', v1Routes);

export default router;
