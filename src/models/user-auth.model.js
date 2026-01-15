import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import moment from 'moment';

class UserAuth extends Model {
  static associate(models) {
    // Define associations here
    UserAuth.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  // Instance method to compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Instance method to check if account is locked
  isLocked() {
    if (!this.lockedUntil) {
      return false;
    }
    return moment().isBefore(this.lockedUntil);
  }

  // Instance method to increment failed attempts
  async incrementFailedAttempts() {
    this.failedAttempts += 1;

    // Lock account after 5 failed attempts for 30 minutes
    if (this.failedAttempts >= 5) {
      const lockDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
      this.lockedUntil = moment().add(lockDuration, 'milliseconds').toDate();
    }

    await this.save();
  }

  // Instance method to reset failed attempts
  async resetFailedAttempts() {
    this.failedAttempts = 0;
    this.lockedUntil = null;
    await this.save();
  }

  // Instance method to check if email verification is expired
  isEmailVerificationExpired() {
    if (!this.emailVerificationExpiresAt) {
      return true;
    }
    return moment().isAfter(this.emailVerificationExpiresAt);
  }

  // Instance method to check if password reset is expired
  isPasswordResetExpired() {
    if (!this.passwordResetExpiresAt) {
      return true;
    }
    return moment().isAfter(this.passwordResetExpiresAt);
  }

  // Instance method to mark email as verified
  async markEmailAsVerified() {
    this.isVerified = true;
    this.emailVerificationToken = null;
    this.emailVerificationExpiresAt = null;
    await this.save();
  }

  
  // Remove password from JSON response
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
