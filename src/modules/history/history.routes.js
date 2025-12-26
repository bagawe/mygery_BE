import express from 'express';
import historyController from './history.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/history
router.post('/', historyController.create.bind(historyController));

// GET /api/history
router.get('/', historyController.getUserHistory.bind(historyController));

export default router;
