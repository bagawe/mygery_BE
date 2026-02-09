# Complete API Documentation - MyGeri Backend

## 📋 Overview

Dokumentasi lengkap semua API endpoints yang tersedia di backend MyGeri aplikasi.

**Base URL:** `http://10.194.77.48:3030` (Local) atau `https://api.mygeri.com` (Production)

---

## 🔐 Authentication

### 1. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "organisasi": "DPC Jakarta Selatan",
  "role": "simpatisan",
  "device_ip": "192.168.1.10"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "simpatisan",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "simpatisan",
      "ktaVerified": false,
      "ktaVerifiedAt": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Revoke All Sessions
```http
POST /api/auth/revoke-all-sessions
Authorization: Bearer {token}
```

---

## 👤 User Management

### 1. Get Current User Profile
```http
GET /api/users/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "organisasi": "DPC Jakarta Selatan",
    "role": "simpatisan",
    "foto": "https://storage.com/foto.jpg",
    "createdAt": "2026-02-09T10:00:00.000Z"
  }
}
```

### 2. Update Current User Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe Updated",
  "organisasi": "DPC Jakarta Pusat",
  "bio": "Anggota aktif Gerindra"
}
```

### 3. Change Password
```http
PUT /api/users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### 4. Upload Profile Photo
```http
POST /api/users/profile/upload-foto
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "foto": {file}
}
```

### 5. Search Users
```http
GET /api/users/search?query=john&limit=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john@example.com",
        "foto": "https://storage.com/foto.jpg",
        "role": "simpatisan"
      }
    ],
    "total": 1
  }
}
```

### 6. Block User
```http
POST /api/users/block
Authorization: Bearer {token}
Content-Type: application/json

{
  "blockedUserId": 2
}
```

### 7. Unblock User
```http
DELETE /api/users/block/{blockedUserId}
Authorization: Bearer {token}
```

### 8. Get Blocked Users
```http
GET /api/users/blocked
Authorization: Bearer {token}
```

### 9. Check Block Status
```http
GET /api/users/block-status/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isBlocked": false,
    "isBlockedBy": false
  }
}
```

---

## 👥 Admin - User Management

### 1. Get All Users (Admin)
```http
GET /api/users?page=1&limit=20&role=kader&search=john
Authorization: Bearer {admin_token}
```

### 2. Get User by UUID (Admin)
```http
GET /api/users/{uuid}
Authorization: Bearer {admin_token}
```

### 3. Update User by UUID (Admin)
```http
PUT /api/users/{uuid}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "kader",
  "organisasi": "Updated Org"
}
```

### 4. Delete User (Admin)
```http
DELETE /api/users/{uuid}
Authorization: Bearer {admin_token}
```

---

## 🏛️ KTA Verification

### 1. Get My KTA Status
```http
GET /api/kta/my-status
Authorization: Bearer {token}
```

**Response:**
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

### 2. Verify KTA (Admin Only)
```http
POST /api/kta/admin/verify
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "user_id": 3,
  "verified": true,
  "notes": "KTA diverifikasi setelah pengecekan dokumen"
}
```

### 3. Get Users List (Admin Only)
```http
GET /api/kta/admin/users?status=unverified&role=kader&limit=20&offset=0
Authorization: Bearer {admin_token}
```

### 4. Verify QR Code (Public)
```http
POST /api/kta/verify-qr
Content-Type: application/json

{
  "qr_data": "3"
}
```

**Response:**
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

### 5. Get KTA Statistics (Admin Only)
```http
GET /api/kta/admin/stats
Authorization: Bearer {admin_token}
```

---

## 📍 Radar Location

### 1. Update Location
```http
POST /api/radar/update-location
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5,
  "is_saved_only": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "user_id": 1,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5,
    "is_sharing_enabled": true,
    "is_saved_location": false,
    "last_seen": "2026-02-09T10:30:00.000Z",
    "updated_at": "2026-02-09T10:30:00.000Z"
  }
}
```

### 2. Get Nearby Locations
```http
GET /api/radar/locations?radius=5000
Authorization: Bearer {token}
```

**Response:**
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
        "is_sharing_enabled": true,
        "is_saved_location": false,
        "last_seen": "2026-02-09T10:25:00.000Z"
      }
    ],
    "total": 1,
    "your_location": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "is_sharing_enabled": true
    }
  }
}
```

### 3. Toggle Sharing
```http
POST /api/radar/toggle-sharing
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true
}
```

### 4. Get My Status
```http
GET /api/radar/my-status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_sharing_enabled": false,
    "is_saved_location": true,
    "last_location_update": "2026-02-09T10:30:00.000Z",
    "location_history_count": 45
  }
}
```

### 5. Get Location History (Admin)
```http
GET /api/radar/admin/location-history?userId=1&page=1&limit=50
Authorization: Bearer {admin_token}
```

### 6. Get Stats (Admin)
```http
GET /api/radar/admin/stats
Authorization: Bearer {admin_token}
```

---

## 📝 Posts & Feed

### 1. Create Post
```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "content": "Hello world! #gerindra @johndoe",
  "images": [file1, file2]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "Hello world! #gerindra @johndoe",
    "images": ["https://storage.com/image1.jpg"],
    "user": {
      "id": 1,
      "name": "John Doe",
      "foto": "https://storage.com/foto.jpg"
    },
    "likes_count": 0,
    "comments_count": 0,
    "views_count": 0,
    "hashtags": ["gerindra"],
    "mentions": ["johndoe"],
    "created_at": "2026-02-09T10:30:00.000Z"
  }
}
```

### 2. Get Feed
```http
GET /api/posts?page=1&limit=20
Authorization: Bearer {token}
```

### 3. Search Posts
```http
GET /api/posts/search?q=gerindra&page=1&limit=20
Authorization: Bearer {token}
```

### 4. Get Trending Posts
```http
GET /api/posts/trending?limit=20
Authorization: Bearer {token}
```

### 5. Get Mentioned Posts
```http
GET /api/posts/mentions?page=1&limit=20
Authorization: Bearer {token}
```

### 6. Get Posts by Hashtag
```http
GET /api/posts/hashtag/{hashtag}?page=1&limit=20
Authorization: Bearer {token}
```

### 7. Get Trending Hashtags
```http
GET /api/posts/hashtags/trending?limit=10
Authorization: Bearer {token}
```

### 8. Get Single Post
```http
GET /api/posts/{id}
Authorization: Bearer {token}
```

### 9. Delete Post
```http
DELETE /api/posts/{id}
Authorization: Bearer {token}
```

### 10. Toggle Like
```http
POST /api/posts/{id}/like
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likes_count": 15
  }
}
```

### 11. Track View
```http
POST /api/posts/{id}/view
Authorization: Bearer {token}
```

### 12. Add Comment
```http
POST /api/posts/{id}/comment
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Great post! @johndoe #agree"
}
```

### 13. Get Comments
```http
GET /api/posts/{id}/comments?page=1&limit=20
Authorization: Bearer {token}
```

### 14. Delete Comment
```http
DELETE /api/posts/{id}/comments/{commentId}
Authorization: Bearer {token}
```

---

## 💬 Messaging

### 1. Get or Create Conversation
```http
POST /api/conversations/get-or-create
Authorization: Bearer {token}
Content-Type: application/json

{
  "participantId": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "participants": [
      {
        "id": 1,
        "name": "John Doe",
        "foto": "https://storage.com/foto.jpg"
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "foto": "https://storage.com/foto2.jpg"
      }
    ],
    "lastMessage": {
      "content": "Hello!",
      "createdAt": "2026-02-09T10:30:00.000Z"
    },
    "unreadCount": 0,
    "createdAt": "2026-02-09T10:00:00.000Z"
  }
}
```

### 2. Get Conversations
```http
GET /api/conversations?page=1&limit=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 1,
        "participants": [...],
        "lastMessage": {...},
        "unreadCount": 3,
        "createdAt": "2026-02-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "hasMore": false
    }
  }
}
```

### 3. Get Messages
```http
GET /api/messages/{conversationId}/messages?page=1&limit=50
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "Hello!",
        "sender": {
          "id": 1,
          "name": "John Doe",
          "foto": "https://storage.com/foto.jpg"
        },
        "isRead": true,
        "createdAt": "2026-02-09T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "hasMore": false
    }
  }
}
```

### 4. Send Message
```http
POST /api/messages/{conversationId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello, how are you?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "Hello, how are you?",
    "senderId": 1,
    "conversationId": 1,
    "isRead": false,
    "createdAt": "2026-02-09T10:30:00.000Z"
  }
}
```

### 5. Mark as Read
```http
PUT /api/messages/{conversationId}/read
Authorization: Bearer {token}
```

---

## 📜 History

### 1. Get User History
```http
GET /api/history?page=1&limit=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": 1,
        "type": "post",
        "title": "Post by John Doe",
        "description": "Hello world! #gerindra",
        "thumbnail": "https://storage.com/thumb.jpg",
        "referenceId": 123,
        "createdAt": "2026-02-09T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "hasMore": true
    }
  }
}
```

### 2. Get History by Type
```http
GET /api/history/type/{type}?page=1&limit=20
Authorization: Bearer {token}
```

Types: `post`, `location`, `kta`, `message`

### 3. Delete Single History
```http
DELETE /api/history/{id}
Authorization: Bearer {token}
```

### 4. Clear All History
```http
DELETE /api/history
Authorization: Bearer {token}
```

---

## ⚙️ System Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-02-09T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 🚨 **ENDPOINTS YANG BELUM TERSEDIA**

Berdasarkan requirement Admin Web Panel, endpoint berikut **BELUM** diimplementasikan:

### 1. ❌ Kader Confirmation
- `GET /api/admin/kader/pending-confirmations` - Belum ada
- `POST /api/admin/kader/confirm-point` - Belum ada
- `GET /api/admin/kader/statistics` - Belum ada

### 2. ❌ Agenda Management
- `POST /api/admin/agenda` - Belum ada
- `GET /api/admin/agenda` - Belum ada
- `PUT /api/admin/agenda/{id}` - Belum ada
- `DELETE /api/admin/agenda/{id}` - Belum ada
- `GET /api/agenda` (public) - Belum ada

### 3. ❌ Announcements (My Gerindra)
- `POST /api/admin/announcements` - Belum ada
- `GET /api/admin/announcements` - Belum ada
- `PUT /api/admin/announcements/{id}` - Belum ada
- `DELETE /api/admin/announcements/{id}` - Belum ada
- `GET /api/announcements` (public) - Belum ada

### 4. ❌ Admin User Blocking
- `POST /api/admin/users/block` - Belum ada (berbeda dengan user block)
- `GET /api/admin/users/blocked` - Belum ada
- Database field `device_ip`, `is_blocked` belum ada

---

## 📊 Summary Endpoint Status

### ✅ **Available Endpoints:** 50+
- Auth: 5 endpoints
- Users: 13 endpoints
- KTA: 5 endpoints
- Radar: 6 endpoints
- Posts: 14 endpoints
- Messaging: 5 endpoints
- History: 4 endpoints
- System: 1 endpoint

### ❌ **Missing Endpoints:** 15+
- Kader Confirmation: 3 endpoints
- Agenda Management: 5 endpoints
- Announcements: 5 endpoints
- Admin User Blocking: 2 endpoints

---

## 🔄 Next Steps untuk Implementasi Lengkap

### 1. Database Migration
```sql
-- Tambah field untuk kader confirmation
ALTER TABLE users ADD COLUMN kader_point_1_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN kader_point_2_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN device_ip VARCHAR(45) NULL;
ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;

-- Buat table agenda
CREATE TABLE agendas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NULL,
  location VARCHAR(255),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat table announcements
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  image_url VARCHAR(500),
  type ENUM('sambutan', 'pengumuman', 'download', 'artikel'),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Backend Implementation
- [ ] Create Kader module dengan controller & service
- [ ] Create Agenda module dengan controller & service
- [ ] Create Announcement module dengan controller & service
- [ ] Update User module untuk admin blocking
- [ ] Add file upload middleware untuk announcements

### 3. Testing
- [ ] Test semua endpoint baru
- [ ] Integration testing dengan web admin
- [ ] Mobile app integration testing

---

## 📝 Notes

**Current Backend IP:** `http://10.194.77.48:3030`

**Status:** Backend sudah implement 50+ endpoints, namun untuk Admin Web Panel masih perlu 15+ endpoint tambahan.

**Prioritas:**
1. HIGH: Agenda Management (untuk mobile calendar)
2. HIGH: Announcements (untuk My Gerindra)
3. MEDIUM: Kader Confirmation
4. MEDIUM: Admin User Blocking dengan IP

---

**Last Updated:** 9 Februari 2026  
**API Version:** v1.0  
**Documentation Version:** 2.0
