const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

/**
 * Protect middleware: Verifies JWT token and attaches authenticated user
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(ApiError.unauthorized('Not authorized to access this route, authentication token missing'));
  }

  try {
    // Verify JWT token signature and expiration
    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch user from DB/store
    const user = await authService.findUserById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('The user account belonging to this token no longer exists'));
    }

    if (user.status !== 'active') {
      return next(ApiError.forbidden('User account is currently inactive or suspended'));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired. Please log in again.'));
    }
    return next(ApiError.unauthorized('Invalid authentication token signature'));
  }
});

/**
 * Role authorization middleware: Restricts access to specific roles
 * @param  {...string} roles Allowed roles e.g. 'admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`
        )
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
