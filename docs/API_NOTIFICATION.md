# 📬 API Notification — Permintaan Endpoint Backend

> **Dokumen ini berisi spesifikasi endpoint notifikasi yang dibutuhkan oleh frontend.**  
> Backend perlu mengimplementasikan endpoint-endpoint berikut agar fitur notifikasi berfungsi penuh.

---

## 📋 Ringkasan

| No | Method | Endpoint | Deskripsi |
|----|--------|----------|-----------|
| 1 | `GET` | `/api/notifications` | Ambil daftar notifikasi user |
| 2 | `GET` | `/api/notifications/unread/count` | Ambil jumlah notifikasi belum dibaca |
| 3 | `PUT` | `/api/notifications/:id/read` | Tandai 1 notifikasi sudah dibaca |
| 4 | `PUT` | `/api/notifications/read-all` | Tandai semua notifikasi sudah dibaca |
| 5 | `DELETE` | `/api/notifications/:id` | Hapus 1 notifikasi |
| 6 | `DELETE` | `/api/notifications/delete-all` | Hapus semua notifikasi user |

### ⚡ Auto-Create (Backend Internal)

Notifikasi **TIDAK dibuat oleh frontend**. Backend harus **otomatis membuat notifikasi** saat:
- User A **like** postingan User B → Buat notifikasi untuk User B
- User A **comment** di postingan User B → Buat notifikasi untuk User B
- **JANGAN** buat notifikasi jika user like/comment postingan **sendiri**

---

## 1️⃣ GET `/api/notifications`

Ambil daftar notifikasi milik user yang sedang login.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `page` | int | 1 | Halaman |
| `limit` | int | 20 | Jumlah per halaman |

### Response Success `200`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "type": "like",
      "postId": 55,
      "commentId": null,
      "fromUserName": "Ahmad Fauzi",
      "fromUserUsername": "ahmadfauzi",
      "message": null,
      "createdAt": "2026-04-07T10:30:00.000Z",
      "isRead": false
    },
    {
      "id": 2,
      "userId": 10,
      "type": "comment",
      "postId": 55,
      "commentId": 123,
      "fromUserName": "Budi Santoso",
      "fromUserUsername": "budisantoso",
      "message": "Mantap sekali postingannya!",
      "createdAt": "2026-04-07T09:15:00.000Z",
      "isRead": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1,
    "hasNextPage": false
  }
}
```

### Response Kosong `200`
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false
  }
}
```

### Field Deskripsi

| Field | Type | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `id` | int | ❌ | ID notifikasi |
| `userId` | int | ❌ | ID pemilik notifikasi (yang menerima) |
| `type` | string | ❌ | Tipe: `"like"` atau `"comment"` |
| `postId` | int | ✅ | ID postingan terkait |
| `commentId` | int | ✅ | ID komentar terkait (untuk type comment) |
| `fromUserName` | string | ❌ | Nama user yang melakukan aksi |
| `fromUserUsername` | string | ❌ | Username user yang melakukan aksi |
| `message` | string | ✅ | Isi komentar (hanya untuk type "comment") |
| `createdAt` | datetime | ❌ | Waktu notifikasi dibuat (ISO 8601) |
| `isRead` | boolean | ❌ | Status sudah dibaca atau belum |

---

## 2️⃣ GET `/api/notifications/unread/count`

Ambil jumlah notifikasi yang belum dibaca.

### Headers
```
Authorization: Bearer <access_token>
```

### Response `200`
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## 3️⃣ PUT `/api/notifications/:id/read`

Tandai 1 notifikasi sebagai sudah dibaca.

### Headers
```
Authorization: Bearer <access_token>
```

### Path Parameters
| Parameter | Type | Deskripsi |
|-----------|------|-----------|
| `id` | int | ID notifikasi |

### Request Body
```json
{}
```

### Response `200`
```json
{
  "success": true,
  "message": "Notifikasi ditandai sudah dibaca"
}
```

### Response `404`
```json
{
  "success": false,
  "message": "Notifikasi tidak ditemukan"
}
```

---

## 4️⃣ PUT `/api/notifications/read-all`

Tandai semua notifikasi user sebagai sudah dibaca.

### Headers
```
Authorization: Bearer <access_token>
```

### Request Body
```json
{}
```

### Response `200`
```json
{
  "success": true,
  "message": "Semua notifikasi ditandai sudah dibaca"
}
```

---

## 5️⃣ DELETE `/api/notifications/:id`

Hapus 1 notifikasi.

### Headers
```
Authorization: Bearer <access_token>
```

### Path Parameters
| Parameter | Type | Deskripsi |
|-----------|------|-----------|
| `id` | int | ID notifikasi |

### Response `200`
```json
{
  "success": true,
  "message": "Notifikasi dihapus"
}
```

---

## 6️⃣ DELETE `/api/notifications/delete-all`

Hapus semua notifikasi user.

### Headers
```
Authorization: Bearer <access_token>
```

### Response `200`
```json
{
  "success": true,
  "message": "Semua notifikasi dihapus"
}
```

---

## ⚡ Auto-Create: Logika di Backend

Backend harus otomatis membuat notifikasi di **2 tempat**:

### A. Saat Like Post

**Trigger**: Ketika endpoint `POST /api/posts/:postId/like` dipanggil

```
Logika:
1. User A like postingan milik User B
2. Jika A ≠ B (bukan like sendiri):
   → INSERT ke tabel notifications:
     - userId = B.id (pemilik post)
     - type = "like"
     - postId = postId
     - fromUserName = A.name
     - fromUserUsername = A.username
     - isRead = false
3. Jika A == B → SKIP (jangan buat notifikasi)
4. Jika unlike (toggle off) → Boleh hapus notifikasi like sebelumnya (opsional)
```

### B. Saat Comment Post

**Trigger**: Ketika endpoint `POST /api/posts/:postId/comment` dipanggil

```
Logika:
1. User A comment di postingan milik User B
2. Jika A ≠ B (bukan comment sendiri):
   → INSERT ke tabel notifications:
     - userId = B.id (pemilik post)
     - type = "comment"
     - postId = postId
     - commentId = newComment.id
     - fromUserName = A.name
     - fromUserUsername = A.username
     - message = isi komentar (potong maks 100 karakter)
     - isRead = false
3. Jika A == B → SKIP
```

---

## 🗃️ Saran Schema Database

### Tabel `notifications`

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,             -- Penerima notifikasi
  type ENUM('like', 'comment') NOT NULL,
  postId INT NULL,
  commentId INT NULL,
  fromUserId INT NOT NULL,         -- Pengirim/pelaku aksi
  fromUserName VARCHAR(255) NOT NULL,
  fromUserUsername VARCHAR(255) NOT NULL,
  message TEXT NULL,               -- Isi komentar (untuk type comment)
  isRead BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (userId),
  INDEX idx_user_read (userId, isRead),
  INDEX idx_created (createdAt),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (fromUserId) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔍 Catatan Tambahan dari Frontend

### Format Role di API Response

Frontend mendeteksi role dari 2 endpoint yang formatnya **berbeda**:

| Endpoint | Format Role | Contoh |
|----------|-------------|--------|
| `POST /api/auth/login` | Bisa `user.role` (string) atau `user.roles` (array) | `"role": "kader"` ATAU `"roles": [{"role":"kader"}]` |
| `GET /api/users/profile` | `data.roles` (array of objects) | `"roles": [{"id":1, "role":"kader", ...}]` |

**Permintaan**: Tolong pastikan **kedua endpoint** menyertakan role yang sudah terupdate dari database, bukan dari cache/JWT. Frontend sudah handle kedua format.

### Testing Checklist

- [ ] User A like post User B → User B terima notifikasi type "like"
- [ ] User A comment post User B → User B terima notifikasi type "comment"
- [ ] User A like post sendiri → TIDAK ada notifikasi
- [ ] User B buka halaman notifikasi → Muncul list notifikasi
- [ ] User B klik "Tandai Semua" → Semua isRead jadi true
- [ ] User B hapus notifikasi → Notifikasi hilang
- [ ] Count unread terupdate setelah mark read
- [ ] Role "kader" yang sudah diupdate admin terdeteksi di `GET /api/users/profile`

---

## 📌 Prioritas Implementasi

1. **TINGGI** — Auto-create notifikasi di endpoint like & comment
2. **TINGGI** — `GET /api/notifications` (list)
3. **SEDANG** — `PUT /api/notifications/:id/read` (mark read)
4. **SEDANG** — `PUT /api/notifications/read-all` (mark all)
5. **SEDANG** — `GET /api/notifications/unread/count` (badge count)
6. **RENDAH** — `DELETE /api/notifications/:id` dan `delete-all`

> **Setelah backend siap**, frontend tinggal mengubah `NotificationService` dari local storage kembali ke API calls. Struktur UI sudah selesai.
