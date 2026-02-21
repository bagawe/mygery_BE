# Save Location Manual Feature - Frontend Documentation

## 📋 Overview

Fitur **Save Location Manual** memungkinkan user untuk menyimpan lokasi mereka tanpa harus mengaktifkan background location sharing. Ini memberikan fleksibilitas kepada user untuk:
- Menyimpan lokasi secara manual tanpa terlihat "online" di radar
- Tetap berbagi lokasi real-time dengan mengaktifkan background sharing

## 🎯 Use Cases

### Use Case 1: Manual Save (Offline Mode)
User ingin menyimpan lokasi mereka untuk record/history, tapi **tidak ingin** terlihat online di radar oleh user lain.

**Contoh Skenario:**
- User sedang di lokasi acara kampanye
- Ingin mencatat kehadiran mereka
- Tapi tidak ingin berbagi lokasi real-time

### Use Case 2: Background Sharing (Online Mode)
User ingin berbagi lokasi mereka secara real-time dan terlihat online di radar oleh user lain.

**Contoh Skenario:**
- Koordinator lapangan sedang bertugas
- Ingin tim bisa melihat lokasi mereka real-time
- Aktifkan background location sharing

## 🔧 API Endpoints

### 1. Update Location dengan Parameter `is_saved_only`

```http
POST /api/radar/location
Content-Type: application/json
Authorization: Bearer {token}

{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5,
  "is_saved_only": true  // ⭐ Parameter baru
}
```

#### Parameter Details

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `latitude` | Float | ✅ Yes | - | Koordinat latitude (-90 to 90) |
| `longitude` | Float | ✅ Yes | - | Koordinat longitude (-180 to 180) |
| `accuracy` | Float | ❌ No | null | Akurasi GPS dalam meter |
| `is_saved_only` | Boolean | ❌ No | false | Mode simpan manual |

#### `is_saved_only` Behavior

| Value | Sharing Status | User Visible in Radar | Description |
|-------|----------------|----------------------|-------------|
| `true` | ❌ Tidak berubah | Tetap sesuai status sebelumnya | Manual save - simpan lokasi tanpa mengaktifkan sharing |
| `false` | ✅ Aktif (`is_sharing_enabled: true`) | Ya, terlihat online | Auto enable - aktifkan background sharing |
| Not provided | ✅ Aktif (default behavior) | Ya, terlihat online | Sama seperti `false` |

#### Response Success

```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "user_id": 1,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5,
    "is_sharing_enabled": false,  // Tetap false karena is_saved_only: true
    "is_saved_location": true,    // ⭐ Flag untuk manual save
    "last_seen": "2026-01-09T10:30:00.000Z",
    "updated_at": "2026-01-09T10:30:00.000Z"
  }
}
```

#### Response Errors

**Rate Limit Error (429)**
```json
{
  "success": false,
  "message": "Please wait before updating location again",
  "retryAfter": 45  // Detik tersisa sebelum bisa update lagi
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "latitude",
      "message": "must be between -90 and 90"
    }
  ]
}
```

### 2. Get Nearby Locations (Updated Response)

```http
GET /api/radar/locations?radius=5000
Authorization: Bearer {token}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "user_id": 2,
        "name": "John Doe",
        "role": "kader",
        "latitude": -6.2100,
        "longitude": 106.8400,
        "accuracy": 15.0,
        "distance": 1234.56,
        "is_sharing_enabled": true,   // ⭐ Online status
        "is_saved_location": false,   // ⭐ Bukan manual save
        "last_seen": "2026-01-09T10:25:00.000Z"
      },
      {
        "user_id": 3,
        "name": "Jane Smith",
        "role": "simpatisan",
        "latitude": -6.2150,
        "longitude": 106.8500,
        "accuracy": 8.0,
        "distance": 2345.67,
        "is_sharing_enabled": false,  // ⭐ Offline (manual save)
        "is_saved_location": true,    // ⭐ Manual save terakhir
        "last_seen": "2026-01-09T09:45:00.000Z"
      }
    ],
    "total": 2,
    "your_location": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "is_sharing_enabled": true
    }
  }
}
```

#### Field Explanations

| Field | Description | UI Recommendation |
|-------|-------------|-------------------|
| `is_sharing_enabled` | Apakah user sedang berbagi lokasi real-time | Show "Online" badge jika `true` |
| `is_saved_location` | Apakah ini hasil manual save terakhir | Show "Last saved" indicator |
| `last_seen` | Timestamp terakhir update lokasi | Show relative time (e.g., "5 minutes ago") |

### 3. Get My Status (Updated)

```http
GET /api/radar/my-status
Authorization: Bearer {token}
```

#### Response

```json
{
  "success": true,
  "data": {
    "is_sharing_enabled": false,
    "is_saved_location": true,    // ⭐ Terakhir kali manual save
    "last_location_update": "2026-01-09T10:30:00.000Z",
    "location_history_count": 45
  }
}
```

### 4. Toggle Sharing (Existing Endpoint)

```http
POST /api/radar/toggle-sharing
Authorization: Bearer {token}

{
  "enabled": true
}
```

Endpoint ini tetap bisa digunakan untuk toggle sharing status tanpa update lokasi.

## 📱 Frontend Implementation

### Flutter Example

#### 1. Manual Save Location (Button Press)

```dart
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class LocationService {
  final String baseUrl = 'https://api.mygeri.com';
  final String token = 'your_jwt_token';

  // Manual Save - User clicks "Save My Location" button
  Future<void> saveLocationManually() async {
    try {
      // Get current location
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );

      final response = await http.post(
        Uri.parse('$baseUrl/api/radar/location'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'is_saved_only': true,  // ⭐ Manual save mode
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Location saved: ${data['data']['is_saved_location']}');
        // Show success message to user
        _showSnackbar('Lokasi berhasil disimpan');
      } else if (response.statusCode == 429) {
        final data = jsonDecode(response.body);
        _showSnackbar('Tunggu ${data['retryAfter']} detik');
      }
    } catch (e) {
      print('❌ Error: $e');
      _showSnackbar('Gagal menyimpan lokasi');
    }
  }

  // Background Sharing - Auto update every N minutes
  Future<void> updateLocationBackground() async {
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );

      final response = await http.post(
        Uri.parse('$baseUrl/api/radar/location'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'is_saved_only': false,  // ⭐ Enable sharing mode
        }),
      );

      if (response.statusCode == 200) {
        print('✅ Background location updated');
      }
    } catch (e) {
      print('❌ Background update error: $e');
    }
  }

  void _showSnackbar(String message) {
    // Implement your snackbar logic
  }
}
```

#### 2. Toggle Sharing Status

```dart
class RadarSettingsScreen extends StatefulWidget {
  @override
  _RadarSettingsScreenState createState() => _RadarSettingsScreenState();
}

class _RadarSettingsScreenState extends State<RadarSettingsScreen> {
  bool isSharingEnabled = false;
  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    _loadSharingStatus();
  }

  Future<void> _loadSharingStatus() async {
    final status = await _locationService.getMyStatus();
    setState(() {
      isSharingEnabled = status['is_sharing_enabled'];
    });
  }

  Future<void> _toggleSharing(bool enabled) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/radar/toggle-sharing'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'enabled': enabled}),
    );

    if (response.statusCode == 200) {
      setState(() {
        isSharingEnabled = enabled;
      });
      
      if (enabled) {
        // Start background location updates
        _startBackgroundLocationService();
      } else {
        // Stop background location updates
        _stopBackgroundLocationService();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Pengaturan Radar')),
      body: Column(
        children: [
          SwitchListTile(
            title: Text('Berbagi Lokasi Real-time'),
            subtitle: Text(
              isSharingEnabled 
                ? 'Lokasi Anda terlihat oleh user lain'
                : 'Lokasi Anda tidak terlihat'
            ),
            value: isSharingEnabled,
            onChanged: _toggleSharing,
          ),
          
          Divider(),
          
          ListTile(
            title: Text('Simpan Lokasi Manual'),
            subtitle: Text('Simpan lokasi tanpa aktifkan sharing'),
            trailing: ElevatedButton(
              child: Text('Simpan Sekarang'),
              onPressed: () => _locationService.saveLocationManually(),
            ),
          ),
        ],
      ),
    );
  }
}
```

#### 3. Display User Status in Map

```dart
class UserLocationMarker extends StatelessWidget {
  final Map<String, dynamic> user;

  UserLocationMarker({required this.user});

  @override
  Widget build(BuildContext context) {
    bool isOnline = user['is_sharing_enabled'];
    bool isManualSave = user['is_saved_location'];
    
    return Column(
      children: [
        Stack(
          children: [
            // User avatar
            CircleAvatar(
              radius: 20,
              backgroundImage: NetworkImage(user['avatar']),
            ),
            
            // Online indicator
            if (isOnline)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
          ],
        ),
        
        SizedBox(height: 4),
        
        // Status badge
        Container(
          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: isOnline ? Colors.green : Colors.grey,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            isOnline ? 'Online' : 'Offline',
            style: TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        
        // Last seen
        if (!isOnline)
          Text(
            _formatLastSeen(user['last_seen']),
            style: TextStyle(fontSize: 9, color: Colors.grey),
          ),
      ],
    );
  }

  String _formatLastSeen(String timestamp) {
    final lastSeen = DateTime.parse(timestamp);
    final diff = DateTime.now().difference(lastSeen);
    
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} menit lalu';
    if (diff.inHours < 24) return '${diff.inHours} jam lalu';
    return '${diff.inDays} hari lalu';
  }
}
```

### React Native Example

```javascript
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.mygeri.com';

// Manual Save Location
export const saveLocationManually = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    Geolocation.getCurrentPosition(
      async (position) => {
        const response = await fetch(`${API_BASE_URL}/api/radar/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            is_saved_only: true,  // ⭐ Manual save mode
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ Location saved:', data);
          // Show success notification
          showToast('Lokasi berhasil disimpan');
        } else if (response.status === 429) {
          showToast(`Tunggu ${data.retryAfter} detik`);
        }
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true }
    );
  } catch (error) {
    console.error('Save location error:', error);
  }
};

// Background Location Update
export const startBackgroundLocationSharing = () => {
  const watchId = Geolocation.watchPosition(
    async (position) => {
      const token = await AsyncStorage.getItem('token');
      
      await fetch(`${API_BASE_URL}/api/radar/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          is_saved_only: false,  // ⭐ Enable sharing
        }),
      });
    },
    (error) => console.error('Watch position error:', error),
    {
      enableHighAccuracy: true,
      distanceFilter: 50,  // Update every 50 meters
      interval: 60000,     // Check every 60 seconds
    }
  );

  return watchId;
};

export const stopBackgroundLocationSharing = (watchId) => {
  Geolocation.clearWatch(watchId);
};
```

## 🎨 UI/UX Recommendations

### 1. Location Settings Screen

```
┌─────────────────────────────────────┐
│  Pengaturan Lokasi                 │
├─────────────────────────────────────┤
│                                     │
│  [●] Berbagi Lokasi Real-time      │
│      Lokasi Anda terlihat oleh     │
│      user lain di radar            │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  📍 Simpan Lokasi Manual           │
│                                     │
│  Simpan lokasi saat ini tanpa      │
│  mengaktifkan berbagi real-time    │
│                                     │
│  [ Simpan Lokasi Sekarang ]        │
│                                     │
│  Terakhir disimpan:                │
│  09 Jan 2026, 10:30 WIB            │
│                                     │
└─────────────────────────────────────┘
```

### 2. Radar Map Screen

**Online User Marker:**
```
    👤
   [🟢 Online]
```

**Offline User Marker:**
```
    👤
   [⚫ 5m ago]
```

### 3. Status Indicators

| Status | Badge Color | Icon | Text |
|--------|------------|------|------|
| Online (Sharing Enabled) | 🟢 Green | • | "Online" |
| Offline (Manual Save) | ⚫ Gray | • | "5 minutes ago" |
| Never Updated | ⚪ Light Gray | - | "No location" |

## 🔐 Privacy & Permissions

### Required Permissions

**iOS (Info.plist)**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Kami memerlukan akses lokasi untuk fitur Radar</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Kami memerlukan akses lokasi di background untuk berbagi lokasi real-time</string>
```

**Android (AndroidManifest.xml)**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

### Privacy Flow

1. **First Time:**
   - Ask "When In Use" permission only
   - User can manually save location
   
2. **Enable Background Sharing:**
   - Ask "Always Allow" permission
   - Explain why background access is needed
   - User explicitly enables sharing toggle

3. **User Control:**
   - Clear toggle to enable/disable sharing
   - Manual save always available
   - Easy to see current status

## ⚠️ Important Notes

### Rate Limiting
- **Limit:** 1 update per minute per user
- **Response:** HTTP 429 with `retryAfter` in seconds
- **Recommendation:** 
  - Show countdown timer in UI
  - Disable save button during countdown
  - Background updates respect this limit

### Battery Optimization
- Manual save: No battery impact (one-time GPS read)
- Background sharing: Medium impact
- **Recommendation:**
  - Default: Manual save only
  - Let user opt-in for background sharing
  - Show battery usage warning

### Data Usage
- Each location update: ~200 bytes
- 1 update/minute = ~288 KB/day
- **Recommendation:**
  - Show data usage estimate
  - Allow configure update frequency

## 📊 Testing Checklist

- [ ] Manual save without enabling sharing
- [ ] Background sharing enables automatically
- [ ] Toggle sharing on/off
- [ ] Rate limit shows countdown
- [ ] Offline users show last seen time
- [ ] Online users show green indicator
- [ ] Location accuracy displays correctly
- [ ] Permissions handled gracefully
- [ ] Error messages user-friendly

## 🆘 Troubleshooting

### Issue: Rate Limit Error

**Problem:** User gets 429 error too frequently

**Solution:**
```dart
// Implement exponential backoff
int retryAfter = 60; // from API response

Timer(Duration(seconds: retryAfter), () {
  // Allow retry
  setState(() => canSaveLocation = true);
});
```

### Issue: Location Not Updating

**Problem:** Background updates stop working

**Solution:**
1. Check if sharing is enabled: `GET /api/radar/my-status`
2. Verify background permission granted
3. Check device battery optimization settings
4. Restart location service

### Issue: Inaccurate Location

**Problem:** GPS accuracy too low

**Solution:**
```dart
// Only send if accuracy is good
if (position.accuracy < 100) {  // meters
  await saveLocation(position);
} else {
  print('⚠️ GPS accuracy too low: ${position.accuracy}m');
}
```

## 📞 Support

Untuk pertanyaan teknis, hubungi:
- **Backend Developer:** [Contact Info]
- **API Documentation:** `/docs/RADAR_API_DOCUMENTATION.md`
- **GitHub Issues:** [Repository URL]

---

**Last Updated:** 9 Januari 2026
**API Version:** v1.0
**Feature:** Save Location Manual
