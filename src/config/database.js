/**
 * Database configuration and connection management
 * @module config/database
 */

import { Sequelize } from 'sequelize';
import APP_CONFIG from './app-config.js';

const { name, user, password, host, port, dialect } = APP_CONFIG.database;
const isDevelopment = APP_CONFIG.server.env === 'development';

// Sequelize ORM instance configured with database connection settings
const sequelize = new Sequelize(
  name,
  user,
  password,
  {
    host,
    port,
    dialect,
    logging: isDevelopment ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

/**
 * Establishes database connection and synchronizes models
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync models with database
    await sequelize.sync({ alter: isDevelopment });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
