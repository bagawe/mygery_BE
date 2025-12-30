import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
import conversationRoutes from './modules/conversation/conversation.routes.js';
import messageRoutes from './modules/message/message.routes.js';
import historyRoutes from './modules/history/history.routes.js';
import postRoutes from './modules/post/post.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const postsDir = path.join(uploadsDir, 'posts');
const profilesDir = path.join(uploadsDir, 'profiles');
const ktpDir = path.join(uploadsDir, 'ktp');

[uploadsDir, postsDir, profilesDir, ktpDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Trust proxy configuration
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
} else {
  app.set('trust proxy', 'loopback');
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

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/posts', postRoutes);

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