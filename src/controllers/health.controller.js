import { sequelize } from '../config/database.js';
import { response, genResponseObj } from '../core/handler.js';
import { appLogger } from '../utils/app-logger.util.js';
import { RES_CODE } from '../config/constants.js';

/**
 * Health check controller with database status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const healthCheck = async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'unknown',
      message: ''
    }
  };

  // Check database connection
  try {
    await sequelize.authenticate();
    healthStatus.database = {
      status: 'connected',
      message: 'Database connection is healthy'
    };
    appLogger.logDebug('Health check: Database connected');
  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.database = {
      status: 'disconnected',
      message: error.message
    };
    appLogger.logError(`Health check: Database connection failed - ${error.message}`);
  }

  // Return appropriate status code based on health
  const statusCode = healthStatus.status === 'healthy' ? RES_CODE.SUCCESS : RES_CODE.INTERNAL_ERROR;
  return response(req, res, genResponseObj(req, statusCode, healthStatus));
};

export { healthCheck };
