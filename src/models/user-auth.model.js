import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS } from '../config/time.constants.js';

/**
 * UserAuth Model
 * Stores authentication credentials and security settings for users
 * Uses shared primary key pattern with User model (userId = User.id)
 * @class UserAuth
 * @extends Model
 */
class UserAuth extends Model {
  /**
   * Define model associations
   * @param {Object} models - All available models
   */
  static associate(models) {
    // Define associations here
    UserAuth.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  /**
   * Compare candidate password with stored hashed password
   * @param {string} candidatePassword - Plain text password to verify
   * @returns {Promise<boolean>} True if password matches
   */
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Check if account is currently locked due to failed login attempts
   * @returns {boolean} True if account is locked
   */
  isLocked() {
    if (!this.lockedUntil) {
      return false;
    }
    return new Date() < this.lockedUntil;
  }

  /**
   * Increment failed login attempts and lock account if threshold reached
   * Locks account for 30 minutes after 5 failed attempts
   * @returns {Promise<void>}
   */
  async incrementFailedAttempts() {
    this.failedAttempts += 1;

    // Lock account after max failed attempts
    if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      this.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }

    await this.save();
  }

  /**
   * Reset failed login attempts and unlock account
   * Called after successful login
   * @returns {Promise<void>}
   */
  async resetFailedAttempts() {
    this.failedAttempts = 0;
    this.lockedUntil = null;
    await this.save();
  }

  /**
   * Check if email verification token has expired
   * @returns {boolean} True if token is expired or missing
   */
  isEmailVerificationExpired() {
    if (!this.emailVerificationExpiresAt) {
      return true;
    }
    return new Date() > this.emailVerificationExpiresAt;
  }

  /**
   * Check if password reset token has expired
   * @returns {boolean} True if token is expired or missing
   */
  isPasswordResetExpired() {
    if (!this.passwordResetExpiresAt) {
      return true;
    }
    return new Date() > this.passwordResetExpiresAt;
  }

  /**
   * Mark email as verified and clear verification token
   * @returns {Promise<void>}
   */
  async markEmailAsVerified() {
    this.isVerified = true;
    this.emailVerificationToken = null;
    this.emailVerificationExpiresAt = null;
    await this.save();
  }

  /**
   * Custom toJSON to exclude sensitive password field
   * @returns {Object} UserAuth object without password
   */
  toJSON() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  }
}

UserAuth.init({
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 255]
    }
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failedAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  emailVerificationExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  passwordResetExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'UserAuth',
  tableName: 'user_auth',
  timestamps: true,
  hooks: {
    beforeCreate: async (userAuth) => {
      if (userAuth.password) {
        const salt = await bcrypt.genSalt(10);
        userAuth.password = await bcrypt.hash(userAuth.password, salt);
      }
    },
    beforeUpdate: async (userAuth) => {
      if (userAuth.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        userAuth.password = await bcrypt.hash(userAuth.password, salt);
      }
    }
  }
});

export default UserAuth;
