# Bug Report — Double Data User Saat Verifikasi

**Tanggal**: 1 April 2026  
**Dibuat oleh**: Frontend Web Admin Team  
**Ditujukan untuk**: Backend Team  
**Priority**: 🔴 HIGH  
**Status**: ❌ BUG DITEMUKAN — Belum Difix

---

## 🔴 Masalah yang Dilaporkan

Setelah admin melakukan verifikasi di web panel, **muncul data user yang dobel** di database.

Harusnya verifikasi adalah proses **UPDATE**, bukan **INSERT baru**.

---

## 📋 Skenario yang Bermasalah

### Skenario 1: Verifikasi Simpatisan → Kader

```
❌ YANG TERJADI SEKARANG:

Sebelum verifikasi (database):
┌─────────────────────────────────────────────┐
│ users table:                                │
│  id: 25, name: "Siti Rahayu"               │
│                                             │
│ user_roles table:                           │
│  { userId: 25, role: 'simpatisan', isActive: true }
└─────────────────────────────────────────────┘

Setelah verifikasi (database):
┌─────────────────────────────────────────────┐
│ users table:                                │
│  id: 25, name: "Siti Rahayu"   ← user lama │
│  id: 26, name: "Siti Rahayu"   ← ❌ USER BARU (DOBEL!) │
│                                             │
│ user_roles table:                           │
│  { userId: 26, role: 'kader', isActive: true } ← ❌ role untuk user baru
└─────────────────────────────────────────────┘

✅ YANG HARUSNYA TERJADI:

Setelah verifikasi (database):
┌─────────────────────────────────────────────┐
│ users table:                                │
│  id: 25, name: "Siti Rahayu"   ← user SAMA │
│                                             │
│ user_roles table:                           │
│  { userId: 25, role: 'simpatisan', isActive: false }  ← UPDATE: deactivate
│  { userId: 25, role: 'kader', isActive: true }        ← INSERT: role baru
└─────────────────────────────────────────────┘
```

### Skenario 2: Verifikasi Kader Lama (Point 1)

```
❌ YANG TERJADI SEKARANG:

Sebelum verifikasi (database):
┌─────────────────────────────────────────────┐
│ users table:                                │
│  id: 12, name: "Budi Santoso"              │
│                                             │
│ user_roles table:                           │
│  { userId: 12, role: 'kader', isActive: true, kaderPoint1Confirmed: false }
└─────────────────────────────────────────────┘

Setelah verifikasi (database):
┌─────────────────────────────────────────────┐
│ users table:                                │
│  id: 12, name: "Budi Santoso"  ← user lama │
│  id: 13, name: "Budi Santoso"  ← ❌ USER BARU (DOBEL!) │
│                                             │
│ user_roles table:                           │
│  { userId: 13, role: 'kader', kaderPoint1Confirmed: true } ← ❌ user baru
└─────────────────────────────────────────────┘

✅ YANG HARUSNYA TERJADI:

Setelah verifikasi (database):
┌─────────────────────────────────────────────┐
│ users table:                                │
│  id: 12, name: "Budi Santoso"  ← user SAMA, TIDAK BERUBAH │
│                                             │
│ user_roles table:                           │
│  { userId: 12, role: 'kader', kaderPoint1Confirmed: true } ← UPDATE saja
└─────────────────────────────────────────────┘
```

---

## 🔍 Dugaan Root Cause di Backend Code

### Kemungkinan Bug #1 — `upsert` yang salah config

```javascript
// ❌ KEMUNGKINAN KODE YANG SALAH
// Seharusnya UPDATE, tapi malah CREATE baru

const updated = await prisma.user.upsert({
  where: { id: userId },
  create: {          // ← INI YANG SALAH: harusnya tidak ada create
    name: user.name,
    roles: {
      create: { role: 'kader', isActive: true }
    }
  },
  update: {          // ← ini benar
    roles: {
      create: { role: 'kader', isActive: true }
    }
  }
})

// Jika kondisi where: { id: userId } tidak match karena tipe data salah,
// Prisma akan CREATE baru → double data!
```

### Kemungkinan Bug #2 — ID type mismatch

```javascript
// ❌ userId dari request adalah String, tapi di DB adalah Int
const userId = req.params.userId;  // "25" (string)

await prisma.user.update({
  where: { id: userId }  // ← "25" !== 25 → update gagal → create baru
})

// FIX: Parse ke integer
const userId = parseInt(req.params.userId);  // 25 (integer)
```

### Kemungkinan Bug #3 — `create` seharusnya `update`

```javascript
// ❌ SALAH: membuat user baru dengan data yang diupdate
await prisma.user.create({
  data: {
    ...userData,
    roles: { create: { role: 'kader', isActive: true } }
  }
})

// ✅ BENAR: update user yang sudah ada
await prisma.user.update({
  where: { id: userId },
  data: {
    roles: {
      updateMany: {
        where: { role: 'simpatisan' },
        data: { isActive: false }
      },
      create: { role: 'kader', isActive: true }
    }
  }
})
```

---

## ✅ Yang HARUS Terjadi di Backend (Expected Logic)

### Untuk `POST /kader/confirm/simpatisan/:userId` dan `POST /kader/confirm/point2/:userId`

```javascript
// ✅ LOGIC YANG BENAR
async confirmPoint2(userId, adminId) {
  const id = parseInt(userId);  // ← PASTIKAN integer, bukan string
  
  // 1. Cek user exist
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  
  // 2. Deactivate role simpatisan yang lama
  await prisma.userRole.updateMany({
    where: { userId: id, role: 'simpatisan' },
    data: { isActive: false }
  });
  
  // 3. Create role kader baru (cek dulu apakah sudah ada)
  const existingKader = await prisma.userRole.findFirst({
    where: { userId: id, role: 'kader' }
  });
  
  if (existingKader) {
    // Update yang sudah ada
    await prisma.userRole.update({
      where: { id: existingKader.id },
      data: { isActive: true }
    });
  } else {
    // Create baru
    await prisma.userRole.create({
      data: { userId: id, role: 'kader', isActive: true }
    });
  }
  
  // 4. Update kaderPoint2Confirmed di user
  // ← UPDATE user, BUKAN CREATE user baru!
  const updated = await prisma.user.update({
    where: { id },  // ← pastikan id sudah integer
    data: {
      kaderPoint2Confirmed: true,
      kaderPoint2ConfirmedAt: new Date(),
      kaderPoint2ConfirmedBy: adminId
    },
    include: {
      roles: true
    }
  });
  
  // 5. Return response
  return updated;
}
```

### Untuk `POST /kader/confirm/point1/:userId`

```javascript
// ✅ LOGIC YANG BENAR
async confirmPoint1(userId, adminId) {
  const id = parseInt(userId);  // ← PASTIKAN integer
  
  // 1. Cek user exist
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  
  // 2. UPDATE kaderPoint1Confirmed — TIDAK membuat user baru
  const updated = await prisma.user.update({
    where: { id },  // ← UPDATE, bukan create/upsert yang salah
    data: {
      kaderPoint1Confirmed: true,
      kaderPoint1ConfirmedAt: new Date(),
      kaderPoint1ConfirmedBy: adminId
    },
    include: { roles: true }
  });
  
  return updated;
}
```

---

## 🧪 Cara Verifikasi Bug di Database

### Langkah 1: Cek apakah ada data dobel

```sql
-- PostgreSQL / MySQL
SELECT name, email, COUNT(*) as total
FROM users
GROUP BY name, email
HAVING COUNT(*) > 1;
-- Jika ada hasil → ada double data!
```

```javascript
// Prisma / Node.js
const duplicates = await prisma.$queryRaw`
  SELECT name, email, COUNT(*) as total
  FROM users
  GROUP BY name, email
  HAVING COUNT(*) > 1
`;
console.log(duplicates);
```

### Langkah 2: Cek apakah `confirm` create user baru

```bash
# 1. Cari userId yang mau ditest
# 2. Catat jumlah row di users table
curl -X GET http://103.127.96.136:3030/api/kader/pending/simpatisan \
  -H "Authorization: Bearer [ADMIN_TOKEN]"

# 3. Confirm salah satu userId
curl -X POST http://103.127.96.136:3030/api/kader/confirm/simpatisan/[USER_ID] \
  -H "Authorization: Bearer [ADMIN_TOKEN]"

# 4. Cek jumlah row di users table — harusnya SAMA, tidak bertambah
# Jika bertambah → CONFIRMED BUG
```

### Langkah 3: Cek tipe data userId

```javascript
// Di handler/controller
console.log('userId type:', typeof req.params.userId);  // harus "number" setelah parse
console.log('userId value:', req.params.userId);        // "25" atau 25?

// Cek apakah where condition match
const user = await prisma.user.findUnique({
  where: { id: req.params.userId }  // ← string "25"?
});
console.log('user found:', user);  // null → berarti tidak match!
```

---

## 🔧 Quick Fix yang Direkomendasikan

### Fix 1: Pastikan parseInt di semua handler confirm

```javascript
// Di semua confirm handler (point1, point2, simpatisan)
const userId = parseInt(req.params.userId, 10);  // ← WAJIB parse integer

if (isNaN(userId)) {
  return res.status(400).json({ success: false, message: 'Invalid userId' });
}
```

### Fix 2: Gunakan `update` bukan `upsert` atau `create`

```javascript
// ❌ JANGAN pakai upsert untuk ini
await prisma.user.upsert({ where: ..., create: ..., update: ... });

// ✅ PAKAI update saja
await prisma.user.update({ where: { id: userId }, data: { ... } });
```

### Fix 3: Cleanup data dobel yang sudah terlanjur masuk

```sql
-- Identifikasi data dobel
SELECT id, name, email, "createdAt"
FROM users
WHERE (name, email) IN (
  SELECT name, email FROM users
  GROUP BY name, email HAVING COUNT(*) > 1
)
ORDER BY name, "createdAt";

-- Hapus data dobel (simpan yang lebih lama / original)
-- HATI-HATI: backup dulu sebelum DELETE
DELETE FROM users
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY email ORDER BY "createdAt" ASC
    ) as rn
    FROM users
  ) t
  WHERE rn > 1
);
```

---

## 📋 Checklist untuk Backend

- [ ] Cek apakah ada data dobel di `users` table saat ini
- [ ] Identifikasi root cause: apakah `upsert` salah, `create` salah, atau ID type mismatch
- [ ] Pastikan semua `req.params.userId` di-parse ke integer: `parseInt(req.params.userId, 10)`
- [ ] Ganti logika yang salah (create/upsert) dengan `update` yang benar
- [ ] Test: lakukan confirm → cek jumlah row di `users` table tidak bertambah
- [ ] Cleanup data dobel yang sudah terlanjur masuk (dengan backup!)
- [ ] Commit & push ke branch `heri01`
- [ ] Informasikan ke FE team setelah fix

---

## ⚠️ Important

**Ini adalah bug kritis karena:**
1. Menyebabkan data dobel di database — data integrity rusak
2. User bisa punya 2 akun berbeda padahal orang yang sama
3. Di mobile, bisa jadi user login ke akun lama (simpatisan) dan tidak connect ke data baru (kader)
4. Jika tidak difix, data dobel akan terus bertambah setiap kali ada verifikasi

---

**Prioritas**: 🔴 HIGH — Tolong fix sebelum fitur verifikasi dipakai live!  
**Pertanyaan**: Hubungi FE Web Admin Team  
**Branch target**: `heri01`
