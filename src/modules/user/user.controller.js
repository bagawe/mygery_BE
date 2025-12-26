import { z } from 'zod';
import { UserService } from './user.service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        // Basic fields
        name: z.string().min(1, 'Name is required').optional(),
        email: z.string().email('Invalid email format').optional(),
        username: z.string().min(3, 'Username must be at least 3 characters').optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
        
        // Identity fields
        nik: z.string().length(16, 'NIK must be exactly 16 digits').regex(/^\d+$/, 'NIK must contain only numbers').optional(),
        jenisKelamin: z.enum(['Laki-laki', 'Perempuan'], {
          errorMap: () => ({ message: 'Jenis kelamin must be either "Laki-laki" or "Perempuan"' })
        }).optional(),
        statusKawin: z.enum(['Kawin', 'Belum Kawin', 'Janda', 'Duda'], {
          errorMap: () => ({ message: 'Status kawin must be one of: Kawin, Belum Kawin, Janda, Duda' })
        }).optional(),
        tempatLahir: z.string().max(100, 'Tempat lahir max 100 characters').optional(),
        tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir must be in YYYY-MM-DD format').optional(),
        
        // Address fields
        provinsi: z.string().max(100, 'Provinsi max 100 characters').optional(),
        kota: z.string().max(100, 'Kota max 100 characters').optional(),
        kecamatan: z.string().max(100, 'Kecamatan max 100 characters').optional(),
        kelurahan: z.string().max(100, 'Kelurahan max 100 characters').optional(),
        rt: z.string().max(3, 'RT max 3 characters').optional(),
        rw: z.string().max(3, 'RW max 3 characters').optional(),
        jalan: z.string().max(255, 'Jalan max 255 characters').optional(),
        
        // Profession & Education
        pekerjaan: z.string().max(100, 'Pekerjaan max 100 characters').optional(),
        pendidikan: z.string().max(50, 'Pendidikan max 50 characters').optional(),
        
        // Political affiliation
        underbow: z.string().max(255, 'Underbow max 255 characters').optional(),
        kegiatan: z.string().optional(),
        
        // Photos (URLs/paths will be set by upload endpoint)
        fotoKtp: z.string().optional(),
        fotoProfil: z.string().optional()
      });
      
      const payload = bodySchema.parse(req.body);
      const userId = req.user.id;
      
      // Convert tanggalLahir string to Date if provided
      if (payload.tanggalLahir) {
        payload.tanggalLahir = new Date(payload.tanggalLahir);
      }
      
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
        // Basic fields
        name: z.string().min(1, 'Name is required').optional(),
        email: z.string().email('Invalid email format').optional(),
        username: z.string().min(3, 'Username must be at least 3 characters').optional(),
        isActive: z.boolean().optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
        
        // Identity fields
        nik: z.string().length(16, 'NIK must be exactly 16 digits').regex(/^\d+$/, 'NIK must contain only numbers').optional(),
        jenisKelamin: z.enum(['Laki-laki', 'Perempuan'], {
          errorMap: () => ({ message: 'Jenis kelamin must be either "Laki-laki" or "Perempuan"' })
        }).optional(),
        statusKawin: z.enum(['Kawin', 'Belum Kawin', 'Janda', 'Duda'], {
          errorMap: () => ({ message: 'Status kawin must be one of: Kawin, Belum Kawin, Janda, Duda' })
        }).optional(),
        tempatLahir: z.string().max(100, 'Tempat lahir max 100 characters').optional(),
        tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir must be in YYYY-MM-DD format').optional(),
        
        // Address fields
        provinsi: z.string().max(100, 'Provinsi max 100 characters').optional(),
        kota: z.string().max(100, 'Kota max 100 characters').optional(),
        kecamatan: z.string().max(100, 'Kecamatan max 100 characters').optional(),
        kelurahan: z.string().max(100, 'Kelurahan max 100 characters').optional(),
        rt: z.string().max(3, 'RT max 3 characters').optional(),
        rw: z.string().max(3, 'RW max 3 characters').optional(),
        jalan: z.string().max(255, 'Jalan max 255 characters').optional(),
        
        // Profession & Education
        pekerjaan: z.string().max(100, 'Pekerjaan max 100 characters').optional(),
        pendidikan: z.string().max(50, 'Pendidikan max 50 characters').optional(),
        
        // Political affiliation
        underbow: z.string().max(255, 'Underbow max 255 characters').optional(),
        kegiatan: z.string().optional(),
        
        // Photos
        fotoKtp: z.string().optional(),
        fotoProfil: z.string().optional()
      });
      
      const payload = bodySchema.parse(req.body);
      const { uuid } = req.params;
      
      // Convert tanggalLahir string to Date if provided
      if (payload.tanggalLahir) {
        payload.tanggalLahir = new Date(payload.tanggalLahir);
      }
      
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

  // Upload photo (profile or KTP)
  async uploadFoto(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fotoType = req.body.fotoType || req.query.fotoType || 'profil';
      
      if (!['ktp', 'profil'].includes(fotoType)) {
        // Delete uploaded file if invalid type
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid fotoType. Must be either "ktp" or "profil"'
        });
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/${fotoType === 'ktp' ? 'ktp' : 'profiles'}/${req.file.filename}`;
      
      // Update user profile with the new photo URL
      const updateData = fotoType === 'ktp' 
        ? { fotoKtp: fileUrl }
        : { fotoProfil: fileUrl };
      
      const userId = req.user.id;
      
      // Get old photo path to delete if exists
      const user = await UserService.getById(userId);
      const oldPhotoPath = fotoType === 'ktp' ? user.fotoKtp : user.fotoProfil;
      
      // Update user with new photo
      await UserService.updateById(userId, updateData);
      
      // Delete old photo file if exists
      if (oldPhotoPath) {
        const oldFilePath = path.join(__dirname, '../../..', oldPhotoPath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      res.json({
        success: true,
        message: `Foto ${fotoType} uploaded successfully`,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          type: fotoType
        }
      });
    } catch (err) {
      // Delete uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(err);
    }
  },

  // Change password
  async changePassword(req, res, next) {
    try {
      const bodySchema = z.object({
        oldPassword: z.string().min(1, 'Old password is required'),
        newPassword: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/\d/, 'Password must contain at least one number')
      });

      const { oldPassword, newPassword } = bodySchema.parse(req.body);
      const userId = req.user.id;

      await UserService.changePassword(userId, oldPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (err) {
      if (err?.issues) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: err.issues
        });
      }

      // Handle specific errors
      if (err.message === 'Old password is incorrect') {
        return res.status(400).json({
          success: false,
          message: 'Old password is incorrect'
        });
      }

      if (err.message === 'New password must be different from old password') {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from old password'
        });
      }

      next(err);
    }
  },

  /**
   * Search users
   * GET /api/users/search?q=keyword&limit=20
   */
  async searchUsers(req, res, next) {
    try {
      const querySchema = z.object({
        q: z.string().min(1, "Query parameter 'q' is required"),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
        excludeSelf: z.string().optional().transform(val => val !== 'false')
      });

      const query = querySchema.parse(req.query);
      const currentUserId = req.user.id;

      const users = await UserService.searchUsers(
        currentUserId,
        query.q,
        query.limit,
        query.excludeSelf
      );

      res.json({
        success: true,
        data: users,
        meta: {
          total: users.length,
          limit: query.limit
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: err.errors
        });
      }

      if (err.message === "Query parameter 'q' is required") {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      next(err);
    }
  },

  /**
   * Block a user
   * POST /api/users/block
   */
  async blockUser(req, res, next) {
    try {
      const bodySchema = z.object({
        blockedUserId: z.number().int().positive()
      });

      const body = bodySchema.parse(req.body);
      const blockerId = req.user.id;

      const block = await UserService.blockUser(blockerId, body.blockedUserId);

      res.json({
        success: true,
        message: 'User blocked successfully',
        data: {
          id: block.id,
          blockerId: block.blockerId,
          blockedUserId: block.blockedUserId,
          createdAt: block.createdAt
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: err.errors
        });
      }

      if (err.message === 'Cannot block yourself' || err.message === 'User already blocked') {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      next(err);
    }
  },

  /**
   * Unblock a user
   * DELETE /api/users/block/:blockedUserId
   */
  async unblockUser(req, res, next) {
    try {
      const blockedUserId = parseInt(req.params.blockedUserId);
      const blockerId = req.user.id;

      await UserService.unblockUser(blockerId, blockedUserId);

      res.json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (err) {
      if (err.message === 'User is not blocked') {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }

      next(err);
    }
  },

  /**
   * Get blocked users list
   * GET /api/users/blocked
   */
  async getBlockedUsers(req, res, next) {
    try {
      const blockerId = req.user.id;
      const users = await UserService.getBlockedUsers(blockerId);

      res.json({
        success: true,
        data: users
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Check block status with a user
   * GET /api/users/block-status/:userId
   */
  async checkBlockStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const otherUserId = parseInt(req.params.userId);

      const status = await UserService.checkBlockStatus(userId, otherUserId);

      res.json({
        success: true,
        data: status
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
