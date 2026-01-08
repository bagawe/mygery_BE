import radarService from './radar.service.js';
import { successResponse, errorResponse } from '../../utils/responseFormatter.js';

// Rate limiting tracker
const updateLimitTracker = new Map();

class RadarController {
  /**
   * Update user location
   * POST /api/radar/update-location
   */
  async updateLocation(req, res) {
    try {
      const userId = req.user.userId;
      const { latitude, longitude, accuracy } = req.body;

      // Validate coordinates
      if (
        typeof latitude !== 'number' ||
        latitude < -90 ||
        latitude > 90 ||
        typeof longitude !== 'number' ||
        longitude < -180 ||
        longitude > 180
      ) {
        return errorResponse(
          res,
          'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180',
          400
        );
      }

      // Rate limiting: 1 update per minute
      const lastUpdate = updateLimitTracker.get(userId);
      if (lastUpdate && Date.now() - lastUpdate < 60000) {
        return errorResponse(res, 'Please wait before updating location again', 429);
      }

      // Update location
      const location = await radarService.updateLocation(userId, latitude, longitude, accuracy);

      // Update rate limit tracker
      updateLimitTracker.set(userId, Date.now());

      return successResponse(res, {
        latitude: parseFloat(location.latitude.toString()),
        longitude: parseFloat(location.longitude.toString()),
        last_update: location.lastUpdate
      }, 'Location updated successfully');
    } catch (error) {
      console.error('Update location controller error:', error);
      
      if (error.message.includes('disabled')) {
        return errorResponse(res, error.message, 403);
      }
      
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get locations with role-based filtering
   * GET /api/radar/locations
   */
  async getLocations(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role || 'simpatisan';
      const filters = {
        region: req.query.region,
        jabatan: req.query.jabatan,
        radius: req.query.radius,
        lat: req.query.lat,
        lng: req.query.lng,
        limit: req.query.limit || 100
      };

      const locations = await radarService.getLocations(userId, userRole, filters);

      return successResponse(res, locations, 'Locations retrieved successfully', 200, {
        total: locations.length,
        filters: {
          region: filters.region || null,
          jabatan: filters.jabatan || null,
          radius: filters.radius ? parseFloat(filters.radius) : null
        }
      });
    } catch (error) {
      console.error('Get locations controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Toggle location sharing
   * POST /api/radar/toggle-sharing
   */
  async toggleSharing(req, res) {
    try {
      const userId = req.user.userId;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return errorResponse(res, 'enabled must be a boolean', 400);
      }

      const location = await radarService.toggleSharing(userId, enabled);

      return successResponse(res, {
        is_sharing_enabled: location.isSharingEnabled
      }, enabled ? 'Location sharing enabled' : 'Location sharing disabled');
    } catch (error) {
      console.error('Toggle sharing controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get current user's location status
   * GET /api/radar/my-status
   */
  async getMyStatus(req, res) {
    try {
      const userId = req.user.userId;
      const status = await radarService.getMyStatus(userId);

      return successResponse(res, status, 'Status retrieved successfully');
    } catch (error) {
      console.error('Get my status controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get location history (ADMIN ONLY)
   * GET /api/radar/admin/location-history
   */
  async getLocationHistory(req, res) {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return errorResponse(res, 'Admin access required', 403);
      }

      const { user_id, start_date, end_date, limit } = req.query;

      if (!user_id) {
        return errorResponse(res, 'user_id is required', 400);
      }

      const history = await radarService.getLocationHistory(parseInt(user_id), {
        start_date,
        end_date,
        limit
      });

      return successResponse(res, history, 'Location history retrieved successfully');
    } catch (error) {
      console.error('Get location history controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get radar statistics (ADMIN ONLY)
   * GET /api/radar/admin/stats
   */
  async getStats(req, res) {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return errorResponse(res, 'Admin access required', 403);
      }

      const stats = await radarService.getStats();

      return successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      console.error('Get stats controller error:', error);
      return errorResponse(res, error.message);
    }
  }
}

export default new RadarController();