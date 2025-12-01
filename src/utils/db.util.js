/**
 * Base Database Utility
 * Provides essential CRUD operations with logging
 */

import { appLogger } from './app-logger.util.js';

/**
 * Helper method to log database operations using the app logger
 */
const logOperation = {
  info: (operation, model, details = {}) => {
    appLogger.logDatabase(operation, model.name, { ...details, success: true });
  },
  error: (operation, model, error, details = {}) => {
    appLogger.logDatabase(operation, model.name, {
      ...details,
      success: false,
      error: error.message,
      stack: error.stack
    });
  },
  warn: (operation, model, message, details = {}) => {
    appLogger.logDatabase(operation, model.name, { ...details, warning: message });
  }
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
    logOperation.info(operation, model, details);

    const where = pk ? { id: pk } : criteria;
    const options = {
      where,
      include,
      ...(attributes && { attributes }),
      ...(transaction && { transaction })
    };

    const result = await model.findOne(options);

    if (result) {
      logOperation.info(operation, model, { ...details, found: true, id: result.id });
    } else {
      logOperation.warn(operation, model, 'Record not found', details);
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
    logOperation.info(operation, model, details);

    const options = {
      where: criteria,
      include,
      ...(attributes && { attributes }),
      ...(order && order.length > 0 && { order }),
      ...(limit && { limit }),
      ...(offset && { offset }),
      ...(transaction && { transaction })
    };

    const results = await model.findAll(options);

    logOperation.info(operation, model, { ...details, count: results.length });
    return results;
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
    logOperation.info(operation, model, details);

    const options = {
      include,
      ...(attributes && { attributes }),
      ...(transaction && { transaction })
    };

    const result = await model.create(data, options);

    logOperation.info(operation, model, { ...details, created: true, id: result.id });
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
    logOperation.info(operation, model, details);

    const options = {
      where: criteria,
      ...(transaction && { transaction })
    };

    const [affectedCount] = await model.update(data, options);

    logOperation.info(operation, model, { ...details, affectedCount });
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
    logOperation.info(operation, model, details);

    const options = {
      where: criteria,
      force,
      ...(transaction && { transaction })
    };

    const deletedCount = await model.destroy(options);

    logOperation.info(operation, model, { ...details, deletedCount });
    return deletedCount;
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