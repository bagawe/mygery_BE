# 📚 HISTORY & MENTION NOTIFICATION API DOCUMENTATION

**Base URL:** `http://localhost:3030/api`  
**Last Updated:** December 30, 2025

---

## 🔐 Authentication

All history endpoints require Bearer Token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📊 **HISTORY ENDPOINTS**

### 1. Get User History

Get user's activity history with mention notifications.

**Endpoint:** `GET /api/history`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |

**Request Example:**
```bash
curl -X GET "http://localhost:3030/api/history?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "History retrieved successfully",
  "data": [
    {
      "id": 123,
      "type": "mention",
      "description": "John Doe menyebut Anda dalam postingan",
      "postId": 456,
      "metadata": {
        "mentionedBy": "John Doe",
        "mentionedAt": "2025-12-30T10:30:00.000Z"
      },
      "createdAt": "2025-12-30T10:30:00.000Z"
    },
    {
      "id": 124,
      "type": "create_post",
      "description": "Anda membuat postingan baru",
      "postId": 457,
      "metadata": {
        "hasImages": true,
        "imageCount": 2,
        "hasMentions": true,
        "mentionCount": 2
      },
      "createdAt": "2025-12-30T09:15:00.000Z"
    },
    {
      "id": 125,
      "type": "login",
      "description": "Login dari perangkat mobile",
      "postId": null,
      "metadata": {
        "device": "Android",
        "ip": "192.168.1.1"
      },
      "createdAt": "2025-12-30T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Notes:**
- `postId` will be `null` for non-post related history (login, logout, etc.)
- `postId` will have value for mention, tag, and create_post types
- Frontend can use `postId` to navigate to post detail page

---

### 2. Get History by Type

Get specific type of history (mention, login, etc.).

**Endpoint:** `GET /api/history/type/:type`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | History type (mention, tag, create_post, login, etc.) |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |

**Request Example:**
```bash
# Get only mention notifications
curl -X GET "http://localhost:3030/api/history/type/mention?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "mention history retrieved successfully",
  "data": [
    {
      "id": 123,
      "type": "mention",
      "description": "John Doe menyebut Anda dalam postingan",
      "postId": 456,
      "metadata": {
        "mentionedBy": "John Doe",
        "mentionedAt": "2025-12-30T10:30:00.000Z"
      },
      "createdAt": "2025-12-30T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 3. Delete History Entry

Delete specific history entry.

**Endpoint:** `DELETE /api/history/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | History ID |

**Request Example:**
```bash
curl -X DELETE "http://localhost:3030/api/history/123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "History deleted successfully",
  "data": null
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "History not found or unauthorized"
}
```

---

### 4. Clear All History

Delete all user history.

**Endpoint:** `DELETE /api/history`

**Request Example:**
```bash
curl -X DELETE "http://localhost:3030/api/history" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "All history cleared successfully",
  "data": null
}
```

---

## 🔔 **MENTION NOTIFICATION FEATURE**

### How Mentions Work

When a user creates a post with mentions (e.g., "@username"), the system automatically:

1. **Extracts mentions** from post content
2. **Finds mentioned users** by username
3. **Creates history entries** for each mentioned user
4. **Links to the post** via `postId` field

### Create Post with Mentions

**Endpoint:** `POST /api/posts`

**Request Body:**
```json
{
  "content": "Hello @johndoe and @janesmith, check this out! #awesome"
}
```

**What Happens:**
1. Post is created (e.g., postId = 456)
2. System extracts mentions: `["johndoe", "janesmith"]`
3. For each mention:
   - Find user by username
   - Create history entry:
     ```json
     {
       "userId": <mentioned_user_id>,
       "type": "mention",
       "description": "Author Name menyebut Anda dalam postingan",
       "postId": 456,
       "metadata": {
         "mentionedBy": "Author Name",
         "mentionedAt": "2025-12-30T10:30:00.000Z"
       }
     }
     ```

### Mention Notification Flow

**Step 1: User A creates post mentioning User B**
```bash
curl -X POST "http://localhost:3030/api/posts" \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -F "content=Hey @userB, look at this!"
```

**Step 2: User B checks history**
```bash
curl -X GET "http://localhost:3030/api/history" \
  -H "Authorization: Bearer USER_B_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 999,
      "type": "mention",
      "description": "User A menyebut Anda dalam postingan",
      "postId": 456,
      "createdAt": "2025-12-30T10:30:00.000Z"
    }
  ]
}
```

**Step 3: User B taps notification (Frontend)**
- Frontend checks `postId` is not null
- Fetches post detail: `GET /api/posts/456`
- Navigates to PostDetailPage

---

## 📋 **HISTORY TYPES**

| Type | Description | postId | Clickable |
|------|-------------|--------|-----------|
| `mention` | User tagged in post | ✅ Yes | ✅ Yes |
| `tag` | User tagged (alternative) | ✅ Yes | ✅ Yes |
| `create_post` | User created post | ✅ Yes | ✅ Yes |
| `login` | User logged in | ❌ No | ❌ No |
| `logout` | User logged out | ❌ No | ❌ No |
| `open_app` | User opened app | ❌ No | ❌ No |
| `edit_profile` | User edited profile | ❌ No | ❌ No |

---

## 🧪 **TESTING**

### Test 1: Create Post with Mentions
```bash
export TOKEN="your_token"

# Create post with mentions
curl -X POST "http://localhost:3030/api/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -F "content=Testing mentions @admin @testuser #hello"
```

### Test 2: Check History
```bash
# Get all history
curl -X GET "http://localhost:3030/api/history" \
  -H "Authorization: Bearer $TOKEN"

# Get only mentions
curl -X GET "http://localhost:3030/api/history/type/mention" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3: Delete History
```bash
# Delete specific entry
curl -X DELETE "http://localhost:3030/api/history/123" \
  -H "Authorization: Bearer $TOKEN"

# Clear all history
curl -X DELETE "http://localhost:3030/api/history" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ **ERROR CODES**

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 💡 **FRONTEND INTEGRATION TIPS**

### Check if History is Clickable
```dart
bool isClickable = history.postId != null && 
  (history.type == 'mention' || 
   history.type == 'tag' || 
   history.type == 'create_post');
```

### Navigate to Post
```dart
if (isClickable) {
  final post = await PostService.getPostById(history.postId);
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => PostDetailPage(post: post),
    ),
  );
}
```

---

**END OF DOCUMENTATION**