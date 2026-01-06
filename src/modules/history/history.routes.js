import express from 'express';
import historyController from './history.controller.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user history
router.get('/', (req, res) => historyController.getUserHistory(req, res));

// Get history by type
router.get('/type/:type', (req, res) => historyController.getHistoryByType(req, res));

// Delete history entry
router.delete('/:id', (req, res) => historyController.deleteHistory(req, res));

// Clear all user history
router.delete('/', (req, res) => historyController.clearUserHistory(req, res));

export default router;
