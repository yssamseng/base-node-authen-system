import express from 'express';
import cors from 'cors';
import { appLogger } from './utils/app-logger.util.js';
import moment from 'moment';
import APP_CONFIG from './config/app-config.js';

const app = express();

// Middleware
app.use(cors({
  origin: APP_CONFIG.cors.origin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Timing middleware
app.use((req, res, next) => {
  const startTime = process.hrtime.bigint();
  req.startTime = startTime;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${moment().toISOString()} - ${req.method} ${req.path}`);
  appLogger.logRequestReceived(req);
  next();
});

// Routes
import routes from './routes/routes.js';
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

export default app;
