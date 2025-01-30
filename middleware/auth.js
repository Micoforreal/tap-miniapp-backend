const jwt = require("jsonwebtoken");
const User = require("../mongoose/models/User");
require('dotenv').config();

/**
 * Extract and validate JWT token from authorization header
 * @param {string} authHeader - Authorization header
 * @returns {string|null} - Extracted token or null if invalid
 */
const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token
 * @returns {Promise} - Resolves with decoded payload or rejects with error
 */
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(new Error(`Token verification failed: ${err.message}`));
      }
      resolve(decoded);
    });
  });
};

/**
 * Main authentication middleware for telegram users
 */
const authenticateUser = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is missing',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const decoded = await verifyToken(token);
    
    if (!decoded.telegramId) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token format: missing telegramId',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const user = await User.findOne({ telegramId: decoded.telegramId })
      .select('-password')  // Exclude sensitive data
      .lean();  // Convert to plain JavaScript object for better performance

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request object for use in subsequent middleware/routes
    req.user = user;
    req.token = token;  // Optionally store token for later use

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * General purpose JWT authentication middleware
 */
const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = await verifyToken(token);
    
    // Attach decoded payload to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Rate limiting middleware (optional enhancement)
 * Requires 'express-rate-limit' package
 */
const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  authenticateUser,
  authenticateToken,
  authRateLimiter
};