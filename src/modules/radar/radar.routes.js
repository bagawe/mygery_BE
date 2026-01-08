import express from 'express';
import radarController from './radar.controller.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public user endpoints
router.post('/update-location', (req, res) => radarController.updateLocation(req, res));
router.get('/locations', (req, res) => radarController.getLocations(req, res));
router.post('/toggle-sharing', (req, res) => radarController.toggleSharing(req, res));
router.get('/my-status', (req, res) => radarController.getMyStatus(req, res));

// Admin-only endpoints
router.get('/admin/location-history', (req, res) => radarController.getLocationHistory(req, res));
router.get('/admin/stats', (req, res) => radarController.getStats(req, res));

export default router;