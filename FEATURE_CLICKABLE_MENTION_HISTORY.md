# Implementasi Fitur: Riwayat Mention/Tag yang Clickable

## ✅ Status: Frontend SELESAI | Backend MENUNGGU

## 📋 Yang Sudah Diimplementasi (Frontend)

### 1. Model UserHistory (`lib/models/user_history.dart`)
**Perubahan:**
- ✅ Tambah field `postId` (nullable) untuk menyimpan ID postingan
- ✅ Tambah getter `isClickable` yang return true jika:
  - `postId` tidak null DAN
  - `type` adalah 'mention', 'tag', atau 'create_post'

```dart
class UserHistory {
  final int? postId;
  
  bool get isClickable => postId != null && 
    (type == 'mention' || type == 'tag' || type == 'create_post');
}
```

### 2. RiwayatPage (`lib/pages/riwayat/riwayat_page.dart`)
**Perubahan:**

#### Icon untuk mention/tag:
- ✅ Type 'mention' dan 'tag' menggunakan icon `Icons.alternate_email` (@)
- ✅ Warna khusus: `Colors.deepOrange`
- ✅ Label: "Anda di-tag dalam postingan"

#### Fungsi navigasi:
- ✅ Method `_navigateToPost(context, postId)` yang:
  - Tampilkan loading indicator
  - Fetch post detail by ID menggunakan `PostService.getPostById()`
  - Navigate ke `PostDetailPage` dengan post tersebut
  - Handle error jika post tidak ditemukan

#### UI ListTile:
- ✅ **onTap:** Hanya ada jika `h.isClickable == true`
- ✅ **trailing:** Icon chevron right hanya untuk item clickable
- ✅ **subtitle:** Tambah hint text "Ketuk untuk melihat postingan" (biru, italic) untuk item clickable

#### Visual Indicators:
```dart
// Item yang BISA diklik:
- Icon chevron right di sebelah kanan
- Text hint biru: "Ketuk untuk melihat postingan"
- OnTap handler aktif

// Item yang TIDAK bisa diklik:
- Tidak ada chevron
- Tidak ada hint text
- OnTap = null
```

### 3. PostService (`lib/services/post_service.dart`)
**Perubahan:**
- ✅ Tambah method `getPostById(int postId)` sebagai helper untuk:
  - Memanggil `getPostDetail(postId)`
  - Return `PostModel` langsung (bukan wrapped dalam `ApiResponse`)
  - Throw exception jika post tidak ditemukan

```dart
Future<PostModel> getPostById(int postId) async {
  final response = await getPostDetail(postId);
  if (response.success && response.data != null) {
    return response.data!;
  } else {
    throw Exception(response.message ?? 'Post tidak ditemukan');
  }
}
```

## 🔧 Yang Perlu Backend Implementasi

### 1. Database Schema
**Tabel `history` perlu kolom baru:**
```sql
ALTER TABLE history 
ADD COLUMN post_id INT NULL,
ADD FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
```

### 2. Endpoint POST /api/posts
**Ketika user buat postingan dengan mentions:**
```javascript
// Request body
{
  "content": "Halo @username1 dan @username2",
  "mentions": ["username1", "username2"]
}

// Backend harus:
1. Parse array mentions
2. Untuk setiap username:
   - Cari user_id
   - Insert ke tabel history:
     INSERT INTO history (user_id, type, description, post_id)
     VALUES (target_user_id, 'mention', 'User A menyebut Anda', post_id);
```

### 3. Endpoint GET /api/history
**Response harus include field `postId`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "type": "mention",
      "description": "John menyebut Anda dalam postingan",
      "postId": 456,  // ⚠️ WAJIB ada untuk mention/tag
      "createdAt": "2026-01-05T10:30:00.000Z"
    },
    {
      "id": 124,
      "type": "login",
      "description": "Login dari mobile",
      "postId": null,  // null untuk non-postingan
      "createdAt": "2026-01-05T09:00:00.000Z"
    }
  ]
}
```

## 🎯 Flow Lengkap

### User A mention User B:
1. **User A create post:**
   ```
   POST /api/posts
   Body: { content: "@userB lihat ini!", mentions: ["userB"] }
   ```

2. **Backend:**
   - Simpan post (dapat post_id = 456)
   - Cari user_id dari "userB" (misal = 789)
   - Insert history:
     ```sql
     INSERT INTO history (user_id, type, description, post_id)
     VALUES (789, 'mention', 'User A menyebut Anda', 456);
     ```

3. **User B buka riwayat:**
   - Lihat notifikasi: "Anda di-tag dalam postingan"
   - Ada icon @ warna orange
   - Ada chevron right + hint text biru
   - **BISA DIKLIK**

4. **User B tap notifikasi:**
   - Loading muncul
   - Fetch `GET /api/posts/456`
   - Buka `PostDetailPage` dengan post tersebut
   - User B lihat postingan asli

### User login (non-postingan):
- Riwayat login **TIDAK BISA DIKLIK** karena:
  - `postId = null`
  - `isClickable = false`
  - Tidak ada chevron, tidak ada hint text
  - OnTap = null

## 📊 Tabel Type History

| Type | Deskripsi | postId | Clickable |
|------|-----------|--------|-----------|
| `mention` | Di-tag dalam post | ✅ Ada | ✅ Ya |
| `tag` | Di-tag (alternatif) | ✅ Ada | ✅ Ya |
| `create_post` | Buat post sendiri | ✅ Ada | ✅ Ya |
| `login` | Login aplikasi | ❌ Null | ❌ Tidak |
| `logout` | Logout aplikasi | ❌ Null | ❌ Tidak |
| `open_app` | Buka aplikasi | ❌ Null | ❌ Tidak |
| `edit_profile` | Edit profil | ❌ Null | ❌ Tidak |

## 🧪 Testing

### Frontend (Sudah Bisa Ditest):
- [x] Riwayat mention tampil dengan icon @ orange
- [x] Ada chevron right untuk item clickable
- [x] Ada hint text "Ketuk untuk melihat postingan"
- [x] Tap pada mention membuka loading
- [x] Error handling jika post tidak ditemukan
- [x] Riwayat login tidak bisa diklik (onTap = null)

### Backend (Perlu Implementasi):
- [ ] POST /api/posts menerima field `mentions`
- [ ] Backend create history entry untuk setiap mention
- [ ] GET /api/history return field `postId`
- [ ] Database memiliki kolom `post_id` di tabel history

### Integration Testing:
- [ ] User A mention User B → User B dapat notifikasi
- [ ] User B tap notifikasi → Buka detail post yang benar
- [ ] Multiple mentions → Semua user dapat notifikasi
- [ ] Post dihapus → History tetap ada tapi tidak bisa diklik

## 📁 File yang Diubah

1. ✅ `lib/models/user_history.dart` - Tambah postId & isClickable
2. ✅ `lib/pages/riwayat/riwayat_page.dart` - UI & navigation logic
3. ✅ `lib/services/post_service.dart` - Helper getPostById()
4. ✅ `dokumentasiBE/BACKEND_REQUEST_MENTION_NOTIFICATION.md` - Dokumentasi lengkap untuk backend

## 🚀 Next Steps

### Untuk Backend Developer:
1. Baca dokumentasi lengkap di `dokumentasiBE/BACKEND_REQUEST_MENTION_NOTIFICATION.md`
2. Tambah kolom `post_id` ke tabel history
3. Update endpoint POST /api/posts untuk handle mentions
4. Update endpoint GET /api/history untuk return postId
5. Testing dengan frontend

### Untuk Frontend Developer:
1. ✅ Implementasi selesai
2. Siap untuk testing ketika backend ready
3. Monitor console log untuk debug flow

## 💡 Catatan Penting

1. **Hanya riwayat postingan yang clickable** - Sesuai permintaan user
2. **Visual feedback jelas** - User tahu mana yang bisa diklik
3. **Error handling lengkap** - Tidak crash jika post dihapus
4. **Loading indicator** - UX baik saat fetch post

---
**Dibuat:** 5 Januari 2026  
**Status:** Frontend ✅ Complete | Backend ⏳ Pending
