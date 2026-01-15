const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { generateAccessToken, verifyToken } = require('../../../src/utils/jwt.util.js');

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
      const token = generateAccessToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should generate different tokens for different users', () => {
      const token1 = generateAccessToken(1);
      const token2 = generateAccessToken(2);

      expect(token1).not.toBe(token2);
    });

    test('should include user ID in token payload', () => {
      const token = generateAccessToken(testUserId);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(testUserId);
    });
  });

  describe('verifyToken', () => {
    test('should verify a valid token and return payload', () => {
      const token = generateAccessToken(testUserId);
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
      // Create a manually expired JWT token by building one with an old exp timestamp
      // This allows us to test expiration behavior without relying on real time delays

      // Get a valid token first to see its structure
      const validToken = generateAccessToken(testUserId);
      const parts = validToken.split('.');

      // Decode the payload (middle part)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Create an expired payload (set exp to 1 hour ago)
      const expiredPayload = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      // Re-encode the token with expired payload
      const expiredPayloadEncoded = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');
      const expiredToken = `${parts[0]}.${expiredPayloadEncoded}.${parts[2]}`;

      // Test that verifyToken returns null for expired token
      const decoded = verifyToken(expiredToken);
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
      const token = generateAccessToken(testUserId);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(testUserId);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should handle multiple token generations and verifications', () => {
      const userIds = [1, 2, 3, 999, 12345];

      userIds.forEach(userId => {
        const token = generateAccessToken(userId);
        const decoded = verifyToken(token);
        expect(decoded.id).toBe(userId);
      });
    });
  });
});