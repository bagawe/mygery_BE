import express from 'express';
import agendaController from './agenda.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';

const router = express.Router();

// Public route for mobile (unauthenticated)
router.get('/public', agendaController.getPublicAgendas.bind(agendaController));

// Kader route (authenticated, kader role)
router.get(
  '/',
  authMiddleware,
  authorizeRole('kader', 'admin'),
  agendaController.getAgendas.bind(agendaController)
);

// Admin routes
router.post(
  '/',
  authMiddleware,
  authorizeRole('admin'),
  agendaController.createAgenda.bind(agendaController)
);

router.get(
  '/stats',
  authMiddleware,
  authorizeRole('admin'),
  agendaController.getStats.bind(agendaController)
);

router.get(
  '/:id',
  authMiddleware,
  authorizeRole('admin'),
  agendaController.getAgendaById.bind(agendaController)
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRole('admin'),
  agendaController.updateAgenda.bind(agendaController)
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRole('admin'),
  agendaController.deleteAgenda.bind(agendaController)
);

export default router;
