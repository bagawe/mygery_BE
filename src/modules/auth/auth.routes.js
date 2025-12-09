import express from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { validateAuth } from '../../middlewares/validationMiddleware.js';
import { authRateLimit, sanitizeInput } from '../../middlewares/securityMiddleware.js';
import { auditLogger } from '../../middlewares/auditMiddleware.js';

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Apply input sanitization
router.use(sanitizeInput);

// Auth routes with validation and logging
router.post('/register', 
  validateAuth.register,
  auditLogger('user_register', { logBefore: true, logAfter: true }),
  AuthController.register
);

router.post('/login', 
  validateAuth.login,
  auditLogger('user_login', { logBefore: true, logAfter: true }),
  AuthController.login
);

router.post('/refresh-token', 
  validateAuth.refreshToken,
  auditLogger('token_refresh', { logAfter: true }),
  AuthController.refreshToken
);

router.post('/logout', 
  auditLogger('user_logout', { logAfter: true }),
  AuthController.logout
);

router.post('/revoke-all-sessions', 
  authMiddleware,
  auditLogger('revoke_all_sessions', { logAfter: true }),
  AuthController.revokeAllSessions
);

export default router;
