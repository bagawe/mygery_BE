# 📍 Radar Location Tracking API Documentation

## Overview
API untuk fitur pelacakan lokasi real-time dengan role-based filtering, privacy controls, dan auto-cleanup. Sistem ini memungkinkan user untuk berbagi lokasi mereka dan melihat lokasi user lain berdasarkan role mereka.

**Base URL:** `http://your-domain.com/api/radar`

---

## 🔐 Authentication
Semua endpoint memerlukan authentication token JWT di header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Endpoints

### 1. Get My Location Status
Mendapatkan status location sharing dan lokasi terakhir user yang sedang login.

**Endpoint:** `GET /api/radar/my-status`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Status retrieved successfully",
  "data": {
    "is_sharing_enabled": false,
    "latitude": null,
    "longitude": null,
    "accuracy": null,
    "last_update": null
  }
}
```

**Response Success (200) - When location exists:**
```json
{
  "success": true,
  "message": "Status retrieved successfully",
  "data": {
    "is_sharing_enabled": true,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5,
    "last_update": "2026-01-08T04:49:31.226Z"
  }
}
```

---

### 2. Toggle Location Sharing
Mengaktifkan atau menonaktifkan sharing lokasi.

**Endpoint:** `POST /api/radar/toggle-sharing`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "enabled": true
}
```

**Field Descriptions:**
- `enabled` (boolean, required): `true` untuk enable, `false` untuk disable

**Response Success (200):**
```json
{
  "success": true,
  "message": "Location sharing enabled",
  "data": {
    "is_sharing_enabled": true
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "enabled must be a boolean"
}
```

---

### 3. Update Location
Mengupdate lokasi user saat ini. **Rate limited: 1 update per minute.**

**Endpoint:** `POST /api/radar/update-location`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5
}
```

**Field Descriptions:**
- `latitude` (number, required): Koordinat lintang (-90 to 90)
- `longitude` (number, required): Koordinat bujur (-180 to 180)
- `accuracy` (number, optional): Akurasi dalam meter

**Response Success (200):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "last_update": "2026-01-08T04:47:10.505Z"
  }
}
```

**Response Error (400) - Invalid Coordinates:**
```json
{
  "success": false,
  "message": "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180"
}
```

**Response Error (403) - Sharing Disabled:**
```json
{
  "success": false,
  "message": "Location sharing is disabled"
}
```

**Response Error (429) - Rate Limited:**
```json
{
  "success": false,
  "message": "Please wait before updating location again"
}
```

---

### 4. Get Nearby Locations
Mendapatkan daftar lokasi user lain dalam radius tertentu dengan role-based filtering.

**Endpoint:** `GET /api/radar/locations`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | number | Optional* | Koordinat lintang untuk center point |
| `longitude` | number | Optional* | Koordinat bujur untuk center point |
| `radius` | number | Optional | Radius pencarian dalam kilometer (default: semua) |
| `region` | string | Optional | Filter berdasarkan provinsi (ex: "DKI Jakarta") |
| `jabatan` | string | Optional | Filter berdasarkan pekerjaan |
| `limit` | number | Optional | Maksimal hasil (default: 100) |

*Note: `latitude` dan `longitude` harus ada berdua atau tidak sama sekali untuk radius filtering.

**Example Request:**
```
GET /api/radar/locations?latitude=-6.2088&longitude=106.8456&radius=5
GET /api/radar/locations?region=DKI Jakarta
GET /api/radar/locations?latitude=-6.2088&longitude=106.8456&radius=10&limit=50
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": [
    {
      "id": 3,
      "latitude": -6.2105,
      "longitude": 106.8456,
      "distance": 0.19,
      "last_update": "2026-01-08T04:30:00.000Z",
      "user": {
        "id": 5,
        "name": "John Doe",
        "fotoProfil": "https://example.com/profile.jpg",
        "pekerjaan": "Software Engineer",
        "provinsi": "DKI Jakarta",
        "roles": [
          {
            "role": "jobseeker"
          }
        ]
      }
    },
    {
      "id": 4,
      "latitude": -6.2095,
      "longitude": 106.8460,
      "distance": 0.35,
      "last_update": "2026-01-08T04:25:00.000Z",
      "user": {
        "id": 7,
        "name": "Jane Smith",
        "fotoProfil": null,
        "pekerjaan": "Marketing Manager",
        "provinsi": "DKI Jakarta",
        "roles": [
          {
            "role": "company"
          }
        ]
      }
    }
  ],
  "total": 2,
  "filters": {
    "region": null,
    "jabatan": null,
    "radius": 5
  }
}
```

**Response Success (200) - No Results:**
```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": [],
  "total": 0,
  "filters": {
    "region": null,
    "jabatan": null,
    "radius": 5
  }
}
```

---

### 5. Get Location History (Admin Only)
Mendapatkan riwayat lokasi user tertentu. **Hanya untuk admin.**

**Endpoint:** `GET /api/radar/admin/location-history`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | number | Yes | ID user yang ingin dilihat history-nya |
| `startDate` | string | Optional | Tanggal mulai (ISO 8601 format) |
| `endDate` | string | Optional | Tanggal akhir (ISO 8601 format) |
| `limit` | number | Optional | Maksimal hasil (default: 100) |

**Example Request:**
```
GET /api/radar/admin/location-history?userId=5
GET /api/radar/admin/location-history?userId=5&startDate=2026-01-01&endDate=2026-01-08
GET /api/radar/admin/location-history?userId=5&limit=50
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Location history retrieved successfully",
  "data": {
    "userId": 5,
    "userName": "John Doe",
    "history": [
      {
        "id": 123,
        "latitude": -6.2088,
        "longitude": 106.8456,
        "accuracy": 10.5,
        "timestamp": "2026-01-08T04:30:00.000Z"
      },
      {
        "id": 122,
        "latitude": -6.2090,
        "longitude": 106.8450,
        "accuracy": 12.3,
        "timestamp": "2026-01-08T04:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

**Response Error (403) - Not Admin:**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

**Response Error (400) - Missing userId:**
```json
{
  "success": false,
  "message": "userId is required"
}
```

---

### 6. Get Location Statistics (Admin Only)
Mendapatkan statistik umum location tracking. **Hanya untuk admin.**

**Endpoint:** `GET /api/radar/admin/stats`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total_users_with_location": 45,
    "total_sharing_enabled": 32,
    "total_locations_last_24h": 156,
    "total_location_history_records": 1234,
    "active_users_last_hour": 12,
    "regions": [
      {
        "provinsi": "DKI Jakarta",
        "count": 25
      },
      {
        "provinsi": "Jawa Barat",
        "count": 12
      }
    ]
  }
}
```

**Response Error (403) - Not Admin:**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## 🎯 Role-Based Filtering Rules

Location visibility berdasarkan role user:

| User Role | Can See |
|-----------|---------|
| **jobseeker** | Hanya jobseeker lain |
| **company** | Company + jobseeker |
| **admin** | Semua user (no filter) |

### Contoh Skenario:
1. User A (jobseeker) hanya akan melihat lokasi dari user lain yang juga jobseeker
2. User B (company) akan melihat lokasi dari company lain DAN jobseeker
3. User C (admin) akan melihat lokasi semua user tanpa batasan

---

## ⚙️ System Features

### Rate Limiting
- **Update Location:** Maximum 1 update per menit per user
- Purpose: Mencegah spam dan menghemat resource server

### Privacy Control
- User dapat enable/disable location sharing kapan saja
- Ketika disabled, lokasi tidak akan ditampilkan ke user lain
- Update lokasi tidak bisa dilakukan jika sharing disabled

### Auto-Cleanup
- **Schedule:** Daily at 2:00 AM server time
- **Action:** Menghapus location history yang lebih dari 30 hari
- **Affected:** Hanya table `location_history`, tidak mempengaruhi current location

### Data Retention
- **Current Location (`user_locations`):** Permanent (sampai user hapus atau update)
- **Location History (`location_history`):** 30 hari (auto-deleted)

### Distance Calculation
- Menggunakan **Haversine formula** untuk menghitung jarak akurat
- Distance dalam response berupa kilometer dengan 2 desimal
- Sorted by distance (terdekat dulu)

### Active Location Filter
- Hanya menampilkan lokasi yang diupdate dalam **24 jam terakhir**
- Lokasi yang lebih lama dari 24 jam dianggap tidak aktif

---

## 📱 Flutter Implementation Guide

### 1. Setup Permission (pubspec.yaml)
```yaml
dependencies:
  geolocator: ^10.1.0
  permission_handler: ^11.0.1
  http: ^1.1.0
```

### 2. Request Location Permission
```dart
import 'package:geolocator/geolocator.dart';

Future<bool> requestLocationPermission() async {
  LocationPermission permission = await Geolocator.checkPermission();
  
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  
  if (permission == LocationPermission.deniedForever) {
    // Show dialog to open settings
    return false;
  }
  
  return permission == LocationPermission.whileInUse || 
         permission == LocationPermission.always;
}
```

### 3. Get Current Location
```dart
Future<Position?> getCurrentLocation() async {
  try {
    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  } catch (e) {
    print('Error getting location: $e');
    return null;
  }
}
```

### 4. API Service Example
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class RadarService {
  final String baseUrl = 'https://your-domain.com/api/radar';
  final String token;

  RadarService(this.token);

  // Toggle location sharing
  Future<Map<String, dynamic>> toggleSharing(bool enabled) async {
    final response = await http.post(
      Uri.parse('$baseUrl/toggle-sharing'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'enabled': enabled}),
    );
    return jsonDecode(response.body);
  }

  // Update location
  Future<Map<String, dynamic>> updateLocation(
    double latitude,
    double longitude,
    double accuracy,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/update-location'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
      }),
    );
    return jsonDecode(response.body);
  }

  // Get nearby locations
  Future<Map<String, dynamic>> getNearbyLocations({
    double? latitude,
    double? longitude,
    double? radius,
    String? region,
  }) async {
    final queryParams = <String, String>{};
    if (latitude != null) queryParams['latitude'] = latitude.toString();
    if (longitude != null) queryParams['longitude'] = longitude.toString();
    if (radius != null) queryParams['radius'] = radius.toString();
    if (region != null) queryParams['region'] = region;

    final uri = Uri.parse('$baseUrl/locations').replace(
      queryParameters: queryParams,
    );

    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    return jsonDecode(response.body);
  }

  // Get my status
  Future<Map<String, dynamic>> getMyStatus() async {
    final response = await http.get(
      Uri.parse('$baseUrl/my-status'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    return jsonDecode(response.body);
  }
}
```

### 5. Background Location Updates (Optional)
```dart
import 'package:workmanager/workmanager.dart';

// Setup background task
void setupBackgroundLocationUpdate() {
  Workmanager().initialize(callbackDispatcher);
  
  Workmanager().registerPeriodicTask(
    "location-update",
    "updateLocationTask",
    frequency: Duration(minutes: 15), // Minimum 15 minutes
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );
}

void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    // Get location and update to server
    // Remember: API has 1 minute rate limit
    return Future.value(true);
  });
}
```

---

## 🧪 Testing Examples

### cURL Examples

**1. Get Status:**
```bash
curl -X GET http://localhost:3030/api/radar/my-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**2. Enable Sharing:**
```bash
curl -X POST http://localhost:3030/api/radar/toggle-sharing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

**3. Update Location:**
```bash
curl -X POST http://localhost:3030/api/radar/update-location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5
  }'
```

**4. Get Nearby (5km radius):**
```bash
curl -X GET "http://localhost:3030/api/radar/locations?latitude=-6.2088&longitude=106.8456&radius=5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## ⚠️ Error Codes & Messages

| Status Code | Message | Description |
|-------------|---------|-------------|
| 200 | Success | Request berhasil |
| 400 | Bad Request | Input tidak valid |
| 401 | Unauthorized | Token tidak valid atau missing |
| 403 | Forbidden | Akses ditolak (admin only atau sharing disabled) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 📊 Data Models

### UserLocation
```typescript
{
  id: number;
  userId: number;
  latitude: number; // Decimal(10,8)
  longitude: number; // Decimal(11,8)
  accuracy?: number;
  lastUpdate: Date;
  isSharingEnabled: boolean;
  createdAt: Date;
}
```

### LocationHistory
```typescript
{
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}
```

---

## 🔒 Security & Privacy

1. **Authentication Required:** Semua endpoint memerlukan valid JWT token
2. **Role-Based Access:** Filtering otomatis berdasarkan user role
3. **Privacy Control:** User dapat disable sharing kapan saja
4. **Rate Limiting:** Mencegah spam updates
5. **Data Retention:** Auto-cleanup setelah 30 hari
6. **Location Accuracy:** Server menerima accuracy dari client untuk transparency

---

## 💡 Best Practices

### Frontend Implementation:
1. **Request permission** sebelum mengakses GPS
2. **Check sharing status** sebelum update location
3. **Handle rate limit** dengan debounce/throttle
4. **Cache location data** untuk reduce API calls
5. **Update location periodically** (recommended: 5-15 menit)
6. **Show loading states** saat fetch data
7. **Handle errors gracefully** dengan user-friendly messages

### Performance Tips:
1. Gunakan **geofencing** untuk trigger updates hanya saat user pindah significant distance
2. Implement **local caching** untuk nearby locations
3. Use **pagination** jika ada banyak results (limit parameter)
4. Hanya update saat app **in foreground** untuk battery efficiency

---

## 📞 Support & Contact

Jika ada pertanyaan atau issue terkait API ini:
- Backend Team: backend@yourcompany.com
- API Documentation: https://docs.yourcompany.com/radar

---

## 📝 Changelog

### Version 1.0.0 (January 8, 2026)
- ✅ Initial release
- ✅ 6 endpoints implemented
- ✅ Role-based filtering
- ✅ Rate limiting
- ✅ Auto-cleanup scheduler
- ✅ Distance calculation
- ✅ Privacy controls

---

**Last Updated:** January 8, 2026  
**API Version:** 1.0.0  
**Status:** Production Ready ✅
