# 📍 Radar Location Tracking Feature

> Real-time location sharing and tracking system for MyGery political party application

---

## 🎯 Overview

Radar adalah fitur location tracking yang memungkinkan anggota partai (simpatisan dan kader) untuk:
- **Share lokasi** mereka secara real-time
- **Melihat lokasi** anggota lain yang aktif dalam radius tertentu
- **Kontrol privacy** dengan toggle enable/disable sharing
- **Role-based access** sesuai hierarki organisasi

---

## 🌟 Key Features

### 1. Real-Time Location Sharing
- GPS coordinate tracking (latitude, longitude)
- Accuracy measurement in meters
- Last update timestamp
- One-click privacy toggle

### 2. Role-Based Visibility
| Role | Can See Locations Of |
|------|---------------------|
| **Simpatisan** | Only other simpatisan |
| **Kader** | Kader + simpatisan |
| **Admin** | All users (simpatisan, kader, admin) |

### 3. Distance Filtering
- Radius-based search (1-100 km)
- Haversine formula for accurate distance calculation
- Sorted by distance (nearest first)
- Distance displayed in kilometers

### 4. Additional Filters
- Filter by region/province (provinsi)
- Filter by position (jabatan/pekerjaan)
- Combine multiple filters

### 5. Privacy & Security
- **Opt-in by default** - sharing disabled initially
- **User control** - toggle on/off anytime
- **JWT authentication** required for all endpoints
- **Rate limiting** - 1 location update per minute
- **Auto-cleanup** - history deleted after 30 days

### 6. Location History (Admin Only)
- Track historical location data
- Filter by user and date range
- Pagination support
- Audit trail for compliance

---

## 🏗️ Architecture

### Tech Stack
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Scheduling:** node-cron (daily cleanup)
- **Authentication:** JWT Bearer tokens

### Database Schema

#### Table: `user_locations`
Current location of each user (1 record per user)

```sql
CREATE TABLE user_locations (
  id                SERIAL PRIMARY KEY,
  userId            INTEGER UNIQUE NOT NULL,
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  accuracy          DOUBLE PRECISION,
  isSharingEnabled  BOOLEAN DEFAULT false,
  lastUpdate        TIMESTAMP DEFAULT NOW(),
  createdAt         TIMESTAMP DEFAULT NOW(),
  updatedAt         TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_locations_userId ON user_locations(userId);
CREATE INDEX idx_user_locations_sharing ON user_locations(isSharingEnabled);
CREATE INDEX idx_user_locations_lastUpdate ON user_locations(lastUpdate);
```

#### Table: `location_history`
Historical location records for audit trail

```sql
CREATE TABLE location_history (
  id         SERIAL PRIMARY KEY,
  userId     INTEGER NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  accuracy   DOUBLE PRECISION,
  timestamp  TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_location_history_userId ON location_history(userId);
CREATE INDEX idx_location_history_timestamp ON location_history(timestamp);
```

**Data Retention:** 30 days (auto-cleanup daily at 2 AM)

---

## 🛣️ API Endpoints

### Base URL: `/api/radar`

All endpoints require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

---

### 1. Get My Status
Get current location sharing status and coordinates.

**Endpoint:** `GET /api/radar/my-status`

**Response:**
```json
{
  "success": true,
  "message": "Status retrieved successfully",
  "data": {
    "is_sharing_enabled": true,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10,
    "last_update": "2026-01-08T08:00:00.000Z"
  }
}
```

---

### 2. Toggle Location Sharing
Enable or disable location sharing.

**Endpoint:** `POST /api/radar/toggle-sharing`

**Request:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location sharing enabled",
  "data": {
    "is_sharing_enabled": true
  }
}
```

---

### 3. Update Location
Update your current GPS coordinates.

**Endpoint:** `POST /api/radar/update-location`

**Rate Limit:** 1 request per minute per user

**Request:**
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10
}
```

**Validation:**
- `latitude`: -90 to 90
- `longitude`: -180 to 180
- `accuracy`: 0 to 1000 (meters)

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "last_update": "2026-01-08T08:00:00.000Z"
  }
}
```

**Error (Rate Limit):**
```json
{
  "success": false,
  "message": "Please wait 45 seconds before updating location again"
}
```

---

### 4. Get Nearby Locations
Get list of users within specified radius, filtered by role.

**Endpoint:** `GET /api/radar/locations`

**Query Parameters:**
- `latitude` (required): Your current latitude
- `longitude` (required): Your current longitude
- `radius` (optional): Search radius in km (default: 10, max: 100)
- `region` (optional): Filter by province (e.g., "DKI Jakarta")
- `jabatan` (optional): Filter by position (e.g., "Ketua RT")

**Example:**
```
GET /api/radar/locations?latitude=-6.2088&longitude=106.8456&radius=50&region=DKI%20Jakarta
```

**Response:**
```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": [
    {
      "userId": 5,
      "name": "Ahmad Kader",
      "latitude": -6.2100,
      "longitude": 106.8460,
      "distance": 0.15,
      "lastUpdate": "2026-01-08T07:55:00.000Z",
      "role": "kader",
      "avatar": "https://example.com/avatar.jpg",
      "jabatan": "Ketua RW 05",
      "provinsi": "DKI Jakarta"
    },
    {
      "userId": 8,
      "name": "Siti Simpatisan",
      "latitude": -6.2150,
      "longitude": 106.8500,
      "distance": 0.85,
      "lastUpdate": "2026-01-08T07:50:00.000Z",
      "role": "simpatisan",
      "avatar": null,
      "jabatan": "Warga",
      "provinsi": "DKI Jakarta"
    }
  ],
  "total": 2,
  "filters": {
    "region": "DKI Jakarta",
    "jabatan": null,
    "radius": 50
  }
}
```

**Role Filtering:**
- **Simpatisan** sees only other **simpatisan** within radius
- **Kader** sees **kader** + **simpatisan** within radius
- **Admin** sees **all users** within radius

---

### 5. Get Location History (Admin Only)
Get historical location records for audit purposes.

**Endpoint:** `GET /api/radar/admin/location-history`

**Access:** Admin only

**Query Parameters:**
- `userId` (optional): Filter by specific user
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50, max: 100)

**Example:**
```
GET /api/radar/admin/location-history?userId=5&startDate=2026-01-01&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Location history retrieved successfully",
  "data": [
    {
      "id": 1234,
      "userId": 5,
      "userName": "Ahmad Kader",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "accuracy": 10,
      "timestamp": "2026-01-08T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16
  }
}
```

---

### 6. Get Statistics (Admin Only)
Get location tracking statistics and aggregated data.

**Endpoint:** `GET /api/radar/admin/stats`

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total_users_sharing": 245,
    "users_by_role": {
      "simpatisan": 180,
      "kader": 60,
      "admin": 5
    },
    "users_by_region": {
      "DKI Jakarta": 120,
      "Jawa Barat": 85,
      "Jawa Tengah": 40
    },
    "active_last_24h": 198,
    "total_location_updates_today": 1542
  }
}
```

---

## 🔐 Security

### Authentication
All endpoints require valid JWT token:
```bash
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/radar/my-status
```

### Authorization
Role-based access control (RBAC):
- Public endpoints: 1-4 (all authenticated users)
- Admin endpoints: 5-6 (admin role required)

### Rate Limiting
Location updates limited to **1 per minute per user** to prevent:
- Server overload
- GPS coordinate spam
- Abuse/misuse

### Input Validation
All inputs validated using Zod schemas:
- Type checking (number, string, boolean)
- Range validation (lat: -90 to 90, lon: -180 to 180)
- Required field enforcement
- SQL injection prevention (Prisma ORM)

### Privacy Controls
- **Opt-in model:** Sharing disabled by default
- **User control:** Toggle sharing anytime
- **Visibility rules:** Can't see users who disabled sharing
- **Data retention:** Auto-delete after 30 days

---

## 🚀 Quick Start Guide

### For Backend Developers

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Run Migrations
```bash
npx prisma migrate deploy
```

#### 3. Generate Prisma Client
```bash
npx prisma generate
```

#### 4. Start Server
```bash
npm run start
# or
node ./src/server.js
```

#### 5. Verify Installation
```bash
# Check health
curl http://localhost:3030/health

# Test radar endpoint (with token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3030/api/radar/my-status
```

---

### For Frontend Developers (Flutter)

#### 1. Request Location Permission
```dart
import 'package:geolocator/geolocator.dart';

Future<bool> requestLocationPermission() async {
  LocationPermission permission = await Geolocator.checkPermission();
  
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  
  return permission == LocationPermission.always || 
         permission == LocationPermission.whileInUse;
}
```

#### 2. Get Current Location
```dart
Future<Position> getCurrentLocation() async {
  return await Geolocator.getCurrentPosition(
    desiredAccuracy: LocationAccuracy.high
  );
}
```

#### 3. Update Location to Backend
```dart
Future<void> updateLocationToBackend(Position position) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/radar/update-location'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'latitude': position.latitude,
      'longitude': position.longitude,
      'accuracy': position.accuracy,
    }),
  );
  
  if (response.statusCode == 200) {
    print('Location updated successfully');
  } else if (response.statusCode == 429) {
    print('Rate limit: Please wait before updating again');
  }
}
```

#### 4. Get Nearby Users
```dart
Future<List<User>> getNearbyUsers(double lat, double lon, int radius) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/radar/locations?latitude=$lat&longitude=$lon&radius=$radius'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data'] as List)
      .map((json) => User.fromJson(json))
      .toList();
  }
  
  return [];
}
```

#### 5. Display on Map (Google Maps)
```dart
import 'package:google_maps_flutter/google_maps_flutter.dart';

Set<Marker> createMarkers(List<User> users) {
  return users.map((user) {
    return Marker(
      markerId: MarkerId('user_${user.userId}'),
      position: LatLng(user.latitude, user.longitude),
      infoWindow: InfoWindow(
        title: user.name,
        snippet: '${user.role} • ${user.distance.toStringAsFixed(2)} km',
      ),
      icon: user.role == 'kader' 
        ? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange)
        : BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
    );
  }).toSet();
}

// In your widget
GoogleMap(
  initialCameraPosition: CameraPosition(
    target: LatLng(currentLat, currentLon),
    zoom: 14,
  ),
  markers: createMarkers(nearbyUsers),
  myLocationEnabled: true,
  myLocationButtonEnabled: true,
)
```

#### 6. Implement Privacy Toggle
```dart
Future<void> toggleLocationSharing(bool enabled) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/radar/toggle-sharing'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'enabled': enabled}),
  );
  
  if (response.statusCode == 200) {
    setState(() {
      isSharingEnabled = enabled;
    });
  }
}

// In your widget
SwitchListTile(
  title: Text('Share My Location'),
  subtitle: Text('Allow others to see my location'),
  value: isSharingEnabled,
  onChanged: (value) => toggleLocationSharing(value),
)
```

---

## 📊 Performance Considerations

### Database Optimization
- **Indexes** on frequently queried columns:
  - `user_locations.userId` (unique)
  - `user_locations.isSharingEnabled`
  - `user_locations.lastUpdate`
  - `location_history.userId`
  - `location_history.timestamp`

### Query Optimization
- Limit results to 100 users maximum
- Filter inactive users (lastUpdate > 24 hours ago)
- Use distance calculation only after basic filters

### Caching Strategy (Future)
- Cache user locations for 1 minute
- Cache statistics for 5 minutes
- Use Redis for distributed caching

### Load Testing Recommendations
- Test with 1000+ concurrent users
- Monitor database query times
- Check memory usage during peak hours
- Profile slow queries with `EXPLAIN ANALYZE`

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Endpoint returns 404"
**Cause:** Routes not registered  
**Solution:** Verify `src/app.js` has `app.use('/api/radar', radarRoutes)`

#### 2. "Invalid role enum value"
**Cause:** Prisma client not regenerated after enum change  
**Solution:** 
```bash
npx prisma generate
# Restart server
```

#### 3. "Rate limit exceeded"
**Cause:** Updating location too frequently  
**Solution:** Wait 60 seconds between updates

#### 4. "No locations returned"
**Cause:** No users sharing within radius OR role filtering  
**Solution:** 
- Increase radius
- Verify users have sharing enabled
- Check your role (simpatisan only sees simpatisan)

#### 5. "Cron job not running"
**Cause:** Server timezone misconfigured  
**Solution:**
```bash
# Check server timezone
date
# Or
timedatectl

# Cron runs at 2 AM in server's timezone
```

---

## 📚 Additional Resources

### Documentation
- **API Reference:** `docs/RADAR_API_DOCUMENTATION.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE_RADAR.md`
- **Changelog:** `CHANGELOG_RADAR_FEATURE.md`
- **DevOps Template:** `DEVOPS_NOTIFICATION_TEMPLATE.md`

### Code Examples
- **cURL Examples:** See API documentation
- **Flutter Examples:** See this file (Quick Start section)
- **Postman Collection:** `postman/mygeri-REST-API.postman_collection.json`

### External Libraries
- **Haversine Formula:** https://en.wikipedia.org/wiki/Haversine_formula
- **node-cron:** https://github.com/node-cron/node-cron
- **Geolocator (Flutter):** https://pub.dev/packages/geolocator
- **Google Maps Flutter:** https://pub.dev/packages/google_maps_flutter

---

## 🤝 Contributing

### Code Style
- Use ESLint configuration
- Follow Airbnb JavaScript Style Guide
- Add JSDoc comments to functions
- Write descriptive commit messages

### Pull Request Process
1. Create feature branch: `git checkout -b feature/radar-enhancement`
2. Make changes and test thoroughly
3. Update documentation if needed
4. Commit with clear messages
5. Push and create PR to `heri01` branch

### Reporting Issues
Include:
- Steps to reproduce
- Expected vs actual behavior
- Server logs (if applicable)
- API request/response examples

---

## 📄 License

This feature is part of MyGery Backend API project.  
© 2026 MyGery Team. All rights reserved.

---

## 📞 Support

- **Backend Team:** backend@mygery.com
- **DevOps Team:** devops@mygery.com
- **Documentation Issues:** Create GitHub issue
- **API Questions:** Refer to API documentation

---

**Version:** 1.0.0  
**Last Updated:** January 8, 2026  
**Status:** Production Ready ✅
