# Mobile App Configuration - Local Backend Connection

## 📱 Flutter Configuration

### 1. Create Environment Configuration

```dart
// lib/config/environment.dart
class Environment {
  static const String development = 'https://api-dev.mygeri.com';
  static const String local = 'http://10.194.183.83:3030';  // Your local IP
  static const String production = 'https://api.mygeri.com';

  // Change this to switch environments
  static String get baseUrl => local;  // Change to 'development' or 'production'
}
```

### 2. Update API Service

```dart
// lib/services/api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/environment.dart';

class ApiService {
  final String baseUrl = Environment.baseUrl;

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> updateLocation({
    required double latitude,
    required double longitude,
    bool isSavedOnly = false,
  }) async {
    final token = await getToken(); // Your token storage logic

    final response = await http.post(
      Uri.parse('$baseUrl/api/radar/location'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        'is_saved_only': isSavedOnly,
      }),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getKTAMyStatus() async {
    final token = await getToken();

    final response = await http.get(
      Uri.parse('$baseUrl/api/kta/my-status'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    return jsonDecode(response.body);
  }
}
```

### 3. Update Android Network Security (for HTTP)

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="MyGeri"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">

        <!-- Add this for local development -->
        <meta-data
            android:name="flutter_development_mode"
            android:value="true" />

    </application>

    <!-- Add this for HTTP connection -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.194.183.83</domain>
    </domain-config>
</network-security-config>
```

```xml
<!-- android/app/src/main/AndroidManifest.xml (add networkSecurityConfig) -->
<application
    android:label="MyGeri"
    android:name="${applicationName}"
    android:icon="@mipmap/ic_launcher"
    android:networkSecurityConfig="@xml/network_security_config">
```

### 4. Update iOS Info.plist

```xml
<!-- ios/Runner/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Add this for HTTP connection -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>

    <!-- Your existing keys -->
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <!-- ... -->
</dict>
</plist>
```

## 📱 React Native Configuration

### 1. Environment Configuration

```javascript
// src/config/environment.js
const environments = {
  development: 'https://api-dev.mygeri.com',
  local: 'http://10.194.183.83:3030',  // Your local IP
  production: 'https://api.mygeri.com',
};

// Change this to switch environments
export const BASE_URL = environments.local;  // Change to 'development' or 'production'
```

### 2. API Service Update

```javascript
// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/environment';

class ApiService {
  async login(email, password) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    return response.json();
  }

  async updateLocation(latitude, longitude, isSavedOnly = false) {
    const token = await AsyncStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/api/radar/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude,
        longitude,
        is_saved_only: isSavedOnly,
      }),
    });

    return response.json();
  }

  async getKTAMyStatus() {
    const token = await AsyncStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/api/kta/my-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }
}

export default new ApiService();
```

### 3. Android Network Security

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Add networkSecurityConfig -->
    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:networkSecurityConfig="@xml/network_security_config">
```

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.194.183.83</domain>
    </domain-config>
</network-security-config>
```

### 4. iOS Info.plist

```xml
<!-- ios/ProjectName/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Add this for HTTP connection -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>
</dict>
</plist>
```

## 🧪 Testing Connection

### 1. Test Health Check

```bash
# From your mobile device/simulator
curl http://10.194.183.83:3030/health
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2026-02-06T...",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. Test Login

```bash
curl -X POST http://10.194.183.83:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"simpatisan@test.com","password":"password123"}'
```

### 3. Test Radar Location

```bash
curl -X POST http://10.194.183.83:3030/api/radar/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"latitude":-6.2088,"longitude":106.8456,"is_saved_only":true}'
```

## 🔧 Troubleshooting

### Issue: Connection Refused

**Problem:** Mobile app can't connect to local backend

**Solutions:**
1. Check if backend is running: `curl http://localhost:3030/health`
2. Verify IP address hasn't changed
3. Check firewall settings
4. Ensure both devices are on same network

### Issue: Network Request Failed (React Native)

**Problem:** React Native shows network error

**Solutions:**
1. Add network security config (Android)
2. Update Info.plist (iOS)
3. Try using `http://localhost:3030` instead of IP
4. Check if Metro bundler is running

### Issue: iOS HTTP Connection Blocked

**Problem:** iOS blocks HTTP connections

**Solution:** Add to Info.plist:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

### Issue: Android Cleartext Traffic Blocked

**Problem:** Android blocks HTTP traffic

**Solution:** Create network_security_config.xml and reference it in AndroidManifest.xml

## 🔄 Switching Between Environments

### Flutter
```dart
// lib/config/environment.dart
static String get baseUrl => local;  // Change to 'development' or 'production'
```

### React Native
```javascript
// src/config/environment.js
export const BASE_URL = environments.local;  // Change to 'development' or 'production'
```

## 📊 Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | `http://10.194.183.83:3030` | Development on local machine |
| Development | `https://api-dev.mygeri.com` | Staging server |
| Production | `https://api.mygeri.com` | Live production |

## ⚠️ Security Notes

- **Never commit local IP addresses** to version control
- **Use environment variables** for sensitive configurations
- **Remove HTTP allowances** before production release
- **Use HTTPS** in production environment

## 🚀 Quick Start

1. **Update your environment config** with the local IP
2. **Configure network security** for Android/iOS
3. **Restart your mobile app**
4. **Test the connection** with health check
5. **Try login and other API calls**

---

**Local Backend URL:** `http://10.194.183.83:3030`
**Date:** February 6, 2026
