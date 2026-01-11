import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RadarService {
  /**
   * Update user location
   * @param {boolean} isSavedOnly - If true, only save location without enabling sharing
   */
  async updateLocation(userId, latitude, longitude, accuracy = null, isSavedOnly = false) {
    try {
      // Get existing location
      const existing = await prisma.userLocation.findUnique({
        where: { userId }
      });

      // Determine sharing status
      let isSharingEnabled;
      if (isSavedOnly) {
        // Manual save: keep existing sharing status (or false if new)
        isSharingEnabled = existing?.isSharingEnabled || false;
      } else {
        // Background service or toggle: enable sharing
        isSharingEnabled = true;
      }

      // Update or create location
      const location = await prisma.userLocation.upsert({
        where: { userId },
        update: {
          latitude,
          longitude,
          accuracy,
          lastUpdate: new Date(),
          isSharingEnabled,
          isSavedLocation: true  // Always true when location is saved
        },
        create: {
          userId,
          latitude,
          longitude,
          accuracy,
          isSharingEnabled,
          isSavedLocation: true  // Always true when location is saved
        }
      });

      // Save to history
      await prisma.locationHistory.create({
        data: {
          userId,
          latitude,
          longitude,
          accuracy
        }
      });

      return location;
    } catch (error) {
      console.error('Update location service error:', error);
      throw error;
    }
  }

  /**
   * Get locations with role-based filtering
   */
  async getLocations(currentUserId, currentUserRole, filters = {}) {
    try {
      const { region, jabatan, radius, lat, lng, limit = 100 } = filters;

      // Build where clause - return all users with saved or shared locations
      let whereClause = {
        OR: [
          { isSharingEnabled: true },
          { isSavedLocation: true }
        ],
        lastUpdate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        userId: {
          not: currentUserId // Exclude current user
        }
      };

      // Role-based filtering
      const userRoleFilter = {};
      if (currentUserRole === 'simpatisan') {
        // Simpatisan can only see other Simpatisan
        userRoleFilter.roles = {
          some: {
            role: 'simpatisan'
          }
        };
      } else if (currentUserRole === 'kader') {
        // Kader can see Kader + Simpatisan
        userRoleFilter.roles = {
          some: {
            role: {
              in: ['kader', 'simpatisan']
            }
          }
        };
      }
      // Admin can see all (no filter)

      // Additional filters
      const userFilters = { ...userRoleFilter };
      if (region) userFilters.provinsi = region;

      // Query locations
      const locations = await prisma.userLocation.findMany({
        where: {
          ...whereClause,
          user: userFilters
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              fotoProfil: true,
              pekerjaan: true, // jabatan
              provinsi: true,  // region
              roles: {
                select: {
                  role: true
                }
              }
            }
          }
        },
        take: parseInt(limit),
        orderBy: {
          lastUpdate: 'desc'
        }
      });

      // Format response
      let formattedLocations = locations.map(loc => ({
        user_id: loc.user.id,
        name: loc.user.name,
        avatar: loc.user.fotoProfil,
        latitude: parseFloat(loc.latitude.toString()),
        longitude: parseFloat(loc.longitude.toString()),
        accuracy: loc.accuracy,
        jabatan: loc.user.pekerjaan,
        region: loc.user.provinsi,
        role: loc.user.roles[0]?.role || 'simpatisan',
        last_update: loc.lastUpdate,
        is_sharing_enabled: loc.isSharingEnabled,  // NEW FIELD
        is_saved_location: loc.isSavedLocation,    // NEW FIELD
        distance: null
      }));

      // Calculate distance if radius provided
      if (radius && lat && lng) {
        formattedLocations = formattedLocations.map(loc => ({
          ...loc,
          distance: this.calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            loc.latitude,
            loc.longitude
          )
        }));

        // Filter by radius
        formattedLocations = formattedLocations
          .filter(loc => loc.distance <= parseFloat(radius))
          .sort((a, b) => a.distance - b.distance);
      }

      return formattedLocations;
    } catch (error) {
      console.error('Get locations service error:', error);
      throw error;
    }
  }

  /**
   * Toggle location sharing
   */
  async toggleSharing(userId, enabled) {
    try {
      const location = await prisma.userLocation.upsert({
        where: { userId },
        update: {
          isSharingEnabled: enabled
        },
        create: {
          userId,
          latitude: 0,
          longitude: 0,
          isSharingEnabled: enabled
        }
      });

      // Optionally clear location when disabled
      if (!enabled && process.env.CLEAR_LOCATION_ON_DISABLE === 'true') {
        await prisma.userLocation.update({
          where: { userId },
          data: {
            latitude: 0,
            longitude: 0,
            accuracy: null
          }
        });
      }

      return location;
    } catch (error) {
      console.error('Toggle sharing service error:', error);
      throw error;
    }
  }

  /**
   * Get user's location status
   */
  async getMyStatus(userId) {
    try {
      const location = await prisma.userLocation.findUnique({
        where: { userId }
      });

      if (!location) {
        return {
          is_sharing_enabled: false,
          is_saved_location: false,  // NEW FIELD
          latitude: null,
          longitude: null,
          accuracy: null,
          last_update: null
        };
      }

      return {
        is_sharing_enabled: location.isSharingEnabled,
        is_saved_location: location.isSavedLocation,  // NEW FIELD
        latitude: location.latitude ? parseFloat(location.latitude.toString()) : null,
        longitude: location.longitude ? parseFloat(location.longitude.toString()) : null,
        accuracy: location.accuracy,
        last_update: location.lastUpdate
      };
    } catch (error) {
      console.error('Get my status service error:', error);
      throw error;
    }
  }

  /**
   * Get location history (ADMIN ONLY)
   */
  async getLocationHistory(targetUserId, filters = {}) {
    try {
      const { start_date, end_date, limit = 100 } = filters;

      const whereClause = { userId: targetUserId };

      if (start_date && end_date) {
        whereClause.timestamp = {
          gte: new Date(start_date),
          lte: new Date(end_date)
        };
      } else if (start_date) {
        whereClause.timestamp = {
          gte: new Date(start_date)
        };
      } else if (end_date) {
        whereClause.timestamp = {
          lte: new Date(end_date)
        };
      }

      const history = await prisma.locationHistory.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        take: parseInt(limit),
        orderBy: {
          timestamp: 'desc'
        }
      });

      return {
        user_id: targetUserId,
        user_name: history[0]?.user.name || null,
        history: history.map(entry => ({
          id: entry.id,
          latitude: parseFloat(entry.latitude.toString()),
          longitude: parseFloat(entry.longitude.toString()),
          accuracy: entry.accuracy,
          timestamp: entry.timestamp
        })),
        total: history.length
      };
    } catch (error) {
      console.error('Get location history service error:', error);
      throw error;
    }
  }

  /**
   * Get radar statistics (ADMIN ONLY)
   */
  async getStats() {
    try {
      const totalSharing = await prisma.userLocation.count({
        where: { isSharingEnabled: true }
      });

      const activeLast1h = await prisma.userLocation.count({
        where: {
          lastUpdate: {
            gte: new Date(Date.now() - 60 * 60 * 1000)
          }
        }
      });

      const activeLast24h = await prisma.userLocation.count({
        where: {
          lastUpdate: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      // Get user counts by role
      const usersByRole = await prisma.userLocation.findMany({
        where: { isSharingEnabled: true },
        include: {
          user: {
            select: {
              roles: {
                select: {
                  role: true
                }
              }
            }
          }
        }
      });

      const roleStats = {};
      usersByRole.forEach(loc => {
        const role = loc.user.roles[0]?.role || 'simpatisan';
        roleStats[role] = (roleStats[role] || 0) + 1;
      });

      // Get user counts by region
      const usersByRegion = await prisma.userLocation.findMany({
        where: { isSharingEnabled: true },
        include: {
          user: {
            select: {
              provinsi: true
            }
          }
        }
      });

      const regionStats = {};
      usersByRegion.forEach(loc => {
        const region = loc.user.provinsi || 'Unknown';
        regionStats[region] = (regionStats[region] || 0) + 1;
      });

      return {
        total_users_sharing: totalSharing,
        active_last_1h: activeLast1h,
        active_last_24h: activeLast24h,
        by_role: roleStats,
        by_region: regionStats
      };
    } catch (error) {
      console.error('Get stats service error:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clean old location history (30 days)
   */
  async cleanOldHistory() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleted = await prisma.locationHistory.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      });

      console.log(`Deleted ${deleted.count} old location history entries`);
      return deleted.count;
    } catch (error) {
      console.error('Clean old history error:', error);
      throw error;
    }
  }
}

export default new RadarService();