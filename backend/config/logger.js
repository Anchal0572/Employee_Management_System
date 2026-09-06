const morgan = require('morgan');
const config = require('./env');

// Custom developer-friendly format: [METHOD] url - status - response-time ms
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Production format: combined Apache-style
const prodFormat = 'combined';

const loggerMiddleware = morgan(config.isDevelopment ? devFormat : prodFormat, {
  skip: (req) => config.isTest && req.url === '/api/health'
});

module.exports = loggerMiddleware;
