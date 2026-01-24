import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { appLogger } from '../utils/app-logger.util.js';
import moment from 'moment';

/**
 * UserToken Model
 * Manages user authentication tokens (access and refresh tokens)
 * Supports multiple concurrent sessions per user
 * @class UserToken
 * @extends Model
 */
class UserToken extends Model {
  /**
   * Define model associations
   * @param {Object} models - All available models
   */
  static associate(models) {
    // Define association with User
    UserToken.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  }

  /**
   * Check if refresh token is expired
   * @returns {boolean} True if token is expired or missing
   */
  isRefreshTokenExpired() {
    if (!this.refreshTokenExpiresAt) {
      return true;
    }
    return moment().isAfter(this.refreshTokenExpiresAt);
  }

  /**
   * Check if access token is expired
   * @returns {boolean} True if token is expired or missing
   */
  isAccessTokenExpired() {
    if (!this.accessTokenExpiresAt) {
      return true;
    }
    return moment().isAfter(this.accessTokenExpiresAt);
  }

  /**
   * Check if token session is active
   * @returns {boolean} True if token is active and not expired
   */
  isActive() {
    return this.isActive && !this.isRefreshTokenExpired();
  }

  /**
   * Revoke token session
   * Sets isActive to false
   * @returns {Promise<void>}
   */
  async revoke() {
    this.isActive = false;
    await this.save();
  }

  /**
   * Custom toJSON to modify output
   * @returns {Object} Token object
   */
  toJSON() {
    const values = Object.assign({}, this.get());
    // Remove sensitive fields if needed in the future
    return values;
  }
}

UserToken.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  accessTokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  refreshTokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  tokenType: {
    type: DataTypes.ENUM('bearer', 'basic'),
    defaultValue: 'bearer',
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'UserToken',
  tableName: 'user_tokens',
  timestamps: true,
  indexes: [
    {
      fields: ['refreshToken'],
      name: 'idx_refresh_token'
    },
    {
      fields: ['accessToken'],
      name: 'idx_access_token'
    },
    {
      fields: ['userId', 'isActive', 'refreshTokenExpiresAt'],
      name: 'idx_user_active_refresh'
    }
  ],
  hooks: {
    // Hook to enforce 2 active sessions per user
    beforeCreate: async (userToken) => {
      await UserToken.enforceSessionLimit(userToken.userId);
    },
    beforeUpdate: async (userToken) => {
      // Only enforce if reactivating a token
      if (userToken.changed('isActive') && userToken.isActive) {
        await UserToken.enforceSessionLimit(userToken.userId);
      }
    }
  }
});

/**
 * Enforce maximum session limit per user
 * Revokes oldest session if limit is exceeded
 * @static
 * @param {number} userId - User ID
 * @param {number} maxSessions - Maximum active sessions allowed (default: 2)
 * @returns {Promise<void>}
 */
UserToken.enforceSessionLimit = async (userId, maxSessions = 2) => {
  try {
    // Count active sessions for this user
    const activeSessionsCount = await UserToken.count({
      where: {
        userId,
        isActive: true
      }
    });

    // If user already has max sessions, revoke the oldest one
    if (activeSessionsCount >= maxSessions) {
      const oldestSession = await UserToken.findOne({
        where: {
          userId,
          isActive: true
        },
        order: [['lastUsedAt', 'ASC']]
      });

      if (oldestSession) {
        appLogger.logDebug(`Revoking oldest session for user ${userId} to enforce session limit`);
        await oldestSession.revoke();
      }
    }
  } catch (error) {
    appLogger.logError('Error enforcing session limit', error, { userId });
    // Don't throw error to prevent blocking login
  }
};

/**
 * Clean up expired and revoked tokens
 * Removes expired refresh tokens and inactive tokens older than 7 days
 * @static
 * @returns {Promise<void>}
 */
UserToken.cleanupExpiredTokens = async () => {
  try {
    const deletedCount = await UserToken.destroy({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            refreshTokenExpiresAt: {
              [sequelize.Sequelize.Op.lt]: moment().toDate()
            }
          },
          {
            isActive: false,
            updatedAt: {
              // Remove inactive tokens after 7 days
              [sequelize.Sequelize.Op.lt]: moment().subtract(7, 'days').toDate()
            }
          }
        ]
      }
    });

    if (deletedCount > 0) {
      appLogger.logDebug(`Cleaned up ${deletedCount} expired/revoked tokens`);
    }
  } catch (error) {
    appLogger.logError('Error cleaning up expired tokens', error);
  }
};

export default UserToken;