# Role Change — Response dari Backend Team

**Tanggal**: 31 Maret 2026  
**Dibuat oleh**: Backend Team  
**Merespons dokumen**: `ROLE_CHANGE_SPEC_FOR_BACKEND_AND_MOBILE.md`  
**Status**: ✅ BUG DITEMUKAN & SUDAH DIFIX

---

## 🔍 Hasil Analisis

Setelah analisis kode, ditemukan **2 bug di Backend** yang menyebabkan masalah ini. Bukan di Mobile.

---

## 🔴 Bug yang Ditemukan

### Bug #1 — `authMiddleware.js` (KRITIS) ← **Root Cause Utama**

**File**: `src/middlewares/authMiddleware.js`

**Masalah**: Middleware mengambil **semua role** termasuk yang sudah `isActive: false`, lalu mengambil `roleNames[0]` sebagai primary role.

```javascript
// ❌ KODE LAMA — SALAH
const user = await prisma.user.findUnique({ 
  where: { id: payload.userId },
  include: { roles: true }          // ← ambil SEMUA role, termasuk isActive=false
});

const roleNames = user.roles.map(r => r.name || r.role);  // ← r.name TIDAK ADA di schema!
req.user = {
  role: roleNames[0] || 'simpatisan'  // ← ambil index [0], bisa jadi role lama
};
```

**Dampak**:
- Setelah user diverifikasi, tabel `UserRole` berisi 2 baris:
  - `{ role: 'simpatisan', isActive: false }` — role lama
  - `{ role: 'kader', isActive: true }` — role baru
- `roleNames[0]` bisa mengambil `simpatisan` (yang `isActive: false`) karena urutan tidak dijamin
- Akibatnya `req.user.role` tetap `simpatisan` → `authorizeRole` menolak akses fitur kader

---

### Bug #2 — `kader.service.js` — Response tidak ada field `role`

**File**: `src/modules/kader/kader.service.js`

**Masalah**: Response `confirmPoint2` mengembalikan semua roles termasuk yang sudah di-deactivate, tanpa field `role` yang menunjukkan role aktif.

```javascript
// ❌ KODE LAMA — response tidak ada field "role"
return updated;
// updated.roles = [
//   { role: 'simpatisan', isActive: false },
//   { role: 'kader', isActive: true }
// ]
// Tidak ada field "role": "kader" di top level!
```

**Dampak**:
- Mobile membaca response tapi tidak bisa tahu role aktif dengan mudah
- Harus parse array `roles` sendiri, rawan salah implementasi

---

## ✅ Fix yang Sudah Dilakukan

### Fix #1 — `authMiddleware.js`

```javascript
// ✅ KODE BARU — BENAR
const user = await prisma.user.findUnique({ 
  where: { id: payload.userId },
  include: { 
    roles: {
      where: { isActive: true }   // ← hanya ambil role yang AKTIF
    }
  }
});

const roleNames = user.roles.map(r => r.role);  // ← field 'role', bukan 'name'

// Prioritas: admin > kader > simpatisan
const rolePriority = ['admin', 'kader', 'simpatisan'];
const primaryRole = rolePriority.find(r => roleNames.includes(r)) || 'simpatisan';

req.user = {
  role: primaryRole  // ← selalu role tertinggi yang aktif
};
```

**Hasil**: Setelah simpatisan diverifikasi menjadi kader:
- Middleware sekarang hanya mengambil `{ role: 'kader', isActive: true }`
- `req.user.role = 'kader'` ✅
- User langsung bisa akses semua fitur kader tanpa logout/login

---

### Fix #2 — `kader.service.js` response

```javascript
// ✅ KODE BARU — response ada field "role" aktif
const activeRoles = updated.roles.filter(r => r.isActive).map(r => r.role);
const primaryRole = rolePriority.find(r => activeRoles.includes(r)) || 'simpatisan';

return {
  ...updated,
  role: primaryRole,   // ← "kader" ✅
  activeRoles          // ← ["kader"] ✅
};
```

---

## 📦 Response Format Sekarang (Setelah Fix)

### `POST /api/kader/confirm/simpatisan/:userId`
```json
{
  "success": true,
  "message": "Simpatisan berhasil diverifikasi dan menjadi Kader",
  "data": {
    "id": 25,
    "name": "Siti Rahayu",
    "email": "siti@example.com",
    "kaderPoint2Confirmed": true,
    "kaderPoint2ConfirmedAt": "2026-03-31T10:00:00.000Z",
    "kaderPoint2ConfirmedBy": 1,
    "role": "kader",
    "activeRoles": ["kader"],
    "roles": [
      { "role": "simpatisan", "isActive": false },
      { "role": "kader", "isActive": true }
    ]
  }
}
```

### `POST /api/kader/confirm/point1/:userId`
```json
{
  "success": true,
  "message": "Point 1 confirmation successful",
  "data": {
    "id": 12,
    "name": "Budi Santoso",
    "kaderPoint1Confirmed": true,
    "kaderPoint1ConfirmedAt": "2026-03-31T10:00:00.000Z",
    "role": "kader",
    "activeRoles": ["kader"],
    "roles": [
      { "role": "kader", "isActive": true }
    ]
  }
}
```

---

## 📱 Untuk Mobile Team

### Kabar Baik: Tidak Perlu Logout/Login Ulang

Dengan fix di `authMiddleware`, setelah user diverifikasi:
- **Setiap request berikutnya** dari mobile (dengan token yang sama) akan mendapatkan `role: kader` dari database real-time
- Tidak perlu refresh token, karena role dibaca dari DB saat setiap request masuk — **bukan dari dalam JWT payload**

### Cara Refresh Data User di Mobile (Recommended)

Setelah menerima notifikasi verifikasi atau setelah login ulang, mobile cukup:

```
GET /api/users/profile
Authorization: Bearer {token_lama_pun_bisa}
```

Response akan berisi roles terbaru dari database.

### Field yang Perlu Mobile Baca dari Profile:

```json
{
  "data": {
    "id": 25,
    "name": "Siti Rahayu",
    "roles": [
      { "role": "kader", "isActive": true }
    ],
    "kaderPoint2Confirmed": true,
    "kaderPoint2ConfirmedAt": "2026-03-31T10:00:00.000Z"
  }
}
```

**Logic di Mobile**:
```dart
// Dart/Flutter contoh
final activeRole = user.roles
  .where((r) => r.isActive)
  .map((r) => r.role)
  .firstWhere(
    (r) => ['admin', 'kader', 'simpatisan'].contains(r),
    orElse: () => 'simpatisan'
  );
```

### Endpoint Tersedia untuk Mobile:

| Endpoint | Fungsi | Auth |
|----------|--------|------|
| `GET /api/users/profile` | Ambil data user + roles terbaru | Bearer token |
| `POST /api/auth/refresh` | Dapat access token baru | refreshToken |

---

## 🧪 Test Endpoint Setelah Fix

### Langkah test manual:
```bash
# 1. Login sebagai admin
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@mygeri.com","password":"password_admin"}'

# Simpan ADMIN_TOKEN dari response

# 2. Confirm simpatisan
curl -X POST http://localhost:3030/api/kader/confirm/simpatisan/[USER_ID] \
  -H "Authorization: Bearer [ADMIN_TOKEN]"

# 3. Cek response — field "role" HARUS "kader" ✅

# 4. Login sebagai user yang baru diverifikasi
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","password":"password_user"}'

# 5. Cek profile dengan token baru
curl -X GET http://localhost:3030/api/users/profile \
  -H "Authorization: Bearer [USER_TOKEN]"

# 6. roles di response harus: [{ "role": "kader", "isActive": true }] ✅
```

---

## ✅ Checklist — Update Status

### Backend Team:
- [x] Identifikasi root cause: `authMiddleware` ambil semua role termasuk `isActive: false`
- [x] Fix `authMiddleware.js`: filter `isActive: true` + prioritas role
- [x] Fix `kader.service.js` `confirmPoint2`: tambah field `role` di response
- [x] Fix `kader.service.js` `confirmPoint1`: tambah field `role` di response
- [x] Validasi: tidak ada error di file yang diubah
- [x] Commit & push ke branch `heri01`

### Mobile Team:
- [ ] Update logic baca role dari `roles` array — filter `isActive: true`
- [ ] Setelah user diverifikasi (notif diterima), call `GET /api/users/profile` untuk refresh
- [ ] Tidak perlu logout/login ulang — token lama masih valid
- [ ] Test flow end-to-end: simpatisan → admin verifikasi → mobile refresh → akses fitur kader

---

## 🔗 File yang Diubah

```
src/middlewares/authMiddleware.js        ← CRITICAL FIX: filter isActive + role priority
src/modules/kader/kader.service.js      ← ADD: field 'role' aktif di response confirm
```

---

**Status**: ✅ Sudah difix dan dipush ke branch `heri01`  
**Testing**: Silakan test dengan cURL di atas atau Postman  
**Pertanyaan**: Hubungi backend team
