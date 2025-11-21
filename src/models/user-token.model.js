import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import moment from 'moment';

class UserToken extends Model {
  static associate(models) {
    // Define association with User
    UserToken.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  }

  // Instance method to check if refresh token is expired
  isRefreshTokenExpired() {
    if (!this.refreshTokenExpiresAt) {
      return true;
    }
    return moment().isAfter(this.refreshTokenExpiresAt);
  }

  // Instance method to check if access token is expired
  isAccessTokenExpired() {
    if (!this.accessTokenExpiresAt) {
      return true;
    }
    return moment().isAfter(this.accessTokenExpiresAt);
  }

  // Instance method to check if token is active
  isActive() {
    return this.isActive && !this.isRefreshTokenExpired();
  }

  // Instance method to revoke token
  async revoke() {
    this.isActive = false;
    await this.save();
  }

  // Custom toJSON to exclude sensitive fields
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

// Static method to enforce session limit
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
        console.log(`Revoking oldest session for user ${userId} to enforce session limit`);
        await oldestSession.revoke();
      }
    }
  } catch (error) {
    console.error('Error enforcing session limit:', error);
    // Don't throw error to prevent blocking login
  }
};

// Static method to cleanup expired tokens
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
      console.log(`Cleaned up ${deletedCount} expired/revoked tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};

export default UserToken;