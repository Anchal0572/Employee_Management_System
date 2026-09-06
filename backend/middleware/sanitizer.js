/**
 * Input Sanitization & Injection Protection Middleware
 * 
 * Protects against:
 * 1. NoSQL Query Injection (strips '$' prefixes e.g. {$gt: ''} or {$ne: null})
 * 2. Stored / Reflected XSS (neutralizes HTML tags and script injections)
 * 3. Prototype Pollution (blocks __proto__, constructor, and prototype keys)
 */

/**
 * Recursively cleans an object or value
 * @param {*} value 
 * @returns {*} Cleaned value
 */
function sanitizeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Strings: Strip XSS script tags and trim
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:[^\s"']*/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item));
  }

  // Handle Objects
  if (typeof value === 'object' && value.constructor === Object) {
    const cleanObj = {};
    let hasKeys = false;
    for (const key of Object.keys(value)) {
      // Block prototype pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Block NoSQL injection keys starting with '$'
      if (key.startsWith('$')) {
        continue;
      }

      const sanitizedVal = sanitizeValue(value[key]);
      if (sanitizedVal !== undefined) {
        cleanObj[key] = sanitizedVal;
        hasKeys = true;
      }
    }

    if (!hasKeys && Object.keys(value).length > 0) {
      return undefined;
    }
    return cleanObj;
  }

  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 */
function sanitizer(req, res, next) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
}

module.exports = {
  sanitizer,
  sanitizeValue
};
