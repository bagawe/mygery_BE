# Quick Reference: Auto-Suggest Endpoints for Admin Web

## 📌 Summary untuk FE Web Developer

Dokumentasi ini menjawab pertanyaan tentang auto-suggest dropdown untuk username dan IP address.

---

## 1️⃣ Username Auto-Suggest

### Endpoint
```
GET /api/users/search?q={keyword}&limit={number}
```

### Contoh Request
```javascript
axios.get('/api/users/search', {
  params: {
    q: 'john',      // keyword pencarian
    limit: 10       // optional, default 20
  }
})
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "uuid": "a1b2c3d4-...",
      "name": "John Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "fotoProfil": "https://...",
      "ktaVerified": true
    }
  ],
  "meta": {
    "total": 1,
    "limit": 10
  }
}
```

---

## 2️⃣ IP Address Auto-Suggest

### Endpoint
```
GET /api/admin/active-ips?q={ip}&limit={number}&includeBlocked={boolean}
```

### Contoh Request
```javascript
axios.get('/api/admin/active-ips', {
  params: {
    q: '192',              // optional, filter IP
    limit: 50,             // optional, default 50
    includeBlocked: false  // optional, default false
  }
})
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "deviceIp": "192.168.1.100",
      "userCount": 5,
      "lastSeen": "2026-02-12T10:30:00.000Z",
      "isBlocked": false,
      "users": [
        {
          "id": 10,
          "name": "John Doe",
          "email": "john@example.com"
        }
      ]
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "uniqueIPs": 1
  }
}
```

---

## 🎯 Quick Usage

### User Autocomplete Component
Sudah ada di dokumentasi lengkap: `UserAutocomplete.vue`
- Debounced search (300ms)
- Shows avatar, name, email
- KTA verified badge

### IP Autocomplete Component
Sudah ada di dokumentasi lengkap: `IPAutocomplete.vue`
- Shows user count per IP
- Last seen timestamp
- Manual IP entry support

---

## 📖 Dokumentasi Lengkap

Lihat file: **`docs/AUTO_SUGGEST_ENDPOINTS.md`**

Berisi:
- ✅ Detail endpoint specifications
- ✅ Complete Vue.js components (copy-paste ready)
- ✅ Composables untuk reusable logic
- ✅ Full page example: Block User Form
- ✅ Styling & animations
- ✅ Error handling
- ✅ Testing examples

---

## ✨ Features

**User Search:**
- ✅ Search by name, email, or username
- ✅ Case-insensitive
- ✅ Partial match
- ✅ Exclude current user
- ✅ Shows profile picture

**IP Search:**
- ✅ List all active IPs
- ✅ Show user count per IP
- ✅ Show associated users
- ✅ Filter by keyword
- ✅ Exclude blocked IPs option

---

## 🔐 Authentication

Kedua endpoint memerlukan authentication:

```javascript
// Set token di axios
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

**User Search:** Butuh token (any authenticated user)  
**IP Search:** Butuh token + **Admin role**

---

## 🧪 Test Endpoints

```bash
# Get admin token
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"Admin123!"}'

# Test user search
curl -X GET "http://localhost:3030/api/users/search?q=admin" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test IP search
curl -X GET "http://localhost:3030/api/admin/active-ips" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

**Created:** February 12, 2026  
**Backend URL:** http://localhost:3030/api  
**Full Documentation:** `docs/AUTO_SUGGEST_ENDPOINTS.md`
