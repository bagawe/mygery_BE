# Role Change Specification — Backend & Mobile

**Tanggal**: 31 Maret 2026  
**Dibuat oleh**: Frontend Team  
**Ditujukan untuk**: Backend Team + Mobile Team  
**Issue**: Setelah admin verifikasi, role user di mobile **tidak berubah** — tetap `simpatisan`

---

## 🔴 Masalah yang Dilaporkan

Setelah admin melakukan verifikasi simpatisan melalui panel admin web:
- Admin menekan tombol ✅ **"Verifikasi"**
- FE memanggil `POST /api/kader/confirm/simpatisan/:userId` → **200 OK**
- Data di halaman admin ter-refresh, user hilang dari daftar pending ✅
- **Tapi di aplikasi mobile, role user MASIH `simpatisan`** ❌

---

## 📐 Definisi Role & Status

### Enum Role yang Valid di Database:
```
simpatisan
kader
admin
```

### Kondisi "Pending Verifikasi" per Alur:

| Alur | Role Awal | Kondisi Pending |
|------|-----------|-----------------|
| Kader Lama (Point 1) | `kader` | `kaderPoint1Confirmed = false` |
| Kader Baru (Point 2) | `simpatisan` | `kaderPoint2Confirmed = false` |
| Simpatisan | `simpatisan` | `kaderPoint2Confirmed = false` |

> ⚠️ **Alur 2 (Kader Baru) dan Alur 3 (Simpatisan) adalah IDENTIK** — keduanya merupakan simpatisan yang ingin jadi kader.

---

## ✅ Yang HARUS Terjadi di Backend Saat Confirm

---

### 🔷 Alur 1: `POST /api/kader/confirm/point1/:userId`

**Kondisi awal user:**
```json
{
  "role": "kader",
  "kaderPoint1Confirmed": false
}
```

**Logic yang harus dijalankan backend:**
```
1. Set kaderPoint1Confirmed = true
2. Set kaderPoint1ConfirmedAt = NOW()
3. Set kaderPoint1ConfirmedBy = adminId (dari token JWT)
4. Role TETAP "kader" (tidak berubah)
```

**Expected response setelah confirm:**
```json
{
  "success": true,
  "message": "Kader lama berhasil diverifikasi",
  "data": {
    "_id": "userId",
    "name": "Nama User",
    "role": "kader",
    "kaderPoint1Confirmed": true,
    "kaderPoint1ConfirmedAt": "2026-03-31T10:00:00.000Z",
    "kaderPoint1ConfirmedBy": "adminId"
  }
}
```

---

### 🔶 Alur 2 & 3: `POST /api/kader/confirm/point2/:userId` dan `POST /api/kader/confirm/simpatisan/:userId`

> Kedua endpoint ini IDENTIK (simpatisan adalah alias point2).

**Kondisi awal user:**
```json
{
  "role": "simpatisan",
  "kaderPoint2Confirmed": false
}
```

**Logic yang HARUS dijalankan backend (INI YANG DIDUGA BELUM BENAR):**
```
1. Set kaderPoint2Confirmed = true          ← mungkin sudah dilakukan ✅
2. Set kaderPoint2ConfirmedAt = NOW()       ← mungkin sudah dilakukan ✅
3. Set kaderPoint2ConfirmedBy = adminId     ← mungkin sudah dilakukan ✅
4. ❌ UBAH role dari "simpatisan" → "kader" ← INI YANG MUNGKIN BELUM DILAKUKAN
```

**Expected response setelah confirm:**
```json
{
  "success": true,
  "message": "Simpatisan berhasil diupgrade menjadi Kader",
  "data": {
    "_id": "userId",
    "name": "Nama User",
    "role": "kader",
    "kaderPoint2Confirmed": true,
    "kaderPoint2ConfirmedAt": "2026-03-31T10:00:00.000Z",
    "kaderPoint2ConfirmedBy": "adminId"
  }
}
```

> 🔑 **Kunci**: Field `role` di response HARUS `"kader"`, **bukan** `"simpatisan"`.

---

## 🧪 Cara Verifikasi Bug di Backend

### Langkah 1 — Cek response endpoint confirm:
```bash
# Login dulu untuk dapatkan token
curl -X POST http://103.127.96.136:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mygeri.com","password":"password_admin"}'

# Simpan token dari response, lalu:
curl -X POST http://103.127.96.136:3030/api/kader/confirm/point2/[USER_ID] \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json"
```

### Langkah 2 — Cek field `role` di response:
- Jika `"role": "simpatisan"` → **BUG DIKONFIRMASI** di backend
- Jika `"role": "kader"` → Backend benar, masalah ada di mobile (lihat bagian Mobile di bawah)

### Langkah 3 — Cek langsung di database:
```javascript
// MongoDB contoh:
db.users.findOne({ _id: ObjectId("userId") })
// Cek apakah field "role" sudah berubah menjadi "kader"
```

---

## 🔧 Fix yang Diperlukan di Backend

Pada handler `POST /kader/confirm/point2/:userId` (dan aliasnya `/confirm/simpatisan/:userId`), pastikan ada baris berikut:

```javascript
// Contoh pseudocode
await User.findByIdAndUpdate(userId, {
  $set: {
    role: "kader",                          // ← WAJIB ADA INI
    kaderPoint2Confirmed: true,
    kaderPoint2ConfirmedAt: new Date(),
    kaderPoint2ConfirmedBy: adminId
  }
});
```

**Jika menggunakan Mongoose:**
```javascript
const user = await User.findById(userId);
user.role = "kader";                        // ← WAJIB
user.kaderPoint2Confirmed = true;
user.kaderPoint2ConfirmedAt = new Date();
user.kaderPoint2ConfirmedBy = req.user._id;
await user.save();
```

---

## 📱 Untuk Mobile Team

### Skenario 1: Backend sudah fix (role berubah di database)

User yang sudah diverifikasi perlu mendapatkan role baru `kader`. Ada 2 cara mobile mengetahui perubahan ini:

#### Option A — User logout & login ulang (paling simpel):
- Setelah admin verifikasi, user di mobile harus **logout kemudian login ulang**
- JWT token baru akan berisi role `kader`
- Mobile sudah bisa akses semua fitur kader

#### Option B — Refresh profile otomatis (lebih baik UX):
- Mobile memanggil `GET /api/auth/profile` atau `GET /api/user/me` setelah notifikasi verifikasi diterima
- Update state lokal dengan data terbaru dari server
- Tidak perlu logout/login

#### Option C — Push Notification + Auto Refresh:
- Backend kirim push notification ke user setelah diverifikasi
- Mobile menerima notif → otomatis refresh token/profile
- User langsung bisa akses fitur kader tanpa action manual

---

### Cara Cek Role dari JWT Token di Mobile:

JWT token berisi payload yang bisa di-decode:
```
Header.Payload.Signature
```

Decode payload (base64) dan cek field `role`:
```json
{
  "userId": "xxx",
  "role": "simpatisan",   ← ini yang perlu cek, harus "kader" setelah verifikasi
  "iat": 1234567890,
  "exp": 1234567890
}
```

Jika token lama masih ada `"role": "simpatisan"` → **user harus refresh token** (logout/login atau call refresh endpoint).

---

### Endpoint yang Bisa Digunakan Mobile untuk Refresh:

| Endpoint | Fungsi |
|----------|--------|
| `POST /api/auth/refresh` | Refresh JWT token (jika tersedia) |
| `GET /api/auth/profile` | Ambil data user terbaru dari server |
| `GET /api/user/me` | Alternatif endpoint profil |

> Tanyakan ke backend team endpoint mana yang tersedia untuk refresh user data.

---

## 📋 Checklist Perbaikan

### Backend Team:
- [ ] Cek handler `POST /kader/confirm/point2/:userId` — apakah ada `user.role = "kader"`?
- [ ] Cek handler `POST /kader/confirm/simpatisan/:userId` — apakah ada `user.role = "kader"`?
- [ ] Test endpoint confirm → cek response `role` field harus `"kader"`
- [ ] Cek database langsung setelah confirm — role user harus berubah

### Mobile Team:
- [ ] Setelah user diverifikasi, pastikan mobile **refresh/re-fetch profile user**
- [ ] Jika ada JWT cached, pastikan token di-refresh setelah verifikasi
- [ ] Test flow: daftar sebagai simpatisan → admin verifikasi → mobile akses fitur kader
- [ ] Jika tidak ada auto-refresh, tampilkan notifikasi ke user untuk logout & login ulang

---

## 🗒️ Catatan Tambahan

- Endpoint `/simpatisan` adalah **alias** dari `/point2` — hasilnya harus 100% sama
- Role `kader_baru` **tidak ada** di database — yang ada hanya `simpatisan`, `kader`, `admin`
- FE admin web sudah benar: memanggil endpoint confirm dengan benar, masalah ada di backend logic atau mobile token caching
- Setelah fix, lakukan **end-to-end test** dari mobile: daftar simpatisan → admin verifikasi → mobile refresh → cek akses fitur

---

*Dokumen ini dibuat oleh Frontend Team untuk memudahkan komunikasi dengan Backend & Mobile Team.*  
*Jika ada pertanyaan, hubungi frontend team.*
