-- AlterTable
ALTER TABLE "products" ADD COLUMN     "thumbnailAssetId" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "galleryAssetIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "heroImageAssetId" TEXT;

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_assets_provider_idx" ON "media_assets"("provider");

-- CreateIndex
CREATE INDEX "media_assets_key_idx" ON "media_assets"("key");
