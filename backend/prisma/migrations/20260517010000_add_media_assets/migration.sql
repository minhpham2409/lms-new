-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('VIDEO', 'IMAGE', 'FILE');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED', 'ORPHANED', 'DELETED');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "MediaAssetType" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PROCESSING',
    "url" TEXT,
    "storageKey" TEXT,
    "originalKey" TEXT,
    "hlsManifestKey" TEXT,
    "jobId" TEXT,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_status_idx" ON "MediaAsset"("ownerId", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_storageKey_idx" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_hlsManifestKey_idx" ON "MediaAsset"("hlsManifestKey");

-- CreateIndex
CREATE INDEX "MediaAsset_jobId_idx" ON "MediaAsset"("jobId");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
