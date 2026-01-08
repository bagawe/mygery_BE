# 🔧 Backend Requirements for Radar Feature

**Date:** 8 Januari 2026  
**For:** Backend Development Team  
**Feature:** Radar - Real-time Kader Location Tracking  
**Priority:** HIGH  
**Status:** ✅ Ready for Implementation

---

## ✅ FINALIZED DECISIONS

**Implementation requirements yang sudah disetujui:**

1. **Location History: YES** ✅
   - Create `location_history` table
   - Store all location updates for audit trail
   - UI: Admin only (web dashboard, not mobile app)
   - Retention: Keep 30 days, auto-delete older

2. **Role-Based Access Control: CRITICAL** ✅
   - **Simpatisan:** Can only see other Simpatisan locations
   - **Kader:** Can see all Kader + Simpatisan locations
   - **Admin:** Can see all + access location_history
   - Filter implemented in backend (query by user.role)

3. **Update Frequency:** ✅
   - Auto-update: Every 1 hour (when switch ON)
   - Manual refresh: Available anytime
   - Rate limit: 1 update per minute (prevent spam)

4. **Privacy:** ✅
   - Default: Location sharing OFF
   - User must manually enable via switch
   - Can disable anytime
   - Location data cleared when disabled (optional)

---

## 📋 Overview

Fitur Radar membutuhkan backend API untuk:
1. Menyimpan dan mengupdate lokasi kader secara real-time
2. Mengambil daftar lokasi kader dengan **role-based filtering**
3. Mengatur preferensi sharing lokasi user
4. Menyimpan location history untuk admin analytics

---

## 🗄️ Database Schema

### **1. Table: user_locations**

```sql
CREATE TABLE user_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT DEFAULT NULL COMMENT 'GPS accuracy in meters',
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_sharing_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_last_update (last_update),
    INDEX idx_sharing (is_sharing_enabled),
    INDEX idx_active_locations (is_sharing_enabled, last_update),
    
    -- Ensure one location per user
    UNIQUE KEY unique_user_location (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns Explanation:**
- `user_id`: Reference to users table
- `latitude`: GPS latitude (-90 to 90)
- `longitude`: GPS longitude (-180 to 180)
- `accuracy`: GPS accuracy in meters (optional, for data quality)
- `last_update`: Auto-updated timestamp when location changes
- `is_sharing_enabled`: User preference to share location or not
- `created_at`: First time user shared location

---

### **2. Table: location_history** (REQUIRED - for admin analytics)

```sql
CREATE TABLE location_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auto-delete old data (30 days retention)
CREATE EVENT delete_old_location_history
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM location_history 
  WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**Purpose:**
- Track historical locations for analytics (ADMIN ONLY)
- Detect movement patterns
- Generate reports (most active regions, etc.)
- Audit trail for security
- **NOT displayed in mobile app, only web dashboard**

---

## 🌐 Required API Endpoints

### **1. POST /api/radar/update-location**

**Description:** Update user's current location (called every 1 hour or manual refresh)

**Authentication:** Required (JWT Bearer Token)

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 15.5,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

**Validation:**
- `latitude`: Required, number, -90 to 90
- `longitude`: Required, number, -180 to 180
- `accuracy`: Optional, positive number
- `timestamp`: Optional, ISO 8601 format

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "last_update": "2026-01-08T10:30:00Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Invalid coordinates",
  "message": "Latitude must be between -90 and 90"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "error": "Location sharing disabled",
  "message": "Please enable location sharing in settings"
}
```

**Response (Error - 429):**
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Please wait before updating location again"
}
```

**Backend Logic (Node.js/Express Example):**
```javascript
router.post('/update-location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, timestamp } = req.body;
    const userId = req.user.id;
    
    // 1. Validate coordinates
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }
    
    // 2. Check if user has sharing enabled
    const userLocation = await db.query(
      'SELECT is_sharing_enabled FROM user_locations WHERE user_id = ?',
      [userId]
    );
    
    if (userLocation.length > 0 && !userLocation[0].is_sharing_enabled) {
      return res.status(403).json({
        success: false,
        error: 'Location sharing disabled',
        message: 'Please enable location sharing in settings'
      });
    }
    
    // 3. Rate limiting (max 1 update per minute)
    const lastUpdate = userLocation.length > 0 
      ? userLocation[0].last_update 
      : null;
    
    if (lastUpdate) {
      const timeDiff = Date.now() - new Date(lastUpdate).getTime();
      if (timeDiff < 60000) { // 1 minute
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: 'Please wait before updating location again'
        });
      }
    }
    
    // 4. Insert or update location
    await db.query(`
      INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_sharing_enabled)
      VALUES (?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        accuracy = VALUES(accuracy),
        last_update = CURRENT_TIMESTAMP
    `, [userId, latitude, longitude, accuracy || null]);
    
    // 5. ALWAYS Save to history (for admin analytics)
    await db.query(`
      INSERT INTO location_history (user_id, latitude, longitude, accuracy)
      VALUES (?, ?, ?, ?)
    `, [userId, latitude, longitude, accuracy || null]);
    
    // 6. Invalidate cache
    await redis.del('radar:locations');
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        last_update: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to update location'
    });
  }
});

function isValidLatitude(lat) {
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

function isValidLongitude(lng) {
  return typeof lng === 'number' && lng >= -180 && lng <= 180;
}
```

---

### **2. GET /api/radar/locations**

**Description:** Get all active kader locations (for map display)

**Authentication:** Required (JWT Bearer Token)

**Query Parameters:**
- `region` (optional): Filter by region name
- `jabatan` (optional): Filter by position/role
- `radius` (optional): Get users within X kilometers
- `lat` (optional): Center latitude for radius filter
- `lng` (optional): Center longitude for radius filter
- `limit` (optional): Max results (default: 100)

**Request Examples:**
```
GET /api/radar/locations
GET /api/radar/locations?region=Jakarta Pusat
GET /api/radar/locations?jabatan=Ketua DPC
GET /api/radar/locations?lat=-6.2088&lng=106.8456&radius=10
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 123,
      "name": "John Doe",
      "avatar": "https://example.com/avatars/123.jpg",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "accuracy": 15.5,
      "jabatan": "Ketua DPC",
      "region": "Jakarta Pusat",
      "last_update": "2026-01-08T10:30:00Z",
      "distance": 2.5
    },
    {
      "user_id": 456,
      "name": "Jane Smith",
      "avatar": null,
      "latitude": -6.2100,
      "longitude": 106.8470,
      "accuracy": 20.0,
      "jabatan": "Sekretaris",
      "region": "Jakarta Selatan",
      "last_update": "2026-01-08T09:45:00Z",
      "distance": null
    }
  ],
  "total": 2,
  "filters": {
    "region": null,
    "jabatan": null,
    "radius": null
  }
}
```

**Backend Logic with Role-Based Access:**
```javascript
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const { region, jabatan, radius, lat, lng, limit = 100 } = req.query;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role; // 'simpatisan', 'kader', or 'admin'
    
    let query = `
      SELECT 
        u.id as user_id,
        u.name,
        u.avatar,
        ul.latitude,
        ul.longitude,
        ul.accuracy,
        u.jabatan,
        u.region,
        u.role,
        ul.last_update
      FROM user_locations ul
      JOIN users u ON ul.user_id = u.id
      WHERE ul.is_sharing_enabled = TRUE
        AND ul.last_update > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND u.id != ?
    `;
    
    const params = [currentUserId]; // Exclude current user from results
    
    // ROLE-BASED FILTERING (CRITICAL)
    if (currentUserRole === 'simpatisan') {
      // Simpatisan can only see other Simpatisan
      query += ' AND u.role = ?';
      params.push('simpatisan');
    } else if (currentUserRole === 'kader') {
      // Kader can see all Kader + Simpatisan
      query += ' AND (u.role = ? OR u.role = ?)';
      params.push('kader', 'simpatisan');
    }
    // Admin can see all (no additional filter)
    
    // Filter by region
    if (region) {
      query += ' AND u.region = ?';
      params.push(region);
    }
    
    // Filter by jabatan
    if (jabatan) {
      query += ' AND u.jabatan = ?';
      params.push(jabatan);
    }
    
    query += ' ORDER BY ul.last_update DESC';
    query += ' LIMIT ?';
    params.push(parseInt(limit));
    
    let locations = await db.query(query, params);
    
    // Calculate distance if radius filter provided
    if (radius && lat && lng) {
      locations = locations
        .map(loc => ({
          ...loc,
          distance: calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            loc.latitude,
            loc.longitude
          )
        }))
        .filter(loc => loc.distance <= parseFloat(radius))
        .sort((a, b) => a.distance - b.distance);
    }
    
    // Format response
    const formattedLocations = locations.map(loc => ({
      user_id: loc.user_id,
      name: loc.name,
      avatar: loc.avatar ? `${process.env.BASE_URL}${loc.avatar}` : null,
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      accuracy: loc.accuracy ? parseFloat(loc.accuracy) : null,
      jabatan: loc.jabatan,
      region: loc.region,
      last_update: loc.last_update,
      distance: loc.distance || null
    }));
    
    res.json({
      success: true,
      data: formattedLocations,
      total: formattedLocations.length,
      filters: {
        region: region || null,
        jabatan: jabatan || null,
        radius: radius ? parseFloat(radius) : null
      }
    });
    
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to fetch locations'
    });
  }
});

// Haversine formula to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
```

---

### **3. POST /api/radar/toggle-sharing**

**Description:** Enable or disable location sharing

**Authentication:** Required (JWT Bearer Token)

**Request Body:**
```json
{
  "enabled": true
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Location sharing enabled",
  "data": {
    "is_sharing_enabled": true
  }
}
```

**Backend Logic:**
```javascript
router.post('/toggle-sharing', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'enabled must be a boolean'
      });
    }
    
    // Insert or update sharing preference
    await db.query(`
      INSERT INTO user_locations (user_id, is_sharing_enabled, latitude, longitude)
      VALUES (?, ?, 0, 0)
      ON DUPLICATE KEY UPDATE
        is_sharing_enabled = VALUES(is_sharing_enabled)
    `, [userId, enabled]);
    
    // If disabled, optionally clear location data
    if (!enabled && process.env.CLEAR_LOCATION_ON_DISABLE === 'true') {
      await db.query(`
        UPDATE user_locations
        SET latitude = 0, longitude = 0, accuracy = NULL
        WHERE user_id = ?
      `, [userId]);
    }
    
    // Invalidate cache
    await redis.del('radar:locations');
    
    res.json({
      success: true,
      message: enabled ? 'Location sharing enabled' : 'Location sharing disabled',
      data: {
        is_sharing_enabled: enabled
      }
    });
    
  } catch (error) {
    console.error('Toggle sharing error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to update sharing preference'
    });
  }
});
```

---

### **4. GET /api/radar/my-status**

**Description:** Get current user's sharing status and location

**Authentication:** Required (JWT Bearer Token)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "is_sharing_enabled": true,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 15.5,
    "last_update": "2026-01-08T10:30:00Z"
  }
}
```

**Response (No location set - 200):**
```json
{
  "success": true,
  "data": {
    "is_sharing_enabled": false,
    "latitude": null,
    "longitude": null,
    "accuracy": null,
    "last_update": null
  }
}
```

**Backend Logic:**
```javascript
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM user_locations WHERE user_id = ?',
      [userId]
    );
    
    if (result.length === 0) {
      return res.json({
        success: true,
        data: {
          is_sharing_enabled: false,
          latitude: null,
          longitude: null,
          accuracy: null,
          last_update: null
        }
      });
    }
    
    const location = result[0];
    
    res.json({
      success: true,
      data: {
        is_sharing_enabled: location.is_sharing_enabled,
        latitude: location.latitude ? parseFloat(location.latitude) : null,
        longitude: location.longitude ? parseFloat(location.longitude) : null,
        accuracy: location.accuracy ? parseFloat(location.accuracy) : null,
        last_update: location.last_update
      }
    });
    
  } catch (error) {
    console.error('Get my status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to fetch status'
    });
  }
});
```

---

### **5. GET /api/radar/admin/location-history**

**Description:** Get location history for a specific user (ADMIN ONLY)

**Authentication:** Required (JWT Bearer Token) + Admin Role Check

**Query Parameters:**
- `user_id` (required): User ID to get history for
- `start_date` (optional): Start date (ISO 8601 format)
- `end_date` (optional): End date (ISO 8601 format)
- `limit` (optional): Max results (default: 100)

**Request Example:**
```
GET /api/radar/admin/location-history?user_id=123&start_date=2026-01-01&limit=50
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "user_name": "John Doe",
    "history": [
      {
        "id": 1001,
        "latitude": -6.2088,
        "longitude": 106.8456,
        "accuracy": 15.5,
        "timestamp": "2026-01-08T10:30:00Z"
      }
    ],
    "total": 1
  }
}
```

**Backend Logic:**
```javascript
router.get('/admin/location-history', authenticateToken, async (req, res) => {
  // Check admin permission
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Admin access required'
    });
  }
  
  const { user_id, start_date, end_date, limit = 100 } = req.query;
  
  try {
    let query = `
      SELECT 
        lh.id,
        lh.latitude,
        lh.longitude,
        lh.accuracy,
        lh.timestamp,
        u.name as user_name
      FROM location_history lh
      JOIN users u ON lh.user_id = u.id
      WHERE lh.user_id = ?
    `;
    
    const params = [user_id];
    
    // Filter by date range
    if (start_date && end_date) {
      query += ' AND lh.timestamp BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      query += ' AND lh.timestamp >= ?';
      params.push(start_date);
    } else if (end_date) {
      query += ' AND lh.timestamp <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY lh.timestamp DESC';
    query += ' LIMIT ?';
    params.push(parseInt(limit));
    
    const history = await db.query(query, params);
    
    res.json({
      success: true,
      data: {
        user_id,
        user_name: history.length > 0 ? history[0].user_name : null,
        history: history.map(entry => ({
          id: entry.id,
          latitude: parseFloat(entry.latitude),
          longitude: parseFloat(entry.longitude),
          accuracy: entry.accuracy ? parseFloat(entry.accuracy) : null,
          timestamp: entry.timestamp
        })),
        total: history.length
      }
    });
    
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to fetch location history'
    });
  }
});
```

---

### **6. GET /api/radar/admin/stats**

**Description:** Get radar statistics dashboard (ADMIN ONLY)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users_sharing": 1523,
    "active_last_1h": 245,
    "active_last_24h": 1203,
    "by_role": {
      "kader": 982,
      "simpatisan": 541
    },
    "by_region": {
      "Jakarta Pusat": 324
    }
  }
}
```

**Backend Logic:**
```javascript
router.get('/admin/stats', authenticateToken, async (req, res) => {
  // Check admin permission
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Admin access required'
    });
  }
  
  try {
    // Total users sharing location
    const totalUsersSharing = await db.query(`
      SELECT COUNT(*) as count 
      FROM user_locations 
      WHERE is_sharing_enabled = TRUE
    `);
    
    // Active users in the last 1 hour
    const activeLast1h = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_locations 
      WHERE last_update > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    
    // Active users in the last 24 hours
    const activeLast24h = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_locations 
      WHERE last_update > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    
    // Users by role
    const usersByRole = await db.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE id IN (SELECT user_id FROM user_locations WHERE is_sharing_enabled = TRUE)
      GROUP BY role
    `);
    
    // Users by region
    const usersByRegion = await db.query(`
      SELECT region, COUNT(*) as count 
      FROM users 
      WHERE id IN (SELECT user_id FROM user_locations WHERE is_sharing_enabled = TRUE)
      GROUP BY region
    `);
    
    res.json({
      success: true,
      data: {
        total_users_sharing: totalUsersSharing[0].count,
        active_last_1h: activeLast1h[0].count,
        active_last_24h: activeLast24h[0].count,
        by_role: Object.fromEntries(usersByRole.map(row => [row.role, row.count])),
        by_region: Object.fromEntries(usersByRegion.map(row => [row.region, row.count])),
      }
    });
    
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to fetch statistics'
    });
  }
});
```

---

## 🚀 Performance Optimization

### **1. Redis Caching**

```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Cache locations for 2 minutes
async function getCachedLocations(filters) {
  const cacheKey = `radar:locations:${JSON.stringify(filters)}`;
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const locations = await queryLocationsFromDB(filters);
  
  // Cache result
  await client.setex(cacheKey, 120, JSON.stringify(locations));
  
  return locations;
}

// Invalidate cache when location updated
async function invalidateLocationCache() {
  const keys = await client.keys('radar:locations:*');
  if (keys.length > 0) {
    await client.del(...keys);
  }
}
```

### **2. Database Indexes**

Already included in schema above:
- `idx_user_id` - Fast user lookup
- `idx_last_update` - Sort by recent
- `idx_sharing` - Filter by sharing status
- `idx_active_locations` - Composite index for active users

### **3. Query Optimization**

```sql
-- Use covering index
ALTER TABLE user_locations 
ADD INDEX idx_covering (is_sharing_enabled, last_update, user_id, latitude, longitude);

-- Partition by date (optional, for large datasets)
ALTER TABLE location_history
PARTITION BY RANGE (UNIX_TIMESTAMP(timestamp)) (
  PARTITION p_2026_01 VALUES LESS THAN (UNIX_TIMESTAMP('2026-02-01')),
  PARTITION p_2026_02 VALUES LESS THAN (UNIX_TIMESTAMP('2026-03-01')),
  -- Add more partitions...
);
```

---

## 🔒 Security Considerations

### **1. Rate Limiting**

```javascript
const rateLimit = require('express-rate-limit');

const locationUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // Max 1 request per minute
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please wait before updating location again'
  }
});

router.post('/update-location', locationUpdateLimiter, authenticateToken, ...);
```

### **2. Input Validation**

```javascript
const { body, query, validationResult } = require('express-validator');

router.post('/update-location', [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat({ min: 0 }),
  body('timestamp').optional().isISO8601(),
], authenticateToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors.array()
    });
  }
  // ... rest of logic
});
```

### **3. Privacy Controls**

```javascript
// Only show location to verified/active members
async function getVisibleLocations(userId) {
  const user = await getUserById(userId);
  
  // Admin can see all
  if (user.role === 'admin') {
    return getAllLocations();
  }
  
  // Regular users only see same region
  return getLocationsByRegion(user.region);
}
```

---

## 📊 Analytics Endpoints (Optional)

### **GET /api/radar/stats**

Get radar statistics for dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "total_active_users": 1523,
    "users_by_region": {
      "Jakarta Pusat": 324,
      "Jakarta Selatan": 289,
      "Jakarta Barat": 156
    },
    "users_by_jabatan": {
      "Ketua DPC": 45,
      "Sekretaris": 38,
      "Anggota": 1440
    },
    "last_24h_updates": 987,
    "avg_accuracy": 18.5
  }
}
```

---

## 🧪 Testing

### **Test Cases**

1. **Update Location:**
   ```bash
   curl -X POST http://localhost:3030/api/radar/update-location \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"latitude": -6.2088, "longitude": 106.8456}'
   ```

2. **Get Locations:**
   ```bash
   curl http://localhost:3030/api/radar/locations \
     -H "Authorization: Bearer <token>"
   ```

3. **Toggle Sharing:**
   ```bash
   curl -X POST http://localhost:3030/api/radar/toggle-sharing \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"enabled": true}'
   ```

---

## 📝 Environment Variables

Add to `.env`:

```env
# Radar Feature
ENABLE_LOCATION_HISTORY=true
CLEAR_LOCATION_ON_DISABLE=false
LOCATION_CACHE_TTL=120
MAX_LOCATION_AGE_HOURS=24

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🚀 Deployment Checklist

- [ ] Create `user_locations` table
- [ ] Create `location_history` table (if needed)
- [ ] Add database indexes
- [ ] Implement all 4 API endpoints
- [ ] Add input validation
- [ ] Add rate limiting
- [ ] Setup Redis caching
- [ ] Test with Postman
- [ ] Update API documentation
- [ ] Deploy to production

---

## 📞 Support

**Questions?** Contact:
- Backend Lead: [Name]
- API Issues: [Email]
- Database: [DBA Email]

---

**Last Updated:** 8 Januari 2026  
**Version:** 1.0  
**Status:** Ready for Implementation
