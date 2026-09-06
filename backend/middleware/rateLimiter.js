/**
 * Rate Limiting Middleware
 * 
 * Provides memory-backed sliding-window rate limiting for sensitive endpoints
 * (such as auth login brute force protection) and general API throttling.
 * Returns standard RateLimit-* and Retry-After headers upon threshold violation.
 */

class MemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // default 15 minutes
    this.max = options.max || 100;                      // max allowed requests per window
    this.message = options.message || 'Too many requests from this IP, please try again later.';
    this.statusCode = options.statusCode || 429;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.hits = new Map(); // ip -> Array<timestamps>
  }

  middleware() {
    return (req, res, next) => {
      // In test mode, allow header-based bypass unless specifically testing rate limiting
      if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
        return next();
      }

      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const now = Date.now();
      const windowStart = now - this.windowMs;

      // Clean expired timestamps
      let timestamps = this.hits.get(ip) || [];
      timestamps = timestamps.filter(t => t > windowStart);

      if (timestamps.length >= this.max) {
        const oldest = timestamps[0];
        const resetTimeMs = oldest + this.windowMs - now;
        const retryAfterSeconds = Math.max(1, Math.ceil(resetTimeMs / 1000));

        res.set({
          'Retry-After': retryAfterSeconds,
          'RateLimit-Limit': this.max,
          'RateLimit-Remaining': 0,
          'RateLimit-Reset': retryAfterSeconds
        });

        return res.status(this.statusCode).json({
          success: false,
          statusCode: this.statusCode,
          message: this.message,
          retryAfterSeconds
        });
      }

      timestamps.push(now);
      this.hits.set(ip, timestamps);

      const remaining = Math.max(0, this.max - timestamps.length);
      res.set({
        'RateLimit-Limit': this.max,
        'RateLimit-Remaining': remaining
      });

      next();
    };
  }

  reset() {
    this.hits.clear();
  }
}

// 1. Auth Rate Limiter: Max 15 attempts / 15 minutes per IP
const authRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login attempts from this IP. Account access throttled for 15 minutes.'
});

// 2. Global API Rate Limiter: Max 300 requests / 15 minutes per IP
const apiRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many API requests from this IP. Please slow down and try again later.'
});

module.exports = {
  MemoryRateLimiter,
  authRateLimiter: authRateLimiter.middleware(),
  apiRateLimiter: apiRateLimiter.middleware(),
  authLimiterInstance: authRateLimiter,
  apiLimiterInstance: apiRateLimiter
};
