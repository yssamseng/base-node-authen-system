import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * User Model
 * Represents user account information including profile details
 * @class User
 * @extends Model
 */
class User extends Model {
  /**
   * Define model associations
   * @param {Object} models - All available models
   */
  static associate(models) {
    // Define associations here
    // Using shared primary key pattern - UserAuth.userId references User.id
    User.hasOne(models.UserAuth, {
      foreignKey: {
        name: 'userId',
        allowNull: false
      },
      as: 'auth',
      onDelete: 'CASCADE',
      constraints: true
    });

    // User has many tokens for session management
    User.hasMany(models.UserToken, {
      foreignKey: 'userId',
      as: 'tokens',
      onDelete: 'CASCADE'
    });
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true
});

export default User;
