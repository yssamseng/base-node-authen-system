import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import moment from 'moment';
import APP_CONFIG from './config/app-config.js';
import { appLogger } from './utils/app-logger.util.js';
import routes from './routes/routes.js';

// Express application configured with security middleware, CORS, compression, and error handling
const app = express();

// ============================================
// 1. SECURITY MIDDLEWARE (First Priority)
// ============================================

// Security headers - must be FIRST to protect all routes
app.use(helmet({
  // Content Security Policy - restricts sources of content
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // HTTP Strict Transport Security - enforce HTTPS in production
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Prevent MIME type sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // XSS Protection
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Permissions-Policy (formerly Feature-Policy)
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
    }
  }
}));

// CORS - Cross-Origin Resource Sharing
// Supports multiple origins (comma-separated in CORS_ORIGIN env var)
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = APP_CONFIG.cors.origins;

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for origin: ' + origin));
    }
  },
  credentials: true
}));

// ============================================
// 2. PERFORMANCE MIDDLEWARE
// ============================================

// Response compression - compress all responses
// Skip compression for smaller responses (< 1KB) to avoid CPU overhead
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      // Don't compress if client explicitly asks not to
      return false;
    }
    // Compress all responses
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (0-9, 6 is default)
}));

// ============================================
// 3. BODY PARSING MIDDLEWARE
// ============================================

// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ============================================
// 4. CUSTOM MIDDLEWARE
// ============================================

// Timing middleware - MUST come before routes, after body parsing
app.use((req, _res, next) => {
  const startTime = process.hrtime.bigint();
  req.startTime = startTime;
  next();
});

// Request logging middleware - logs incoming requests
app.use((req, _res, next) => {
  console.log(`${moment().toISOString()} - ${req.method} ${req.path}`);
  appLogger.logRequestReceived(req);
  next();
});

// ============================================
// 5. ROUTES
// ============================================

// API routes
app.use('/api', routes);

// ============================================
// 6. ERROR HANDLING (Last Priority)
// ============================================

// 404 handler - must be before error handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handling middleware - MUST be LAST
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

export default app;
