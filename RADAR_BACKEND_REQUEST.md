# 🖥️ BACKEND REQUEST: Radar Save Location Feature

**Tanggal**: 9 Januari 2026  
**Request dari**: Frontend Team  
**Priority**: Medium  
**Estimasi**: ~4 jam kerja

---

## 📋 RINGKASAN FITUR

User ingin bisa **save lokasi manual** tanpa harus enable "location sharing" (background service). 

### Perbedaan:
- **Save Location** = User klik tombol, lokasi tersimpan, tapi **tidak auto-update** (no background service)
- **Enable Sharing** = Background service jalan, lokasi **auto-update setiap 1 jam**

### Visual di Map:
- **ONLINE** (sharing enabled) = Marker berwarna (hijau/biru/ungu by role)
- **OFFLINE** (saved location only) = Marker abu-abu

---

## 🔧 PERUBAHAN YANG DIBUTUHKAN

### 1️⃣ DATABASE MIGRATION

**Tambah kolom baru di tabel `user_locations`:**

```sql
ALTER TABLE user_locations 
ADD COLUMN is_saved_location BOOLEAN DEFAULT FALSE;
```

**Penjelasan:**
- `is_sharing_enabled` = User aktif sharing (background service ON)
- `is_saved_location` = User pernah save lokasi (manual atau via sharing)

**Relasi:**
| Kondisi | `is_sharing_enabled` | `is_saved_location` | Keterangan |
|---------|---------------------|-------------------|------------|
| Belum save | `false` | `false` | User belum pernah save lokasi |
| Save manual | `false` | `true` | User save manual, tidak auto-update |
| Enable sharing | `true` | `true` | User enable sharing, auto-update 1 jam |

---

### 2️⃣ UPDATE ENDPOINT: `/api/radar/update-location`

**Request Body (TAMBAH field baru):**

```json
POST /api/radar/update-location
Content-Type: application/json
Authorization: Bearer <token>

{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5,
  "is_saved_only": true   // ← FIELD BARU (optional, default: false)
}
```

**Logic Update:**

```javascript
// Pseudocode
if (is_saved_only === true) {
  // User klik "Save Location" (manual save)
  user_location.latitude = latitude;
  user_location.longitude = longitude;
  user_location.accuracy = accuracy;
  user_location.is_saved_location = true;
  // JANGAN update is_sharing_enabled (biarkan false jika memang false)
  user_location.last_update = now();
} else {
  // Behavior default (existing) - dari background service atau toggle sharing
  user_location.latitude = latitude;
  user_location.longitude = longitude;
  user_location.accuracy = accuracy;
  user_location.is_sharing_enabled = true;  // Set true (dari background service)
  user_location.is_saved_location = true;   // Set true juga
  user_location.last_update = now();
}
```

**Response** (tidak perlu berubah):
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

---

### 3️⃣ UPDATE ENDPOINT: `/api/radar/nearby`

**Request** (tidak berubah):
```
GET /api/radar/nearby?latitude=-6.2088&longitude=106.8456&radius=5000
Authorization: Bearer <token>
```

**Response (TAMBAH 2 field):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "latitude": -6.2088,
      "longitude": 106.8456,
      "distance": 2.3,
      "is_sharing_enabled": false,    // ← FIELD BARU: apakah user sedang sharing (background service ON)
      "is_saved_location": true,      // ← FIELD BARU: apakah user punya saved location
      "last_update": "2026-01-09T10:00:00Z",
      "user": {
        "id": 1,
        "name": "John Doe",
        "fotoProfil": "https://...",
        "pekerjaan": "Developer",
        "provinsi": "DKI Jakarta",
        "roles": [
          {"role": "simpatisan"}
        ]
      }
    },
    {
      "id": 2,
      "latitude": -6.2100,
      "longitude": 106.8500,
      "distance": 1.8,
      "is_sharing_enabled": true,     // User ini sedang sharing (ONLINE)
      "is_saved_location": true,
      "last_update": "2026-01-09T10:05:00Z",
      "user": {
        "id": 2,
        "name": "Jane Doe",
        "roles": [
          {"role": "kader"}
        ]
      }
    }
  ]
}
```

**Logic Update:**

```sql
-- Return SEMUA user yang punya location (saved atau sharing)
SELECT * FROM user_locations 
WHERE (is_saved_location = true OR is_sharing_enabled = true)
  AND ST_Distance_Sphere(
    point(longitude, latitude),
    point(?, ?)
  ) <= ?
ORDER BY distance ASC;
```

**Sebelumnya** (mungkin hanya return user dengan `is_sharing_enabled = true`):
```sql
-- OLD QUERY (jika ada)
WHERE is_sharing_enabled = true  -- ← Hapus filter ini atau ubah
```

---

### 4️⃣ UPDATE ENDPOINT: `/api/radar/my-status`

**Request** (tidak berubah):
```
GET /api/radar/my-status
Authorization: Bearer <token>
```

**Response (TAMBAH 1 field):**

```json
{
  "success": true,
  "data": {
    "has_location": true,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5,
    "is_sharing_enabled": false,
    "is_saved_location": true,      // ← FIELD BARU
    "last_update": "2026-01-09T10:00:00Z"
  }
}
```

**Jika user belum pernah save lokasi:**
```json
{
  "success": true,
  "data": {
    "has_location": false,
    "latitude": null,
    "longitude": null,
    "accuracy": null,
    "is_sharing_enabled": false,
    "is_saved_location": false,     // ← false karena belum pernah save
    "last_update": null
  }
}
```

---

## 🧪 TEST CASES

### Test 1: Save Location Manual
```bash
# User belum pernah save, klik "Save Location"
POST /api/radar/update-location
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5,
  "is_saved_only": true
}

# Expected DB State:
# is_sharing_enabled = false
# is_saved_location = true
# latitude/longitude = updated
```

### Test 2: Enable Sharing (Existing Behavior)
```bash
# User toggle sharing ON
POST /api/radar/toggle-sharing
{"enabled": true}

# Lalu background service kirim update
POST /api/radar/update-location
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5
  # is_saved_only tidak ada atau false
}

# Expected DB State:
# is_sharing_enabled = true
# is_saved_location = true
# latitude/longitude = updated
```

### Test 3: Nearby Query Return Both Online & Offline
```bash
GET /api/radar/nearby?latitude=-6.2088&longitude=106.8456&radius=5000

# Expected Response:
# - User A (is_sharing_enabled=true, is_saved_location=true) → ONLINE
# - User B (is_sharing_enabled=false, is_saved_location=true) → OFFLINE
# Keduanya muncul di response
```

### Test 4: My Status After Save
```bash
# After save location manual
GET /api/radar/my-status

# Expected Response:
{
  "has_location": true,
  "is_sharing_enabled": false,
  "is_saved_location": true  // ← true karena sudah save
}
```

---

## 📊 SKENARIO LENGKAP

### Skenario A: User Baru (Belum Save)
```
DB State:
- is_sharing_enabled = false
- is_saved_location = false

Action: User klik "Save Location"
Request: POST /update-location {"is_saved_only": true}

DB State After:
- is_sharing_enabled = false  (tetap false, tidak aktifkan sharing)
- is_saved_location = true    (set true karena sudah save)

Map Display: Marker abu-abu (OFFLINE)
```

### Skenario B: User Enable Sharing
```
DB State:
- is_sharing_enabled = false
- is_saved_location = true  (pernah save manual sebelumnya)

Action: User toggle "Enable Sharing" ON
Request: POST /toggle-sharing {"enabled": true}

DB State After:
- is_sharing_enabled = true   (set true, background service aktif)
- is_saved_location = true    (tetap true)

Map Display: Marker berwarna (ONLINE)
```

### Skenario C: User Disable Sharing (tapi punya saved location)
```
DB State:
- is_sharing_enabled = true
- is_saved_location = true

Action: User toggle "Enable Sharing" OFF
Request: POST /toggle-sharing {"enabled": false}

DB State After:
- is_sharing_enabled = false  (set false, background service stop)
- is_saved_location = true    (TETAP true, location tidak dihapus)

Map Display: Marker abu-abu (OFFLINE) - user masih terlihat di map
```

---

## ⚠️ BACKWARD COMPATIBILITY

**Data Existing:**
- User yang sudah ada mungkin punya `is_sharing_enabled = true`
- Setelah migration, `is_saved_location` akan `null` atau `false`

**Migrasi Data (Recommended):**
```sql
-- Set is_saved_location = true untuk user yang punya location
UPDATE user_locations 
SET is_saved_location = true 
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL;
```

**Frontend Handling:**
```javascript
// Jika backend belum update, frontend harus handle null
is_saved_location = response.is_saved_location ?? response.is_sharing_enabled;
```

---

## ✅ CHECKLIST IMPLEMENTATION

- [ ] **Database**
  - [ ] Tambah kolom `is_saved_location BOOLEAN DEFAULT FALSE`
  - [ ] Migrasi data existing (set `is_saved_location = true` jika ada location)

- [ ] **Endpoint: `/update-location`**
  - [ ] Accept parameter `is_saved_only` (optional, default false)
  - [ ] Logic: jika `is_saved_only=true`, hanya set `is_saved_location=true`, **tidak** set `is_sharing_enabled`
  - [ ] Logic: jika `is_saved_only=false/null`, behavior existing (set both true)

- [ ] **Endpoint: `/nearby`**
  - [ ] Return field `is_sharing_enabled` dan `is_saved_location` untuk setiap user
  - [ ] Query return user dengan `is_saved_location=true OR is_sharing_enabled=true` (tidak hanya yang sharing)

- [ ] **Endpoint: `/my-status`**
  - [ ] Return field `is_saved_location`

- [ ] **Testing**
  - [ ] Test save location manual (`is_saved_only=true`)
  - [ ] Test enable/disable sharing (existing behavior tetap jalan)
  - [ ] Test nearby query return both online & offline users
  - [ ] Test backward compatibility dengan frontend lama

---

## 🚀 DEPLOYMENT NOTES

**Urutan Deploy:**
1. Deploy database migration dulu
2. Deploy backend update
3. Test API dengan Postman/curl
4. Notify frontend team → Frontend bisa mulai implement
5. Deploy frontend

**Rollback Plan:**
- Kolom `is_saved_location` bisa di-set `null` tanpa break existing functionality
- Frontend akan fallback ke `is_sharing_enabled` jika field baru tidak ada

---

## 📞 CONTACT

**Frontend Team**: 
- File lengkap analisis: `dokumentasiFE/RADAR_SAVE_LOCATION_ANALYSIS.md`
- Tanya jawab: Koordinasi via Slack/Discord

**Backend Team**:
- Jika ada pertanyaan tentang requirement, silakan ask
- Estimasi: ~4 jam (termasuk testing)

---

**Terima kasih!** 🙏
