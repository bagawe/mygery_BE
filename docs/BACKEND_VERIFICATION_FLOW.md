# Backend Verification Flow - Catatan Implementasi

**Tanggal**: 31 Maret 2026  
**Status**: ⚠️ PERLU DIKONFIRMASI & IMPLEMENTASI

---

## 📋 Ringkasan 3 Alur Verifikasi

Admin akan memiliki **3 menu terpisah** untuk memverifikasi 3 jenis user dengan hasil akhir yang sama: **Role `kader` + terverifikasi = Full Akses Mobile**.

### Alur 1: Kader Lama (Point 1)
**Tujuan**: Verifikasi kader lama agar mendapat akses penuh mobile

- **Source User**: User yang sudah memiliki role `kader` sejak awal (sudah terdaftar sebagai kader)
- **Status Awal**: Role `kader` tapi `kaderPoint1Verified = false`
- **Admin Menu**: "Verifikasi Kader Lama" (`/kader/point1`)
- **Endpoint GET**: `GET /api/kader/pending/point1`
- **Endpoint POST**: `POST /api/kader/confirm/point1/:userId`
- **Hasil Akhir**: 
  - Role tetap `kader`
  - `kaderPoint1Verified = true` / `kaderPoint1ConfirmedAt = now()`
  - `kaderPoint1ConfirmedBy = adminId`
  - User bisa akses semua fitur mobile
- **Badge Status**: 🟡 "Kader (Belum Terverifikasi)" → ✅ "Kader Terverifikasi"

---

### Alur 2: Kader Baru (Point 2)
**Tujuan**: Verifikasi pendaftar kader baru agar mendapat role kader

- **Source User**: User baru yang mendaftar dengan intent menjadi kader (bukan simpatisan)
- **Status Awal**: Role `kader_baru` atau pending status (belum menjadi kader resmi)
- **Admin Menu**: "Verifikasi Kader Baru" (`/kader/point2`)
- **Endpoint GET**: `GET /api/kader/pending/point2`
- **Endpoint POST**: `POST /api/kader/confirm/point2/:userId`
- **Hasil Akhir**:
  - Role berubah dari `kader_baru` → `kader`
  - `kaderPoint2Verified = true` / `kaderPoint2ConfirmedAt = now()`
  - `kaderPoint2ConfirmedBy = adminId`
  - User bisa akses semua fitur mobile
- **Badge Status**: 🟡 "Kader Baru (Pending)" → ✅ "Kader"

---

### Alur 3: Simpatisan (Verifikasi → Upgrade ke Kader)
**Tujuan**: Verifikasi simpatisan untuk diupgrade menjadi kader

- **Source User**: User dengan role `simpatisan` yang ingin verifikasi untuk jadi kader
- **Status Awal**: Role `simpatisan`, `simpatisanVerified = false` (atau tidak ada field ini)
- **Admin Menu**: "Verifikasi Simpatisan" (`/simpatisan`) ⚠️ **BARU**
- **Endpoint GET**: `GET /api/kader/pending/simpatisan` ⚠️ **BARU**
- **Endpoint POST**: `POST /api/kader/confirm/simpatisan/:userId` ⚠️ **BARU**
- **Hasil Akhir**:
  - Role berubah dari `simpatisan` → `kader`
  - `simpatisanVerified = true` / `simpatisanVerifiedAt = now()` (atau buat field baru)
  - `simpatisanVerifiedBy = adminId`
  - User bisa akses semua fitur mobile
- **Badge Status**: 🔵 "Simpatisan" → ✅ "Kader"

---

## 🔧 Detail Implementasi Backend

### 1. Database Schema Updates (Jika Diperlukan)

#### Untuk Simpatisan (NEW FLOW)
```sql
-- Tambahkan fields baru di table users/simpatisan jika belum ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS simpatisanVerified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS simpatisanVerifiedAt TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS simpatisanVerifiedBy UUID NULL REFERENCES users(id);

-- Pastikan fields existing tetap ada:
-- kaderPoint1Verified, kaderPoint1ConfirmedAt, kaderPoint1ConfirmedBy
-- kaderPoint2Verified, kaderPoint2ConfirmedAt, kaderPoint2ConfirmedBy
```

---

### 2. GET Endpoints

#### `GET /api/kader/pending/point1`
**Deskripsi**: Ambil daftar kader lama yang pending verifikasi

**Query**:
```javascript
// SELECT dari users yang:
// - role = 'kader'
// - kaderPoint1Verified = false (atau IS NULL)
// - ATAU berdasarkan flag/status lain yang menunjukkan pending point1
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nama Kader",
      "email": "kader@example.com",
      "phone": "+62812345678",
      "nik": "3271234567890123",
      "createdAt": "2026-01-15T10:30:00Z",
      "kaderPoint1Verified": false,
      "kaderPoint1VerifiedAt": null,
      "roles": [{ "role": "kader", "isActive": true }]
    }
  ],
  "count": 5
}
```

---

#### `GET /api/kader/pending/point2`
**Deskripsi**: Ambil daftar kader baru yang pending verifikasi

**Query**:
```javascript
// SELECT dari users yang:
// - role = 'kader_baru' ATAU pending status
// - kaderPoint2Verified = false (atau IS NULL)
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nama Kader Baru",
      "email": "kaderbaru@example.com",
      "phone": "+62812345678",
      "nik": "3271234567890123",
      "createdAt": "2026-03-20T14:50:00Z",
      "kaderPoint2Verified": false,
      "kaderPoint2VerifiedAt": null,
      "roles": [{ "role": "kader_baru", "isActive": true }]
    }
  ],
  "count": 3
}
```

---

#### `GET /api/kader/pending/simpatisan` ⚠️ NEW
**Deskripsi**: Ambil daftar simpatisan yang pending verifikasi → upgrade ke kader

**Query**:
```javascript
// SELECT dari users yang:
// - role = 'simpatisan'
// - simpatisanVerified = false (atau IS NULL)
// - request verifikasi sudah submitted (ada field flag/status?)
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nama Simpatisan",
      "email": "simpatisan@example.com",
      "phone": "+62812345678",
      "nik": "3271234567890123",
      "createdAt": "2026-02-10T09:15:00Z",
      "simpatisanVerified": false,
      "simpatisanVerifiedAt": null,
      "roles": [{ "role": "simpatisan", "isActive": true }]
    }
  ],
  "count": 8
}
```

---

#### `GET /api/kader/stats`
**Deskripsi**: Ambil statistik gabungan untuk 3 alur verifikasi

**Response Format** (Update dari sebelumnya):
```json
{
  "success": true,
  "data": {
    "pending_point1": 5,
    "confirmed_point1": 45,
    "rejected_point1": 2,
    
    "pending_point2": 3,
    "confirmed_point2": 18,
    "rejected_point2": 1,
    
    "pending_simpatisan": 8,
    "confirmed_simpatisan": 25,
    "rejected_simpatisan": 3,
    
    "total_kader_verified": 88,
    "total_simpatisan": 50
  }
}
```

---

### 3. POST Endpoints

#### `POST /api/kader/confirm/point1/:userId`
**Deskripsi**: Verifikasi kader lama

**Body**:
```json
{
  // Kosong atau bisa tambah optional note:
  // "note": "Verifikasi manual oleh admin"
}
```

**Logic**:
```javascript
// 1. Validasi user exists dan role = 'kader'
// 2. Set kaderPoint1Verified = true
// 3. Set kaderPoint1VerifiedAt = NOW()
// 4. Set kaderPoint1VerifiedBy = adminId (dari JWT token)
// 5. Emit event atau log untuk audit trail
// 6. Return updated user data
```

**Response**:
```json
{
  "success": true,
  "message": "Kader berhasil diverifikasi",
  "data": {
    "id": "uuid",
    "name": "Nama Kader",
    "email": "kader@example.com",
    "kaderPoint1Verified": true,
    "kaderPoint1VerifiedAt": "2026-03-31T15:45:00Z",
    "roles": [{ "role": "kader", "isActive": true }]
  }
}
```

**Status Code**: `200 OK`

---

#### `POST /api/kader/confirm/point2/:userId`
**Deskripsi**: Verifikasi & upgrade kader baru → role kader

**Body**:
```json
{
  // Kosong atau optional note
}
```

**Logic**:
```javascript
// 1. Validasi user exists dan role = 'kader_baru'
// 2. UPDATE role: 'kader_baru' → 'kader'
// 3. Set kaderPoint2Verified = true
// 4. Set kaderPoint2VerifiedAt = NOW()
// 5. Set kaderPoint2VerifiedBy = adminId
// 6. Emit event atau log audit
// 7. Return updated user dengan roles array baru
```

**Response**:
```json
{
  "success": true,
  "message": "Kader baru berhasil diverifikasi dan menjadi Kader",
  "data": {
    "id": "uuid",
    "name": "Nama Kader Baru",
    "email": "kaderbaru@example.com",
    "kaderPoint2Verified": true,
    "kaderPoint2VerifiedAt": "2026-03-31T16:00:00Z",
    "roles": [
      { "role": "kader_baru", "isActive": false },
      { "role": "kader", "isActive": true }
    ]
  }
}
```

**Status Code**: `200 OK`

---

#### `POST /api/kader/confirm/simpatisan/:userId` ⚠️ NEW
**Deskripsi**: Verifikasi & upgrade simpatisan → role kader

**Body**:
```json
{
  // Kosong atau optional note
}
```

**Logic**:
```javascript
// 1. Validasi user exists dan role = 'simpatisan'
// 2. UPDATE role: 'simpatisan' → 'kader'
// 3. Set simpatisanVerified = true
// 4. Set simpatisanVerifiedAt = NOW()
// 5. Set simpatisanVerifiedBy = adminId
// 6. Emit event atau log audit
// 7. Return updated user dengan roles array baru
```

**Response**:
```json
{
  "success": true,
  "message": "Simpatisan berhasil diverifikasi dan menjadi Kader",
  "data": {
    "id": "uuid",
    "name": "Nama Simpatisan",
    "email": "simpatisan@example.com",
    "simpatisanVerified": true,
    "simpatisanVerifiedAt": "2026-03-31T16:15:00Z",
    "roles": [
      { "role": "simpatisan", "isActive": false },
      { "role": "kader", "isActive": true }
    ]
  }
}
```

**Status Code**: `200 OK`

---

### 4. Reject/Tolak Endpoints (OPTIONAL - Jika Belum Ada)

Jika admin bisa menolak:

#### `POST /api/kader/reject/point1/:userId`
```json
{
  "reason": "Alasan penolakan dari admin"
}
```

#### `POST /api/kader/reject/point2/:userId`
```json
{
  "reason": "Alasan penolakan dari admin"
}
```

#### `POST /api/kader/reject/simpatisan/:userId` ⚠️ NEW
```json
{
  "reason": "Alasan penolakan dari admin"
}
```

**Logic untuk reject**: Simpan reason di DB, set flag penolakan, buat notification untuk user.

---

## 🔐 Authorization

Pastikan semua endpoint di atas:
- ✅ Require `adminToken` JWT
- ✅ Verify role admin (bukan user biasa)
- ✅ Audit log untuk setiap action (siapa, kapan, apa)

---

## 📱 Frontend - Backend Integration

### Frontend Files:
- `src/pages/KaderPoint1Page.vue` → Call `/api/kader/pending/point1` & `/api/kader/confirm/point1/:id`
- `src/pages/KaderPoint2Page.vue` → Call `/api/kader/pending/point2` & `/api/kader/confirm/point2/:id`
- `src/pages/SimpatisanPage.vue` → Call `/api/kader/pending/simpatisan` & `/api/kader/confirm/simpatisan/:id` ⚠️
- Dashboard stats → Call `/api/kader/stats` (gabungan 3 alur)

### API Client:
```javascript
// src/api/axios.js
// Base URL: http://localhost:3030/api (local dev)
// Token: Bearer {adminToken}
```

---

## ✅ Checklist Implementasi Backend

### Priority 1 - EXISTING ENDPOINTS (Cek apakah sudah sesuai)
- [ ] `GET /api/kader/pending/point1` - sudah ada? Response format sesuai?
- [ ] `POST /api/kader/confirm/point1/:userId` - sudah ada? Ubah data benar?
- [ ] `POST /api/kader/reject/point1/:userId` - sudah ada?
- [ ] `GET /api/kader/pending/point2` - sudah ada? Response format sesuai?
- [ ] `POST /api/kader/confirm/point2/:userId` - sudah ada? Ubah role benar?
- [ ] `POST /api/kader/reject/point2/:userId` - sudah ada?
- [ ] `GET /api/kader/stats` - sudah ada? Update response untuk gabung 3 alur?

### Priority 2 - NEW ENDPOINTS (Buat dari 0)
- [ ] `GET /api/kader/pending/simpatisan` - CREATE BARU
- [ ] `POST /api/kader/confirm/simpatisan/:userId` - CREATE BARU
- [ ] `POST /api/kader/reject/simpatisan/:userId` - CREATE BARU
- [ ] Database field `simpatisanVerified`, `simpatisanVerifiedAt`, `simpatisanVerifiedBy` - CREATE BARU (jika belum)

### Priority 3 - Improvements
- [ ] Add audit logging untuk semua action
- [ ] Add notification/email ke user ketika diverifikasi
- [ ] Add error handling & validation
- [ ] Add rate limiting untuk prevent spam reject/confirm

---

## 🧪 Testing

Suggest test scenarios:

### Scenario 1: Verify Kader Lama
```bash
GET /api/kader/pending/point1
# Expected: Daftar kader lama dengan kaderPoint1Verified = false

POST /api/kader/confirm/point1/[userId]
# Expected: kaderPoint1Verified = true
```

### Scenario 2: Verify Kader Baru
```bash
GET /api/kader/pending/point2
# Expected: Daftar kader baru pending

POST /api/kader/confirm/point2/[userId]
# Expected: Role berubah kader_baru → kader, kaderPoint2Verified = true
```

### Scenario 3: Verify Simpatisan → Kader
```bash
GET /api/kader/pending/simpatisan
# Expected: Daftar simpatisan pending

POST /api/kader/confirm/simpatisan/[userId]
# Expected: Role berubah simpatisan → kader, simpatisanVerified = true
```

### Scenario 4: Stats
```bash
GET /api/kader/stats
# Expected: Gabung count dari 3 alur
{
  "pending_point1": 5,
  "confirmed_point1": 45,
  "pending_point2": 3,
  "confirmed_point2": 18,
  "pending_simpatisan": 8,
  "confirmed_simpatisan": 25
}
```

---

## 📞 Questions untuk Clarification

1. **Simpatisan** - Apakah user simpatisan bisa request upgrade ke kader kapan saja, atau ada flow approval terlebih dahulu?
2. **Kader Baru** - Role "kader_baru" sudah ada di system, atau perlu dibuat?
3. **Database** - Apakah sudah ada field `simpatisanVerified`, atau perlu migration?
4. **Notification** - Perlu kirim email/push notification ke user ketika diverifikasi?
5. **Audit Trail** - Ada requirement untuk audit logging?

---

## 🔗 Related Documentation
- Frontend Implementation: `/src/pages/KaderPoint1Page.vue`, `/src/pages/KaderPoint2Page.vue`, `/src/pages/SimpatisanPage.vue`
- Previous Endpoints: `ADMIN_WEB_API_DOCUMENTATION.md`, `NEW_ADMIN_ENDPOINTS_TESTED.md`
- Mobile Auth: `DEVELOPMENT_SETUP.md`

---

**Created**: 31-03-2026  
**Last Updated**: 31-03-2026  
**Status**: Draft - Awaiting Backend Confirmation
