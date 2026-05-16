-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "mediaAssetId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_mediaAssetId_key" ON "Lesson"("mediaAssetId");

-- CreateIndex
CREATE INDEX "Lesson_mediaAssetId_idx" ON "Lesson"("mediaAssetId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
