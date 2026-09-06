const ApiError = require('../utils/apiError');

/**
 * Handle 404 routes that don't match any registered endpoint
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl} - Route not found on EMS API`));
};

module.exports = notFoundHandler;
