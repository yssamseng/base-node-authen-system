import { verifyAccessToken } from '../utils/jwt.util.js';
import { responseError, genErrorResponseObj } from '../core/handler.js';
import models from '../models/index.js';
const { User, UserToken } = models;
import { runWithTrace } from '../core/trace.js';
import crypto from 'crypto';

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      const errorObj = genErrorResponseObj(req, '40006', 'No authentication token, access denied');
      return responseError(req, res, errorObj);
    }

    // Verify access token
    const verificationResult = verifyAccessToken(token);

    if (!verificationResult.valid) {
      // Handle specific error cases
      if (verificationResult.error === 'TokenExpiredError') {
        const errorObj = genErrorResponseObj(req, '40103', 'Token has expired');
        return responseError(req, res, errorObj);
      } else if (verificationResult.error === 'JsonWebTokenError') {
        const errorObj = genErrorResponseObj(req, '40007', 'Token is not valid');
        return responseError(req, res, errorObj);
      } else {
        const errorObj = genErrorResponseObj(req, '40007', verificationResult.error || 'Token verification failed');
        return responseError(req, res, errorObj);
      }
    }

    const decoded = verificationResult.decoded;

    // Check if token exists in database and is active
    const tokenRecord = await UserToken.findOne({
      where: {
        accessToken: token,
        isActive: true,
        userId: decoded.id
      }
    });

    if (!tokenRecord) {
      const errorObj = genErrorResponseObj(req, '40007', 'Token is not valid or has been revoked');
      return responseError(req, res, errorObj);
    }

    // Check if access token is expired
    if (tokenRecord.isAccessTokenExpired()) {
      // Revoke the token
      await tokenRecord.revoke();
      const errorObj = genErrorResponseObj(req, '40103', 'Access token has expired');
      return responseError(req, res, errorObj);
    }

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      const errorObj = genErrorResponseObj(req, '40403', 'User not found');
      return responseError(req, res, errorObj);
    }

    if (!user.isActive) {
      const errorObj = genErrorResponseObj(req, '40004', 'User account is inactive');
      return responseError(req, res, errorObj);
    }

    // Update last used timestamp for the token
    tokenRecord.lastUsedAt = new Date();
    await tokenRecord.save();

    // Attach user and token info to request
    req.user = user;
    req.token = tokenRecord;

    const correlationId = crypto.randomUUID();
    const store = {
      correlation_id: correlationId,
      user_id: user.id,
    };
    runWithTrace(store, next);
  } catch (error) {
    console.error('Auth middleware error:', error);
    const errorObj = genErrorResponseObj(req, '50000', 'Server error during authentication');
    responseError(req, res, errorObj);
  }
};

export { authenticate };
