import jwt from 'jsonwebtoken';
import moment from 'moment';
import APP_CONFIG from '../config/app-config.js';

const { secret, accessExpire, refreshSecret, refreshExpire } = APP_CONFIG.jwt;

// Security: Ensure JWT secrets are properly configured
if (!secret || secret === '' || secret.length < 32) {
  throw new Error(
    'JWT_SECRET must be set and at least 32 characters long. ' +
    'Set a strong secret in your .env file: JWT_SECRET=your_very_long_random_secret_key_here'
  );
}

// Security: Require separate refresh token secret (HIGH PRIORITY)
if (!refreshSecret) {
  throw new Error(
    'JWT_REFRESH_SECRET must be set as a separate secret from JWT_SECRET. ' +
    'This is a security requirement to prevent token type confusion attacks. ' +
    'Add to your .env: JWT_REFRESH_SECRET=your_different_secret_key_here'
  );
}

if (refreshSecret === secret) {
  throw new Error(
    'JWT_REFRESH_SECRET must be different from JWT_SECRET. ' +
    'Using the same secret for both token types is a security vulnerability.'
  );
}

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'access' },
    secret,
    { expiresIn: accessExpire }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    refreshSecret,
    { expiresIn: refreshExpire }
  );
};

const generateTokenPair = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId)
  };
};

const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, secret);
    // Ensure this is an access token
    if (decoded.type !== 'access') {
      return { valid: false, error: 'Invalid token type' };
    }
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, refreshSecret);
    // Ensure this is a refresh token
    if (decoded.type !== 'refresh') {
      return { valid: false, error: 'Invalid token type' };
    }
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Get token expiration date
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return moment(decoded.payload.exp * 1000).toDate();
  } catch (error) {
    return null;
  }
};

// Extract token type from JWT payload
const getTokenType = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded?.type || 'unknown';
  } catch (error) {
    return 'unknown';
  }
};

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
  getTokenExpiration,
  getTokenType
};
