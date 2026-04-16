import express from 'express';
import onboardingController from './onboarding.controller.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoint - get active slides
router.get('/slides', (req, res) => onboardingController.getSlides(req, res));

// Admin endpoints
router.use(authenticateToken);

router.get('/all', (req, res) => onboardingController.getAllSlides(req, res));
router.post('/slides', (req, res) => onboardingController.createSlide(req, res));
router.put('/slides/:id', (req, res) => onboardingController.updateSlide(req, res));
router.delete('/slides/:id', (req, res) => onboardingController.deleteSlide(req, res));
router.put('/slides/:id/deactivate', (req, res) => onboardingController.deactivateSlide(req, res));
router.put('/slides/:id/activate', (req, res) => onboardingController.activateSlide(req, res));
router.post('/reorder', (req, res) => onboardingController.reorderSlides(req, res));

export default router;
