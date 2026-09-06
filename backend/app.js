const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const corsOptions = require('./config/cors');
const loggerMiddleware = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { sanitizer } = require('./middleware/sanitizer');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const apiRoutes = require('./routes');

const app = express();

// Security Headers: Hardened Helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*']
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true
  })
);

// Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// HTTP Request Logging
app.use(loggerMiddleware);
app.use(requestLogger);

// Body Parsing & Input Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizer);

// Global API Rate Limiter
app.use('/api', apiRateLimiter);

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Employee Management System (EMS) API',
    status: 'online',
    documentation: '/docs',
    healthCheck: '/api/health'
  });
});

// API Routes aggregator
const { serve } = require('inngest/express');
const { inngest, functions } = require('./jobs');
app.use('/api/inngest', serve({ client: inngest, functions }));

app.use('/api', apiRoutes);

// Catch 404 routes
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

module.exports = app;
