/**
 * Attach request arrival timestamp and correlation metadata
 */
const requestLogger = (req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
};

module.exports = requestLogger;
