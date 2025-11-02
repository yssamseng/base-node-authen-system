const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { generateToken, verifyToken } = require('../../../src/utils/jwt.util.js');

describe('JWT Utility Functions', () => {
  const testUserId = 123;

  beforeEach(() => {
    // Ensure JWT_SECRET is set for tests
    process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
    process.env.JWT_EXPIRE = '24h';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRE;
  });

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const token = generateToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should generate different tokens for different users', () => {
      const token1 = generateToken(1);
      const token2 = generateToken(2);

      expect(token1).not.toBe(token2);
    });

    test('should include user ID in token payload', () => {
      const token = generateToken(testUserId);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(testUserId);
    });

    test('should throw error if JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;

      expect(() => generateToken(testUserId)).toThrow();
    });
  });

  describe('verifyToken', () => {
    test('should verify a valid token and return payload', () => {
      const token = generateToken(testUserId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUserId);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    test('should return null for expired token', () => {
      // Create token with very short expiration
      process.env.JWT_EXPIRE = '1ms';
      const token = generateToken(testUserId);

      // Wait for token to expire
      setTimeout(() => {
        const decoded = verifyToken(token);
        expect(decoded).toBeNull();
      }, 10);
    });

    test('should return null for token signed with wrong secret', () => {
      const token = generateToken(testUserId);

      // Change the secret after token generation
      process.env.JWT_SECRET = 'different_secret';
      const decoded = verifyToken(token);

      expect(decoded).toBeNull();
    });

    test('should return null for malformed token', () => {
      const malformedTokens = [
        '',
        'invalid',
        'header.payload',
        'header.payload.signature.extra',
        null,
        undefined,
        123,
        {}
      ];

      malformedTokens.forEach(token => {
        const decoded = verifyToken(token);
        expect(decoded).toBeNull();
      });
    });
  });

  describe('Token Integration', () => {
    test('should generate and verify token successfully', () => {
      const token = generateToken(testUserId);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(testUserId);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should handle multiple token generations and verifications', () => {
      const userIds = [1, 2, 3, 999, 12345];

      userIds.forEach(userId => {
        const token = generateToken(userId);
        const decoded = verifyToken(token);
        expect(decoded.id).toBe(userId);
      });
    });
  });
});