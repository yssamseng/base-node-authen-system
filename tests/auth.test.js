const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { generateAccessToken, verifyToken } = require('../src/utils/jwt.util.js');

describe('JWT Authentication Tests', () => {
  const testUserId = 123;
  const testSecret = 'test_jwt_secret_key_for_testing';

  beforeEach(() => {
    // Ensure JWT_SECRET is set for tests
    process.env.JWT_SECRET = testSecret;
    process.env.JWT_EXPIRE = '24h';
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRE;
  });

  describe('Token Generation', () => {
    test('should generate a valid JWT token', () => {
      const token = generateAccessToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts: header.payload.signature
    });

    test('should generate different tokens for different users', () => {
      const token1 = generateAccessToken(1);
      const token2 = generateAccessToken(2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Verification', () => {
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

    test('should return null for null token', () => {
      const decoded = verifyToken(null);
      expect(decoded).toBeNull();
    });

    test('should return null for undefined token', () => {
      const decoded = verifyToken(undefined);
      expect(decoded).toBeNull();
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

  describe('Error Handling', () => {
    test('should handle token verification errors gracefully', () => {
      // Test with malformed token
      const malformedTokens = [
        '',
        'invalid',
        'header.payload',
        'header.payload.signature.extra',
        'not.a.jwt',
        123,
        {},
        [],
        true
      ];

      malformedTokens.forEach(token => {
        expect(() => verifyToken(token)).not.toThrow();
        const decoded = verifyToken(token);
        expect(decoded).toBeNull();
      });
    });
  });

  describe('Token Payload Validation', () => {
    test('should include correct user ID in payload', () => {
      const userIds = [1, 42, 999, 123456];

      userIds.forEach(userId => {
        const token = generateAccessToken(userId);
        const decoded = verifyToken(token);
        expect(decoded.id).toBe(userId);
      });
    });

    test('should have proper timestamp fields', () => {
      const token = generateAccessToken(testUserId);
      const decoded = verifyToken(token);

      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(decoded.iat); // Expiration should be after issued
    });
  });
});

describe('Authentication Flow Examples', () => {
  test('should demonstrate complete auth flow', async () => {
    // Ensure environment is set for this test
    process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
    process.env.JWT_EXPIRE = '24h';

    const user = { id: 1, email: 'test@example.com' };

    // Simulate login - generate token
    const token = generateAccessToken(user.id);
    expect(token).toBeDefined();

    // Simulate protected route access - verify token
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(user.id);

    // Token should contain user ID for further operations
    expect(decoded.id).toBe(1);
  });

  test('should demonstrate failed auth flow', async () => {
    const invalidToken = 'fake.jwt.token';

    // Simulate protected route access with invalid token
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();

    // Should reject access for invalid tokens
    expect(decoded).toBeNull();
  });
});