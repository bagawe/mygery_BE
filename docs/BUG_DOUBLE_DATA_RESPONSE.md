# Bug Response — Double Data User Saat Verifikasi

**Tanggal**: 1 April 2026  
**Dibuat oleh**: Backend Team  
**Merespons**: `BUG_DOUBLE_DATA_USER.md`  
**Status**: ✅ ROOT CAUSE DITEMUKAN & SUDAH DIFIX  
**Priority**: 🔴 HIGH → ✅ RESOLVED

---

## 🔍 Hasil Investigasi

Setelah analisis kode, ditemukan **2 root cause** yang saling berkaitan:

---

## 🔴 Root Cause #1 — Tidak Ada UNIQUE Constraint di `UserRole`

**File**: `prisma/schema.prisma` — model `UserRole`

**Masalah**: Tabel `UserRole` tidak memiliki constraint untuk mencegah duplikasi `(userId, role)`. Artinya database **tidak pernah menolak** insert role yang sama untuk user yang sama.

```prisma
// ❌ SEBELUMNYA — Tidak ada constraint
model UserRole {
  id     Int   @id @default(autoincrement())
  userId Int
  role   Role
  // Tidak ada @@unique → bisa insert kader 2x untuk user yang sama!
}

// ✅ SESUDAH — Ada constraint
model UserRole {
  id     Int   @id @default(autoincrement())
  userId Int
  role   Role
  @@unique([userId, role])  // ← Database level protection
  @@index([userId])
  @@index([role])
}
```

---

## 🔴 Root Cause #2 — `confirmPoint2` Tidak Atomic (Non-Transaction)

**File**: `src/modules/kader/kader.service.js`

**Masalah**: Sebelumnya `confirmPoint2` melakukan 3 operasi **terpisah** (bukan dalam 1 transaction):

```javascript
// ❌ SEBELUMNYA — 3 operasi terpisah, tidak atomic
// Jika FE double-click tombol verify → 2 request masuk bersamaan
// Request #1 dan #2 bisa lolos cek hasKaderRole secara bersamaan
// karena keduanya cek sebelum salah satu selesai

await prisma.userRole.updateMany(...)  // Operasi 1
await prisma.userRole.create(...)      // Operasi 2 ← bisa CREATE 2x!
await prisma.user.update(...)          // Operasi 3
```

Jika FE **double-click** tombol verify, atau ada **request duplikat**, kedua request bisa melewati validasi `hasKaderRole` secara bersamaan → `create` role kader dipanggil 2x → **double data di `UserRole`**.

> ⚠️ Meski ini di tabel `UserRole` bukan `User`, efeknya sama — user punya 2 baris role kader, data tidak konsisten.

---

## ✅ Fix yang Sudah Dilakukan

### Fix #1 — Schema: Tambah `@@unique([userId, role])`

```prisma
model UserRole {
  ...
  @@unique([userId, role])  // ← BARU: database menolak duplikat role per user
  @@index([userId])
  @@index([role])
}
```

### Fix #2 — Service: Pakai `$transaction` + `upsert`

```javascript
// ✅ SESUDAH — Semua dalam 1 transaction, atomic
async confirmPoint2(userId, adminId) {
  const id = parseInt(userId);
  if (isNaN(id)) throw new Error('Invalid userId');  // Validasi tipe data

  const result = await prisma.$transaction(async (tx) => {
    // Semua operasi dalam 1 transaction
    // Jika salah satu gagal → semua di-rollback otomatis

    // 1. Cek & validasi user
    const user = await tx.user.findUnique({ where: { id }, include: { roles: true } });
    if (!user) throw new Error('User not found');
    if (user.kaderPoint2Confirmed) throw new Error('Already confirmed'); // Guard ganda

    // 2. Deactivate simpatisan
    await tx.userRole.updateMany({ where: { userId: id, role: 'simpatisan' }, data: { isActive: false } });

    // 3. UPSERT kader — bukan CREATE
    //    Jika sudah ada row kader → update isActive=true
    //    Jika belum ada → create baru
    //    @@unique([userId, role]) menjamin tidak bisa duplikat
    await tx.userRole.upsert({
      where: { userId_role: { userId: id, role: 'kader' } },
      update: { isActive: true },
      create: { userId: id, role: 'kader', isActive: true }
    });

    // 4. Update user (UPDATE, bukan CREATE!)
    return tx.user.update({ where: { id }, data: { kaderPoint2Confirmed: true, ... } });
  });
}
```

### Fix #3 — Migration: Cleanup + Tambah Constraint di DB

File migration: `prisma/migrations/20260401022239_add_unique_userrole_userid_role/migration.sql`

```sql
-- 1. Hapus data duplikat yang mungkin sudah ada
DELETE FROM "UserRole"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", role) id
  FROM "UserRole"
  ORDER BY "userId", role, "isActive" DESC, "createdAt" DESC
);

-- 2. Tambah unique constraint di database
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", role);

-- 3. Tambah index untuk performa
CREATE INDEX IF NOT EXISTS "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX IF NOT EXISTS "UserRole_role_idx" ON "UserRole"("role");
```

> ⚠️ **Migration ini perlu dijalankan di dev server** dengan perintah:
> ```bash
> npx prisma migrate deploy
> ```

---

## 📋 Jawaban Atas Dugaan di Dokumen FE

| Dugaan FE | Status | Penjelasan |
|-----------|--------|------------|
| Bug #1: `upsert` salah config | ❌ Bukan ini | Tidak pakai `upsert` sama sekali, pakai `create` |
| Bug #2: ID type mismatch | ✅ **Sebagian benar** | `parseInt` sudah ada, tapi tidak ada validasi `isNaN` — sudah difix |
| Bug #3: `create` seharusnya `update` | ✅ **Benar** | Role kader memang di-`create` baru, tapi seharusnya pakai `upsert` — sudah difix |

---

## 🚀 Cara Deploy Fix ke Dev Server

```bash
# 1. Pull perubahan terbaru
git pull origin heri01

# 2. Jalankan migration (apply constraint ke database)
npx prisma migrate deploy

# 3. Restart server
pm2 restart mygeri-be   # atau sesuai nama proses
```

> ⚠️ **Penting**: `prisma migrate deploy` perlu dijalankan sekali agar constraint `@@unique([userId, role])` aktif di database dev server.

---

## 🧪 Cara Verifikasi Fix Berhasil

### 1. Cek tidak ada double role setelah verify:
```bash
# Sebelum verify — catat jumlah row di UserRole
# Lakukan verify simpatisan
# Cek UserRole — harus ada 2 row (simpatisan isActive=false, kader isActive=true)
# TIDAK ada row ke-3
```

### 2. Cek double-click tidak menyebabkan error / double data:
```bash
# Klik verify 2x cepat
# Response pertama: 200 OK
# Response kedua: 400 "User is already a kader" atau "User already confirmed for Point 2"
# TIDAK ada double data di database
```

### 3. Cek cleanup data lama (jika sudah ada duplikat):
```sql
SELECT "userId", role, COUNT(*) as total
FROM "UserRole"
GROUP BY "userId", role
HAVING COUNT(*) > 1;
-- Harus 0 rows setelah migration dijalankan
```

---

## 📁 File yang Diubah

```
prisma/schema.prisma                                           ← @@unique([userId, role]) + index
prisma/migrations/20260401022239_.../migration.sql             ← SQL cleanup + constraint
src/modules/kader/kader.service.js                             ← $transaction + upsert
```

---

**Status**: ✅ Fix sudah di-push ke branch `heri01`  
**Action diperlukan**: Jalankan `npx prisma migrate deploy` di dev server  
**Testing**: Silakan test double-click verify — seharusnya tidak ada double data lagi
