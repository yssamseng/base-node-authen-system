import { DataTypes, Model, Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import moment from 'moment';

class RateLimit extends Model {
  static associate(models) {
    // No associations needed
  }

  /**
   * Check if a request should be rate limited
   * @param {string} key - Unique identifier (ip:path or userId:path)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
   */
  static async checkRateLimit(key, maxRequests, windowMs) {
    const now = moment().toDate();
    const windowStart = moment().subtract(windowMs, 'milliseconds').toDate();

    // Clean up old records for this key
    await RateLimit.destroy({
      where: {
        key,
        createdAt: { [Op.lt]: windowStart }
      }
    });

    // Count requests in current window
    const count = await RateLimit.count({
      where: {
        key,
        createdAt: { [Op.gte]: windowStart }
      }
    });

    const remaining = Math.max(0, maxRequests - count - 1);
    const resetAt = moment().add(windowMs, 'milliseconds').toDate();
    const allowed = count < maxRequests;

    // If allowed, record this request
    if (allowed) {
      await RateLimit.create({
        key,
        createdAt: now
      });
    }

    return { allowed, remaining, resetAt, count: count + 1 };
  }

  /**
   * Reset rate limit for a key (for testing or manual reset)
   * @param {string} key - Unique identifier
   */
  static async resetLimit(key) {
    await RateLimit.destroy({
      where: { key }
    });
  }

  /**
   * Clean up old rate limit records (should run periodically)
   * @param {number} hoursOld - Delete records older than this many hours
   */
  static async cleanupOldRecords(hoursOld = 1) {
    const cutoffDate = moment().subtract(hoursOld, 'hours').toDate();
    const deletedCount = await RateLimit.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate }
      }
    });
    return deletedCount;
  }

  /**
   * Get statistics for a key
   * @param {string} key - Unique identifier
   */
  static async getStats(key) {
    const now = moment().toDate();
    const last24h = moment().subtract(24, 'hours').toDate();

    const [total, last24hCount, lastRequest] = await Promise.all([
      RateLimit.count({ where: { key } }),
      RateLimit.count({
        where: {
          key,
          createdAt: { [Op.gte]: last24h }
        }
      }),
      RateLimit.findOne({
        where: { key },
        order: [['createdAt', 'DESC']],
        attributes: ['createdAt']
      })
    ]);

    return {
      total,
      last24h: last24hCount,
      lastRequestAt: lastRequest?.createdAt
    };
  }
}

RateLimit.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    index: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'RateLimit',
  tableName: 'rate_limits',
  timestamps: false,
  indexes: [
    {
      fields: ['key', 'createdAt'],
      name: 'rate_limit_key_created_idx'
    },
    {
      fields: ['createdAt'],
      name: 'rate_limit_created_idx'
    }
  ]
});

export default RateLimit;
