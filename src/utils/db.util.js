/**
 * Base Database Utility
 * Provides essential CRUD operations with logging
 * Tracks database operation timing and logs slow queries (>1000ms)
 */

import { appLogger } from './app-logger.util.js';

// Slow query threshold in milliseconds
const SLOW_QUERY_THRESHOLD = 1000;

/**
 * Helper method to log database operations with timing
 * Normal queries use logDatabase (DEBUG level)
 * Slow queries (>1000ms) use logPerformance (WARNING level)
 */
const logOperation = {
  info: (operation, model, details = {}, durationMs = null) => {
    const logDetails = { ...details };
    if (durationMs !== null) {
      logDetails.duration_ms = parseFloat(durationMs.toFixed(2));
    }

    // Slow query → logPerformance (WARNING), Normal query → logDatabase (DEBUG)
    if (durationMs !== null && durationMs > SLOW_QUERY_THRESHOLD) {
      appLogger.logPerformance(`${model.name}.${operation}`, durationMs, {
        table: model.name,
        operation,
        ...logDetails
      });
    } else {
      appLogger.logDatabase(operation, model.name, { ...logDetails, success: true });
    }
  },
  error: (operation, model, error, details = {}, durationMs = null) => {
    const logDetails = {
      ...details,
      success: false,
      error: error.message,
      stack: error.stack
    };
    if (durationMs !== null) {
      logDetails.duration_ms = parseFloat(durationMs.toFixed(2));
    }
    appLogger.logDatabase(operation, model.name, logDetails);
  },
  warn: (operation, model, message, details = {}, durationMs = null) => {
    const logDetails = { ...details, warning: message };
    if (durationMs !== null) {
      logDetails.duration_ms = parseFloat(durationMs.toFixed(2));
    }
    appLogger.logDatabase(operation, model.name, logDetails);
  }
};

/**
 * Execute database operation with timing tracking
 * @param {Function} operationFn - Function that executes the database operation
 * @returns {Promise<any>} Result of the operation
 */
const withTiming = async (operationFn) => {
  const startTime = process.hrtime.bigint();
  const result = await operationFn();
  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1_000_000;
  return { result, durationMs };
};

/**
 * Find a single record by primary key
 * @param {Model} model - Sequelize model
 * @param {Object} options - Query options
 * @param {number|string} options.pk - Primary key value
 * @param {Array} options.include - Associated models to include
 * @param {Array} options.attributes - Attributes to select
 * @param {Object} options.transaction - Sequelize transaction
 * @returns {Promise<Model|null>} Found record or null
 */
const findOne = async (model, { pk, criteria = {}, include = [], attributes = null, transaction = null } = {}) => {
  const operation = 'findOne';
  const details = { pk, criteria: Object.keys(criteria), hasInclude: include.length > 0, hasTransaction: !!transaction };

  try {
    const { result, durationMs } = await withTiming(async () => {
      const where = pk ? { id: pk } : criteria;
      const options = {
        where,
        include,
        ...(attributes && { attributes }),
        ...(transaction && { transaction })
      };
      return await model.findOne(options);
    });

    logOperation.info(operation, model, details, durationMs);

    if (result) {
      logOperation.info(operation, model, { ...details, found: true, id: result.id }, durationMs);
    } else {
      logOperation.warn(operation, model, 'Record not found', details, durationMs);
    }

    return result;
  } catch (error) {
    logOperation.error(operation, model, error, details);
    throw error;
  }
};

/**
 * Find all records based on criteria
 * @param {Model} model - Sequelize model
 * @param {Object} options - Query options
 * @param {Object} options.criteria - Where conditions
 * @param {Array} options.include - Associated models to include
 * @param {Array} options.attributes - Attributes to select
 * @param {Array} options.order - Ordering specifications
 * @param {number} options.limit - Number of records to return
 * @param {number} options.offset - Number of records to skip
 * @param {Object} options.transaction - Sequelize transaction
 * @returns {Promise<Array>} Array of found records
 */
const findAll = async (model, {
  criteria = {},
  include = [],
  attributes = null,
  order = [],
  limit = null,
  offset = null,
  transaction = null
} = {}) => {
  const operation = 'findAll';
  const details = {
    criteria: Object.keys(criteria),
    hasInclude: include.length > 0,
    hasOrder: order.length > 0,
    hasLimit: !!limit,
    hasTransaction: !!transaction
  };

  try {
    const { result, durationMs } = await withTiming(async () => {
      const options = {
        where: criteria,
        include,
        ...(attributes && { attributes }),
        ...(order && order.length > 0 && { order }),
        ...(limit && { limit }),
        ...(offset && { offset }),
        ...(transaction && { transaction })
      };
      return await model.findAll(options);
    });

    logOperation.info(operation, model, { ...details, count: result.length }, durationMs);
    return result;
  } catch (error) {
    logOperation.error(operation, model, error, details);
    throw error;
  }
};

/**
 * Create a new record
 * @param {Model} model - Sequelize model
 * @param {Object} options - Create options
 * @param {Object} options.data - Data to create
 * @param {Array} options.include - Associated models to include in result
 * @param {Array} options.attributes - Attributes to select in result
 * @param {Object} options.transaction - Sequelize transaction
 * @returns {Promise<Model>} Created record
 */
const create = async (model, { data, include = [], attributes = null, transaction = null } = {}) => {
  const operation = 'create';
  const details = {
    dataKeys: Object.keys(data),
    hasInclude: include.length > 0,
    hasTransaction: !!transaction
  };

  try {
    const { result, durationMs } = await withTiming(async () => {
      const options = {
        include,
        ...(attributes && { attributes }),
        ...(transaction && { transaction })
      };
      return await model.create(data, options);
    });

    logOperation.info(operation, model, { ...details, created: true, id: result.id }, durationMs);
    return result;
  } catch (error) {
    logOperation.error(operation, model, error, details);
    throw error;
  }
};

/**
 * Update records based on criteria
 * @param {Model} model - Sequelize model
 * @param {Object} options - Update options
 * @param {Object} options.data - Data to update
 * @param {Object} options.criteria - Where conditions
 * @param {Object} options.transaction - Sequelize transaction
 * @returns {Promise<Array>} Array [affectedCount, affectedRows]
 */
const update = async (model, { data, criteria = {}, transaction = null } = {}) => {
  const operation = 'update';
  const details = {
    dataKeys: Object.keys(data),
    criteria: Object.keys(criteria),
    hasTransaction: !!transaction
  };

  try {
    const { result, durationMs } = await withTiming(async () => {
      const options = {
        where: criteria,
        ...(transaction && { transaction })
      };
      return await model.update(data, options);
    });

    const [affectedCount] = result;
    logOperation.info(operation, model, { ...details, affectedCount }, durationMs);
    return [affectedCount];
  } catch (error) {
    logOperation.error(operation, model, error, details);
    throw error;
  }
};

/**
 * Delete records based on criteria
 * @param {Model} model - Sequelize model
 * @param {Object} options - Delete options
 * @param {Object} options.criteria - Where conditions
 * @param {boolean} options.force - Force delete (bypass soft deletes)
 * @param {Object} options.transaction - Sequelize transaction
 * @returns {Promise<number>} Number of deleted records
 */
const deleteRecord = async (model, { criteria = {}, force = false, transaction = null } = {}) => {
  const operation = 'delete';
  const details = {
    criteria: Object.keys(criteria),
    force,
    hasTransaction: !!transaction
  };

  try {
    const { result, durationMs } = await withTiming(async () => {
      const options = {
        where: criteria,
        force,
        ...(transaction && { transaction })
      };
      return await model.destroy(options);
    });

    logOperation.info(operation, model, { ...details, deletedCount: result }, durationMs);
    return result;
  } catch (error) {
    logOperation.error(operation, model, error, details);
    throw error;
  }
};

export {
  findOne,
  findAll,
  create,
  update,
  deleteRecord as delete,
};