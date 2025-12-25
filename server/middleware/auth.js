const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and adds user information to request object
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate token payload
    if (!decoded.userId || !decoded.email) {
      return res.status(401).json({
        error: 'Invalid token payload.',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }

    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    // Add token info for potential refresh
    req.tokenInfo = {
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Token not active yet.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error during authentication.',
        code: 'AUTH_ERROR'
      });
    }
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present and valid, but doesn't require authentication
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.userId && decoded.email) {
        req.user = {
          id: decoded.userId,
          email: decoded.email
        };
      }
    } catch (jwtError) {
      // Invalid token, but continue without authentication
      console.log('Optional auth failed:', jwtError.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Check if token is close to expiration (within 1 hour)
 * Adds a header to suggest token refresh
 */
const checkTokenExpiration = (req, res, next) => {
  if (req.tokenInfo && req.tokenInfo.exp) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = req.tokenInfo.exp - now;
    
    // If token expires within 1 hour (3600 seconds)
    if (timeUntilExpiry < 3600) {
      res.set('X-Token-Refresh-Suggested', 'true');
      res.set('X-Token-Expires-In', timeUntilExpiry.toString());
    }
  }
  
  next();
};

/**
 * Middleware to require specific user (for user-specific resources)
 * @param {Function} getUserIdFromRequest - Function to extract user ID from request
 */
const requireSameUser = (getUserIdFromRequest) => {
  return (req, res, next) => {
    try {
      const requestedUserId = getUserIdFromRequest(req);
      
      if (!requestedUserId) {
        return res.status(400).json({
          error: 'User ID not found in request.',
          code: 'MISSING_USER_ID'
        });
      }

      if (parseInt(requestedUserId) !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied. You can only access your own resources.',
          code: 'FORBIDDEN'
        });
      }

      next();
    } catch (error) {
      console.error('Same user check error:', error);
      return res.status(500).json({
        error: 'Internal server error during authorization.',
        code: 'AUTH_ERROR'
      });
    }
  };
};

/**
 * Rate limiting for authenticated users
 * More generous limits for authenticated users
 */
const authenticatedRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes for authenticated users
  message: {
    error: 'Too many requests from this authenticated user, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for rate limiting if available
    return req.user ? `user_${req.user.id}` : req.ip;
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  checkTokenExpiration,
  requireSameUser,
  authenticatedRateLimit
};