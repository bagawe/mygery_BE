import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';

// Middleware imports
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import { 
  securityHeaders, 
  generalRateLimit, 
  sanitizeInput, 
  apiSecurityHeaders 
} from './middlewares/securityMiddleware.js';
import { activityLogger } from './middlewares/auditMiddleware.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';

// import logger from './utils/logger.js';
// import morgan from 'morgan';

dotenv.config();

const app = express();

// Integrasi morgan agar setiap request juga dicatat oleh winston
// app.use(morgan('combined', {
//   stream: {
//     write: (message) => logger.info(message.trim())
//   }
// }));

// Trust proxy configuration - fix for rate limiting warning
// In development, trust localhost; in production, configure based on your setup
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true); // Trust all proxies in production
} else {
  app.set('trust proxy', 'loopback'); // Trust only localhost in development
}

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3030'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: process.env.JSON_LIMIT || '1mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: process.env.URL_ENCODED_LIMIT || '1mb' 
}));

// General rate limiting
app.use(generalRateLimit);

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Activity logging for audit trail
app.use(activityLogger);

// API security headers
app.use('/api', apiSecurityHeaders);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
