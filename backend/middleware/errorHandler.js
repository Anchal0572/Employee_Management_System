const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Global centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not already an ApiError instance, convert known errors
  if (!(error instanceof ApiError)) {
    // Mongoose bad ObjectId / CastError
    if (err.name === 'CastError') {
      const message = `Resource not found with id: ${err.value}`;
      error = ApiError.notFound(message);
    }
    // Mongoose duplicate key error (code 11000)
    else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      const message = `Duplicate value entered for ${field}: ${err.keyValue ? err.keyValue[field] : ''}. Must be unique.`;
      error = ApiError.conflict(message);
    }
    // Mongoose validation error
    else if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors || {}).map(e => ({
        field: e.path,
        message: e.message
      }));
      error = ApiError.badRequest('Validation error occurred', errors);
    }
    // JWT errors
    else if (err.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid security token');
    } else if (err.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Security token has expired');
    }
    // Fallback general error
    else {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      error = new ApiError(statusCode, message, [], err.stack);
    }
  }

  const statusCode = error.statusCode || 500;
  const responsePayload = {
    success: false,
    statusCode,
    message: error.message || 'An error occurred',
    errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
    ...(config.isDevelopment ? { stack: error.stack } : {})
  };

  if (config.isDevelopment && statusCode >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, error);
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
