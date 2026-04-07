-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OnboardingType" AS ENUM ('title_image', 'title_text', 'image_only', 'text_only', 'title_image_text');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "onboarding_slides" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" VARCHAR(255),
    "description" TEXT,
    "imageUrl" VARCHAR(500),
    "backgroundColor" VARCHAR(7),
    "type" "OnboardingType" NOT NULL DEFAULT 'title_image',
    "skipAllowed" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_slides_uuid_key" ON "onboarding_slides"("uuid");

-- CreateIndex
CREATE INDEX "onboarding_slides_order_idx" ON "onboarding_slides"("order");

-- CreateIndex
CREATE INDEX "onboarding_slides_isActive_idx" ON "onboarding_slides"("isActive");

-- CreateIndex
CREATE INDEX "onboarding_slides_createdAt_idx" ON "onboarding_slides"("createdAt");

-- Insert default onboarding slides
INSERT INTO "onboarding_slides" ("uuid", "order", "title", "description", "imageUrl", "type", "skipAllowed", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 1, 'Selamat Datang', NULL, '/uploads/onboarding/welcome-1.png', 'title_image', false, true, NOW(), NOW()),
  (gen_random_uuid(), 2, 'Fitur Utama', 'Explore semua fitur menarik aplikasi kami', '/uploads/onboarding/features-2.png', 'title_image_text', false, true, NOW(), NOW()),
  (gen_random_uuid(), 3, 'Komunitas Kader', 'Bergabunglah dengan ribuan kader lainnya', '/uploads/onboarding/community-3.jpg', 'title_image_text', true, true, NOW(), NOW()),
  (gen_random_uuid(), 4, 'Terima Kasih', 'Sekarang Anda siap memulai perjalanan!', NULL, 'text_only', true, true, NOW(), NOW());
