import express from 'express';
import ktaController from './kta.controller.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';

const router = express.Router();

// User endpoints (authenticated only)
router.get('/my-status', authenticateToken, ktaController.getMyStatus.bind(ktaController));
router.post('/verify-qr', ktaController.verifyQR.bind(ktaController)); // Public untuk scan QR

// Admin endpoints (admin only)
router.post('/admin/verify', 
  authenticateToken, 
  authorizeRole(['admin']), 
  ktaController.verifyKTA.bind(ktaController)
);

router.get('/admin/users', 
  authenticateToken, 
  authorizeRole(['admin']), 
  ktaController.getUsersList.bind(ktaController)
);

router.get('/admin/stats', 
  authenticateToken, 
  authorizeRole(['admin']), 
  ktaController.getStats.bind(ktaController)
);

export default router;
