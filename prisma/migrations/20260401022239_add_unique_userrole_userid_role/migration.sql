-- Fix: Prevent duplicate role per user (double data bug saat verifikasi)
-- Sebelum tambah constraint, hapus dulu data duplikat jika ada
-- Simpan hanya 1 row per (userId, role) — prioritas isActive=true, lalu yang terbaru

DELETE FROM "UserRole"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", role) id
  FROM "UserRole"
  ORDER BY "userId", role, "isActive" DESC, "createdAt" DESC
);

-- Tambah unique constraint: satu user hanya boleh punya satu baris per role
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", role);

-- Tambah index untuk performa query
CREATE INDEX IF NOT EXISTS "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX IF NOT EXISTS "UserRole_role_idx" ON "UserRole"("role");