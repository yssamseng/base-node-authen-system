// Test setup file for proper mocking

import { TextEncoder, TextDecoder } from 'util';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_for_testing_different';
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
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      finished: false
    }),
    close: jest.fn().mockResolvedValue(),
    Op: {},
    QueryTypes: 'SELECT'
  },
  connectDB: jest.fn().mockResolvedValue()
}));

// Mock db.util.js to pass through to model mocks
jest.mock('../src/utils/db.util.js', () => ({
  findOne: jest.fn((model, { pk, criteria, include, attributes, transaction } = {}) => {
    const where = pk ? { id: pk } : criteria;
    const options = {
      where,
      ...(include && include.length > 0 && { include }),
      ...(attributes && { attributes }),
      ...(transaction && { transaction })
    };
    return model.findOne(options);
  }),
  findAll: jest.fn((model, { criteria, include, attributes, order, limit, offset, transaction } = {}) => {
    const options = {
      where: criteria,
      ...(include && include.length > 0 && { include }),
      ...(attributes && { attributes }),
      ...(order && order.length > 0 && { order }),
      ...(limit && { limit }),
      ...(offset && { offset }),
      ...(transaction && { transaction })
    };
    return model.findAll(options);
  }),
  create: jest.fn((model, { data, include, attributes, transaction } = {}) => {
    const options = {
      ...(include && include.length > 0 && { include }),
      ...(attributes && { attributes }),
      ...(transaction && { transaction })
    };
    return model.create(data, options);
  }),
  update: jest.fn((model, { data, criteria, transaction } = {}) => {
    const options = {
      where: criteria,
      ...(transaction && { transaction })
    };
    return model.update(data, options);
  }),
  delete: jest.fn()
}));

// Mock app-config to avoid __dirname/__filename conflicts with Jest's CommonJS transformation
// Since ES modules evaluate imports before mocks, we need to mock at module level
jest.mock('../src/config/app-config.js', () => {
  const mockConfig = {
    service: {
      name: 'node-auth-api',
      version: '1.0.0',
    },
    server: {
      port: 3000,
      env: 'test',
    },
    database: {
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      name: 'test_auth',
      user: 'test_user',
      password: 'test_password',
    },
    jwt: {
      secret: 'test_jwt_secret_key_for_testing_please_change_this',
      expire: '24h',
      accessExpire: '15m',
      refreshSecret: 'test_refresh_secret_please_change_this',
      refreshExpire: '7d',
    },
    cors: {
      origin: 'http://localhost:3000',
      origins: ['http://localhost:3000'],
    },
    email: {
      provider: 'smtp',
      smtp: {
        host: 'localhost',
        port: 587,
        secure: false,
      },
      from: 'test@example.com',
      fromName: 'Test Application',
      frontendUrl: 'http://localhost:3000',
    },
    emailVerification: {
      enabled: false,
      expiryHours: 24,
      allowUnverifiedLogin: true,
      resendCooldownMinutes: 5,
      maxAttempts: 3,
      requireForLogin: false,
      requireForProfile: false,
      requireForSensitive: false,
    },
    logtail: {
      sourceToken: 'test_source_token',
      endpoint: 'https://in.logtail.com',
    },
    log: {
      level: 'info',
    },
  };
  return {
    __esModule: true,
    default: mockConfig,
  };
});