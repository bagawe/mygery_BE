import { AuthService } from './auth.service.js';

// Helper function to extract client info
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent']
});

export const AuthController = {
  async register(req, res, next) {
    try {
      const data = req.body; // Already validated by middleware
      const clientInfo = getClientInfo(req);
      const user = await AuthService.register(data, clientInfo);
      
      res.status(201).json({ 
        success: true, 
        message: 'User registered successfully', 
        data: user 
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const data = req.body; // Already validated by middleware
      const clientInfo = getClientInfo(req);
      const result = await AuthService.login(data, clientInfo);
      
      res.json({ 
        success: true, 
        message: 'Login successful', 
        data: result 
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body; // Already validated by middleware
      const clientInfo = getClientInfo(req);
      const result = await AuthService.refreshToken(refreshToken, clientInfo);
      
      res.json({ 
        success: true, 
        message: 'Token refreshed successfully', 
        data: result 
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const clientInfo = getClientInfo(req);
      const result = await AuthService.logout(refreshToken, clientInfo);
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      next(error);
    }
  },

  async revokeAllSessions(req, res, next) {
    try {
      const clientInfo = getClientInfo(req);
      const result = await AuthService.revokeAllSessions(req.user.id, clientInfo);
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      next(error);
    }
  }
};
