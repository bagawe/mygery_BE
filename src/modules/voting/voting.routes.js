import express from 'express';
import votingController from './voting.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';

const router = express.Router();

// ==================== ADMIN ROUTES ====================
// All admin routes require authentication and admin role

/**
 * @route   POST /api/voting
 * @desc    Create new voting
 * @access  Admin only
 */
router.post(
  '/',
  authMiddleware,
  authorizeRole('admin'),
  votingController.createVoting
);

/**
 * @route   GET /api/voting/stats
 * @desc    Get voting statistics
 * @access  Admin only
 * @note    Must be before /:id route
 */
router.get(
  '/stats',
  authMiddleware,
  authorizeRole('admin'),
  votingController.getVotingStats
);

/**
 * @route   GET /api/voting
 * @desc    Get all votings with filters
 * @access  Admin only
 */
router.get(
  '/',
  authMiddleware,
  authorizeRole('admin'),
  votingController.getAllVotings
);

/**
 * @route   GET /api/voting/:id
 * @desc    Get voting by ID with statistics
 * @access  Admin only
 */
router.get(
  '/:id',
  authMiddleware,
  authorizeRole('admin'),
  votingController.getVotingById
);

/**
 * @route   PUT /api/voting/:id
 * @desc    Update voting
 * @access  Admin only
 */
router.put(
  '/:id',
  authMiddleware,
  authorizeRole('admin'),
  votingController.updateVoting
);

/**
 * @route   PATCH /api/voting/:id/extend
 * @desc    Extend voting deadline
 * @access  Admin only
 */
router.patch(
  '/:id/extend',
  authMiddleware,
  authorizeRole('admin'),
  votingController.extendDeadline
);

/**
 * @route   DELETE /api/voting/:id
 * @desc    Delete voting
 * @access  Admin only
 */
router.delete(
  '/:id',
  authMiddleware,
  authorizeRole('admin'),
  votingController.deleteVoting
);

/**
 * @route   GET /api/voting/:id/results
 * @desc    Get voting results and statistics
 * @access  Admin only
 */
router.get(
  '/:id/results',
  authMiddleware,
  authorizeRole('admin'),
  votingController.getVotingResults
);

// ==================== MOBILE ROUTES (KADER ONLY) ====================

/**
 * @route   GET /api/voting/active
 * @desc    Get active votings for kader
 * @access  Kader only
 * @note    Must be before /:id route
 */
router.get(
  '/active',
  authMiddleware,
  authorizeRole('kader'),
  votingController.getActiveVotings
);

/**
 * @route   GET /api/voting/my-votes
 * @desc    Get user's voting history
 * @access  Kader only
 */
router.get(
  '/my-votes',
  authMiddleware,
  authorizeRole('kader'),
  votingController.getUserVotingHistory
);

/**
 * @route   GET /api/voting/:id/detail
 * @desc    Get voting detail for kader
 * @access  Kader only
 */
router.get(
  '/:id/detail',
  authMiddleware,
  authorizeRole('kader'),
  votingController.getVotingDetail
);

/**
 * @route   POST /api/voting/:id/vote
 * @desc    Submit vote
 * @access  Kader only
 */
router.post(
  '/:id/vote',
  authMiddleware,
  authorizeRole('kader'),
  votingController.submitVote
);

export default router;
