# KTA Verification Feature - Frontend Documentation

## 📋 Overview

**KTA (Kartu Tanda Anggota)** adalah fitur verifikasi keanggotaan yang memungkinkan:
- User melihat status verifikasi KTA mereka
- Admin melakukan approval/reject verifikasi KTA
- System generate nomor KTA unik untuk setiap user
- QR code verification untuk validasi KTA

## 🎯 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **simpatisan** | ✅ Lihat status KTA sendiri |
| **kader** | ✅ Lihat status KTA sendiri |
| **admin** | ✅ Semua user permissions<br>✅ Verify/Reject KTA user lain<br>✅ Lihat daftar semua user<br>✅ Lihat statistics |

## 📱 API Endpoints

### 1. Get My KTA Status

User melihat status verifikasi KTA mereka sendiri.

```http
GET /api/kta/my-status
Authorization: Bearer {token}
```

#### Response - User Belum Diverifikasi

```json
{
  "success": true,
  "data": {
    "user_id": 3,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "kader",
    "kta_verified": false,
    "kta_verified_at": null,
    "verified_by": null,
    "card_number": "KTA-2026-000003",
    "can_print": false,
    "message": "KTA Anda belum diverifikasi. Silakan hubungi admin."
  }
}
```

#### Response - User Sudah Diverifikasi

```json
{
  "success": true,
  "data": {
    "user_id": 3,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "kader",
    "kta_verified": true,
    "kta_verified_at": "2026-01-09T01:00:00.000Z",
    "verified_by": {
      "id": 4,
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "card_number": "KTA-2026-000003",
    "can_print": true,
    "message": "KTA Anda telah diverifikasi. Anda dapat mencetak kartu."
  }
}
```

#### Field Explanations

| Field | Type | Description |
|-------|------|-------------|
| `kta_verified` | Boolean | Status verifikasi (true = sudah diverifikasi) |
| `kta_verified_at` | DateTime/null | Timestamp kapan diverifikasi |
| `verified_by` | Object/null | Data admin yang melakukan verifikasi |
| `card_number` | String | Nomor KTA unik (format: KTA-YYYY-NNNNNN) |
| `can_print` | Boolean | Apakah user bisa print KTA (true jika verified) |
| `message` | String | Pesan status untuk ditampilkan ke user |

---

### 2. Verify KTA (Admin Only)

Admin melakukan verifikasi atau reject KTA user.

```http
POST /api/kta/admin/verify
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "user_id": 3,
  "verified": true,
  "notes": "KTA diverifikasi setelah pengecekan dokumen"
}
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | Integer | ✅ Yes | ID user yang akan diverifikasi |
| `verified` | Boolean | ✅ Yes | `true` = verify, `false` = reject/unverify |
| `notes` | String | ❌ No | Catatan admin (opsional) |

#### Response Success - Verify

```json
{
  "success": true,
  "message": "User KTA verified successfully",
  "data": {
    "user_id": 3,
    "name": "John Doe",
    "email": "john@example.com",
    "kta_verified": true,
    "kta_verified_at": "2026-01-09T01:00:00.000Z",
    "verified_by": 4,
    "card_number": "KTA-2026-000003"
  }
}
```

#### Response Success - Reject/Unverify

```json
{
  "success": true,
  "message": "User KTA unverified successfully",
  "data": {
    "user_id": 3,
    "name": "John Doe",
    "email": "john@example.com",
    "kta_verified": false,
    "kta_verified_at": null,
    "verified_by": null,
    "card_number": "KTA-2026-000003"
  }
}
```

#### Response Errors

**User Not Found (404)**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "user_id",
      "message": "user_id is required"
    }
  ]
}
```

**Unauthorized (403)**
```json
{
  "success": false,
  "message": "Insufficient permissions. Admin access required."
}
```

---

### 3. Get Users List (Admin Only)

Admin melihat daftar semua user dengan filter dan pagination.

```http
GET /api/kta/admin/users?status=unverified&role=kader&limit=20&offset=0
Authorization: Bearer {admin_token}
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | all | Filter: `verified`, `unverified`, `all` |
| `role` | String | all | Filter: `simpatisan`, `kader`, `admin`, `all` |
| `search` | String | - | Search by name or email |
| `limit` | Integer | 20 | Jumlah data per page (max: 100) |
| `offset` | Integer | 0 | Skip N records (untuk pagination) |

#### Response

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 3,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "kader",
        "kta_verified": false,
        "kta_verified_at": null,
        "verified_by": null,
        "card_number": "KTA-2026-000003",
        "created_at": "2025-12-01T10:00:00.000Z"
      },
      {
        "id": 5,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "simpatisan",
        "kta_verified": true,
        "kta_verified_at": "2026-01-05T14:30:00.000Z",
        "verified_by": {
          "id": 4,
          "name": "Admin User"
        },
        "card_number": "KTA-2026-000005",
        "created_at": "2025-12-15T08:20:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  }
}
```

#### Pagination Logic

```
Page 1: offset=0,  limit=20  → Records 1-20
Page 2: offset=20, limit=20  → Records 21-40
Page 3: offset=40, limit=20  → Records 41-60
```

---

### 4. Verify QR Code (Public Endpoint)

Scan QR code untuk verify validitas KTA. **Tidak perlu authentication.**

```http
POST /api/kta/verify-qr
Content-Type: application/json

{
  "qr_data": "3"
}
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `qr_data` | String | ✅ Yes | Data dari QR code (biasanya user ID) |

#### Response - KTA Valid & Verified

```json
{
  "success": true,
  "data": {
    "valid": true,
    "verified": true,
    "user": {
      "name": "John Doe",
      "role": "kader",
      "card_number": "KTA-2026-000003",
      "verified_at": "2026-01-09T01:00:00.000Z"
    },
    "message": "KTA valid dan terverifikasi"
  }
}
```

#### Response - KTA Valid Tapi Belum Verified

```json
{
  "success": true,
  "data": {
    "valid": true,
    "verified": false,
    "user": {
      "name": "John Doe",
      "role": "kader",
      "card_number": "KTA-2026-000003"
    },
    "message": "KTA ditemukan tetapi belum diverifikasi"
  }
}
```

#### Response - Invalid QR Code

```json
{
  "success": false,
  "message": "Invalid QR code data"
}
```

#### Response - User Not Found

```json
{
  "success": true,
  "data": {
    "valid": false,
    "message": "KTA tidak ditemukan"
  }
}
```

---

### 5. Get KTA Statistics (Admin Only)

Admin melihat statistik verifikasi KTA.

```http
GET /api/kta/admin/stats
Authorization: Bearer {admin_token}
```

#### Response

```json
{
  "success": true,
  "data": {
    "total_users": 45,
    "verified_users": 12,
    "unverified_users": 33,
    "verification_rate": "26.67",
    "by_role": {
      "simpatisan": {
        "total": 30,
        "verified": 8,
        "unverified": 22
      },
      "kader": {
        "total": 14,
        "verified": 4,
        "unverified": 10
      },
      "admin": {
        "total": 1,
        "verified": 0,
        "unverified": 1
      }
    },
    "recent_verifications": [
      {
        "user_id": 3,
        "name": "John Doe",
        "verified_at": "2026-01-09T01:00:00.000Z",
        "verified_by": {
          "id": 4,
          "name": "Admin User"
        }
      }
    ]
  }
}
```

#### Field Explanations

| Field | Description |
|-------|-------------|
| `verification_rate` | Persentase user yang sudah diverifikasi (string dengan 2 desimal) |
| `by_role` | Breakdown statistik per role |
| `recent_verifications` | 10 verifikasi terakhir |

---

## 📱 Frontend Implementation

### Flutter Example

#### 1. User - Check KTA Status

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class KTAStatusScreen extends StatefulWidget {
  @override
  _KTAStatusScreenState createState() => _KTAStatusScreenState();
}

class _KTAStatusScreenState extends State<KTAStatusScreen> {
  Map<String, dynamic>? ktaData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadKTAStatus();
  }

  Future<void> _loadKTAStatus() async {
    try {
      final token = await getToken(); // Your token storage
      final response = await http.get(
        Uri.parse('https://api.mygeri.com/api/kta/my-status'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          ktaData = data['data'];
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading KTA status: $e');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    final isVerified = ktaData?['kta_verified'] ?? false;
    final canPrint = ktaData?['can_print'] ?? false;
    final cardNumber = ktaData?['card_number'] ?? '';
    final message = ktaData?['message'] ?? '';

    return Scaffold(
      appBar: AppBar(title: Text('Status KTA')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // KTA Card Display
            Card(
              elevation: 4,
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Logo/Header
                    Image.asset('assets/logo.png', height: 60),
                    SizedBox(height: 16),
                    
                    // Card Number
                    Text(
                      cardNumber,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    
                    SizedBox(height: 8),
                    
                    // Name
                    Text(
                      ktaData?['name'] ?? '',
                      style: TextStyle(fontSize: 18),
                    ),
                    
                    // Role Badge
                    Chip(
                      label: Text(ktaData?['role'] ?? ''),
                      backgroundColor: _getRoleColor(ktaData?['role']),
                    ),
                    
                    SizedBox(height: 16),
                    
                    // Verification Status
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isVerified ? Colors.green : Colors.orange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isVerified ? Icons.check_circle : Icons.pending,
                            color: Colors.white,
                            size: 16,
                          ),
                          SizedBox(width: 8),
                          Text(
                            isVerified ? 'Terverifikasi' : 'Belum Diverifikasi',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Verified Date
                    if (isVerified && ktaData?['kta_verified_at'] != null)
                      Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Text(
                          'Diverifikasi: ${_formatDate(ktaData!['kta_verified_at'])}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    
                    // QR Code (if verified)
                    if (isVerified) ...[
                      SizedBox(height: 16),
                      QrImage(
                        data: ktaData?['user_id'].toString() ?? '',
                        version: QrVersions.auto,
                        size: 150,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            SizedBox(height: 16),
            
            // Status Message
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
            
            SizedBox(height: 24),
            
            // Action Buttons
            if (canPrint)
              ElevatedButton.icon(
                icon: Icon(Icons.print),
                label: Text('Cetak KTA'),
                onPressed: _printKTA,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            
            SizedBox(height: 12),
            
            OutlinedButton.icon(
              icon: Icon(Icons.refresh),
              label: Text('Refresh Status'),
              onPressed: _loadKTAStatus,
            ),
          ],
        ),
      ),
    );
  }

  Color _getRoleColor(String? role) {
    switch (role) {
      case 'admin': return Colors.red;
      case 'kader': return Colors.blue;
      case 'simpatisan': return Colors.green;
      default: return Colors.grey;
    }
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return '${date.day}/${date.month}/${date.year}';
  }

  Future<void> _printKTA() async {
    // Implement print/download KTA logic
    // Could generate PDF with card layout
  }
}
```

#### 2. Admin - Verify User KTA

```dart
class AdminVerifyKTAScreen extends StatefulWidget {
  final int userId;
  final String userName;

  AdminVerifyKTAScreen({
    required this.userId,
    required this.userName,
  });

  @override
  _AdminVerifyKTAScreenState createState() => _AdminVerifyKTAScreenState();
}

class _AdminVerifyKTAScreenState extends State<AdminVerifyKTAScreen> {
  final _notesController = TextEditingController();
  bool isVerifying = false;

  Future<void> _verifyKTA(bool verified) async {
    setState(() => isVerifying = true);

    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('https://api.mygeri.com/api/kta/admin/verify'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': widget.userId,
          'verified': verified,
          'notes': _notesController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Show success dialog
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text('Berhasil'),
            content: Text(data['message']),
            actions: [
              TextButton(
                child: Text('OK'),
                onPressed: () {
                  Navigator.pop(ctx); // Close dialog
                  Navigator.pop(context, true); // Return to previous screen
                },
              ),
            ],
          ),
        );
      } else {
        // Handle error
        final data = jsonDecode(response.body);
        _showError(data['message']);
      }
    } catch (e) {
      _showError('Terjadi kesalahan: $e');
    } finally {
      setState(() => isVerifying = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Verifikasi KTA')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Verifikasi KTA untuk:',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            SizedBox(height: 8),
            Text(
              widget.userName,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            SizedBox(height: 24),
            
            TextField(
              controller: _notesController,
              decoration: InputDecoration(
                labelText: 'Catatan (Opsional)',
                hintText: 'Tambahkan catatan verifikasi...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            
            SizedBox(height: 24),
            
            if (isVerifying)
              Center(child: CircularProgressIndicator())
            else ...[
              ElevatedButton.icon(
                icon: Icon(Icons.check_circle),
                label: Text('Verifikasi KTA'),
                onPressed: () => _verifyKTA(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              
              SizedBox(height: 12),
              
              OutlinedButton.icon(
                icon: Icon(Icons.cancel),
                label: Text('Tolak Verifikasi'),
                onPressed: () => _verifyKTA(false),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

#### 3. Admin - Users List with Filters

```dart
class AdminUsersListScreen extends StatefulWidget {
  @override
  _AdminUsersListScreenState createState() => _AdminUsersListScreenState();
}

class _AdminUsersListScreenState extends State<AdminUsersListScreen> {
  List<dynamic> users = [];
  bool isLoading = false;
  bool hasMore = true;
  int offset = 0;
  final int limit = 20;
  
  String statusFilter = 'all';
  String roleFilter = 'all';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        offset = 0;
        users = [];
        hasMore = true;
      });
    }

    if (isLoading || !hasMore) return;

    setState(() => isLoading = true);

    try {
      final token = await getToken();
      final queryParams = {
        'status': statusFilter,
        'role': roleFilter,
        'limit': limit.toString(),
        'offset': offset.toString(),
      };
      
      if (_searchController.text.isNotEmpty) {
        queryParams['search'] = _searchController.text;
      }

      final uri = Uri.parse('https://api.mygeri.com/api/kta/admin/users')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newUsers = data['data']['users'] as List;
        final pagination = data['data']['pagination'];

        setState(() {
          users.addAll(newUsers);
          hasMore = pagination['has_more'];
          offset += limit;
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading users: $e');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Kelola KTA'),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Cari nama atau email...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
                suffixIcon: IconButton(
                  icon: Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    _loadUsers(refresh: true);
                  },
                ),
              ),
              onSubmitted: (_) => _loadUsers(refresh: true),
            ),
          ),
          
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                FilterChip(
                  label: Text('Semua'),
                  selected: statusFilter == 'all',
                  onSelected: (_) => _changeFilter('all', roleFilter),
                ),
                SizedBox(width: 8),
                FilterChip(
                  label: Text('Terverifikasi'),
                  selected: statusFilter == 'verified',
                  onSelected: (_) => _changeFilter('verified', roleFilter),
                ),
                SizedBox(width: 8),
                FilterChip(
                  label: Text('Belum Verifikasi'),
                  selected: statusFilter == 'unverified',
                  onSelected: (_) => _changeFilter('unverified', roleFilter),
                ),
              ],
            ),
          ),
          
          SizedBox(height: 8),
          
          // Users List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _loadUsers(refresh: true),
              child: ListView.builder(
                itemCount: users.length + (hasMore ? 1 : 0),
                itemBuilder: (ctx, index) {
                  if (index == users.length) {
                    // Load more indicator
                    if (!isLoading) _loadUsers();
                    return Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }

                  final user = users[index];
                  return _buildUserCard(user);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    final isVerified = user['kta_verified'] ?? false;

    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isVerified ? Colors.green : Colors.orange,
          child: Icon(
            isVerified ? Icons.check : Icons.pending,
            color: Colors.white,
          ),
        ),
        title: Text(user['name']),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user['email']),
            SizedBox(height: 4),
            Row(
              children: [
                Chip(
                  label: Text(user['role']),
                  backgroundColor: _getRoleColor(user['role']),
                  labelStyle: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                SizedBox(width: 8),
                Text(
                  user['card_number'],
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: IconButton(
          icon: Icon(Icons.edit),
          onPressed: () => _verifyUser(user),
        ),
        onTap: () => _showUserDetails(user),
      ),
    );
  }

  void _changeFilter(String status, String role) {
    setState(() {
      statusFilter = status;
      roleFilter = role;
    });
    _loadUsers(refresh: true);
  }

  void _showFilterDialog() {
    // Implement filter dialog
  }

  Future<void> _verifyUser(Map<String, dynamic> user) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => AdminVerifyKTAScreen(
          userId: user['id'],
          userName: user['name'],
        ),
      ),
    );

    if (result == true) {
      // Refresh list after verification
      _loadUsers(refresh: true);
    }
  }

  void _showUserDetails(Map<String, dynamic> user) {
    // Show user details dialog
  }

  Color _getRoleColor(String role) {
    switch (role) {
      case 'admin': return Colors.red;
      case 'kader': return Colors.blue;
      case 'simpatisan': return Colors.green;
      default: return Colors.grey;
    }
  }
}
```

#### 4. QR Code Scanner

```dart
import 'package:qr_code_scanner/qr_code_scanner.dart';

class QRScannerScreen extends StatefulWidget {
  @override
  _QRScannerScreenState createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool isScanning = true;

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  Future<void> _verifyQRCode(String qrData) async {
    if (!isScanning) return;
    
    setState(() => isScanning = false);

    try {
      final response = await http.post(
        Uri.parse('https://api.mygeri.com/api/kta/verify-qr'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'qr_data': qrData}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final isValid = data['data']['valid'];
        final isVerified = data['data']['verified'];
        final message = data['data']['message'];

        // Show result dialog
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Row(
              children: [
                Icon(
                  isValid && isVerified ? Icons.check_circle : Icons.error,
                  color: isValid && isVerified ? Colors.green : Colors.red,
                ),
                SizedBox(width: 8),
                Text(isValid ? 'KTA Valid' : 'KTA Tidak Valid'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (data['data']['user'] != null) ...[
                  Text('Nama: ${data['data']['user']['name']}'),
                  Text('Role: ${data['data']['user']['role']}'),
                  Text('No. KTA: ${data['data']['user']['card_number']}'),
                  if (data['data']['user']['verified_at'] != null)
                    Text('Terverifikasi: ${_formatDate(data['data']['user']['verified_at'])}'),
                ],
                SizedBox(height: 12),
                Text(
                  message,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isValid && isVerified ? Colors.green : Colors.orange,
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                child: Text('Scan Lagi'),
                onPressed: () {
                  Navigator.pop(ctx);
                  setState(() => isScanning = true);
                },
              ),
              TextButton(
                child: Text('Tutup'),
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      }
    } catch (e) {
      print('QR verification error: $e');
      setState(() => isScanning = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Scan QR KTA')),
      body: QRView(
        key: qrKey,
        onQRViewCreated: (controller) {
          this.controller = controller;
          controller.scannedDataStream.listen((scanData) {
            if (isScanning) {
              _verifyQRCode(scanData.code ?? '');
            }
          });
        },
        overlay: QrScannerOverlayShape(
          borderColor: Colors.green,
          borderRadius: 10,
          borderLength: 30,
          borderWidth: 10,
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return '${date.day}/${date.month}/${date.year}';
  }
}
```

#### 5. Admin - Statistics Dashboard

```dart
class AdminStatsScreen extends StatefulWidget {
  @override
  _AdminStatsScreenState createState() => _AdminStatsScreenState();
}

class _AdminStatsScreenState extends State<AdminStatsScreen> {
  Map<String, dynamic>? stats;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('https://api.mygeri.com/api/kta/admin/stats'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          stats = data['data'];
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading stats: $e');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    final totalUsers = stats?['total_users'] ?? 0;
    final verifiedUsers = stats?['verified_users'] ?? 0;
    final unverifiedUsers = stats?['unverified_users'] ?? 0;
    final verificationRate = stats?['verification_rate'] ?? '0';
    final byRole = stats?['by_role'] ?? {};

    return Scaffold(
      appBar: AppBar(title: Text('Statistik KTA')),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            // Overview Cards
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Total User',
                    totalUsers.toString(),
                    Icons.people,
                    Colors.blue,
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Terverifikasi',
                    verifiedUsers.toString(),
                    Icons.check_circle,
                    Colors.green,
                  ),
                ),
              ],
            ),
            
            SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Belum Verifikasi',
                    unverifiedUsers.toString(),
                    Icons.pending,
                    Colors.orange,
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Tingkat Verifikasi',
                    '$verificationRate%',
                    Icons.percent,
                    Colors.purple,
                  ),
                ),
              ],
            ),
            
            SizedBox(height: 24),
            
            // By Role Section
            Text(
              'Verifikasi per Role',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            SizedBox(height: 12),
            
            ...byRole.entries.map((entry) {
              final role = entry.key;
              final data = entry.value;
              return _buildRoleCard(
                role,
                data['total'],
                data['verified'],
                data['unverified'],
              );
            }).toList(),
            
            SizedBox(height: 24),
            
            // Recent Verifications
            Text(
              'Verifikasi Terakhir',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            SizedBox(height: 12),
            
            ...((stats?['recent_verifications'] ?? []) as List).map((v) {
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.green,
                    child: Icon(Icons.check, color: Colors.white),
                  ),
                  title: Text(v['name']),
                  subtitle: Text(
                    'Diverifikasi oleh ${v['verified_by']['name']}',
                  ),
                  trailing: Text(
                    _formatDate(v['verified_at']),
                    style: TextStyle(fontSize: 12),
                  ),
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleCard(String role, int total, int verified, int unverified) {
    final percentage = total > 0 ? (verified / total * 100).toStringAsFixed(1) : '0';

    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  role.toUpperCase(),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  '$percentage%',
                  style: TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            
            SizedBox(height: 8),
            
            LinearProgressIndicator(
              value: total > 0 ? verified / total : 0,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
            ),
            
            SizedBox(height: 8),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total: $total', style: TextStyle(fontSize: 12)),
                Text('Verified: $verified', style: TextStyle(fontSize: 12)),
                Text('Unverified: $unverified', style: TextStyle(fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    return '${date.day}/${date.month}/${date.year}';
  }
}
```

### React Native Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.mygeri.com';

// User - Check KTA Status
export const KTAStatusScreen = () => {
  const [ktaData, setKtaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKTAStatus();
  }, []);

  const loadKTAStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/kta/my-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        setKtaData(result.data);
      }
    } catch (error) {
      console.error('Error loading KTA status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  const isVerified = ktaData?.kta_verified || false;
  const canPrint = ktaData?.can_print || false;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        {ktaData?.card_number}
      </Text>
      
      <Text style={{ fontSize: 18, marginTop: 10 }}>
        {ktaData?.name}
      </Text>
      
      <View style={{
        marginTop: 15,
        padding: 10,
        backgroundColor: isVerified ? 'green' : 'orange',
        borderRadius: 20,
      }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {isVerified ? '✓ Terverifikasi' : '⏳ Belum Diverifikasi'}
        </Text>
      </View>
      
      <Text style={{ marginTop: 15, textAlign: 'center', color: 'gray' }}>
        {ktaData?.message}
      </Text>
      
      {canPrint && (
        <Button
          title="Cetak KTA"
          onPress={() => {/* Implement print */}}
        />
      )}
      
      <Button
        title="Refresh Status"
        onPress={loadKTAStatus}
      />
    </View>
  );
};

// Admin - Verify KTA
export const verifyKTA = async (userId, verified, notes = '') => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/kta/admin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        verified: verified,
        notes: notes,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error verifying KTA:', error);
    throw error;
  }
};
```

---

## 🎨 UI/UX Recommendations

### 1. KTA Card Layout

```
┌───────────────────────────────────┐
│                                   │
│         [LOGO PARTAI]             │
│                                   │
│     KTA-2026-000003               │
│                                   │
│     JOHN DOE                      │
│     [ KADER ]                     │
│                                   │
│     [✓ TERVERIFIKASI]             │
│     Verified: 09/01/2026          │
│                                   │
│     [QR CODE]                     │
│                                   │
│     ID: 3                         │
│                                   │
└───────────────────────────────────┘

   [ CETAK KTA ]   [ BAGIKAN ]
```

### 2. Admin User List Layout

```
┌───────────────────────────────────┐
│  [🔍 Cari...]         [⚙ Filter] │
├───────────────────────────────────┤
│  [Semua] [✓Verified] [⏳Pending] │
├───────────────────────────────────┤
│                                   │
│  ● John Doe                  [✏]  │
│    john@example.com               │
│    [KADER] KTA-2026-000003        │
│    ✓ Terverifikasi                │
│                                   │
├───────────────────────────────────┤
│                                   │
│  ○ Jane Smith                [✏]  │
│    jane@example.com               │
│    [SIMPATISAN] KTA-2026-000005   │
│    ⏳ Belum diverifikasi           │
│                                   │
└───────────────────────────────────┘
```

### 3. Statistics Dashboard

```
┌────────────┬────────────┐
│ 👥 Total   │ ✓ Verified │
│   45       │    12      │
└────────────┴────────────┘
┌────────────┬────────────┐
│ ⏳ Pending │ 📊 Rate    │
│   33       │  26.67%    │
└────────────┴────────────┘

VERIFIKASI PER ROLE
━━━━━━━━━━━━━━━━━━━━━
SIMPATISAN    [████░░░] 26%
Total: 30  Verified: 8

KADER         [███░░░░] 28%
Total: 14  Verified: 4

ADMIN         [░░░░░░░] 0%
Total: 1   Verified: 0
```

---

## 🔐 Security & Best Practices

### 1. Token Management

```dart
// Store token securely
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

Future<void> saveToken(String token) async {
  await storage.write(key: 'jwt_token', value: token);
}

Future<String?> getToken() async {
  return await storage.read(key: 'jwt_token');
}
```

### 2. Error Handling

```dart
try {
  final response = await http.post(...);
  
  if (response.statusCode == 200) {
    // Success
  } else if (response.statusCode == 401) {
    // Unauthorized - redirect to login
    Navigator.pushReplacementNamed(context, '/login');
  } else if (response.statusCode == 403) {
    // Forbidden - show permission error
    _showError('Anda tidak memiliki akses');
  } else {
    // Other errors
    final data = jsonDecode(response.body);
    _showError(data['message']);
  }
} catch (e) {
  // Network error
  _showError('Koneksi bermasalah. Coba lagi.');
}
```

### 3. QR Code Security

```dart
// Validate QR data before sending
bool isValidQRData(String data) {
  // Check if data is numeric (user ID)
  return int.tryParse(data) != null;
}

Future<void> scanQRCode(String qrData) async {
  if (!isValidQRData(qrData)) {
    _showError('QR code tidak valid');
    return;
  }
  
  // Proceed with verification
  await verifyQRCode(qrData);
}
```

---

## ⚠️ Important Notes

### KTA Number Format

Format: `KTA-{YEAR}-{USER_ID_PADDED}`

Examples:
- User ID 3 → `KTA-2026-000003`
- User ID 125 → `KTA-2026-000125`
- User ID 1500 → `KTA-2026-001500`

### Verification Flow

1. **User Registration** → KTA created with `verified: false`
2. **User Submits Documents** → (Not in API scope - handle in app)
3. **Admin Reviews** → Use `POST /api/kta/admin/verify`
4. **User Gets Notified** → (Implement push notification)
5. **User Can Print** → `can_print: true` after verification

### Admin Permissions

Only users with role `admin` can:
- Verify/Unverify KTA
- View all users list
- View statistics
- See verification history

Non-admin users get **403 Forbidden** error.

---

## 📊 Testing Checklist

### User Flow
- [ ] User can view their KTA status
- [ ] Unverified user sees correct message
- [ ] Verified user can see QR code
- [ ] Card number displays correctly
- [ ] Verified date shows properly

### Admin Flow
- [ ] Admin can see users list
- [ ] Filters work correctly
- [ ] Pagination loads more users
- [ ] Search finds users by name/email
- [ ] Verify action updates status
- [ ] Unverify action works
- [ ] Statistics show correct data

### QR Scanner
- [ ] Scanner opens camera
- [ ] Valid QR shows user info
- [ ] Invalid QR shows error
- [ ] Unverified user shows warning
- [ ] No authentication required

### Edge Cases
- [ ] Handle network errors gracefully
- [ ] Show loading indicators
- [ ] Retry failed requests
- [ ] Handle 403 for non-admin
- [ ] Handle 404 for deleted users

---

## 🆘 Troubleshooting

### Issue: 403 Forbidden on Admin Endpoints

**Problem:** Non-admin user trying to access admin endpoint

**Solution:**
```dart
if (response.statusCode == 403) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text('Akses Ditolak'),
      content: Text('Anda harus login sebagai admin'),
      actions: [
        TextButton(
          child: Text('OK'),
          onPressed: () => Navigator.pop(ctx),
        ),
      ],
    ),
  );
}
```

### Issue: QR Code Not Generating

**Problem:** User ID not available

**Solution:**
```dart
// Make sure user data is loaded
if (ktaData?['user_id'] != null) {
  QrImage(
    data: ktaData!['user_id'].toString(),
    version: QrVersions.auto,
    size: 150,
  );
} else {
  Text('Loading QR code...');
}
```

### Issue: Print KTA Not Working

**Problem:** Need to generate PDF/Image

**Solution:**
```dart
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

Future<void> printKTA() async {
  final pdf = pw.Document();
  
  pdf.addPage(
    pw.Page(
      build: (pw.Context context) {
        return pw.Center(
          child: pw.Column(
            children: [
              pw.Text(ktaData['card_number']),
              pw.Text(ktaData['name']),
              // Add QR code, etc.
            ],
          ),
        );
      },
    ),
  );
  
  // Save or share PDF
  final bytes = await pdf.save();
  // Use share_plus or other package to share
}
```

---

## 📞 Support

Untuk pertanyaan teknis, hubungi:
- **Backend Developer:** [Contact Info]
- **API Documentation:** `/docs/KTA_API_DOCUMENTATION.md`
- **GitHub Issues:** [Repository URL]

---

## 🔄 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-09 | 1.0 | Initial KTA verification feature |

---

**Last Updated:** 9 Januari 2026  
**API Version:** v1.0  
**Feature:** KTA Verification System
