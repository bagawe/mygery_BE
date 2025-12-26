import express from 'express';
import { UserController } from './user.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';
import { uploadPhoto, handleUploadError } from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

// User profile routes (using token)
router.get('/profile', authMiddleware, UserController.getCurrentUserProfile);
router.put('/profile', authMiddleware, UserController.updateCurrentUserProfile);

// Change password endpoint
router.put('/change-password', authMiddleware, UserController.changePassword);

// Upload photo endpoint
router.post('/profile/upload-foto', 
  authMiddleware, 
  uploadPhoto.single('file'), 
  handleUploadError,
  UserController.uploadFoto
);

// User search endpoint
router.get('/search', authMiddleware, UserController.searchUsers);

// Block/Unblock endpoints
router.post('/block', authMiddleware, UserController.blockUser);
router.delete('/block/:blockedUserId', authMiddleware, UserController.unblockUser);
router.get('/blocked', authMiddleware, UserController.getBlockedUsers);
router.get('/block-status/:userId', authMiddleware, UserController.checkBlockStatus);

// Admin user management routes
// Admin routes protected by role
router.get('/', authMiddleware, authorizeRole('admin'), UserController.getUsers); // List users with pagination/filters
router.get('/:uuid', authMiddleware, authorizeRole('admin'), UserController.getUserByUuid); // Get user by UUID
router.put('/:uuid', authMiddleware, authorizeRole('admin'), UserController.updateUserByUuid); // Update user by admin
router.delete('/:uuid', authMiddleware, authorizeRole('admin'), UserController.deleteUser); // Delete user by admin

export default router;
