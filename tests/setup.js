// Test setup file for proper mocking

import { TextEncoder, TextDecoder } from 'util';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.JWT_EXPIRE = '24h';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_auth';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Global test timeout
jest.setTimeout(10000);

// Mock whatwg encoding for Jest
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console.log to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Sequelize before any models are imported
jest.mock('sequelize', () => ({
  Sequelize: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    transaction: jest.fn().mockImplementation((callback) => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        finished: false
      };
      return callback(mockTransaction);
    }),
    Op: {}
  })),
  DataTypes: {
    INTEGER: jest.fn(),
    STRING: jest.fn().mockImplementation((length) => ({ type: 'STRING', length })),
    TEXT: jest.fn(),
    BOOLEAN: jest.fn(),
    DATE: jest.fn(),
    TIMESTAMP: jest.fn(),
    JSON: jest.fn(),
    ENUM: jest.fn(),
    VIRTUAL: jest.fn()
  },
  Model: class MockModel {
    static init(attributes, options) {}
    static associate(models) {}
    static create = jest.fn();
    static findOne = jest.fn();
    static findByPk = jest.fn();
    static findAll = jest.fn();
    static update = jest.fn();
    static destroy = jest.fn();
    static count = jest.fn();
    static hasMany = jest.fn();
    static hasOne = jest.fn();
    static belongsTo = jest.fn();
    toJSON() {
      return this;
    }
    save() {
      return Promise.resolve(this);
    }
    destroy() {
      return Promise.resolve();
    }
    update() {
      return Promise.resolve(this);
    }
    get() {
      return this;
    }
    set() {
      return this;
    }
  }
}));

// Mock Sequelize database connection
jest.mock('../src/config/database.js', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    transaction: jest.fn().mockImplementation((callback) => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        finished: false
      };
      return callback(mockTransaction);
    }),
    close: jest.fn().mockResolvedValue(),
    Op: {},
    QueryTypes: 'SELECT'
  }
}));