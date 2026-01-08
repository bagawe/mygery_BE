# 🚀 FRONTEND INTEGRATION GUIDE - Mention Notification Feature

**Status:** ✅ **READY FOR INTEGRATION**  
**Backend Version:** 1.0.0  
**Date:** January 5, 2026  
**Branch:** `heri01`

---

## 📋 **OVERVIEW**

Fitur **Mention Notification** sudah **100% complete** di backend dan siap untuk diintegrasikan dengan Flutter.

### **What's New:**
- ✅ User mendapat notifikasi ketika di-mention dalam post
- ✅ Notifikasi **clickable** - tap untuk langsung ke post detail
- ✅ History API sekarang include `postId` field
- ✅ Support multiple mentions dalam satu post
- ✅ Auto-detect mentions dari post content

---

## 🎯 **FITUR YANG SUDAH READY**

### 1️⃣ **Mention Detection**
Backend otomatis detect mention dari post content:
- Format: `@username`
- Case insensitive
- Support multiple mentions: `@user1 @user2 @user3`

### 2️⃣ **Notification System**
- User yang di-mention otomatis dapat notifikasi di history
- Type: `mention`
- Include `postId` untuk navigation
- Include metadata (mentionedBy, mentionedAt)

### 3️⃣ **Clickable History**
- History entries dengan `postId != null` bisa diklik
- Tap notifikasi → langsung ke post detail
- Frontend sudah prepare logic di `RiwayatPage`

---

## 🔌 **API ENDPOINTS READY**

### **1. Get User History**

**Endpoint:** `GET /api/history`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "message": "History retrieved successfully",
  "data": [
    {
      "id": 1,
      "type": "mention",
      "description": "Admin User menyebut Anda dalam postingan",
      "postId": 123,  // ⚠️ NEW FIELD - Use this for navigation
      "metadata": {
        "mentionedBy": "Admin User",
        "mentionedAt": "2026-01-05T16:38:30.758Z"
      },
      "createdAt": "2026-01-05T16:38:30.759Z"
    },
    {
      "id": 2,
      "type": "create_post",
      "description": "Anda membuat postingan baru",
      "postId": 124,  // ⚠️ NEW FIELD
      "metadata": {
        "hasImages": true,
        "imageCount": 2,
        "hasMentions": true,
        "mentionCount": 2
      },
      "createdAt": "2026-01-05T16:38:30.762Z"
    },
    {
      "id": 3,
      "type": "login",
      "description": "Login dari perangkat mobile",
      "postId": null,  // Non-post history = null
      "metadata": {
        "device": "Android",
        "ip": "192.168.1.1"
      },
      "createdAt": "2026-01-05T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### **2. Get History by Type**

**Endpoint:** `GET /api/history/type/:type`

**Example:** Get only mentions
```
GET /api/history/type/mention
```

**Response:**
```json
{
  "success": true,
  "message": "mention history retrieved successfully",
  "data": [
    {
      "id": 1,
      "type": "mention",
      "description": "John Doe menyebut Anda dalam postingan",
      "postId": 456,
      "metadata": {
        "mentionedBy": "John Doe",
        "mentionedAt": "2026-01-05T14:20:00.000Z"
      },
      "createdAt": "2026-01-05T14:20:00.000Z"
    }
  ]
}
```

---

### **3. Get Post Detail (for Navigation)**

**Endpoint:** `GET /api/posts/{postId}`

**Example:**
```
GET /api/posts/123
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 123,
    "userId": 5,
    "content": "Hello @username, check this out! #awesome",
    "imageUrl": "https://example.com/image.jpg",
    "imageUrls": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "createdAt": "2026-01-05T10:30:00.000Z",
    "user": {
      "id": 5,
      "uuid": "abc-123",
      "name": "John Doe",
      "username": "johndoe",
      "fotoProfil": "https://example.com/avatar.jpg"
    },
    "likeCount": 45,
    "commentCount": 12,
    "likedByMe": false
  }
}
```

---

## 🔧 **FLUTTER MODEL UPDATE REQUIRED**

### **UserHistory Model**

Update model dengan field baru `postId`:

```dart
class UserHistory {
  final int id;
  final String type;
  final String? description;
  final int? postId;  // ⚠️ NEW FIELD - REQUIRED
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  UserHistory({
    required this.id,
    required this.type,
    this.description,
    this.postId,  // ⚠️ ADD THIS
    this.metadata,
    required this.createdAt,
  });

  // ⚠️ NEW GETTER - Check if history is clickable
  bool get isClickable {
    return postId != null && 
      (type == 'mention' || type == 'tag' || type == 'create_post');
  }

  factory UserHistory.fromJson(Map<String, dynamic> json) {
    return UserHistory(
      id: json['id'],
      type: json['type'],
      description: json['description'],
      postId: json['postId'],  // ⚠️ ADD THIS
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

---

## 🎨 **UI IMPLEMENTATION GUIDE**

### **1. RiwayatPage - Update ListTile**

```dart
Widget _buildHistoryItem(UserHistory history) {
  return ListTile(
    leading: CircleAvatar(
      backgroundColor: _getIconColor(history.type),
      child: Icon(_getIcon(history.type), color: Colors.white),
    ),
    title: Text(history.description ?? ''),
    subtitle: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _formatDate(history.createdAt),
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
        // ⚠️ NEW: Show hint for clickable items
        if (history.isClickable)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Ketuk untuk melihat postingan',
              style: TextStyle(
                fontSize: 11,
                color: Colors.blue,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
      ],
    ),
    // ⚠️ NEW: Add trailing icon for clickable items
    trailing: history.isClickable
        ? Icon(Icons.chevron_right, color: Colors.grey)
        : null,
    // ⚠️ NEW: Add onTap handler
    onTap: history.isClickable
        ? () => _navigateToPost(context, history.postId!)
        : null,
  );
}
```

---

### **2. Navigation to Post Detail**

```dart
Future<void> _navigateToPost(BuildContext context, int postId) async {
  // Show loading
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => Center(child: CircularProgressIndicator()),
  );

  try {
    // Fetch post detail
    final post = await PostService.getPostById(postId);
    
    // Close loading
    Navigator.pop(context);
    
    // Navigate to post detail
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PostDetailPage(post: post),
      ),
    );
  } catch (e) {
    // Close loading
    Navigator.pop(context);
    
    // Show error
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Post tidak ditemukan atau telah dihapus'),
        backgroundColor: Colors.red,
      ),
    );
  }
}
```

---

### **3. Icon & Color for Mention Type**

```dart
IconData _getIcon(String type) {
  switch (type) {
    case 'mention':
    case 'tag':
      return Icons.alternate_email;  // @ icon
    case 'create_post':
      return Icons.add_circle;
    case 'login':
      return Icons.login;
    default:
      return Icons.history;
  }
}

Color _getIconColor(String type) {
  switch (type) {
    case 'mention':
    case 'tag':
      return Colors.deepOrange;  // Special color for mentions
    case 'create_post':
      return Colors.blue;
    case 'login':
      return Colors.green;
    default:
      return Colors.grey;
  }
}
```

---

## 🧪 **TESTING CHECKLIST**

### **Frontend Testing:**

- [ ] Update `UserHistory` model dengan field `postId`
- [ ] Update `fromJson` factory method
- [ ] Add `isClickable` getter
- [ ] Update `RiwayatPage` UI dengan:
  - [ ] Chevron icon untuk clickable items
  - [ ] Hint text "Ketuk untuk melihat postingan"
  - [ ] onTap handler
- [ ] Test navigation ke post detail
- [ ] Test error handling (post dihapus)
- [ ] Test loading indicator
- [ ] Test visual indicators (icon @ orange)

### **Integration Testing:**

- [ ] User A mention User B
- [ ] User B dapat notifikasi di history
- [ ] User B tap notifikasi
- [ ] Navigasi ke post detail berhasil
- [ ] Post detail menampilkan konten yang benar
- [ ] Non-clickable history tidak ada onTap

---

## 📊 **DATA FLOW**

```
┌─────────────────────────────────────────────────────────────┐
│  User A creates post: "Hello @userB, check this!"          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend detects mention: @userB                            │
│  Creates history for User B:                                │
│  - type: 'mention'                                          │
│  - description: 'User A menyebut Anda dalam postingan'      │
│  - postId: 123  ← IMPORTANT                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  User B opens RiwayatPage                                   │
│  GET /api/history                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Frontend receives history with postId                      │
│  Shows:                                                     │
│  - Icon: @ (orange)                                         │
│  - Text: "User A menyebut Anda dalam postingan"            │
│  - Hint: "Ketuk untuk melihat postingan" (blue)            │
│  - Trailing: Chevron right                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  User B taps on history item                                │
│  onTap: _navigateToPost(context, 123)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Frontend calls: GET /api/posts/123                         │
│  Receives post detail                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Navigate to PostDetailPage with post data                  │
│  User B sees the original post                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚦 **HISTORY TYPES REFERENCE**

| Type | postId | Clickable | Icon | Color | Action |
|------|--------|-----------|------|-------|--------|
| `mention` | ✅ Yes | ✅ Yes | @ | Orange | Navigate to post |
| `tag` | ✅ Yes | ✅ Yes | @ | Orange | Navigate to post |
| `create_post` | ✅ Yes | ✅ Yes | + | Blue | Navigate to post |
| `login` | ❌ No | ❌ No | 🔑 | Green | No action |
| `logout` | ❌ No | ❌ No | 🚪 | Grey | No action |
| `open_app` | ❌ No | ❌ No | 📱 | Grey | No action |
| `edit_profile` | ❌ No | ❌ No | 👤 | Grey | No action |

---

## ⚠️ **IMPORTANT NOTES**

### **1. Null Safety**
```dart
// ✅ GOOD
if (history.postId != null) {
  navigateToPost(history.postId!);
}

// ❌ BAD
navigateToPost(history.postId);  // May crash if null
```

### **2. Error Handling**
```dart
try {
  final post = await PostService.getPostById(postId);
  // Navigate
} catch (e) {
  // Show error - post may have been deleted
  showSnackBar('Post tidak ditemukan');
}
```

### **3. Loading State**
Always show loading indicator saat fetch post detail untuk UX yang baik.

---

## 🔗 **BACKEND DOCUMENTATION**

Full backend documentation tersedia di:
- `HISTORY_API_DOCUMENTATION.md` - Complete API reference
- `TESTING_MENTION_FEATURE.md` - Testing guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## 📞 **SUPPORT**

### **Backend Team:**
- ✅ Feature complete dan tested
- ✅ Migration sudah dijalankan
- ✅ Endpoints ready di branch `heri01`

### **Questions?**
Contact backend team jika ada pertanyaan tentang:
- API response format
- Error handling
- Additional features

---

## ✅ **READY TO INTEGRATE**

**Status:** ✅ **PRODUCTION READY**

**What You Need:**
1. Update `UserHistory` model (add `postId` field)
2. Update `RiwayatPage` UI (add clickable behavior)
3. Test navigation flow
4. Deploy to production

**Estimated Integration Time:** 2-4 hours

---

## 🎯 **SUCCESS CRITERIA**

Integration berhasil jika:
- ✅ User dapat notifikasi ketika di-mention
- ✅ Notifikasi menampilkan icon @ orange
- ✅ Notifikasi menampilkan hint text biru
- ✅ Tap notifikasi membuka post detail
- ✅ Error handling bekerja dengan baik
- ✅ Loading indicator muncul
- ✅ Non-clickable history tidak bisa di-tap

---

**Happy Coding! 🚀**

---

**Last Updated:** January 5, 2026  
**Backend Branch:** `heri01`  
**Backend Commit:** `9984f55`  
**Status:** ✅ Ready for Integration