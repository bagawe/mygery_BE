import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Fix trust proxy warning
  skip: (req) => {
    // Skip rate limiting if trust proxy is not properly configured
    return !req.ip;
  },
  // Custom key generator with fallback
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || req.connection.remoteAddress || 'unknown';
  }
});

// Rate limiting for general API endpoints
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Fix trust proxy warning
  skip: (req) => {
    // Skip rate limiting if trust proxy is not properly configured
    return !req.ip;
  },
  // Custom key generator with fallback
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || req.connection.remoteAddress || 'unknown';
  }
});

// Enhanced security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// CSRF protection for state-changing operations
export const csrfProtection = (req, res, next) => {
  const method = req.method.toUpperCase();
  
  // Skip CSRF protection for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Check for CSRF token in header
  const csrfToken = req.headers['x-csrf-token'];
  const expectedToken = req.headers['x-requested-with'];

  // For API requests, we expect X-Requested-With header
  if (expectedToken !== 'XMLHttpRequest' && !csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF protection: Missing required headers'
    });
  }

  next();
};

// Security headers for API responses
export const apiSecurityHeaders = (req, res, next) => {
  // Prevent caching of sensitive data
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    // API specific headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  
  next();
};