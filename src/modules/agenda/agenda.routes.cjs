const express = require('express');
const router = express.Router();
const agendaController = require('./agenda.controller.cjs');
const authMiddleware = require('../../middlewares/authMiddleware');
const authorizeRole = require('../../middlewares/authorizeRole');

// Public route for mobile
router.get('/public', agendaController.getPublicAgendas.bind(agendaController));

// Admin routes
router.post(
  '/',
  authMiddleware,
  authorizeRole('admin'),
  agendaController.createAgenda.bind(agendaController)
);

router.get(
  '/',
  authMiddleware,
  authorizeRole('admin'),
  agendaController.getAgendas.bind(agendaController)
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

module.exports = router;
