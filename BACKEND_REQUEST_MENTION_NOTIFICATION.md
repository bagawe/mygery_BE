# Request Backend: Notifikasi Mention/Tag dalam Postingan

## 📋 Overview
Ketika user membuat postingan dan menyebut user lain dengan @username (mention/tag), user yang di-tag harus menerima notifikasi di riwayat mereka. Notifikasi ini harus bisa diklik untuk langsung mengarah ke detail postingan tersebut.

## 🎯 Tujuan
1. User yang di-tag dalam postingan akan menerima notifikasi di riwayat
2. Notifikasi tersebut bisa diklik dan langsung mengarah ke halaman detail postingan (bukan beranda)
3. Hanya riwayat yang berhubungan dengan postingan yang bisa diklik
4. Riwayat lain (login, logout, dll) tetap tidak bisa diklik

## 📱 Frontend Implementation (Sudah Selesai)

### 1. Model UserHistory
```dart
class UserHistory {
  final int id;
  final String type;
  final String? description;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final int? postId; // ID postingan untuk riwayat yang bisa diklik

  // Helper untuk cek apakah riwayat ini bisa diklik
  bool get isClickable => postId != null && 
    (type == 'mention' || type == 'tag' || type == 'create_post');
}
```

### 2. Fitur yang Sudah Diimplementasi
- ✅ Riwayat dengan type 'mention' atau 'tag' ditampilkan dengan icon @ (alternate_email)
- ✅ Warna khusus untuk riwayat mention/tag (deepOrange)
- ✅ Label: "Anda di-tag dalam postingan"
- ✅ OnTap handler untuk navigasi ke detail postingan
- ✅ Loading indicator saat fetch post detail
- ✅ Error handling jika post tidak ditemukan
- ✅ Visual indicator (chevron right icon + text hint) untuk item yang bisa diklik

### 3. UI/UX
- Item riwayat yang bisa diklik memiliki:
  - Icon panah kanan (chevron_right) di sebelah kanan
  - Text hint: "Ketuk untuk melihat postingan" (biru, italic, 11px)
  - OnTap handler yang membuka detail postingan
- Item riwayat yang tidak bisa diklik:
  - Tidak ada icon panah
  - Tidak ada text hint
  - OnTap = null (tidak ada aksi)

## 🔧 Backend Requirements

### 1. Endpoint: POST /api/posts
**Ketika user membuat postingan dengan mentions:**

Request body:
```json
{
  "content": "Halo @username1 dan @username2, ini postingan saya",
  "mentions": ["username1", "username2"],
  "location": "Jakarta (optional)",
  "images": ["file1.jpg", "file2.jpg"] // optional
}
```

**Yang perlu backend lakukan:**
1. Parse field `mentions` array
2. Untuk setiap username yang di-mention:
   - Cari user_id dari username tersebut
   - Insert ke tabel `history` dengan:
     ```sql
     INSERT INTO history (user_id, type, description, post_id, created_at)
     VALUES 
       (user_id_yang_di_mention, 'mention', 'Username A menyebut Anda dalam postingan', post_id, NOW()),
       (user_id_yang_di_mention_2, 'mention', 'Username A menyebut Anda dalam postingan', post_id, NOW());
     ```

### 2. Endpoint: GET /api/history
**Response harus include field `postId`:**

Response format:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "type": "mention",
      "description": "John Doe menyebut Anda dalam postingan",
      "postId": 456,  // ⚠️ PENTING: Field ini harus ada untuk riwayat mention/tag
      "metadata": {
        "device": "Android",
        "ip": "192.168.1.1"
      },
      "createdAt": "2026-01-05T10:30:00.000Z"
    },
    {
      "id": 124,
      "type": "login",
      "description": "Login dari perangkat mobile",
      "postId": null,  // Null untuk riwayat non-postingan
      "metadata": {...},
      "createdAt": "2026-01-05T09:00:00.000Z"
    }
  ]
}
```

### 3. Database Schema Update

**Tabel `history` perlu kolom baru:**
```sql
ALTER TABLE history 
ADD COLUMN post_id INT NULL,
ADD FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
```

**Atau jika membuat tabel baru:**
```sql
CREATE TABLE history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  post_id INT NULL,  -- NULL jika riwayat tidak berhubungan dengan postingan
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

### 4. Type History yang Perlu postId

| Type | Deskripsi | Perlu postId? | Clickable? |
|------|-----------|---------------|------------|
| `mention` | User di-tag dalam postingan | ✅ Ya | ✅ Ya |
| `tag` | User di-tag dalam postingan (alternatif) | ✅ Ya | ✅ Ya |
| `create_post` | User membuat postingan sendiri | ✅ Ya | ✅ Ya |
| `login` | User login | ❌ Tidak | ❌ Tidak |
| `logout` | User logout | ❌ Tidak | ❌ Tidak |
| `open_app` | User buka aplikasi | ❌ Tidak | ❌ Tidak |
| `edit_profile` | User edit profil | ❌ Tidak | ❌ Tidak |
| `search_user` | User search user lain | ❌ Tidak | ❌ Tidak |
| `search_post` | User search postingan | ❌ Tidak | ❌ Tidak |

## 🔄 Flow Lengkap

### Skenario: User A mention User B dalam postingan

1. **User A membuat postingan:**
   ```
   POST /api/posts
   {
     "content": "Halo @userB, lihat ini!",
     "mentions": ["userB"]
   }
   ```

2. **Backend process:**
   - Simpan postingan (dapat post_id = 456)
   - Parse mentions array
   - Cari user_id untuk username "userB" (misal user_id = 789)
   - Insert ke tabel history:
     ```sql
     INSERT INTO history (user_id, type, description, post_id)
     VALUES (789, 'mention', 'User A menyebut Anda dalam postingan', 456);
     ```

3. **User B buka halaman riwayat:**
   ```
   GET /api/history
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
         "postId": 456,  // Ada postId
         "createdAt": "2026-01-05T10:30:00.000Z"
       }
     ]
   }
   ```

4. **User B tap riwayat tersebut:**
   - Frontend memanggil `GET /api/posts/456` untuk fetch detail post
   - Navigate ke `PostDetailPage` dengan post tersebut
   - User B melihat postingan asli yang menyebut dia

## ✅ Testing Checklist

### Backend Testing:
- [ ] Endpoint POST /api/posts menerima field `mentions` (array of strings)
- [ ] Backend membuat entry history dengan type 'mention' untuk setiap user yang di-tag
- [ ] Field `postId` terisi dengan benar di tabel history
- [ ] Endpoint GET /api/history mengembalikan field `postId` untuk setiap item
- [ ] Jika post dihapus, history terkait juga terhapus (CASCADE) atau postId jadi null

### Frontend Testing:
- [x] Riwayat dengan postId menampilkan icon chevron right
- [x] Riwayat dengan postId menampilkan hint "Ketuk untuk melihat postingan"
- [x] Tap pada riwayat mention membuka detail postingan
- [x] Tap pada riwayat non-postingan tidak ada aksi (tidak error)
- [x] Loading indicator muncul saat fetch post detail
- [x] Error message jika post tidak ditemukan

### Integration Testing:
- [ ] User A mention User B → User B menerima notifikasi di riwayat
- [ ] User B tap notifikasi → Membuka detail postingan yang tepat
- [ ] Multiple mentions dalam satu postingan → Semua user yang di-tag menerima notifikasi
- [ ] Post dengan mention dihapus → Riwayat tetap ada tapi postId jadi null / tidak bisa diklik

## 📝 Notes

1. **Rekomendasi type name:** Gunakan `'mention'` untuk konsistensi dengan fitur @ mention
2. **Description format:** Sertakan nama user yang mention, contoh: "John Doe menyebut Anda dalam postingan"
3. **Notification real-time:** Jika menggunakan WebSocket/FCM, kirim push notification real-time
4. **Privacy:** Pastikan user yang di-mention bisa melihat postingan (tidak di-block)

## 🚀 Priority
**HIGH** - Fitur ini penting untuk engagement dan user experience

## 📞 Contact
Jika ada pertanyaan tentang implementasi frontend, hubungi tim frontend.

---
**Last Updated:** 5 Januari 2026
**Status:** Frontend ✅ Complete | Backend ⏳ Waiting Implementation
