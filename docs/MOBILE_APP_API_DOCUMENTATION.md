# 📱 MOBILE APP - API DOCUMENTATION

**Target:** Flutter / React Native Mobile App  
**Date:** February 11, 2026  
**Backend Version:** v1.0.0  
**Base URL (Development):** 
- **FE di laptop yang sama dengan BE:** `http://localhost:3030/api`
- **FE di device fisik/emulator lain:** `http://[IP_LAPTOP]:3030/api`
- **Production:** `https://api.mygerindra.com/api`

> ⚠️ **PENTING:** 
> - Jika develop Flutter di laptop yang sama dengan BE → gunakan `localhost`
> - Jika test di HP fisik via USB/WiFi → gunakan IP laptop (contoh: `10.194.77.48`)
> - IP laptop akan berubah saat pindah WiFi! Gunakan environment variable.

---

## 🔐 AUTHENTICATION

### **User Login**
```dart
// Flutter Example
POST /api/auth/login

// Request
{
  "identifier": "user@example.com",  // Email or NIK
  "password": "User123!"
}

// Response (200)
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 5,
      "uuid": "cf503cab-8ad8-4b05-855d-84e7321c0752",
      "nik": "3201234567890123",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "08123456789",
      "address": "Jakarta",
      "roles": [
        { "role": "simpatisan", "isActive": true }
      ]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "38d74102cbe63ab0c09dbcbc07c47ef5...",
    "expiresIn": "1d"
  }
}
```

### **User Registration**
```dart
POST /api/auth/register

// Request
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "password": "SecurePass123!",
  "address": "Jakarta Selatan",
  "nik": "3201234567890123"  // Optional
}

// Response (201)
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 10,
      "name": "John Doe",
      "email": "john@example.com",
      "roles": [{ "role": "simpatisan" }]
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### **Flutter HTTP Client Setup**
```dart
// lib/services/api_client.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Gunakan const untuk development, ganti dengan env variable
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3030/api', // FE dan BE di laptop yang sama
  );
  
  // ATAU jika test di HP fisik, uncomment ini dan sesuaikan IP:
  // defaultValue: 'http://10.194.77.48:3030/api', // Ganti dengan IP laptop Anda
  
  static Future<Map<String, String>> _getHeaders({bool requiresAuth = false}) async {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (requiresAuth) {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    
    return headers;
  }
  
  static Future<dynamic> get(String endpoint, {bool requiresAuth = false}) async {
    final headers = await _getHeaders(requiresAuth: requiresAuth);
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
    );
    
    if (response.statusCode == 401) {
      // Token expired - redirect to login
      // Navigate to login screen
    }
    
    return json.decode(response.body);
  }
  
  static Future<dynamic> post(String endpoint, Map<String, dynamic> body, {bool requiresAuth = false}) async {
    final headers = await _getHeaders(requiresAuth: requiresAuth);
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: json.encode(body),
    );
    
    return json.decode(response.body);
  }
}
```

**Cara Run dengan Environment Variable:**
```bash
# Development - FE dan BE di laptop yang sama
flutter run --dart-define=API_BASE_URL=http://localhost:3030/api

# Development - Test di HP fisik (ganti dengan IP laptop Anda)
flutter run --dart-define=API_BASE_URL=http://10.194.77.48:3030/api

# Production
flutter run --dart-define=API_BASE_URL=https://api.mygerindra.com/api
```

---

## 📅 1. AGENDA / CALENDAR (PUBLIC ACCESS)

### **1.1 Get Monthly Calendar**
```dart
GET /api/agenda/public?month=2026-02

// Query Parameters:
// - month: YYYY-MM format (Required)

// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Rapat Koordinasi Wilayah Jakarta",
      "description": "Rapat koordinasi dengan kader wilayah Jakarta",
      "date": "2026-02-15T00:00:00.000Z",
      "time": "14:00",
      "location": "DPP Gerindra Jakarta"
    },
    {
      "id": 2,
      "title": "Bakti Sosial",
      "description": "Kegiatan bakti sosial untuk masyarakat",
      "date": "2026-02-20T00:00:00.000Z",
      "time": "09:00",
      "location": "Kelurahan Cijantung"
    }
  ],
  "count": 2
}
```

### **Flutter Calendar Widget Example**
```dart
// lib/screens/calendar_screen.dart
import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import '../services/api_client.dart';
import '../models/agenda.dart';

class CalendarScreen extends StatefulWidget {
  @override
  _CalendarScreenState createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  List<Agenda> _agendas = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadAgendas();
  }

  Future<void> _loadAgendas() async {
    setState(() => _loading = true);
    
    try {
      // Format: 2026-02
      final monthParam = '${_focusedDay.year}-${_focusedDay.month.toString().padLeft(2, '0')}';
      final response = await ApiClient.get('/agenda/public?month=$monthParam');
      
      if (response['success']) {
        setState(() {
          _agendas = (response['data'] as List)
              .map((json) => Agenda.fromJson(json))
              .toList();
        });
      }
    } catch (e) {
      print('Error loading agendas: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal memuat agenda')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  List<Agenda> _getAgendasForDay(DateTime day) {
    return _agendas.where((agenda) {
      final agendaDate = DateTime.parse(agenda.date);
      return agendaDate.year == day.year &&
             agendaDate.month == day.month &&
             agendaDate.day == day.day;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Agenda Kegiatan'),
      ),
      body: Column(
        children: [
          TableCalendar(
            firstDay: DateTime(2020),
            lastDay: DateTime(2030),
            focusedDay: _focusedDay,
            selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
            onDaySelected: (selectedDay, focusedDay) {
              setState(() {
                _selectedDay = selectedDay;
                _focusedDay = focusedDay;
              });
            },
            onPageChanged: (focusedDay) {
              setState(() {
                _focusedDay = focusedDay;
              });
              _loadAgendas(); // Load new month
            },
            eventLoader: _getAgendasForDay,
            calendarStyle: CalendarStyle(
              markersMaxCount: 3,
              markerDecoration: BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? Center(child: CircularProgressIndicator())
                : _buildAgendaList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAgendaList() {
    final selectedAgendas = _selectedDay != null
        ? _getAgendasForDay(_selectedDay!)
        : _agendas;

    if (selectedAgendas.isEmpty) {
      return Center(
        child: Text(
          'Tidak ada agenda',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      itemCount: selectedAgendas.length,
      itemBuilder: (context, index) {
        final agenda = selectedAgendas[index];
        return Card(
          margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.red,
              child: Icon(Icons.event, color: Colors.white),
            ),
            title: Text(
              agenda.title,
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 4),
                Text(agenda.description ?? ''),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16),
                    SizedBox(width: 4),
                    Text(agenda.time ?? '-'),
                    SizedBox(width: 16),
                    Icon(Icons.location_on, size: 16),
                    SizedBox(width: 4),
                    Expanded(child: Text(agenda.location ?? '-')),
                  ],
                ),
              ],
            ),
            isThreeLine: true,
          ),
        );
      },
    );
  }
}

// lib/models/agenda.dart
class Agenda {
  final int id;
  final String title;
  final String? description;
  final String date;
  final String? time;
  final String? location;

  Agenda({
    required this.id,
    required this.title,
    this.description,
    required this.date,
    this.time,
    this.location,
  });

  factory Agenda.fromJson(Map<String, dynamic> json) {
    return Agenda(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      date: json['date'],
      time: json['time'],
      location: json['location'],
    );
  }
}
```

---

## 📢 2. MY GERINDRA (PUBLIC ACCESS)

### **2.1 Get All Announcements**
```dart
GET /api/announcement/public?type=all

// Query Parameters (Optional):
// - type: sambutan | pengumuman | download | artikel | all

// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Selamat Datang di My Gerindra",
      "content": "Terima kasih telah bergabung dengan aplikasi My Gerindra...",
      "imageUrl": "https://example.com/image.jpg",
      "type": "sambutan",
      "isActive": true,
      "createdAt": "2026-02-09T09:26:13.036Z"
    },
    {
      "id": 2,
      "title": "Pengumuman Rapat Koordinasi",
      "content": "Diadakan rapat koordinasi tingkat provinsi...",
      "imageUrl": null,
      "type": "pengumuman",
      "isActive": true,
      "createdAt": "2026-02-08T14:00:00.000Z"
    }
  ],
  "count": 2
}
```

### **Flutter My Gerindra Screen Example**
```dart
// lib/screens/my_gerindra_screen.dart
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../models/announcement.dart';

class MyGerindraScreen extends StatefulWidget {
  @override
  _MyGerindraScreenState createState() => _MyGerindraScreenState();
}

class _MyGerindraScreenState extends State<MyGerindraScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, List<Announcement>> _announcementsByType = {
    'sambutan': [],
    'pengumuman': [],
    'download': [],
    'artikel': [],
  };
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAnnouncements();
  }

  Future<void> _loadAnnouncements() async {
    setState(() => _loading = true);
    
    try {
      // Load all types
      final types = ['sambutan', 'pengumuman', 'download', 'artikel'];
      
      for (var type in types) {
        final response = await ApiClient.get('/announcement/public?type=$type');
        
        if (response['success']) {
          setState(() {
            _announcementsByType[type] = (response['data'] as List)
                .map((json) => Announcement.fromJson(json))
                .toList();
          });
        }
      }
    } catch (e) {
      print('Error loading announcements: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal memuat konten')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Gerindra'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: [
            Tab(text: 'Sambutan'),
            Tab(text: 'Pengumuman'),
            Tab(text: 'Download'),
            Tab(text: 'Artikel'),
          ],
        ),
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAnnouncementList('sambutan'),
                _buildAnnouncementList('pengumuman'),
                _buildAnnouncementList('download'),
                _buildAnnouncementList('artikel'),
              ],
            ),
    );
  }

  Widget _buildAnnouncementList(String type) {
    final announcements = _announcementsByType[type] ?? [];

    if (announcements.isEmpty) {
      return Center(
        child: Text(
          'Belum ada konten',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAnnouncements,
      child: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: announcements.length,
        itemBuilder: (context, index) {
          final announcement = announcements[index];
          return Card(
            margin: EdgeInsets.only(bottom: 16),
            child: InkWell(
              onTap: () => _showAnnouncementDetail(announcement),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (announcement.imageUrl != null)
                    Image.network(
                      announcement.imageUrl!,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          height: 200,
                          color: Colors.grey[300],
                          child: Icon(Icons.image, size: 50, color: Colors.grey),
                        );
                      },
                    ),
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          announcement.title,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          announcement.content,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: Colors.grey[700]),
                        ),
                        SizedBox(height: 8),
                        Text(
                          _formatDate(announcement.createdAt),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showAnnouncementDetail(Announcement announcement) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          padding: EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              Text(
                announcement.title,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Text(
                _formatDate(announcement.createdAt),
                style: TextStyle(color: Colors.grey),
              ),
              SizedBox(height: 16),
              if (announcement.imageUrl != null) ...[
                Image.network(announcement.imageUrl!),
                SizedBox(height: 16),
              ],
              Text(
                announcement.content,
                style: TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return '${date.day}/${date.month}/${date.year}';
  }
}

// lib/models/announcement.dart
class Announcement {
  final int id;
  final String title;
  final String content;
  final String? imageUrl;
  final String type;
  final bool isActive;
  final String createdAt;

  Announcement({
    required this.id,
    required this.title,
    required this.content,
    this.imageUrl,
    required this.type,
    required this.isActive,
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'],
      title: json['title'],
      content: json['content'],
      imageUrl: json['imageUrl'],
      type: json['type'],
      isActive: json['isActive'],
      createdAt: json['createdAt'],
    );
  }
}
```

---

## 👤 3. USER PROFILE (REQUIRES AUTH)

### **3.1 Get Current User Profile**
```dart
GET /api/user/profile

// Headers:
// Authorization: Bearer <accessToken>

// Response (200)
{
  "success": true,
  "data": {
    "id": 5,
    "uuid": "cf503cab-8ad8-4b05-855d-84e7321c0752",
    "nik": "3201234567890123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "address": "Jakarta Selatan",
    "isBlocked": false,
    "createdAt": "2026-02-01T08:00:00.000Z",
    "roles": [
      { "role": "simpatisan", "isActive": true }
    ]
  }
}
```

### **3.2 Update Profile**
```dart
PUT /api/user/profile

// Headers:
// Authorization: Bearer <accessToken>

// Request Body (all fields optional)
{
  "name": "John Doe Updated",
  "phone": "08198765432",
  "address": "Jakarta Utara"
}

// Response (200)
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

### **3.3 Change Password**
```dart
POST /api/user/change-password

// Headers:
// Authorization: Bearer <accessToken>

// Request Body
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

// Response (200)
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🔄 4. REFRESH TOKEN

### **4.1 Refresh Access Token**
```dart
POST /api/auth/refresh

// Request Body
{
  "refreshToken": "38d74102cbe63ab0c09dbcbc07c47ef5..."
}

// Response (200)
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1d"
  }
}
```

### **Flutter Token Refresh Example**
```dart
// lib/services/auth_service.dart
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthService {
  static Future<bool> refreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refreshToken');
      
      if (refreshToken == null) return false;
      
      final response = await ApiClient.post('/auth/refresh', {
        'refreshToken': refreshToken,
      });
      
      if (response['success']) {
        final newAccessToken = response['data']['accessToken'];
        await prefs.setString('accessToken', newAccessToken);
        return true;
      }
      
      return false;
    } catch (e) {
      print('Token refresh failed: $e');
      return false;
    }
  }
  
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    // Navigate to login screen
  }
}
```

---

## 🚫 5. BLOCKED USER HANDLING

### **Important: Check Block Status**
Sebelum mengizinkan user login atau menggunakan aplikasi, cek apakah user di-block:

```dart
// After successful login, check if user is blocked
Future<void> _handleLogin(String identifier, String password) async {
  try {
    final loginResponse = await ApiClient.post('/auth/login', {
      'identifier': identifier,
      'password': password,
    });
    
    if (loginResponse['success']) {
      final user = loginResponse['data']['user'];
      
      // Check if user is blocked
      if (user['isBlocked'] == true) {
        _showBlockedDialog(user['blockReason']);
        return;
      }
      
      // Save tokens
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', loginResponse['data']['accessToken']);
      await prefs.setString('refreshToken', loginResponse['data']['refreshToken']);
      
      // Navigate to home
      Navigator.pushReplacementNamed(context, '/home');
    }
  } catch (e) {
    print('Login failed: $e');
  }
}

void _showBlockedDialog(String? reason) {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => AlertDialog(
      title: Text('Akun Diblokir'),
      content: Text(
        reason ?? 'Akun Anda telah diblokir oleh admin. Silakan hubungi administrator.',
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
            // Navigate to login or contact support
          },
          child: Text('OK'),
        ),
      ],
    ),
  );
}
```

---

## 📦 COMPLETE FLUTTER STATE MANAGEMENT EXAMPLE

### **Using Provider**
```dart
// lib/providers/agenda_provider.dart
import 'package:flutter/material.dart';
import '../models/agenda.dart';
import '../services/api_client.dart';

class AgendaProvider with ChangeNotifier {
  List<Agenda> _agendas = [];
  bool _loading = false;
  String? _error;

  List<Agenda> get agendas => _agendas;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> loadAgendas(DateTime date) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final monthParam = '${date.year}-${date.month.toString().padLeft(2, '0')}';
      final response = await ApiClient.get('/agenda/public?month=$monthParam');

      if (response['success']) {
        _agendas = (response['data'] as List)
            .map((json) => Agenda.fromJson(json))
            .toList();
      }
    } catch (e) {
      _error = 'Gagal memuat agenda: $e';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  List<Agenda> getAgendasForDay(DateTime day) {
    return _agendas.where((agenda) {
      final agendaDate = DateTime.parse(agenda.date);
      return agendaDate.year == day.year &&
             agendaDate.month == day.month &&
             agendaDate.day == day.day;
    }).toList();
  }
}

// Usage in main.dart
import 'package:provider/provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AgendaProvider()),
        ChangeNotifierProvider(create: (_) => AnnouncementProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MyApp(),
    ),
  );
}

// Usage in widget
class CalendarScreen extends StatefulWidget {
  @override
  _CalendarScreenState createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  @override
  void initState() {
    super.initState();
    // Load agendas when screen opens
    Future.microtask(() {
      Provider.of<AgendaProvider>(context, listen: false)
          .loadAgendas(DateTime.now());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AgendaProvider>(
      builder: (context, provider, child) {
        if (provider.loading) {
          return Center(child: CircularProgressIndicator());
        }

        if (provider.error != null) {
          return Center(child: Text(provider.error!));
        }

        return ListView.builder(
          itemCount: provider.agendas.length,
          itemBuilder: (context, index) {
            final agenda = provider.agendas[index];
            return ListTile(
              title: Text(agenda.title),
              subtitle: Text(agenda.description ?? ''),
            );
          },
        );
      },
    );
  }
}
```

---

## 🎨 UI/UX RECOMMENDATIONS

### **1. Bottom Navigation**
```dart
BottomNavigationBar(
  currentIndex: _currentIndex,
  onTap: (index) => setState(() => _currentIndex = index),
  items: [
    BottomNavigationBarItem(
      icon: Icon(Icons.home),
      label: 'Home',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.calendar_today),
      label: 'Agenda',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.article),
      label: 'My Gerindra',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.person),
      label: 'Profile',
    ),
  ],
)
```

### **2. Pull to Refresh**
```dart
RefreshIndicator(
  onRefresh: () async {
    await provider.loadAgendas(DateTime.now());
  },
  child: ListView(...),
)
```

### **3. Loading States**
```dart
// Use shimmer effect for better UX
import 'package:shimmer/shimmer.dart';

Widget _buildLoadingShimmer() {
  return Shimmer.fromColors(
    baseColor: Colors.grey[300]!,
    highlightColor: Colors.grey[100]!,
    child: Column(
      children: List.generate(5, (index) => Card(
        margin: EdgeInsets.all(16),
        child: Container(height: 100),
      )),
    ),
  );
}
```

---

## ⚠️ ERROR HANDLING

### **Network Error Handling**
```dart
import 'package:connectivity_plus/connectivity_plus.dart';

class NetworkHelper {
  static Future<bool> checkConnectivity() async {
    var connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }
  
  static void showNoInternetDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Tidak Ada Koneksi'),
        content: Text('Pastikan Anda terhubung ke internet'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }
}
```

### **API Error Handling**
```dart
Future<dynamic> safeApiCall(Future<dynamic> Function() apiCall) async {
  try {
    // Check internet first
    if (!await NetworkHelper.checkConnectivity()) {
      throw Exception('No internet connection');
    }
    
    return await apiCall();
  } on SocketException {
    throw Exception('Network error. Please check your connection.');
  } on FormatException {
    throw Exception('Invalid response format from server.');
  } catch (e) {
    throw Exception('Error: $e');
  }
}
```

---

## 🚀 DEPLOYMENT NOTES

### **1. Environment Configuration**
```dart
// lib/config/environment.dart
class Environment {
  // BEST PRACTICE: Gunakan --dart-define saat run
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3030/api', // Default development
  );
  
  static bool get isProduction => apiBaseUrl.contains('mygerindra.com');
  
  // Helper untuk cek IP dinamis (jika dibutuhkan)
  static String get currentBackendHost {
    final uri = Uri.parse(apiBaseUrl);
    return '${uri.host}:${uri.port}';
  }
}

// Usage in your code:
// final response = await http.get(Uri.parse('${Environment.apiBaseUrl}/agenda/public'));
```

### **2. Cara Run Aplikasi dengan Berbagai Skenario**

#### **Skenario A: Develop FE dan BE di laptop yang sama**
```bash
# TIDAK PERLU GANTI-GANTI IP!
flutter run
# atau
flutter run --dart-define=API_BASE_URL=http://localhost:3030/api
```

#### **Skenario B: Test di HP fisik via USB/WiFi**
```bash
# 1. Cek IP laptop dulu
ipconfig getifaddr en0  # macOS WiFi
# atau
ifconfig | grep "inet " | grep -v 127.0.0.1  # macOS semua interface

# 2. Run dengan IP laptop (contoh: 10.194.77.48)
flutter run --dart-define=API_BASE_URL=http://10.194.77.48:3030/api
```

#### **Skenario C: Production**
```bash
flutter run --dart-define=API_BASE_URL=https://api.mygerindra.com/api
```

### **3. Solusi Pintar: Script Helper**

Buat file `run_dev.sh` di root project Flutter:
```bash
#!/bin/bash

# Get current laptop IP automatically (macOS)
LAPTOP_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo "🔍 Detected laptop IP: $LAPTOP_IP"
echo ""
echo "Choose run mode:"
echo "1) Localhost (FE dan BE di laptop yang sama) - RECOMMENDED"
echo "2) Network IP (Test di HP fisik via USB/WiFi)"
echo "3) Production"
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo "🚀 Running with localhost..."
    flutter run --dart-define=API_BASE_URL=http://localhost:3030/api
    ;;
  2)
    echo "🚀 Running with network IP: $LAPTOP_IP..."
    flutter run --dart-define=API_BASE_URL=http://$LAPTOP_IP:3030/api
    ;;
  3)
    echo "🚀 Running with production API..."
    flutter run --dart-define=API_BASE_URL=https://api.mygerindra.com/api
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
```

Cara pakai:
```bash
chmod +x run_dev.sh
./run_dev.sh
```

### **2. Required Dependencies**
Add to `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  shared_preferences: ^2.2.2
  provider: ^6.1.1
  table_calendar: ^3.0.9
  connectivity_plus: ^5.0.2
  shimmer: ^3.0.0
  cached_network_image: ^3.3.1
```

### **3. Android Network Permissions**
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

### **4. iOS App Transport Security**
Add to `ios/Runner/Info.plist` for development:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

---

## 📝 TESTING CHECKLIST

- [ ] User registration flow
- [ ] User login flow
- [ ] Token refresh mechanism
- [ ] Blocked user handling
- [ ] Calendar view with events
- [ ] Month navigation in calendar
- [ ] Announcement tabs (Sambutan, Pengumuman, Download, Artikel)
- [ ] Image loading and error handling
- [ ] Profile view and update
- [ ] Password change
- [ ] Offline mode handling
- [ ] Pull to refresh functionality
- [ ] Loading states and shimmer effects
- [ ] Error messages and dialogs

---

## 🔗 IMPORTANT ENDPOINTS SUMMARY

| Feature | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| Login | POST | `/api/auth/login` | ❌ |
| Register | POST | `/api/auth/register` | ❌ |
| Refresh Token | POST | `/api/auth/refresh` | ❌ |
| Get Profile | GET | `/api/user/profile` | ✅ |
| Update Profile | PUT | `/api/user/profile` | ✅ |
| Change Password | POST | `/api/user/change-password` | ✅ |
| Get Calendar | GET | `/api/agenda/public?month=YYYY-MM` | ❌ |
| Get Announcements | GET | `/api/announcement/public?type=all` | ❌ |

---

**Last Updated:** February 9, 2026  
**Questions?** Contact backend team  
**Flutter Examples:** Complete working examples included above
