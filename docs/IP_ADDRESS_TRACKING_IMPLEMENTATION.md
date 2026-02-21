# 📍 IP Address Tracking - Implementation Guide

**Date:** February 12, 2026  
**For:** Admin Web Panel (Vue.js) & Mobile App (Flutter)  
**Purpose:** Implementasi tracking IP address saat login untuk sistem blocking

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Backend Requirements](#backend-requirements)
3. [Frontend Web Implementation (Vue.js)](#frontend-web-implementation-vuejs)
4. [Mobile App Implementation (Flutter)](#mobile-app-implementation-flutter)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Kenapa Perlu Tracking IP Address?

1. **Security:** Monitor aktivitas mencurigakan dari IP tertentu
2. **Blocking System:** Admin dapat block user berdasarkan IP
3. **Audit Trail:** Tracking dari mana user melakukan login
4. **Analytics:** Melihat distribusi geografis user

### Flow Diagram

```
┌─────────────────┐
│   User Login    │
│  (Web/Mobile)   │
└────────┬────────┘
         │
         │ 1. Get User's IP
         │    (Client-side)
         ▼
┌─────────────────┐
│  POST /login    │
│  {              │
│    identifier,  │
│    password,    │
│    deviceIp ←── │ 🔑 Send IP here
│  }              │
└────────┬────────┘
         │
         │ 2. Backend saves IP
         ▼
┌─────────────────┐
│  Database       │
│  user.deviceIp  │
│  = "10.0.0.1"   │
└─────────────────┘
```

### ⚠️ PENTING: Kapan IP Harus Dikirim?

**✅ HARUS mengirim `deviceIp` di:**
- Login (POST /api/auth/login)
- Register (POST /api/auth/register)
- Refresh token (POST /api/auth/refresh)
- Update profile (PUT /api/users/profile)

**❌ TIDAK PERLU mengirim `deviceIp` di:**
- Get data (GET requests)
- Voting
- Posting
- Messaging

---

## Backend Requirements

### API Endpoint: Login

**Endpoint:**
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "password123",
  "deviceIp": "192.168.1.100"  // 🔑 NEW: Optional field
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "user@example.com",
      "deviceIp": "192.168.1.100"  // ✅ IP saved
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "38d741...",
    "expiresIn": "1d"
  }
}
```

### Backend Implementation Status

✅ **Backend sudah support `deviceIp` field**
- Field `deviceIp` sudah ada di database (table `users`)
- Backend akan save IP jika dikirim dari frontend
- Jika tidak dikirim, field akan `null` (optional)

---

## Frontend Web Implementation (Vue.js)

### 1. Get User IP Address (Client-Side)

Ada 2 cara mendapatkan IP user:

#### Option A: Using External API (Recommended for Web)

```javascript
// utils/ipDetector.js

/**
 * Get user's public IP address
 * Uses ipify API (free, no auth required)
 */
export async function getUserIP() {
  try {
    // Method 1: ipify (recommended)
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP from ipify:', error);
    
    try {
      // Method 2: Fallback to ipapi
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return data.ip;
    } catch (fallbackError) {
      console.error('Failed to get IP from ipapi:', fallbackError);
      
      // Method 3: Fallback to local IP (if in same network)
      return getLocalIP();
    }
  }
}

/**
 * Get local IP address (for development/same network)
 */
function getLocalIP() {
  try {
    // This only works if backend and frontend are in same network
    return window.location.hostname;
  } catch (error) {
    return null;
  }
}

/**
 * Cache IP to avoid multiple API calls
 */
let cachedIP = null;

export async function getCachedIP() {
  if (cachedIP) {
    return cachedIP;
  }
  
  cachedIP = await getUserIP();
  return cachedIP;
}
```

#### Option B: Get from Backend (Alternative)

```javascript
// Backend can detect client IP from request headers
// Create endpoint: GET /api/auth/my-ip

export async function getIPFromBackend() {
  try {
    const response = await axios.get('/api/auth/my-ip');
    return response.data.ip;
  } catch (error) {
    console.error('Failed to get IP from backend:', error);
    return null;
  }
}
```

### 2. Update Auth Store

Update auth store untuk include IP saat login:

```javascript
// stores/auth.js
import { defineStore } from 'pinia';
import axios from 'axios';
import { getCachedIP } from '@/utils/ipDetector';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
  }),

  actions: {
    async login(credentials) {
      try {
        // 🔑 Get user's IP address
        const deviceIp = await getCachedIP();
        
        console.log('Login with IP:', deviceIp); // For debugging

        const response = await axios.post(
          'http://localhost:3030/api/auth/login',
          {
            identifier: credentials.identifier,
            password: credentials.password,
            deviceIp: deviceIp  // 🔑 Send IP to backend
          }
        );

        const { user, accessToken, refreshToken } = response.data.data;

        // Save to state
        this.user = user;
        this.token = accessToken;
        this.refreshToken = refreshToken;

        // Save to localStorage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        return { success: true };
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.response) {
          return {
            success: false,
            message: error.response.data.message || 'Login failed',
          };
        }
        
        return {
          success: false,
          message: 'Network error. Please try again.',
        };
      }
    },

    async register(userData) {
      try {
        // 🔑 Get user's IP address
        const deviceIp = await getCachedIP();

        const response = await axios.post(
          'http://localhost:3030/api/auth/register',
          {
            ...userData,
            deviceIp: deviceIp  // 🔑 Send IP to backend
          }
        );

        return { success: true, data: response.data };
      } catch (error) {
        console.error('Register error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Registration failed',
        };
      }
    },

    async updateProfile(profileData) {
      try {
        // 🔑 Get current IP (in case user changed network)
        const deviceIp = await getCachedIP();

        const response = await axios.put(
          '/api/users/profile',
          {
            ...profileData,
            deviceIp: deviceIp  // 🔑 Update IP
          }
        );

        // Update user in state
        this.user = response.data.data;
        localStorage.setItem('user', JSON.stringify(this.user));

        return { success: true };
      } catch (error) {
        console.error('Update profile error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Update failed',
        };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      delete axios.defaults.headers.common['Authorization'];
    },
  },
});
```

### 3. Update Login Component

```vue
<!-- views/Login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Admin Panel</h1>
        <p>Silakan login untuk melanjutkan</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.identifier"
            type="email"
            placeholder="admin@example.com"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
        </div>

        <!-- 🔍 Show detected IP (optional - for debugging) -->
        <div v-if="detectedIP" class="detected-ip">
          <small>📍 Your IP: {{ detectedIP }}</small>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button 
          type="submit" 
          class="btn-login"
          :disabled="loading"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getCachedIP } from '@/utils/ipDetector';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  identifier: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');
const detectedIP = ref('');

// 🔑 Detect IP on component mount
onMounted(async () => {
  try {
    detectedIP.value = await getCachedIP();
    console.log('Detected IP:', detectedIP.value);
  } catch (error) {
    console.error('Failed to detect IP:', error);
  }
});

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await authStore.login(form.value);

    if (result.success) {
      if (authStore.isAdmin) {
        router.push('/dashboard');
      } else {
        errorMessage.value = 'Access denied. Admin role required.';
        authStore.logout();
      }
    } else {
      errorMessage.value = result.message;
    }
  } catch (error) {
    errorMessage.value = 'An error occurred. Please try again.';
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ...existing styles... */

.detected-ip {
  padding: 8px 12px;
  background: #edf2f7;
  border-radius: 6px;
  text-align: center;
  font-family: 'Monaco', monospace;
}

.detected-ip small {
  color: #4a5568;
  font-size: 12px;
}
</style>
```

### 4. Environment Configuration

```javascript
// .env
VITE_API_BASE_URL=http://localhost:3030/api
VITE_IP_API_URL=https://api.ipify.org?format=json

// config/api.js
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  ipApiURL: import.meta.env.VITE_IP_API_URL,
};
```

---

## Mobile App Implementation (Flutter)

### 1. Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  dio: ^5.4.0
  shared_preferences: ^2.2.2
  network_info_plus: ^5.0.0  # For getting local IP
```

### 2. Create IP Detector Service

```dart
// lib/services/ip_detector_service.dart

import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:network_info_plus/network_info_plus.dart';

class IPDetectorService {
  static String? _cachedIP;

  /// Get user's public IP address
  static Future<String?> getUserIP() async {
    // Return cached IP if available
    if (_cachedIP != null) {
      return _cachedIP;
    }

    try {
      // Method 1: Using ipify API
      final response = await http.get(
        Uri.parse('https://api.ipify.org?format=json'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _cachedIP = data['ip'];
        print('✅ Public IP detected: $_cachedIP');
        return _cachedIP;
      }
    } catch (e) {
      print('⚠️ Failed to get public IP from ipify: $e');
    }

    try {
      // Method 2: Fallback to ipapi
      final response = await http.get(
        Uri.parse('https://ipapi.co/json/'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _cachedIP = data['ip'];
        print('✅ Public IP detected (fallback): $_cachedIP');
        return _cachedIP;
      }
    } catch (e) {
      print('⚠️ Failed to get public IP from ipapi: $e');
    }

    // Method 3: Get local WiFi IP (for same network)
    try {
      final info = NetworkInfo();
      final wifiIP = await info.getWifiIP();
      if (wifiIP != null) {
        _cachedIP = wifiIP;
        print('✅ Local WiFi IP detected: $_cachedIP');
        return _cachedIP;
      }
    } catch (e) {
      print('⚠️ Failed to get WiFi IP: $e');
    }

    print('❌ Failed to detect any IP address');
    return null;
  }

  /// Clear cached IP (call when network changes)
  static void clearCache() {
    _cachedIP = null;
    print('🔄 IP cache cleared');
  }

  /// Get IP with retry logic
  static Future<String?> getUserIPWithRetry({int maxRetries = 3}) async {
    for (int i = 0; i < maxRetries; i++) {
      final ip = await getUserIP();
      if (ip != null) {
        return ip;
      }
      
      if (i < maxRetries - 1) {
        print('🔄 Retrying IP detection... (${i + 1}/$maxRetries)');
        await Future.delayed(Duration(seconds: 2));
      }
    }
    
    return null;
  }
}
```

### 3. Update Auth Service

```dart
// lib/services/auth_service.dart

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'ip_detector_service.dart';

class AuthService {
  final Dio _dio;
  final String baseUrl;

  AuthService({required this.baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ));

  /// Login with IP tracking
  Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
  }) async {
    try {
      // 🔑 Get user's IP address
      final deviceIp = await IPDetectorService.getUserIP();
      
      print('📍 Logging in with IP: $deviceIp');

      final response = await _dio.post(
        '/auth/login',
        data: {
          'identifier': identifier,
          'password': password,
          'deviceIp': deviceIp, // 🔑 Send IP to backend
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        
        // Save tokens
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('accessToken', data['accessToken']);
        await prefs.setString('refreshToken', data['refreshToken']);
        await prefs.setString('user', json.encode(data['user']));
        
        // Save detected IP for reference
        if (deviceIp != null) {
          await prefs.setString('lastKnownIP', deviceIp);
        }

        print('✅ Login successful. IP saved: ${data['user']['deviceIp']}');

        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Login failed',
        };
      }
    } on DioException catch (e) {
      print('❌ Login error: ${e.message}');
      
      if (e.response != null) {
        return {
          'success': false,
          'message': e.response?.data['message'] ?? 'Login failed',
        };
      }
      
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  /// Register with IP tracking
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? username,
    String? phone,
  }) async {
    try {
      // 🔑 Get user's IP address
      final deviceIp = await IPDetectorService.getUserIP();

      final response = await _dio.post(
        '/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'username': username,
          'phone': phone,
          'deviceIp': deviceIp, // 🔑 Send IP to backend
        },
      );

      if (response.statusCode == 201 && response.data['success']) {
        print('✅ Registration successful with IP: $deviceIp');
        return {
          'success': true,
          'data': response.data['data'],
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Registration failed',
        };
      }
    } on DioException catch (e) {
      print('❌ Registration error: ${e.message}');
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Registration failed',
      };
    }
  }

  /// Update profile with IP tracking
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> profileData) async {
    try {
      // 🔑 Get current IP (user might have changed network)
      final deviceIp = await IPDetectorService.getUserIP();

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');

      final response = await _dio.put(
        '/users/profile',
        data: {
          ...profileData,
          'deviceIp': deviceIp, // 🔑 Update IP
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200 && response.data['success']) {
        // Update stored user data
        await prefs.setString('user', json.encode(response.data['data']));
        
        print('✅ Profile updated with new IP: $deviceIp');

        return {
          'success': true,
          'data': response.data['data'],
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Update failed',
        };
      }
    } on DioException catch (e) {
      print('❌ Update profile error: ${e.message}');
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Update failed',
      };
    }
  }

  /// Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');
    
    // Clear IP cache
    IPDetectorService.clearCache();
    
    print('✅ Logged out and IP cache cleared');
  }
}
```

### 4. Update Login Screen

```dart
// lib/screens/login_screen.dart

import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/ip_detector_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isLoading = false;
  String? _errorMessage;
  String? _detectedIP;

  late AuthService _authService;

  @override
  void initState() {
    super.initState();
    _authService = AuthService(baseUrl: 'http://localhost:3030/api');
    
    // 🔑 Detect IP on screen load
    _detectIP();
  }

  /// Detect user's IP address
  Future<void> _detectIP() async {
    try {
      final ip = await IPDetectorService.getUserIP();
      setState(() {
        _detectedIP = ip;
      });
      print('📍 IP detected: $ip');
    } catch (e) {
      print('⚠️ Failed to detect IP: $e');
    }
  }

  /// Handle login
  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _authService.login(
        identifier: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (result['success']) {
        // Navigate to home screen
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      } else {
        setState(() {
          _errorMessage = result['message'];
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An error occurred. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Icon(
                    Icons.account_circle,
                    size: 100,
                    color: Theme.of(context).primaryColor,
                  ),
                  const SizedBox(height: 24),

                  // Title
                  Text(
                    'Welcome Back',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Login to continue',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 32),

                  // 🔍 Show detected IP (for debugging)
                  if (_detectedIP != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.location_on, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'Your IP: $_detectedIP',
                            style: const TextStyle(
                              fontSize: 12,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),

                  // Email field
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.email),
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your email';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      prefixIcon: Icon(Icons.lock),
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Error message
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error, color: Colors.red),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Login button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Login'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

### 5. Monitor Network Changes

```dart
// lib/services/network_monitor.dart

import 'package:connectivity_plus/connectivity_plus.dart';
import 'ip_detector_service.dart';

class NetworkMonitor {
  static void initialize() {
    Connectivity().onConnectivityChanged.listen((ConnectivityResult result) {
      if (result != ConnectivityResult.none) {
        print('🔄 Network changed, clearing IP cache');
        IPDetectorService.clearCache();
      }
    });
  }
}

// Call in main.dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  NetworkMonitor.initialize();
  runApp(MyApp());
}
```

---

## Testing & Validation

### 1. Test Login dengan IP (Web)

```javascript
// Browser Console Test
async function testLogin() {
  // Get IP
  const ipResponse = await fetch('https://api.ipify.org?format=json');
  const ipData = await ipResponse.json();
  console.log('My IP:', ipData.ip);

  // Login with IP
  const loginResponse = await fetch('http://localhost:3030/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@example.com',
      password: 'Admin123!',
      deviceIp: ipData.ip
    })
  });

  const loginData = await loginResponse.json();
  console.log('Login response:', loginData);
  console.log('IP saved in backend:', loginData.data.user.deviceIp);
}

testLogin();
```

### 2. Test dengan cURL

```bash
# Get your public IP
MY_IP=$(curl -s https://api.ipify.org)
echo "My IP: $MY_IP"

# Login with IP
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"identifier\": \"admin@example.com\",
    \"password\": \"Admin123!\",
    \"deviceIp\": \"$MY_IP\"
  }"
```

### 3. Verify IP Saved in Database

```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Check active IPs
curl -X GET "http://localhost:3030/api/admin/active-ips" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Test Network Change Scenario

**Scenario:** User pindah dari WiFi ke Mobile Data

```javascript
// Simulate network change
localStorage.removeItem('cachedIP');

// Try to get new IP
const newIP = await getCachedIP();
console.log('New IP after network change:', newIP);

// Login again (will use new IP)
await authStore.login({ identifier: '...', password: '...' });
```

---

## Troubleshooting

### Problem 1: IP Detection Failed

**Symptoms:**
- `deviceIp` is `null` in backend
- Console shows: "Failed to get IP"

**Solutions:**

1. **Check Internet Connection**
```javascript
// Test if ipify API is accessible
fetch('https://api.ipify.org?format=json')
  .then(res => res.json())
  .then(data => console.log('IP:', data.ip))
  .catch(err => console.error('Failed:', err));
```

2. **Use Fallback Methods**
```javascript
// Try multiple services
const ipServices = [
  'https://api.ipify.org?format=json',
  'https://ipapi.co/json/',
  'https://api.my-ip.io/ip.json'
];

for (const service of ipServices) {
  try {
    const response = await fetch(service);
    const data = await response.json();
    return data.ip;
  } catch (error) {
    continue; // Try next service
  }
}
```

3. **Allow Manual Entry**
```vue
<template>
  <div v-if="!detectedIP" class="manual-ip-entry">
    <input
      v-model="manualIP"
      placeholder="Enter your IP manually (optional)"
      type="text"
    />
  </div>
</template>
```

### Problem 2: CORS Error

**Symptoms:**
- Browser console: "CORS policy blocked"
- IP detection works, but can't send to backend

**Solution:**

Backend must allow CORS:
```javascript
// Backend: src/app.js
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',  // Vue dev server
    'http://localhost:3000',  // Alternative port
    'https://admin.mygerindra.com'  // Production
  ],
  credentials: true
}));
```

### Problem 3: IP Shows as `null` in Database

**Symptoms:**
- Login successful but `user.deviceIp` is `null`

**Debug Steps:**

1. **Check if IP is sent from frontend**
```javascript
// Add console.log before sending
console.log('Sending login data:', {
  identifier: credentials.identifier,
  deviceIp: deviceIp  // Should not be null
});
```

2. **Check backend logs**
```javascript
// Backend: auth.controller.js
console.log('Received login data:', req.body);
// Should show: { identifier: '...', password: '...', deviceIp: '...' }
```

3. **Check backend saves IP**
```javascript
// Backend: auth.service.js
const user = await prisma.user.update({
  where: { id: userId },
  data: {
    deviceIp: deviceIp  // Make sure this is included
  }
});
console.log('User IP saved:', user.deviceIp);
```

### Problem 4: IP Not Updated After Network Change

**Solution:**

Clear IP cache when network changes:

**Vue.js:**
```javascript
// Listen for online/offline events
window.addEventListener('online', () => {
  localStorage.removeItem('cachedIP');
  console.log('Network reconnected, IP cache cleared');
});
```

**Flutter:**
```dart
// Use connectivity_plus package
Connectivity().onConnectivityChanged.listen((result) {
  if (result != ConnectivityResult.none) {
    IPDetectorService.clearCache();
  }
});
```

### Problem 5: Same IP for Multiple Users

**This is normal!** Multiple users can share same IP if:
- Using same WiFi network
- Behind same router/NAT
- Using same VPN
- In same office/home

**Backend handling:**
```javascript
// Multiple users with same IP is allowed
// Only block specific user, not all users with that IP
await prisma.user.update({
  where: { id: userId },  // Block specific user
  data: {
    isBlocked: true,
    blockReason: 'Violating terms'
  }
});
```

---

## Summary Checklist

### ✅ Frontend Web (Vue.js)

- [ ] Install `ipDetector.js` utility
- [ ] Update `auth.js` store untuk send `deviceIp`
- [ ] Update login component untuk detect IP
- [ ] Test login dengan IP
- [ ] Verify IP saved in backend

### ✅ Mobile App (Flutter)

- [ ] Add `network_info_plus` dependency
- [ ] Create `ip_detector_service.dart`
- [ ] Update `auth_service.dart` untuk send `deviceIp`
- [ ] Update login screen
- [ ] Add network change monitoring
- [ ] Test login dengan IP

### ✅ Backend (Already Done)

- [x] `deviceIp` field exists in database
- [x] Backend accepts `deviceIp` in login/register
- [x] Backend saves IP to user record
- [x] Admin can see active IPs via `/api/admin/active-ips`

### ✅ Testing

- [ ] Test IP detection works
- [ ] Test login saves IP correctly
- [ ] Test admin can see IP list
- [ ] Test network change scenario
- [ ] Test blocking by IP

---

## Quick Reference

### Get IP (Web)
```javascript
import { getCachedIP } from '@/utils/ipDetector';
const ip = await getCachedIP();
```

### Get IP (Flutter)
```dart
import 'package:your_app/services/ip_detector_service.dart';
final ip = await IPDetectorService.getUserIP();
```

### Send IP on Login (Web)
```javascript
await authStore.login({
  identifier: email,
  password: password,
  // deviceIp will be automatically added by auth store
});
```

### Send IP on Login (Flutter)
```dart
await authService.login(
  identifier: email,
  password: password,
  // deviceIp will be automatically added by auth service
);
```

### Check Active IPs (Admin)
```bash
curl -X GET "http://localhost:3030/api/admin/active-ips" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

**Last Updated:** February 12, 2026  
**Status:** ✅ Implementation Guide Complete  
**Backend Support:** ✅ Ready  
**Documentation:** ✅ Complete

---

## Need Help?

1. Check backend is running: `http://localhost:3030/health`
2. Check IP detection: Open browser console and run `await getCachedIP()`
3. Check CORS: Make sure backend allows your frontend URL
4. Check database: Verify `deviceIp` column exists in `users` table
5. Check logs: Look for IP-related logs in backend console

**Related Documentation:**
- `AUTO_SUGGEST_ENDPOINTS.md` - Auto-suggest dropdown implementation
- `ADMIN_WEB_LOGIN_DOCUMENTATION.md` - Login implementation guide
- `DEVELOPMENT_SETUP.md` - Development environment setup
