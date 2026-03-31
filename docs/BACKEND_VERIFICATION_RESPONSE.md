# Backend Verification Flow - Konfirmasi Implementasi

**Tanggal**: 31 Maret 2026  
**Status**: ✅ SUDAH DIIMPLEMENTASI  
**Dibalas oleh**: Backend Team  
**Merespons dokumen**: `BACKEND_VERIFICATION_FLOW.md`

---

## ✅ Ringkasan Konfirmasi

Semua endpoint yang diminta sudah tersedia. Berikut klarifikasi penting sebelum FE integrasi:

---

## ⚠️ KLARIFIKASI PENTING: Perbedaan Penamaan Role

> Dokumen FE menyebut **"kader_baru"** sebagai role tersendiri.  
> **Di database, role tersebut TIDAK ADA.**

### Enum Role yang Ada di Database:
```
simpatisan   ← ini yang FE sebut "kader_baru"
kader
admin
```

### Mapping yang Benar:

| FE Menyebut | Database Sebenarnya | Keterangan |
|-------------|---------------------|------------|
| `kader_baru` | `simpatisan` | Simpatisan yang pending upgrade ke kader |
| `kaderPoint1Verified` | `kaderPoint1Confirmed` | Nama field berbeda |
| `kaderPoint2Verified` | `kaderPoint2Confirmed` | Nama field berbeda |
| `simpatisanVerified` | ❌ Tidak ada | Tidak perlu, sudah tercakup `kaderPoint2Confirmed` |
| `simpatisanVerifiedAt` | ❌ Tidak ada | Pakai `kaderPoint2ConfirmedAt` |
| `simpatisanVerifiedBy` | ❌ Tidak ada | Pakai `kaderPoint2ConfirmedBy` |

---

## ✅ Status Semua Endpoint

### GET Endpoints

| Endpoint | Status | Keterangan |
|----------|--------|------------|
| `GET /api/kader/pending/point1` | ✅ Ada | Kader lama belum terverifikasi |
| `GET /api/kader/pending/point2` | ✅ Ada | Simpatisan pending upgrade ke kader |
| `GET /api/kader/pending/simpatisan` | ✅ BARU DITAMBAH | **Alias untuk `/pending/point2`** — sama persis |
| `GET /api/kader/stats` | ✅ Ada (diupdate) | Format response diupdate sesuai permintaan FE |
| `GET /api/kader/confirmed` | ✅ Ada | Daftar user yang sudah dikonfirmasi |

### POST Endpoints

| Endpoint | Status | Keterangan |
|----------|--------|------------|
| `POST /api/kader/confirm/point1/:userId` | ✅ Ada | Verifikasi kader lama |
| `POST /api/kader/confirm/point2/:userId` | ✅ Ada | Upgrade simpatisan → kader |
| `POST /api/kader/confirm/simpatisan/:userId` | ✅ BARU DITAMBAH | **Alias untuk `/confirm/point2`** — sama persis |
| `POST /api/kader/reject/point1/:userId` | ✅ Ada | Tolak verifikasi kader lama |
| `POST /api/kader/reject/point2/:userId` | ✅ Ada | Tolak upgrade simpatisan |
| `POST /api/kader/reject/simpatisan/:userId` | ✅ BARU DITAMBAH | **Alias untuk `/reject/point2`** — sama persis |

---

## 📋 Alur Verifikasi — Konfirmasi Detail

### Alur 1: Kader Lama (Point 1) ✅ SUDAH ADA

**Endpoint**: `GET /api/kader/pending/point1`

Query condition:
```
role = 'kader' AND kaderPoint1Confirmed = false
```

**Endpoint**: `POST /api/kader/confirm/point1/:userId`

Logic yang terjadi:
```
1. Validasi user exists + punya role 'kader'
2. Set kaderPoint1Confirmed = true
3. Set kaderPoint1ConfirmedAt = NOW()
4. Set kaderPoint1ConfirmedBy = adminId (dari JWT)
5. Return updated user data
```

---

### Alur 2: Kader Baru / Simpatisan (Point 2) ✅ SUDAH ADA

> ⚠️ **FE menyebut "kader_baru"** — di backend ini adalah user dengan role **`simpatisan`**

**Endpoint**: `GET /api/kader/pending/point2`  
**Endpoint alias**: `GET /api/kader/pending/simpatisan`

Query condition:
```
role = 'simpatisan' AND kaderPoint2Confirmed = false
```

**Endpoint**: `POST /api/kader/confirm/point2/:userId`  
**Endpoint alias**: `POST /api/kader/confirm/simpatisan/:userId`

Logic yang terjadi:
```
1. Validasi user exists + punya role 'simpatisan'
2. Deactivate role 'simpatisan' (isActive = false)
3. Create role baru 'kader' (isActive = true)
4. Set kaderPoint2Confirmed = true
5. Set kaderPoint2ConfirmedAt = NOW()
6. Set kaderPoint2ConfirmedBy = adminId (dari JWT)
7. Return updated user + roles array baru
```

---

### Alur 3: Simpatisan → Kader ✅ SAMA DENGAN ALUR 2

> Alur 3 di dokumen FE **IDENTIK** dengan Alur 2 di backend.  
> FE boleh menggunakan endpoint `/simpatisan` atau `/point2` — hasilnya sama.

**Endpoint alias tersedia**:
- `GET /api/kader/pending/simpatisan`
- `POST /api/kader/confirm/simpatisan/:userId`
- `POST /api/kader/reject/simpatisan/:userId`

---

## 📦 Response Format Aktual

### GET `/api/kader/pending/point1`
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 12,
      "nik": "3271234567890123",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "phone": "08123456789",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "kaderPoint1Confirmed": false,
      "kaderPoint1ConfirmedAt": null,
      "roles": [
        { "role": "kader", "isActive": true }
      ]
    }
  ]
}
```

### GET `/api/kader/pending/point2` atau `/pending/simpatisan`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 25,
      "nik": "3271234567890456",
      "name": "Siti Rahayu",
      "email": "siti@example.com",
      "phone": "08198765432",
      "createdAt": "2026-03-20T14:50:00.000Z",
      "kaderPoint2Confirmed": false,
      "kaderPoint2ConfirmedAt": null,
      "roles": [
        { "role": "simpatisan", "isActive": true }
      ]
    }
  ]
}
```

### POST `/api/kader/confirm/point1/:userId`
```json
{
  "success": true,
  "message": "Point 1 confirmation successful",
  "data": {
    "id": 12,
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "kaderPoint1Confirmed": true,
    "kaderPoint1ConfirmedAt": "2026-03-31T15:45:00.000Z",
    "kaderPoint1ConfirmedBy": 1
  }
}
```

### POST `/api/kader/confirm/point2/:userId` atau `/confirm/simpatisan/:userId`
```json
{
  "success": true,
  "message": "Simpatisan berhasil diverifikasi dan menjadi Kader",
  "data": {
    "id": 25,
    "name": "Siti Rahayu",
    "email": "siti@example.com",
    "kaderPoint2Confirmed": true,
    "kaderPoint2ConfirmedAt": "2026-03-31T16:00:00.000Z",
    "kaderPoint2ConfirmedBy": 1,
    "roles": [
      { "role": "simpatisan", "isActive": false },
      { "role": "kader", "isActive": true }
    ]
  }
}
```

### POST `/api/kader/reject/point1/:userId`
**Request Body**:
```json
{ "reason": "Alasan penolakan dari admin" }
```

**Response**:
```json
{
  "success": true,
  "message": "Point 1 confirmation rejected",
  "data": {
    "message": "Point 1 confirmation rejected",
    "userId": 12,
    "reason": "Alasan penolakan dari admin"
  }
}
```

### POST `/api/kader/reject/point2/:userId` atau `/reject/simpatisan/:userId`
**Request Body**:
```json
{ "reason": "Alasan penolakan dari admin" }
```

**Response**:
```json
{
  "success": true,
  "message": "Point 2 upgrade rejected, user remains as simpatisan",
  "data": {
    "message": "Point 2 upgrade rejected, user remains as simpatisan",
    "userId": 25,
    "reason": "Alasan penolakan dari admin"
  }
}
```

### GET `/api/kader/stats`
```json
{
  "success": true,
  "data": {
    "pending_point1": 5,
    "confirmed_point1": 45,

    "pending_point2": 3,
    "confirmed_point2": 18,

    "pending_simpatisan": 3,
    "confirmed_simpatisan": 18,

    "total_kader_verified": 63,
    "total_simpatisan": 50,
    "total_kader": 45
  }
}
```

> ℹ️ `pending_simpatisan` dan `confirmed_simpatisan` nilainya **selalu sama** dengan `pending_point2` dan `confirmed_point2` karena keduanya merujuk data yang sama.

---

## 🔐 Authorization

Semua endpoint:
- ✅ Require header `Authorization: Bearer {adminToken}`
- ✅ Hanya bisa diakses oleh role `admin`
- ✅ `adminId` diambil otomatis dari JWT token (tidak perlu kirim di body)

---

## 🧪 Testing (cURL)

### 1. Login dulu untuk dapat token admin:
```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 2. Ambil daftar pending point1:
```bash
curl -X GET http://localhost:3030/api/kader/pending/point1 \
  -H "Authorization: Bearer {YOUR_ADMIN_TOKEN}"
```

### 3. Ambil daftar pending simpatisan:
```bash
curl -X GET http://localhost:3030/api/kader/pending/simpatisan \
  -H "Authorization: Bearer {YOUR_ADMIN_TOKEN}"
```

### 4. Konfirmasi kader lama (point1):
```bash
curl -X POST http://localhost:3030/api/kader/confirm/point1/12 \
  -H "Authorization: Bearer {YOUR_ADMIN_TOKEN}" \
  -H "Content-Type: application/json"
```

### 5. Konfirmasi simpatisan → kader:
```bash
curl -X POST http://localhost:3030/api/kader/confirm/simpatisan/25 \
  -H "Authorization: Bearer {YOUR_ADMIN_TOKEN}" \
  -H "Content-Type: application/json"
```

### 6. Tolak simpatisan:
```bash
curl -X POST http://localhost:3030/api/kader/reject/simpatisan/25 \
  -H "Authorization: Bearer {YOUR_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Dokumen tidak lengkap"}'
```

### 7. Ambil stats:
```bash
curl -X GET http://localhost:3030/api/kader/stats \
  -H "Authorization: Bearer {YOUR_ADMIN_TOKEN}"
```

---

## ✅ Checklist — Update Status

### Priority 1 - EXISTING ENDPOINTS
- [x] `GET /api/kader/pending/point1` — ✅ Ada, response format sesuai
- [x] `POST /api/kader/confirm/point1/:userId` — ✅ Ada, berjalan benar
- [x] `POST /api/kader/reject/point1/:userId` — ✅ Ada
- [x] `GET /api/kader/pending/point2` — ✅ Ada, response format sesuai
- [x] `POST /api/kader/confirm/point2/:userId` — ✅ Ada, role berubah simpatisan→kader
- [x] `POST /api/kader/reject/point2/:userId` — ✅ Ada
- [x] `GET /api/kader/stats` — ✅ Ada, **response format sudah diupdate** sesuai permintaan FE

### Priority 2 - NEW ENDPOINTS (Sudah dibuat)
- [x] `GET /api/kader/pending/simpatisan` — ✅ DIBUAT (alias point2)
- [x] `POST /api/kader/confirm/simpatisan/:userId` — ✅ DIBUAT (alias point2)
- [x] `POST /api/kader/reject/simpatisan/:userId` — ✅ DIBUAT (alias point2)
- [x] Database field `simpatisanVerified` — ✅ **TIDAK PERLU**, sudah tercakup di `kaderPoint2Confirmed`

---

## 📞 Jawaban atas Questions di Dokumen FE

**1. Simpatisan — Apakah bisa request upgrade kapan saja?**  
> Backend tidak ada flow "request dari user". Admin langsung bisa lihat semua simpatisan di `GET /api/kader/pending/simpatisan` dan langsung konfirmasi. Jika FE butuh flow "user request dulu", perlu diskusi tambahan.

**2. Kader Baru — Role "kader_baru" sudah ada?**  
> ❌ Role `kader_baru` **tidak ada** di database. Yang ada: `simpatisan`, `kader`, `admin`. "Kader baru" = user dengan role `simpatisan` yang diupgrade oleh admin.

**3. Database — Field `simpatisanVerified` perlu dibuat?**  
> ❌ **Tidak perlu**. Field `kaderPoint2Confirmed`, `kaderPoint2ConfirmedAt`, `kaderPoint2ConfirmedBy` sudah mencakup alur ini. Tidak perlu migration database.

**4. Notification — Email/push notification ke user?**  
> Belum diimplementasi. Bisa ditambahkan di sprint berikutnya jika diperlukan.

**5. Audit Trail — Ada?**  
> ✅ Untuk reject point2/simpatisan sudah ada log di tabel `LogActivity`. Untuk confirm, data tersimpan di field `ConfirmedAt` dan `ConfirmedBy`.

---

## 🔗 File yang Diubah

```
src/modules/kader/kader.service.js     ← Updated: getPendingPoint2, confirmPoint2, stats + alias simpatisan
src/modules/kader/kader.controller.js  ← Updated: + getPendingSimpatisan, confirmSimpatisan, rejectSimpatisan
src/modules/kader/kader.routes.js      ← Updated: + 3 route alias simpatisan
```

---

**Dibuat**: 31-03-2026  
**Status**: ✅ Selesai Diimplementasi — Siap untuk integrasi FE  
**Branch**: `heri01`
