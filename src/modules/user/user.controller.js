import { z } from 'zod';
import { UserService } from './user.service.js';

export const UserController = {
  // Get current user profile (from token)
  async getCurrentUserProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await UserService.getById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const { password, ...userProfile } = user;
      res.json({ 
        success: true, 
        data: userProfile 
      });
    } catch (err) { 
      next(err); 
    }
  },

  // Update current user profile (from token)
  async updateCurrentUserProfile(req, res, next) {
    try {
      const bodySchema = z.object({
        name: z.string().min(1, 'Name is required').optional(),
        email: z.string().email('Invalid email format').optional(),
        username: z.string().min(3, 'Username must be at least 3 characters').optional()
      });
      
      const payload = bodySchema.parse(req.body);
      const userId = req.user.id;
      
      // Check if email or username already exists (if being updated)
      if (payload.email || payload.username) {
        const existingUser = await UserService.checkExistingUser(payload.email, payload.username, userId);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email or username already exists'
          });
        }
      }
      
      const updated = await UserService.updateById(userId, payload);
      const { password, ...userProfile } = updated;
      
      res.json({ 
        success: true, 
        data: userProfile,
        message: 'Profile updated successfully'
      });
    } catch (err) {
      if (err?.issues) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: err.issues 
        });
      }
      next(err);
    }
  },

  // Get list of users (admin only) with pagination and filters
  async getUsers(req, res, next) {
    try {
      const querySchema = z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
        search: z.string().optional(),
        role: z.string().optional(),
        isActive: z.string().optional().transform(val => {
          if (val === 'true') return true;
          if (val === 'false') return false;
          return undefined;
        })
      });

      const query = querySchema.parse(req.query);
      const result = await UserService.getUsers(query);
      
      res.json({
        success: true,
        data: result.users,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / query.limit)
        }
      });
    } catch (err) {
      if (err?.issues) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid query parameters', 
          errors: err.issues 
        });
      }
      next(err);
    }
  },

  // Get user by UUID (admin only)
  async getUserByUuid(req, res, next) {
    try {
      const { uuid } = req.params;
      const user = await UserService.getByUuid(uuid);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const { password, ...userProfile } = user;
      res.json({ 
        success: true, 
        data: userProfile 
      });
    } catch (err) { 
      next(err); 
    }
  },

  // Update user by UUID (admin only)
  async updateUserByUuid(req, res, next) {
    try {
      const bodySchema = z.object({
        name: z.string().min(1, 'Name is required').optional(),
        email: z.string().email('Invalid email format').optional(),
        username: z.string().min(3, 'Username must be at least 3 characters').optional(),
        isActive: z.boolean().optional()
      });
      
      const payload = bodySchema.parse(req.body);
      const { uuid } = req.params;
      
      // Check if user exists
      const existingUser = await UserService.getByUuid(uuid);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if email or username already exists (if being updated)
      if (payload.email || payload.username) {
        const duplicateUser = await UserService.checkExistingUser(payload.email, payload.username, existingUser.id);
        if (duplicateUser) {
          return res.status(400).json({
            success: false,
            message: 'Email or username already exists'
          });
        }
      }
      
      const updated = await UserService.updateByUuid(uuid, payload);
      const { password, ...userProfile } = updated;
      
      res.json({ 
        success: true, 
        data: userProfile,
        message: 'User updated successfully'
      });
    } catch (err) {
      if (err?.issues) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          errors: err.issues 
        });
      }
      next(err);
    }
  },

  // Delete user by UUID (admin only)
  async deleteUser(req, res, next) {
    try {
      const { uuid } = req.params;
      
      // Check if user exists
      const existingUser = await UserService.getByUuid(uuid);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Prevent self-deletion
      if (existingUser.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }
      
      await UserService.deleteByUuid(uuid);
      
      res.json({ 
        success: true, 
        message: 'User deleted successfully'
      });
    } catch (err) { 
      next(err); 
    }
  },

  // Legacy methods (for backward compatibility)
  async getProfile(req, res, next) {
    return this.getUserByUuid(req, res, next);
  },

  async updateProfile(req, res, next) {
    return this.updateUserByUuid(req, res, next);
  }
};
